import uuid
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.company import Company
from app.models.enums import OrigenDeclaracion, TipoSujeto
from app.models.registration_token import RegistrationToken
from app.models.representation import EstadoRepresentacion, Representacion
from app.models.system_user import SystemUser
from app.schemas.company import CompanyCreate
from app.schemas.party import PartyCreate
from app.schemas.registration_token import (
    GenerarTokenRequest,
    RegistrationTokenResponse,
    TokenGenerado,
    TokenInfo,
)
from app.services import comparecientes as svc
from app.utils.access_log import registrar_acceso
from app.utils.anexos import guardar_anexo_pdf

logger = logging.getLogger(__name__)

router = APIRouter(tags=["registro"])

MENSAJE_LINK_INVALIDO = "El enlace no es válido o ya fue utilizado"


# ============================================
# ENDPOINTS PRIVADOS (requieren login)
# ============================================

@router.post("/api/registro/generar-token", response_model=TokenGenerado)
def generar_token(
    datos: GenerarTokenRequest,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    """Genera un link para un documento concreto (cédula/pasaporte o RUC del titular)."""
    token_str = str(uuid.uuid4())
    expira_en = datetime.now(timezone.utc) + timedelta(hours=72)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/registro/{token_str}"

    token = RegistrationToken(
        token=token_str,
        link=link,
        tipo_esperado=TipoSujeto(datos.tipo),
        documento_esperado=datos.documento,
        expira_en=expira_en,
        creado_por=current_user.id,
    )
    db.add(token)
    db.commit()

    return TokenGenerado(
        token=token_str,
        link=link,
        expira_en=expira_en,
        creado_por=current_user.username,
        tipo=datos.tipo,
        documento=datos.documento,
    )


@router.get("/api/registro/tokens", response_model=list[RegistrationTokenResponse])
def listar_tokens(
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    filas = (
        db.query(RegistrationToken, SystemUser.username)
        .outerjoin(SystemUser, SystemUser.id == RegistrationToken.creado_por)
        .order_by(RegistrationToken.creado_en.desc())
        .all()
    )
    return [
        RegistrationTokenResponse(
            id=t.id,
            token=t.token,
            link=t.link,
            usado=t.usado,
            usado_en=t.usado_en,
            tipo_esperado=t.tipo_esperado.value,
            documento_esperado=t.documento_esperado,
            creado_en=t.creado_en,
            expira_en=t.expira_en,
            creado_por=username,
        )
        for t, username in filas
    ]


@router.delete("/api/registro/tokens/{token}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_token(
    token: str,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    token_obj = db.query(RegistrationToken).filter(RegistrationToken.token == token).first()
    if not token_obj:
        raise HTTPException(status_code=404, detail="Token no encontrado")
    if token_obj.usado:
        raise HTTPException(status_code=400, detail="No se puede eliminar un token ya usado")
    db.delete(token_obj)
    db.commit()


# ============================================
# ENDPOINTS PÚBLICOS (sin login)
# ============================================

def _token_vigente(token: str, db: Session):
    """Devuelve el token si existe, no se usó y no expiró; si no, None."""
    token_obj = db.query(RegistrationToken).filter(RegistrationToken.token == token).first()
    if not token_obj or token_obj.usado:
        return None
    if token_obj.expira_en.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return None
    return token_obj


@router.get("/api/public/registro/verificar/{token}", response_model=TokenInfo)
def verificar_token(token: str, db: Session = Depends(get_db)):
    token_obj = _token_vigente(token, db)
    if token_obj is None:
        return TokenInfo(valido=False, mensaje=MENSAJE_LINK_INVALIDO)
    return TokenInfo(
        valido=True,
        mensaje="Token válido",
        tipo=token_obj.tipo_esperado.value,
        documento=token_obj.documento_esperado,
    )


def _registrar_persona(db: Session, raw: dict, token_obj: RegistrationToken, ip, extra: dict | None = None):
    """
    Guarda a una persona del formulario público y crea su declaración UAFE.

    - Si la cédula es nueva, se crea la persona.
    - Si ya existe, NO se tocan sus datos personales: lo que escribió queda en la
      declaración como "datos reportados" para que un empleado lo revise.

    Devuelve (party, era_nueva).
    """
    datos = PartyCreate(**raw).model_dump()
    if extra:
        datos.update(extra)

    party = svc.buscar_party(db, datos["document_number"])
    nueva = party is None
    reportados = None
    if nueva:
        party = svc.crear_party(db, datos)
    else:
        reportados = svc.reportados_party(party, datos)

    svc.crear_declaracion(
        db,
        party=party,
        datos=datos,
        origen=OrigenDeclaracion.formulario_publico,
        token_id=token_obj.id,
        datos_reportados=reportados,
    )
    registrar_acceso(db, "registro_publico", "registro_publico", "parties", party.document_number, ip)
    return party, nueva


def _enlazar_si_nuevos(db: Session, a, a_nueva: bool, b, b_nueva: bool):
    """
    Solo se enlazan cónyuges cuando los dos son registros nuevos. Si alguno ya
    existía, el enlace queda en sus datos reportados y lo aplica un empleado.
    """
    if a is not None and b is not None and a_nueva and b_nueva:
        svc.vincular_conyuges(db, a, b)


def _socios_validos(socios) -> list:
    return [
        s for s in (socios or [])
        if (s.get("nombres") or "").strip() or (s.get("numero_documento") or "").strip()
    ]


def _validar_socios(datos: dict, anexo_base64) -> tuple[str, list]:
    """
    Los socios se informan de UNA sola forma, obligatoria:
      - empresa controlada por la Supercias: lista, anexo (nómina en PDF) o
        autorización para consultar la web de la Superintendencia;
      - empresa extranjera o no controlada: siempre la lista, con documento.
    """
    socios = _socios_validos(datos.get("socios"))
    controlada = datos.get("controlada_supercias")
    if controlada is None:
        raise HTTPException(status_code=400, detail="Indique si la empresa está controlada por la Superintendencia de Compañías.")

    modalidad = datos.get("socios_modalidad") if controlada else "lista"
    if modalidad not in ("lista", "anexo", "autorizacion"):
        raise HTTPException(status_code=400, detail="Elija cómo va a informar los socios o accionistas.")

    if modalidad == "lista":
        if not socios:
            raise HTTPException(status_code=400, detail="Ingrese al menos un socio o accionista.")
        if not controlada and any(not (s.get("numero_documento") or "").strip() for s in socios):
            raise HTTPException(status_code=400, detail="Indique la cédula o pasaporte de cada socio o accionista.")
    elif modalidad == "anexo" and not anexo_base64:
        raise HTTPException(status_code=400, detail="Adjunte la nómina de socios o accionistas en PDF.")
    elif modalidad == "autorizacion" and not datos.get("autoriza_consulta_supercias"):
        raise HTTPException(status_code=400, detail="Debe autorizar la consulta en la web de la Superintendencia de Compañías.")
    return modalidad, socios


def _registrar_empresa(db: Session, empresa_raw: dict, token_obj: RegistrationToken, ip):
    anexo_base64 = empresa_raw.pop("anexo_socios_base64", None)
    anexo_nombre = empresa_raw.pop("anexo_socios_nombre", None)
    empresa_raw.pop("anexo_socios_path", None)  # nunca aceptar una ruta enviada por el cliente

    datos = CompanyCreate(**empresa_raw).model_dump()

    if datos["ruc"] != token_obj.documento_esperado:
        raise HTTPException(status_code=400, detail="Este enlace fue generado para otro RUC.")

    modalidad, socios = _validar_socios(datos, anexo_base64)
    datos["socios_modalidad"] = modalidad
    datos["autoriza_consulta_supercias"] = modalidad == "autorizacion"
    datos["referencia_supercias"] = None

    # Representante legal (persona)
    rep_datos = svc.datos_rep(datos)
    rep = svc.buscar_party(db, rep_datos["document_number"])
    rep_reportados = None
    if rep is None:
        rep = svc.crear_party(db, rep_datos)
    else:
        rep_reportados = svc.reportados_party(rep, rep_datos)

    # Empresa
    company = svc.buscar_company(db, datos["ruc"])
    company_reportados = None
    if company is None:
        company = Company()
        svc._asignar(company, svc._elegir(datos, svc.COMPANY_IDENTIDAD))
        company.representante = rep
        company.cargo_representante = datos["rep_position"]
        db.add(company)
        db.flush()
    else:
        company_reportados = svc.reportados_company(company, datos)

    decl_empresa = svc.crear_declaracion(
        db,
        company=company,
        datos=datos,
        origen=OrigenDeclaracion.formulario_publico,
        token_id=token_obj.id,
        datos_reportados=company_reportados,
    )
    if modalidad == "lista":
        svc.guardar_socios(decl_empresa, socios)
    elif modalidad == "anexo":
        ruta, nombre = guardar_anexo_pdf(anexo_base64, anexo_nombre, company.ruc)
        decl_empresa.anexo_socios_path = ruta
        decl_empresa.anexo_socios_nombre = nombre

    svc.crear_declaracion(
        db,
        party=rep,
        datos=rep_datos,
        origen=OrigenDeclaracion.formulario_publico,
        token_id=token_obj.id,
        declaracion_empresa=decl_empresa,
        datos_reportados=rep_reportados,
    )
    registrar_acceso(db, "registro_publico", "registro_publico", "companies", company.ruc, ip)
    registrar_acceso(db, "registro_publico", "registro_publico", "parties", rep.document_number, ip)


def _registrar_personas(db: Session, payload: dict, token_obj: RegistrationToken, ip):
    calidad = payload.get("calidad_participacion") or "propios_derechos"
    representado_es_conyugue = bool(payload.get("representado_es_conyugue"))

    titular_raw = dict(payload.get("titular") or {})
    doc_titular = str(titular_raw.get("document_number") or "").strip().upper()
    if doc_titular != token_obj.documento_esperado:
        raise HTTPException(status_code=400, detail="Este enlace fue generado para otro número de documento.")

    extra = {"calidad_participacion": calidad}

    titular, titular_nuevo = _registrar_persona(db, titular_raw, token_obj, ip, extra)

    conyuge = conyuge_nuevo = None
    if payload.get("conyugue"):
        conyuge, conyuge_nuevo = _registrar_persona(db, dict(payload["conyugue"]), token_obj, ip)
        _enlazar_si_nuevos(db, titular, titular_nuevo, conyuge, conyuge_nuevo)

    representado = None
    if payload.get("representado"):
        representado, representado_nuevo = _registrar_persona(db, dict(payload["representado"]), token_obj, ip, extra)
        if payload.get("conyugue_representado"):
            cr, cr_nuevo = _registrar_persona(db, dict(payload["conyugue_representado"]), token_obj, ip)
            _enlazar_si_nuevos(db, representado, representado_nuevo, cr, cr_nuevo)

    if calidad in ("representando", "propios_y_representando"):
        if calidad == "propios_y_representando" and representado_es_conyugue:
            representado = conyuge
        if representado is not None:
            db.add(Representacion(
                representante_id=titular.id,
                representado_id=representado.id,
                es_conyugue=representado_es_conyugue if calidad == "propios_y_representando" else False,
                calidad_participacion=calidad,
                registration_token_id=token_obj.id,
                estado=EstadoRepresentacion.pendiente,
            ))


@router.post("/api/public/registro/{token}", status_code=status.HTTP_201_CREATED)
def registrar_cliente(
    token: str,
    request: Request,
    payload: dict,
    db: Session = Depends(get_db),
):
    token_obj = _token_vigente(token, db)
    if token_obj is None:
        raise HTTPException(status_code=400, detail=MENSAJE_LINK_INVALIDO)

    ip_raw = request.headers.get("X-Forwarded-For", request.client.host if request.client else None)
    ip = ip_raw.split(",")[0].strip() if ip_raw else None

    try:
        tipo = payload.get("tipo", "persona")
        if tipo != token_obj.tipo_esperado.value:
            raise HTTPException(
                status_code=400,
                detail="Este enlace es para registrar "
                + ("una empresa." if token_obj.tipo_esperado == TipoSujeto.empresa else "una persona natural."),
            )

        if tipo == "empresa":
            _registrar_empresa(db, dict(payload.get("empresa") or {}), token_obj, ip)
        else:
            _registrar_personas(db, payload, token_obj, ip)

        token_obj.usado = True
        token_obj.usado_en = datetime.now(timezone.utc)
        db.commit()
        return {"message": "Datos registrados correctamente"}

    except HTTPException:
        db.rollback()
        raise
    except ValidationError as e:
        db.rollback()
        mensajes = []
        for err in e.errors()[:5]:
            campo = ".".join(str(x) for x in err.get("loc", []))
            msg = err.get("msg", "valor inválido").replace("Value error, ", "")
            mensajes.append(f"{campo}: {msg}" if campo else msg)
        raise HTTPException(
            status_code=400,
            detail="Hay datos inválidos en el formulario. " + "; ".join(mensajes),
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error en registro público: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="No se pudieron guardar los datos. Revise la información ingresada o contacte a la notaría.",
        )