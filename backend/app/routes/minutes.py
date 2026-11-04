from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
import os
import logging

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.system_user import SystemUser
from app.models.minute import Minute, MinuteType
from app.services.minuta_generator import generate_minuta_compraventa
from app.services.promesa_minuta_generator import generate_promesa_minuta_compraventa
from app.services.poder_generator import generate_poder

router = APIRouter(prefix="/minutes", tags=["minutes"])
logger = logging.getLogger(__name__)


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

        new_minute = Minute(
            minute_type=MinuteType.COMPRAVENTA_INMUEBLE,
            contract_data=data,
            file_path=output_path,
            created_by=current_user.id
        )
        db.add(new_minute)
        db.commit()
        db.refresh(new_minute)

        return FileResponse(
            path=output_path,
            filename=f"minuta_{new_minute.id}.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

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
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """Listar todas las minutas del usuario actual"""
    minutes = db.query(Minute).filter(Minute.created_by == current_user.id).all()
    return minutes


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

    return FileResponse(
        path=minute.file_path,
        filename=f"minuta_{minute.id}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )


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
        new_minute = Minute(
            minute_type=MinuteType.PROMESA_COMPRAVENTA,
            contract_data=data,
            file_path=output_path,
            created_by=current_user.id
        )
        db.add(new_minute)
        db.commit()
        db.refresh(new_minute)

        return FileResponse(
            path=output_path,
            filename=f"promesa_compraventa_{new_minute.id}.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

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

        new_minute = Minute(
            minute_type=MinuteType.PODERES,
            contract_data=data,
            file_path=output_path,
            created_by=current_user.id
        )
        db.add(new_minute)
        db.commit()
        db.refresh(new_minute)

        return FileResponse(
            path=output_path,
            filename=f"poder_{new_minute.id}.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error al generar poder: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al generar el poder. Contacte al administrador."
        )