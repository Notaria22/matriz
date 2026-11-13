import copy
import uuid
import logging
from dataclasses import dataclass
from typing import Optional
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
from app.models.registro import Registro
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
# ============================================
# LÓGICA COMPARTIDA: formulario público e interno
# ============================================
# El formulario es exactamente el mismo en los dos casos. Cambia solo la
# confianza:
#   - público: si la persona ya existe, lo que escribió queda como "datos
#     reportados" para que un empleado lo revise.
#   - interno (empleado con sesión): la identidad se guarda directamente.

def _sin_campos_ausentes(datos: dict, raw: dict, campos) -> dict:
    """
    Quita los datos de identidad que el formulario no envió (ej. "edificio",
    que solo se llena para minutas), para no borrar lo que ya estaba guardado.
    """
    for c in campos:
        if c not in raw:
            datos.pop(c, None)
    return datos


# ---- Errores de validación claros, en español y por campo ----

_PERSONAS_FORMULARIO = [
    ("titular", "", "Sus datos"),
    ("conyugue", "c_", "Datos del cónyuge"),
    ("representado", "r_", "Datos del representado"),
    ("conyugue_representado", "cr_", "Datos del cónyuge del representado"),
]


def _mensaje_es(err: dict) -> str:
    """Traduce un error de Pydantic a un mensaje claro en español."""
    tipo = err.get("type", "")
    ctx = err.get("ctx") or {}
    valor = err.get("input")
    vacio = valor is None or (isinstance(valor, str) and not valor.strip())
    if tipo == "missing" or (tipo == "string_too_short" and ctx.get("min_length") == 1) or (
        vacio and tipo.endswith("_type")
    ):
        return "Este campo es obligatorio."
    if tipo == "string_too_short":
        return f"Debe tener al menos {ctx.get('min_length')} caracteres."
    if tipo == "string_too_long":
        escribio = f" (escribió {len(valor)})" if isinstance(valor, str) else ""
        return f"Máximo {ctx.get('max_length')} caracteres{escribio}."
    if tipo == "string_pattern_mismatch":
        return "Seleccione una opción válida."
    if tipo.startswith("date") or tipo.startswith("datetime"):
        return "Fecha no válida."
    if tipo.startswith(("decimal", "float", "int")) or tipo in ("greater_than", "less_than"):
        return "Debe ser un número válido."
    if tipo.startswith("bool"):
        return "Seleccione Sí o No."
    if tipo == "value_error":
        msg = str(err.get("msg", "")).replace("Value error, ", "")
        if "email" in msg.lower():
            return "Correo electrónico no válido."
        return msg if msg.endswith(".") else msg + "."
    return "Valor no válido."


def _errores_de(e: ValidationError, prefijo: str, seccion: str) -> list[dict]:
    errores = []
    for err in e.errors():
        loc = [str(x) for x in err.get("loc", []) if not isinstance(x, int)]
        campo = loc[0] if loc else ""
        mensaje = _mensaje_es(err)
        # Errores de todo el modelo (sin campo): ubicarlos en el campo que corresponde
        if not campo and "actividad económica" in mensaje.lower():
            campo = "rep_actividad_economica_otra" if "representante" in mensaje.lower() else "actividad_economica_otra"
        errores.append({
            "campo": f"{prefijo}{campo}" if campo else "",
            "seccion": seccion,
            "mensaje": mensaje,
        })
    return errores


def _error_400(errores: list[dict]) -> HTTPException:
    n = len(errores)
    return HTTPException(
        status_code=400,
        detail={
            "mensaje": "Revise " + ("el campo marcado en rojo." if n == 1 else f"los {n} campos marcados en rojo."),
            "errores": errores,
        },
    )


_FILAS_PATRIMONIO = {
    "inmuebles": (("tipo", "ciudad", "valor"), "Agregue los inmuebles o marque que no posee."),
    "vehiculos": (("marca", "modelo", "placa", "valor"), "Agregue los vehículos o marque que no posee."),
    "acciones": (("entidad", "monto"), "Agregue las inversiones o marque que no posee."),
}


def _errores_patrimonio(pat, prefijo: str, seccion: str, obligatoria: bool) -> list[dict]:
    """Filas empezadas deben estar completas; si es obligatoria, cada parte se declara o se marca 'no posee'."""
    pat = pat or {}
    errores = []

    def error(campo, mensaje):
        errores.append({"campo": f"{prefijo}patrimonio_{campo}", "seccion": seccion, "mensaje": mensaje})

    for lista, (campos, mensaje) in _FILAS_PATRIMONIO.items():
        if pat.get(f"no_posee_{lista}"):
            continue
        filas = [f for f in (pat.get(lista) or []) if any(str(v or "").strip() for v in f.values())]
        if obligatoria and not filas:
            error(lista, mensaje)
        for i, fila in enumerate(pat.get(lista) or []):
            if fila not in filas:
                continue
            for c in campos:
                if not str(fila.get(c) or "").strip():
                    error(f"{lista}_{i}_{c}", "Este campo es obligatorio.")
    if obligatoria and not pat.get("no_posee_inversiones") and not str(pat.get("inversiones") or "").strip():
        error("inversiones", "Indique las entidades o marque que no posee.")
    return errores


def _validar_envio(payload: dict, tipo: str) -> None:
    """Valida TODO el formulario antes de guardar y devuelve todos los errores juntos."""
    errores = []
    if tipo == "empresa":
        raw = {k: v for k, v in (payload.get("empresa") or {}).items()
               if k not in ("anexo_socios_base64", "anexo_socios_nombre", "anexo_socios_path")}
        try:
            CompanyCreate(**raw)
        except ValidationError as e:
            for err in _errores_de(e, "", "Empresa"):
                if err["campo"].startswith("rep_"):
                    err["seccion"] = "Representante legal"
                errores.append(err)
        errores.extend(_errores_patrimonio(raw.get("patrimonio"), "", "Empresa", True))
        errores.extend(_errores_patrimonio(raw.get("rep_patrimonio"), "rep_", "Representante legal", True))
    else:
        for clave, prefijo, seccion in _PERSONAS_FORMULARIO:
            raw = payload.get(clave)
            if not raw:
                continue
            try:
                PartyCreate(**raw)
            except ValidationError as e:
                errores.extend(_errores_de(e, prefijo, seccion))
            errores.extend(_errores_patrimonio(raw.get("patrimonio"), prefijo, seccion, False))
    if errores:
        raise _error_400(errores)


@dataclass
class _Contexto:
    origen: OrigenDeclaracion
    registro_id: str
    token: Optional[RegistrationToken] = None
    usuario: Optional[SystemUser] = None
    ip: Optional[str] = None

    @property
    def interno(self) -> bool:
        return self.origen == OrigenDeclaracion.sistema_interno

    @property
    def token_id(self) -> Optional[int]:
        return self.token.id if self.token is not None else None

    @property
    def usuario_id(self) -> Optional[int]:
        return self.usuario.id if self.usuario is not None else None

    def log(self, db: Session, entidad: str, entidad_id: str, nueva: bool = False):
        if self.interno:
            registrar_acceso(db, self.usuario.username, "crear" if nueva else "actualizar",
                             entidad, entidad_id, self.ip)
        else:
            registrar_acceso(db, "registro_publico", "registro_publico", entidad, entidad_id, self.ip)


def _registrar_persona(db: Session, raw: dict, ctx: _Contexto, extra: dict | None = None):
    """
    Guarda a una persona del formulario y crea su declaración UAFE.

    - Cédula nueva: se crea la persona.
    - Ya existe y es el formulario público: NO se tocan sus datos personales;
      lo que escribió queda como "datos reportados" para revisión.
    - Ya existe y es interno: se actualiza su identidad directamente.

    Devuelve (party, era_nueva).
    """
    datos = _sin_campos_ausentes(PartyCreate(**raw).model_dump(), raw, svc.PARTY_IDENTIDAD)
    if extra:
        datos.update(extra)

    party = svc.buscar_party(db, datos["document_number"])
    nueva = party is None
    reportados = None
    if ctx.interno:
        party = svc.guardar_identidad_party(db, datos)
    elif nueva:
        party = svc.crear_party(db, datos)
    else:
        reportados = svc.reportados_party(party, datos)

    svc.crear_declaracion(
        db,
        party=party,
        datos=datos,
        origen=ctx.origen,
        usuario_id=ctx.usuario_id,
        token_id=ctx.token_id,
        datos_reportados=reportados,
        registro_id=ctx.registro_id,
    )
    ctx.log(db, "parties", party.document_number, nueva)
    return party, nueva


def _enlazar_conyuges(db: Session, ctx: _Contexto, a, a_nueva: bool, b, b_nueva: bool):
    """
    Interno: siempre se enlazan. Público: solo si los dos son registros nuevos;
    si alguno ya existía, el enlace queda en sus datos reportados.
    """
    if a is None or b is None:
        return
    if ctx.interno or (a_nueva and b_nueva):
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


def _registrar_empresa(db: Session, empresa_raw: dict, ctx: _Contexto, documento_esperado: Optional[str]):
    anexo_base64 = empresa_raw.pop("anexo_socios_base64", None)
    anexo_nombre = empresa_raw.pop("anexo_socios_nombre", None)
    empresa_raw.pop("anexo_socios_path", None)  # nunca aceptar una ruta enviada por el cliente

    datos = _sin_campos_ausentes(
        CompanyCreate(**empresa_raw).model_dump(),
        empresa_raw,
        svc.COMPANY_IDENTIDAD + list(svc.REP_IDENTIDAD),
    )

    if documento_esperado and datos["ruc"] != documento_esperado:
        raise HTTPException(status_code=400, detail="Este formulario fue abierto para otro RUC.")

    modalidad, socios = _validar_socios(datos, anexo_base64)
    datos["socios_modalidad"] = modalidad
    datos["autoriza_consulta_supercias"] = modalidad == "autorizacion"
    datos["referencia_supercias"] = None

    rep_datos = svc.datos_rep(datos)
    company_nueva = svc.buscar_company(db, datos["ruc"]) is None
    rep_nuevo = svc.buscar_party(db, rep_datos["document_number"]) is None
    rep_reportados = company_reportados = None

    if ctx.interno:
        company = svc.guardar_empresa_interna(db, datos)
        rep = company.representante
    else:
        # Representante legal (persona)
        rep = svc.buscar_party(db, rep_datos["document_number"])
        if rep is None:
            rep = svc.crear_party(db, rep_datos)
        else:
            rep_reportados = svc.reportados_party(rep, rep_datos)

        company = svc.buscar_company(db, datos["ruc"])
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
        origen=ctx.origen,
        usuario_id=ctx.usuario_id,
        token_id=ctx.token_id,
        datos_reportados=company_reportados,
        registro_id=ctx.registro_id,
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
        origen=ctx.origen,
        usuario_id=ctx.usuario_id,
        token_id=ctx.token_id,
        declaracion_empresa=decl_empresa,
        datos_reportados=rep_reportados,
        registro_id=ctx.registro_id,
    )
    ctx.log(db, "companies", company.ruc, company_nueva)
    ctx.log(db, "parties", rep.document_number, rep_nuevo)
    return company


def _registrar_personas(db: Session, payload: dict, ctx: _Contexto, documento_esperado: Optional[str]):
    calidad = payload.get("calidad_participacion") or "propios_derechos"
    representado_es_conyugue = bool(payload.get("representado_es_conyugue"))

    titular_raw = dict(payload.get("titular") or {})
    doc_titular = str(titular_raw.get("document_number") or "").strip().upper()
    if documento_esperado and doc_titular != documento_esperado:
        raise HTTPException(status_code=400, detail="Este formulario fue abierto para otro número de documento.")

    extra = {"calidad_participacion": calidad}

    titular, titular_nuevo = _registrar_persona(db, titular_raw, ctx, extra)

    conyuge = conyuge_nuevo = None
    if payload.get("conyugue"):
        conyuge, conyuge_nuevo = _registrar_persona(db, dict(payload["conyugue"]), ctx)
        _enlazar_conyuges(db, ctx, titular, titular_nuevo, conyuge, conyuge_nuevo)
    elif ctx.interno and titular.marital_status is not None and titular.marital_status.value != "casado":
        svc.vincular_conyuges(db, titular, None)

    representado = None
    if payload.get("representado"):
        representado, representado_nuevo = _registrar_persona(db, dict(payload["representado"]), ctx, extra)
        if payload.get("conyugue_representado"):
            cr, cr_nuevo = _registrar_persona(db, dict(payload["conyugue_representado"]), ctx)
            _enlazar_conyuges(db, ctx, representado, representado_nuevo, cr, cr_nuevo)

    if calidad in ("representando", "propios_y_representando"):
        if calidad == "propios_y_representando" and representado_es_conyugue:
            representado = conyuge
        if representado is not None:
            db.add(Representacion(
                representante_id=titular.id,
                representado_id=representado.id,
                es_conyugue=representado_es_conyugue if calidad == "propios_y_representando" else False,
                calidad_participacion=calidad,
                registration_token_id=ctx.token_id,
                estado=EstadoRepresentacion.pendiente,
            ))
    return titular


def _payload_para_guardar(payload: dict) -> dict:
    """Copia del envío sin el PDF de socios (se guarda aparte, en disco)."""
    copia = copy.deepcopy(payload)
    empresa = copia.get("empresa")
    if isinstance(empresa, dict):
        empresa.pop("anexo_socios_base64", None)
        empresa.pop("anexo_socios_path", None)
    return copia


def _validar_aceptacion(payload: dict):
    if not payload.get("acepta_condiciones"):
        raise HTTPException(status_code=400, detail="Debe aceptar las condiciones jurídicas, declaraciones y autorización.")
    if not payload.get("acepta_privacidad"):
        raise HTTPException(status_code=400, detail="Debe aceptar el tratamiento de sus datos personales.")


def _procesar(db: Session, payload: dict, ctx_base: dict, tipo: str, documento_esperado: Optional[str]):
    """Valida la aceptación, guarda el envío completo y registra a todos."""
    _validar_envio(payload, tipo)
    _validar_aceptacion(payload)
    registro = Registro(
        tipo=TipoSujeto(tipo),
        origen=ctx_base["origen"],
        registration_token_id=ctx_base["token"].id if ctx_base.get("token") else None,
        registrado_por=ctx_base["usuario"].id if ctx_base.get("usuario") else None,
        payload=_payload_para_guardar(payload),
        acepta_condiciones=True,
        acepta_privacidad=True,
    )
    db.add(registro)
    db.flush()
    ctx = _Contexto(registro_id=registro.id, **ctx_base)

    if tipo == "empresa":
        return _registrar_empresa(db, dict(payload.get("empresa") or {}), ctx, documento_esperado)
    return _registrar_personas(db, payload, ctx, documento_esperado)


def _error_validacion(e: ValidationError) -> HTTPException:
    """Último recurso (la validación previa ya revisa todo el formulario)."""
    return _error_400(_errores_de(e, "", ""))


def _ip(request: Request) -> Optional[str]:
    ip_raw = request.headers.get("X-Forwarded-For", request.client.host if request.client else None)
    return ip_raw.split(",")[0].strip() if ip_raw else None


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

    try:
        tipo = payload.get("tipo", "persona")
        if tipo != token_obj.tipo_esperado.value:
            raise HTTPException(
                status_code=400,
                detail="Este enlace es para registrar "
                + ("una empresa." if token_obj.tipo_esperado == TipoSujeto.empresa else "una persona natural."),
            )

        _procesar(
            db, payload,
            {"origen": OrigenDeclaracion.formulario_publico, "token": token_obj, "ip": _ip(request)},
            tipo, token_obj.documento_esperado,
        )

        token_obj.usado = True
        token_obj.usado_en = datetime.now(timezone.utc)
        db.commit()
        return {"message": "Datos registrados correctamente"}

    except HTTPException:
        db.rollback()
        raise
    except ValidationError as e:
        db.rollback()
        raise _error_validacion(e)
    except Exception as e:
        db.rollback()
        logger.error(f"Error en registro público: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="No se pudieron guardar los datos. Revise la información ingresada o contacte a la notaría.",
        )


# ============================================
# REGISTRO INTERNO (empleado con sesión)
# ============================================

@router.post("/api/registro/interno", status_code=status.HTTP_201_CREATED)
def registrar_interno(
    request: Request,
    payload: dict,
    modo: str = "nuevo",
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    """
    Mismo formulario que el público, llenado desde Comparecientes o desde una
    matriz.
      - modo=nuevo: la cédula/RUC del titular no debe existir.
      - modo=actualizar: debe existir; se actualiza su identidad y se crea una
        declaración UAFE nueva.
    """
    if modo not in ("nuevo", "actualizar"):
        raise HTTPException(status_code=400, detail="Modo inválido.")

    tipo = payload.get("tipo", "persona")
    if tipo not in ("persona", "empresa"):
        raise HTTPException(status_code=400, detail="Tipo inválido.")

    if tipo == "empresa":
        documento = str((payload.get("empresa") or {}).get("ruc") or "").strip()
        existe = svc.buscar_company(db, documento) is not None
    else:
        documento = str((payload.get("titular") or {}).get("document_number") or "").strip().upper()
        existe = svc.buscar_party(db, documento) is not None

    if not documento:
        raise HTTPException(status_code=400, detail="Ingrese el número de documento.")
    if modo == "nuevo" and existe:
        raise HTTPException(
            status_code=409,
            detail=f"El {'RUC' if tipo == 'empresa' else 'documento'} {documento} ya está registrado, use Actualizar.",
        )
    if modo == "actualizar" and not existe:
        raise HTTPException(status_code=404, detail=f"No existe un registro con el documento {documento}.")

    try:
        _procesar(
            db, payload,
            {"origen": OrigenDeclaracion.sistema_interno, "usuario": current_user, "ip": _ip(request)},
            tipo, documento,
        )
        db.commit()
        return {"message": "Datos registrados correctamente", "tipo": tipo, "documento": documento}

    except HTTPException:
        db.rollback()
        raise
    except ValidationError as e:
        db.rollback()
        raise _error_validacion(e)
    except Exception as e:
        db.rollback()
        logger.error(f"Error en registro interno: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="No se pudieron guardar los datos.")


# ============================================
# REGISTRO VIGENTE (para la ficha y la impresión)
# ============================================

def _registro_vigente(db: Session, documento: str, tipo: str) -> Optional[Registro]:
    """Último envío del formulario en el que aparece este documento."""
    from app.models.declaracion_uafe import DeclaracionUAFE  # import local: evita ciclo

    q = db.query(DeclaracionUAFE).filter(DeclaracionUAFE.registro_id.isnot(None))
    if tipo == "empresa":
        company = svc.buscar_company(db, documento)
        if company is None:
            return None
        q = q.filter(DeclaracionUAFE.company_id == company.id)
    else:
        party = svc.buscar_party(db, documento)
        if party is None:
            return None
        q = q.filter(DeclaracionUAFE.party_id == party.id)
    decl = q.order_by(DeclaracionUAFE.fecha.desc(), DeclaracionUAFE.id.desc()).first()
    return db.get(Registro, decl.registro_id) if decl else None


@router.get("/api/registro/vigente/{tipo}/{documento}")
def obtener_registro_vigente(
    tipo: str,
    documento: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user),
):
    if tipo not in ("persona", "empresa"):
        raise HTTPException(status_code=400, detail="Tipo inválido.")
    documento = documento.strip().upper()
    registro = _registro_vigente(db, documento, tipo)
    if registro is None:
        raise HTTPException(status_code=404, detail="Este compareciente no tiene un formulario registrado.")

    usuario = db.get(SystemUser, registro.registrado_por) if registro.registrado_por else None
    registrar_acceso(db, current_user.username, "ver", "registros", registro.id, _ip(request))
    db.commit()
    return {
        "id": registro.id,
        "tipo": registro.tipo.value,
        "origen": registro.origen.value,
        "fecha": registro.fecha.isoformat() if registro.fecha else None,
        "registrado_por": usuario.nombre if usuario else None,
        "acepta_condiciones": registro.acepta_condiciones,
        "acepta_privacidad": registro.acepta_privacidad,
        "payload": registro.payload,
    }