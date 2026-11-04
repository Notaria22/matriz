from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.system_user import SystemUser
from app.schemas.party import PartyCreate
from app.services import comparecientes as svc
from app.utils.access_log import registrar_acceso

router = APIRouter(prefix="/api/users", tags=["users"])
logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", include_in_schema=False, status_code=status.HTTP_201_CREATED)
def save_user(
    request: Request,
    user_data: PartyCreate,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    """
    POST /api/users — Crear o actualizar compareciente (sistema interno).

    - La identidad se crea o actualiza.
    - Si cambian los datos UAFE, se guarda una declaración nueva a nombre del
      usuario del sistema (nunca se sobrescribe la anterior).
    - El cónyuge se enlaza de los dos lados.
    """
    try:
        datos = user_data.model_dump(exclude_unset=True)
        existia = svc.buscar_party(db, user_data.document_number) is not None
        party = svc.guardar_identidad_party(db, datos)

        if "partner_document_number" in datos or "marital_status" in datos:
            conyuge = None
            if party.marital_status and party.marital_status.value == "casado":
                conyuge = svc.buscar_party(db, datos.get("partner_document_number"))
                if datos.get("partner_document_number") and conyuge is None:
                    raise HTTPException(
                        status_code=400,
                        detail="El cónyuge indicado no está registrado. Guárdelo primero.",
                    )
                if conyuge is None and "partner_document_number" not in datos:
                    conyuge = party.partner  # no se envió: se mantiene el actual
            svc.vincular_conyuges(db, party, conyuge)

        svc.declaracion_si_cambia(db, party, datos, current_user.id)

        registrar_acceso(
            db, current_user.username, "actualizar" if existia else "crear",
            "parties", party.document_number, get_client_ip(request),
        )
        db.commit()
        db.refresh(party)
        return svc.serializar_party(party)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error guardando compareciente: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al guardar el compareciente. Verifique los datos e intente de nuevo.",
        )


@router.get("/{document_number}")
def get_user(
    document_number: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    """GET /api/users/:documentNumber — Compareciente con su cónyuge y su última declaración UAFE."""
    party = svc.buscar_party(db, document_number)
    if not party:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    registrar_acceso(db, current_user.username, "ver", "parties", party.document_number, get_client_ip(request))
    db.commit()
    return svc.serializar_party(party)