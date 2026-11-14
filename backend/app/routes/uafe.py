from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import comparecientes as svc
from app.config import settings
import logging

router = APIRouter(prefix="/api/public/uafe", tags=["uafe"])
logger = logging.getLogger(__name__)

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def verificar_api_key(api_key: str = Security(API_KEY_HEADER)):
    """Valida que el header X-API-Key sea correcto."""
    if not settings.UAFE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Integración UAFE no configurada en este servidor."
        )
    if api_key != settings.UAFE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return api_key


def _uafe_persona(decl) -> dict:
    """Bloque "uafe" de una persona, con el mismo formato que antes del refactor."""
    d = svc.serializar_declaracion(decl) if decl else {}
    campos = [
        "actividad_economica", "actividad_economica_otra", "empresa_trabajo",
        "ingreso_mensual", "origen_fondos",
        "es_pep", "es_pep_indirecto", "pep_nombre", "pep_institucion", "pep_cargo",
        "pep_fecha_inicio", "pep_grado_relacion", "pep_relacion_tipo", "pep_ya_no_ejerce",
        "pep_fecha_fin", "situacion_patrimonial", "rol_tramite", "rol_tramite_otro", "calidad_participacion",
        "conyugue_comparece", "razon_exclusion_conyugue",
    ]
    bloque = {c: d.get(c) for c in campos}
    bloque["pep_anios_trabajo"] = None  # campo retirado; se conserva la llave
    bloque["fecha_declaracion"] = d.get("fecha")
    return bloque


@router.get("/consultar/{documento}")
def consultar_uafe(
    documento: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verificar_api_key),
):
    """
    Consulta datos UAFE de una persona natural o empresa por cédula o RUC.

    - 10 dígitos → persona natural
    - 13 dígitos → empresa

    El bloque "uafe" corresponde a la declaración más reciente; el historial
    completo va en "historial_declaraciones" (de la más reciente a la más antigua).

    Requiere header: X-API-Key
    """
    documento = documento.strip()

    if not documento.isdigit():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El documento debe contener solo dígitos.")

    if len(documento) == 10:
        party = svc.buscar_party(db, documento)
        if not party:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No se encontró ninguna persona con cédula {documento}.",
            )

        partner = party.partner
        conyugue = None
        if partner:
            conyugue = {
                "cedula": partner.document_number,
                "nombres": partner.names,
                "apellidos": partner.last_names,
                "genero": partner.gender.value if partner.gender else None,
                "nacionalidad": partner.nationality,
                "fecha_nacimiento": str(partner.birth_date) if partner.birth_date else None,
                "ocupacion": partner.occupation,
                "profesion": partner.profession,
            }

        return {
            "tipo": "persona_natural",
            "documento": party.document_number,
            "tipo_documento": party.document_type.value if party.document_type else "cedula",
            "nombres": party.names,
            "apellidos": party.last_names,
            "genero": party.gender.value if party.gender else None,
            "estado_civil": party.marital_status.value if party.marital_status else None,
            "nacionalidad": party.nationality,
            "fecha_nacimiento": str(party.birth_date) if party.birth_date else None,
            "email": party.email,
            "telefono": party.phone,
            "provincia": party.province,
            "canton": party.canton,
            "parroquia": party.parroquia,
            "sector": party.sector,
            "calle_principal": party.main_street,
            "calle_secundaria": party.secondary_street,
            "numero_casa": party.number_street,
            "ocupacion": party.occupation,
            "profesion": party.profession,
            "conyugue": conyugue,
            "uafe": _uafe_persona(svc.declaracion_vigente_persona(party)),
            "representante_legal_de": svc.empresas_representadas(party),
            "historial_declaraciones": [svc.serializar_declaracion(d) for d in party.declaraciones],
        }

    elif len(documento) == 13:
        company = svc.buscar_company(db, documento)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No se encontró ninguna empresa con RUC {documento}.",
            )

        decl = svc.ultima_declaracion(company)
        d = svc.serializar_declaracion(decl) if decl else {}
        rep = company.representante
        rep_decl = svc._decl_rep_de(company, decl)

        return {
            "tipo": "persona_juridica",
            "ruc": company.ruc,
            "razon_social": company.razon_social,
            "email": company.email,
            "telefono": company.phone,
            "provincia": company.province,
            "canton": company.canton,
            "parroquia": company.parroquia,
            "sector": company.sector,
            "calle_principal": company.main_street,
            "calle_secundaria": company.secondary_street,
            "numero": company.number_street,
            "uafe_empresa": {
                "ingreso_mensual": d.get("ingreso_mensual"),
                "egreso_mensual": d.get("egreso_mensual"),
                "actividad_economica": d.get("actividad_economica"),
                "rol_tramite": d.get("rol_tramite"),
                "rol_tramite_otro": d.get("rol_tramite_otro"),
                "origen_fondos": d.get("origen_fondos"),
                "situacion_patrimonial": d.get("situacion_patrimonial"),
                "fecha_declaracion": d.get("fecha"),
            },
            "socios": {
                "controlada_supercias": d.get("controlada_supercias"),
                "listado": d.get("socios", []),
                "referencia_supercias": d.get("referencia_supercias"),
                "tiene_anexo": bool(d.get("tiene_anexo")),
                # lista | anexo | autorizacion (consulta en la web de la Superintendencia)
                "modalidad": d.get("socios_modalidad"),
                "autoriza_consulta_supercias": d.get("autoriza_consulta_supercias"),
            },
            "representante_legal": {
                "cedula": rep.document_number,
                "nombres": rep.names,
                "apellidos": rep.last_names,
                "genero": rep.gender.value if rep.gender else None,
                "nacionalidad": rep.nationality,
                "fecha_nacimiento": str(rep.birth_date) if rep.birth_date else None,
                "cargo": company.cargo_representante,
                "ocupacion": rep.occupation,
                "profesion": rep.profession,
                "email": rep.email,
                "telefono": rep.phone,
                "provincia": rep.province,
                "canton": rep.canton,
                "parroquia": rep.parroquia,
                "calle_principal": rep.main_street,
                "calle_secundaria": rep.secondary_street,
                "numero": rep.number_street,
                "uafe": _uafe_persona(rep_decl),
            },
            "historial_declaraciones": [svc.serializar_declaracion(x) for x in company.declaraciones],
        }

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El documento debe tener 10 dígitos (cédula) o 13 dígitos (RUC).",
        )