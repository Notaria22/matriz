from pathlib import Path
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.system_user import SystemUser
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.services import comparecientes as svc
from app.utils.access_log import registrar_acceso

router = APIRouter(prefix="/api/companies", tags=["companies"])
logger = logging.getLogger(__name__)


def _ip(request: Request):
    fwd = request.headers.get("X-Forwarded-For")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else None)


def _guardar(db: Session, datos: dict, request: Request, usuario: SystemUser, accion: str):
    try:
        company = svc.guardar_empresa_interna(db, datos)
        registrar_acceso(db, usuario.username, accion, "companies", company.ruc, _ip(request))
        db.commit()
        db.refresh(company)
        return svc.serializar_company(company)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error guardando empresa: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al guardar la empresa. Verifique los datos e intente de nuevo.",
        )


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", include_in_schema=False, status_code=status.HTTP_201_CREATED)
def save_company(
    company_data: CompanyCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    """
    POST /api/companies — Crear o actualizar empresa (por RUC).
    El representante legal se guarda como persona: si ya existe por su cédula,
    se actualizan sus datos.
    """
    existia = svc.buscar_company(db, company_data.ruc) is not None
    return _guardar(db, company_data.model_dump(exclude_unset=True), request, current_user,
                    "actualizar" if existia else "crear")


@router.get("/{ruc}")
def get_company(
    ruc: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    """GET /api/companies/{ruc} — Empresa con su representante y su última declaración UAFE."""
    company = svc.buscar_company(db, ruc)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    registrar_acceso(db, current_user.username, "ver", "companies", company.ruc, _ip(request))
    db.commit()
    return svc.serializar_company(company)


@router.put("/{ruc}")
def update_company(
    ruc: str,
    company_data: CompanyUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    """PUT /api/companies/{ruc} — Actualizar empresa y representante."""
    company = svc.buscar_company(db, ruc)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")

    # Se completa con los datos actuales lo que el formulario no envió
    actual = svc.serializar_company(company)
    datos = {**{k: actual.get(k) for k in list(svc.COMPANY_IDENTIDAD) + list(svc.REP_IDENTIDAD) + ["rep_position"]},
             **company_data.model_dump(exclude_unset=True), "ruc": company.ruc}
    return _guardar(db, datos, request, current_user, "actualizar")


@router.get("/{ruc}/anexo-socios")
def descargar_anexo_socios(
    ruc: str,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    """GET /api/companies/{ruc}/anexo-socios — Listado de socios más reciente que adjuntó la empresa."""
    company = svc.buscar_company(db, ruc)
    decl = svc.declaracion_con_anexo(company) if company else None
    if not decl:
        raise HTTPException(status_code=404, detail="Esta empresa no tiene anexo de socios")

    ruta = Path(decl.anexo_socios_path)
    if not ruta.is_file():
        raise HTTPException(status_code=404, detail="El archivo del anexo ya no existe en el servidor")

    return FileResponse(
        path=str(ruta),
        filename=decl.anexo_socios_nombre or f"socios_{ruc}.pdf",
        media_type="application/pdf",
    )