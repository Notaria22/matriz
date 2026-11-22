from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import date
import os
import logging

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.system_user import SystemUser
from app.models.minute import Minute, MinuteType
from app.services.minuta_generator import generate_minuta_compraventa
from app.services.promesa_minuta_generator import generate_promesa_minuta_compraventa
from app.services.poder_generator import generate_poder
from app.services.archivo import siguiente_codigo, texto_de_busqueda, filtrar_busqueda

router = APIRouter(prefix="/minutes", tags=["minutes"])
logger = logging.getLogger(__name__)

DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def verificar_acceso_minutas(current_user: SystemUser):
    if current_user.rol.value == "notaria":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a minutas"
        )


def registrar_minuta(db: Session, tipo: MinuteType, data: dict, output_path: str, current_user: SystemUser) -> Minute:
    nueva = Minute(
        codigo=siguiente_codigo(db, "minuta"),
        minute_type=tipo,
        contract_data=data,
        texto_busqueda=texto_de_busqueda(data),
        file_path=output_path,
        created_by=current_user.id
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


def descarga(minute: Minute) -> FileResponse:
    return FileResponse(path=minute.file_path, filename=f"{minute.codigo}.docx", media_type=DOCX)


@router.post("/generate-minuta")
async def generate_minuta(
    data: Dict[Any, Any],
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """Generar minuta de compraventa de inmueble"""
    try:
        if data.get('tipoContrato') != 'compraventa':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se soporta tipo de contrato 'compraventa' en este endpoint"
            )

        output_path = generate_minuta_compraventa(data, current_user)

        if not output_path or not os.path.exists(output_path):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al generar el documento"
            )

        new_minute = registrar_minuta(db, MinuteType.COMPRAVENTA_INMUEBLE, data, output_path, current_user)
        return descarga(new_minute)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al generar minuta de compraventa: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar minuta: {str(e)}"
        )


@router.get("")
@router.get("/", include_in_schema=False)
async def list_minutes(
    q: Optional[str] = Query(None, description="Código, nombres o cédulas"),
    tipo: Optional[str] = Query(None),
    desde: Optional[date] = Query(None),
    hasta: Optional[date] = Query(None),
    limite: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """Minutas generadas por el usuario actual, para el Archivo (sin el contenido completo)"""
    verificar_acceso_minutas(current_user)
    query = db.query(Minute).filter(Minute.created_by == current_user.id)
    if tipo:
        query = query.filter(Minute.minute_type == MinuteType(tipo))
    query = filtrar_busqueda(query, [Minute.codigo, Minute.texto_busqueda], q, Minute.created_at, desde, hasta)
    minutas = query.order_by(Minute.created_at.desc(), Minute.id.desc()).limit(limite).all()
    return [
        {
            "id": m.id,
            "codigo": m.codigo,
            "tipo": m.minute_type.value,
            "comparecientes": m.texto_busqueda or "",
            "created_at": m.created_at,
        }
        for m in minutas
    ]


@router.get("/{minute_id}")
async def get_minute(
    minute_id: int,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """Obtener una minuta específica"""
    minute = db.query(Minute).filter(
        Minute.id == minute_id,
        Minute.created_by == current_user.id
    ).first()

    if not minute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Minuta no encontrada"
        )

    return minute


@router.get("/download/{minute_id}")
async def download_minute(
    minute_id: int,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """Descargar una minuta"""
    minute = db.query(Minute).filter(
        Minute.id == minute_id,
        Minute.created_by == current_user.id
    ).first()

    if not minute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Minuta no encontrada"
        )

    if not os.path.exists(minute.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado"
        )

    return descarga(minute)


@router.post("/generate-promesa")
async def generate_promesa(
    data: Dict[Any, Any],
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """Generar minuta de promesa de compraventa"""
    try:
        output_path = generate_promesa_minuta_compraventa(data, current_user)

        if not output_path or not os.path.exists(output_path):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al generar el documento"
            )

        # Bug corregido: usar MinuteType.PROMESA_COMPRAVENTA en lugar de COMPRAVENTA_INMUEBLE
        new_minute = registrar_minuta(db, MinuteType.PROMESA_COMPRAVENTA, data, output_path, current_user)
        return descarga(new_minute)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al generar minuta de promesa: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar promesa: {str(e)}"
        )

@router.post("/generate-poder")
async def generate_poder_endpoint(
    data: Dict[Any, Any],
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """Generar minuta de poder, procuración o delegación"""
    try:
        output_path = generate_poder(data, current_user)

        if not output_path or not os.path.exists(output_path):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al generar el documento"
            )

        new_minute = registrar_minuta(db, MinuteType.PODERES, data, output_path, current_user)
        return descarga(new_minute)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al generar poder: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al generar el poder. Contacte al administrador."
        )