"""
Lógica compartida de comparecientes (personas y empresas) y declaraciones UAFE.

La base separa:
  - identidad (parties / companies), que se actualiza;
  - declaraciones UAFE (declaraciones_uafe), que nunca se sobrescriben.

Hacia afuera (frontend, minutas, sistema UAFE externo) la API sigue devolviendo
el mismo JSON plano de antes: los campos UAFE salen de la última declaración.
"""
from __future__ import annotations

import enum
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.declaracion_uafe import DeclaracionSocio, DeclaracionUAFE
from app.models.enums import (
    EstadoDatosReportados,
    OrigenDeclaracion,
    TipoSujeto,
)
from app.models.party import Party

# ---------------------------------------------------------------------------
# Campos
# ---------------------------------------------------------------------------

PARTY_IDENTIDAD = [
    "document_type", "document_number", "names", "last_names", "gender",
    "marital_status", "nationality", "birth_date", "email", "phone",
    "province", "canton", "parroquia", "sector", "main_street",
    "secondary_street", "number_street", "referencia", "edificio", "occupation", "profession",
]

UAFE_PERSONA = [
    "actividad_economica", "actividad_economica_otra", "empresa_trabajo", "ingreso_mensual", "rol_tramite",
    "origen_fondos", "es_pep", "es_pep_indirecto", "pep_nombre",
    "pep_institucion", "pep_fecha_inicio", "pep_cargo", "pep_grado_relacion",
    "pep_relacion_tipo", "pep_ya_no_ejerce", "pep_fecha_fin", "patrimonio",
    "conyugue_comparece", "razon_exclusion_conyugue", "calidad_participacion",
]

COMPANY_IDENTIDAD = [
    "ruc", "razon_social", "email", "phone", "province", "canton", "parroquia",
    "sector", "main_street", "secondary_street", "number_street", "referencia",
]

UAFE_EMPRESA = [
    "ingreso_mensual", "egreso_mensual", "actividad_empresa", "rol_tramite",
    "origen_fondos", "controlada_supercias", "referencia_supercias",
    "socios_modalidad", "autoriza_consulta_supercias",
]

# Campos del representante dentro del payload de empresa: rep_<campo> -> <campo> de Party
REP_IDENTIDAD = {
    f"rep_{c}": c for c in PARTY_IDENTIDAD if c not in ("marital_status", "edificio")
}
REP_UAFE = {
    f"rep_{c}": c for c in UAFE_PERSONA
    if c not in ("conyugue_comparece", "razon_exclusion_conyugue", "calidad_participacion")
}


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

NUMERICOS = {"ingreso_mensual", "egreso_mensual"}


def _valor_json(v: Any) -> Any:
    """Convierte un valor a algo guardable en JSON y mostrable."""
    if isinstance(v, enum.Enum):
        return v.value
    if isinstance(v, Decimal):
        return format(v.normalize(), "f")
    if isinstance(v, (date, datetime)):
        return v.isoformat()
    if isinstance(v, str):
        return v.strip() or None
    if isinstance(v, dict):
        return {k: _valor_json(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_valor_json(x) for x in v]
    return v


def _comparable(campo: str, v: Any) -> Any:
    """Valor normalizado para comparar (1500, "1500.00" y Decimal('1500') son iguales)."""
    if campo in NUMERICOS and not _vacio(v):
        try:
            return format(Decimal(str(v)).normalize(), "f")
        except Exception:
            pass
    return _valor_json(v)


def _vacio(v: Any) -> bool:
    return v is None or v == "" or v == [] or v == {}


def _elegir(data: dict, campos: list[str]) -> dict:
    return {c: data[c] for c in campos if c in data}


def _a_enum(columna, valor):
    """Convierte un string al enum de la columna (las columnas Enum lo exigen)."""
    if valor is None or isinstance(valor, enum.Enum):
        return valor
    enum_cls = getattr(columna.type, "enum_class", None)
    return enum_cls(valor) if enum_cls else valor


def _asignar(obj, campos: dict) -> None:
    tabla = obj.__table__.columns
    for campo, valor in campos.items():
        if campo in tabla:
            valor = _a_enum(tabla[campo], valor)
        setattr(obj, campo, valor)


# ---------------------------------------------------------------------------
# Personas
# ---------------------------------------------------------------------------

def buscar_party(db: Session, document_number: Optional[str]) -> Optional[Party]:
    if not document_number:
        return None
    return db.query(Party).filter(Party.document_number == document_number.strip().upper()).first()


def guardar_identidad_party(db: Session, datos: dict) -> Party:
    """Crea la persona o actualiza su identidad (sistema interno)."""
    identidad = _elegir(datos, PARTY_IDENTIDAD)
    party = buscar_party(db, identidad.get("document_number"))
    if party is None:
        party = Party()
        db.add(party)
    _asignar(party, identidad)
    db.flush()
    return party


def crear_party(db: Session, datos: dict) -> Party:
    party = Party()
    _asignar(party, _elegir(datos, PARTY_IDENTIDAD))
    db.add(party)
    db.flush()
    return party


def vincular_conyuges(db: Session, party: Party, conyuge: Optional[Party]) -> None:
    """
    Enlaza (o desenlaza, con conyuge=None) a dos personas de los dos lados.
    Si alguno tenía otro cónyuge enlazado, ese enlace viejo se limpia.
    """
    def soltar(p: Optional[Party]):
        if p is not None and p.partner is not None:
            anterior = p.partner
            if anterior.partner_id == p.id:
                anterior.partner = None
            p.partner = None

    if conyuge is not None and conyuge.id == party.id:
        raise HTTPException(status_code=400, detail="Una persona no puede ser su propio cónyuge.")

    if conyuge is None:
        soltar(party)
    elif party.partner_id != conyuge.id or conyuge.partner_id != party.id:
        soltar(party)
        soltar(conyuge)
        party.partner = conyuge
        conyuge.partner = party
    db.flush()


def ultima_declaracion(party_or_company) -> Optional[DeclaracionUAFE]:
    decl = party_or_company.declaraciones
    return decl[0] if decl else None


def _uafe_de(decl: Optional[DeclaracionUAFE], campos: list[str]) -> dict:
    if decl is None:
        return {c: None for c in campos}
    return {c: getattr(decl, c) for c in campos}


def crear_declaracion(
    db: Session,
    *,
    party: Optional[Party] = None,
    company: Optional[Company] = None,
    datos: dict,
    origen: OrigenDeclaracion,
    usuario_id: Optional[int] = None,
    token_id: Optional[int] = None,
    declaracion_empresa: Optional[DeclaracionUAFE] = None,
    datos_reportados: Optional[dict] = None,
    registro_id: Optional[str] = None,
) -> DeclaracionUAFE:
    decl = DeclaracionUAFE(
        tipo_sujeto=TipoSujeto.persona if party is not None else TipoSujeto.empresa,
        party=party,
        company=company,
        origen=origen,
        registrado_por=usuario_id,
        registration_token_id=token_id,
        declaracion_empresa=declaracion_empresa,
        registro_id=registro_id,
    )
    campos = UAFE_PERSONA if party is not None else UAFE_EMPRESA
    _asignar(decl, {c: datos.get(c) for c in campos})
    if datos_reportados:
        decl.datos_reportados = datos_reportados
        decl.datos_reportados_estado = EstadoDatosReportados.pendiente
    db.add(decl)
    db.flush()
    return decl


def declaracion_si_cambia(
    db: Session,
    party: Party,
    datos: dict,
    usuario_id: Optional[int],
) -> Optional[DeclaracionUAFE]:
    """
    Sistema interno: crea una declaración nueva solo si los datos UAFE enviados
    son distintos de la última declaración. Si no hay nada que declarar, no crea.
    """
    enviados = _elegir(datos, UAFE_PERSONA)
    if not enviados:
        return None

    actual = ultima_declaracion(party)
    base = _uafe_de(actual, UAFE_PERSONA)
    nuevos = {**base, **enviados}

    if actual is None:
        significativos = {
            k: v for k, v in nuevos.items()
            if not (k == "conyugue_comparece" and v in (True, None))
        }
        if all(_vacio(v) for v in significativos.values()):
            return None
    elif all(_comparable(c, nuevos[c]) == _comparable(c, base[c]) for c in UAFE_PERSONA):
        return None

    return crear_declaracion(
        db, party=party, datos=nuevos,
        origen=OrigenDeclaracion.sistema_interno, usuario_id=usuario_id,
    )


def diferencias(actual: dict, reportado: dict) -> dict:
    """{campo: {"actual": x, "reportado": y}} solo para los campos que cambian."""
    cambios = {}
    for campo, valor in reportado.items():
        a, r = _valor_json(actual.get(campo)), _valor_json(valor)
        if _vacio(r):
            continue
        if a != r:
            cambios[campo] = {"actual": a, "reportado": r}
    return cambios


def identidad_party_dict(party: Party) -> dict:
    d = {c: _valor_json(getattr(party, c)) for c in PARTY_IDENTIDAD}
    d["partner_document_number"] = party.partner.document_number if party.partner else None
    return d


def identidad_company_dict(company: Company) -> dict:
    d = {c: _valor_json(getattr(company, c)) for c in COMPANY_IDENTIDAD}
    d["cargo_representante"] = company.cargo_representante
    d["representante_document_number"] = company.representante.document_number
    return d


def _resumen_declaracion(decl: DeclaracionUAFE) -> dict:
    return {
        "id": decl.id,
        "fecha": decl.fecha.isoformat() if decl.fecha else None,
        "origen": decl.origen.value,
        "rol_tramite": _valor_json(decl.rol_tramite),
        "origen_fondos": decl.origen_fondos,
        "es_pep": decl.es_pep,
        "es_pep_indirecto": decl.es_pep_indirecto,
    }


def _pendientes(decls: list[DeclaracionUAFE], actual: dict) -> list[dict]:
    """Datos personales reportados por el cliente que todavía no se revisan."""
    pendientes = []
    for d in decls:
        if d.datos_reportados_estado != EstadoDatosReportados.pendiente or not d.datos_reportados:
            continue
        cambios = diferencias(actual, d.datos_reportados)
        if cambios:
            pendientes.append({
                "declaracion_id": d.id,
                "fecha": d.fecha.isoformat() if d.fecha else None,
                "cambios": cambios,
            })
    return pendientes


def serializar_party(party: Party, con_partner: bool = True) -> dict:
    """Mismo JSON plano que devolvía GET /api/users/{documento} antes del refactor."""
    decl = ultima_declaracion(party)
    data = {c: getattr(party, c) for c in PARTY_IDENTIDAD}
    for c in ("document_type", "gender", "marital_status"):
        data[c] = data[c].value if data[c] is not None else None
    data["partner_document_number"] = party.partner.document_number if party.partner else None

    uafe = _uafe_de(decl, UAFE_PERSONA)
    for c, v in uafe.items():
        if isinstance(v, enum.Enum):
            uafe[c] = v.value
        elif isinstance(v, Decimal):
            uafe[c] = float(v)
    if uafe["conyugue_comparece"] is None:
        uafe["conyugue_comparece"] = True
    data.update(uafe)
    data["pep_anios_trabajo"] = None  # campo retirado; se mantiene por compatibilidad

    data["declaraciones"] = [_resumen_declaracion(d) for d in party.declaraciones]
    data["datos_reportados_pendientes"] = _pendientes(party.declaraciones, identidad_party_dict(party))

    if con_partner:
        data["partner"] = serializar_party(party.partner, con_partner=False) if party.partner else None
    return data


# ---------------------------------------------------------------------------
# Empresas
# ---------------------------------------------------------------------------

def buscar_company(db: Session, ruc: Optional[str]) -> Optional[Company]:
    if not ruc:
        return None
    return db.query(Company).filter(Company.ruc == ruc.strip()).first()


def datos_rep(datos: dict) -> dict:
    """Extrae del payload de empresa los datos del representante como persona."""
    rep = {campo: datos[clave] for clave, campo in REP_IDENTIDAD.items() if clave in datos}
    rep.update({campo: datos[clave] for clave, campo in REP_UAFE.items() if clave in datos})
    return rep


def guardar_empresa_interna(db: Session, datos: dict) -> Company:
    """
    Sistema interno: crea o actualiza la empresa y su representante legal.
    Si el representante ya existe por su cédula, se actualizan sus datos.
    """
    rep_datos = datos_rep(datos)
    rep = buscar_party(db, rep_datos.get("document_number"))
    if rep is None:
        rep = crear_party(db, rep_datos)
    else:
        _asignar(rep, _elegir(rep_datos, [c for c in PARTY_IDENTIDAD if c in REP_IDENTIDAD.values()]))
        db.flush()

    company = buscar_company(db, datos.get("ruc"))
    if company is None:
        company = Company()
        db.add(company)
    _asignar(company, _elegir(datos, COMPANY_IDENTIDAD))
    company.representante = rep
    if datos.get("rep_position"):
        company.cargo_representante = datos["rep_position"]
    db.flush()
    return company


def _decl_rep_de(company: Company, decl_empresa: Optional[DeclaracionUAFE]) -> Optional[DeclaracionUAFE]:
    """Declaración UAFE del representante: la enlazada a la última de la empresa, o la última suya."""
    if decl_empresa is not None:
        enlazadas = [d for d in decl_empresa.declaraciones_representante
                     if d.party_id == company.representante_id]
        if enlazadas:
            return enlazadas[0]
    return ultima_declaracion(company.representante)


def declaracion_con_anexo(company: Company) -> Optional[DeclaracionUAFE]:
    for d in company.declaraciones:
        if d.anexo_socios_path:
            return d
    return None


def serializar_company(company: Company) -> dict:
    """Mismo JSON plano que devolvía GET /api/companies/{ruc} antes del refactor."""
    decl = ultima_declaracion(company)
    rep = company.representante
    rep_decl = _decl_rep_de(company, decl)

    data = {c: getattr(company, c) for c in COMPANY_IDENTIDAD}

    for clave, campo in REP_IDENTIDAD.items():
        v = getattr(rep, campo)
        data[clave] = v.value if isinstance(v, enum.Enum) else v
    data["rep_position"] = company.cargo_representante

    for c, v in _uafe_de(decl, UAFE_EMPRESA).items():
        data[c] = float(v) if isinstance(v, Decimal) else (v.value if isinstance(v, enum.Enum) else v)

    data["socios"] = [
        {
            "nombres": s.nombres,
            "tipo_documento": s.tipo_documento,
            "numero_documento": s.numero_documento,
            "porcentaje": float(s.porcentaje) if s.porcentaje is not None else None,
        }
        for s in (decl.socios if decl else [])
    ]
    con_anexo = declaracion_con_anexo(company)
    data["anexo_socios_nombre"] = con_anexo.anexo_socios_nombre if con_anexo else None

    for clave, campo in REP_UAFE.items():
        v = getattr(rep_decl, campo) if rep_decl else None
        data[clave] = float(v) if isinstance(v, Decimal) else (v.value if isinstance(v, enum.Enum) else v)
    data["rep_pep_anios_trabajo"] = None

    data["declaraciones"] = [_resumen_declaracion(d) for d in company.declaraciones]
    data["datos_reportados_pendientes"] = _pendientes(company.declaraciones, identidad_company_dict(company))
    data["rep_datos_reportados_pendientes"] = _pendientes(rep.declaraciones, identidad_party_dict(rep))
    return data


def guardar_socios(decl: DeclaracionUAFE, socios: Optional[list]) -> None:
    for s in socios or []:
        nombres = (s.get("nombres") or "").strip()
        numero = (s.get("numero_documento") or "").strip()
        if not nombres and not numero:
            continue
        porcentaje = s.get("porcentaje")
        decl.socios.append(DeclaracionSocio(
            nombres=nombres or numero,
            tipo_documento=s.get("tipo_documento") or None,
            numero_documento=numero or None,
            porcentaje=Decimal(str(porcentaje)) if porcentaje not in (None, "") else None,
        ))


def serializar_declaracion(decl: DeclaracionUAFE) -> dict:
    """Declaración completa (para el historial y el sistema UAFE externo)."""
    campos = UAFE_PERSONA if decl.tipo_sujeto == TipoSujeto.persona else UAFE_EMPRESA
    data = {
        "id": decl.id,
        "fecha": decl.fecha.isoformat() if decl.fecha else None,
        "origen": decl.origen.value,
        "registrado_por": decl.registrado_por,
    }
    for c in campos:
        v = getattr(decl, c)
        data[c] = float(v) if isinstance(v, Decimal) else _valor_json(v) if not isinstance(v, (bool, dict, list)) else v
    if decl.tipo_sujeto == TipoSujeto.persona:
        data["situacion_patrimonial"] = data.pop("patrimonio")
    else:
        data["actividad_economica"] = data.pop("actividad_empresa")
        data["socios"] = [
            {
                "nombres": s.nombres,
                "tipo_documento": s.tipo_documento,
                "numero_documento": s.numero_documento,
                "porcentaje": float(s.porcentaje) if s.porcentaje is not None else None,
            }
            for s in decl.socios
        ]
        data["tiene_anexo"] = bool(decl.anexo_socios_path)
    return data


def reportados_party(party: Party, datos: dict) -> Optional[dict]:
    """
    Datos personales que escribió en el formulario público alguien ya registrado.
    Devuelve None si no hay nada distinto de lo que ya está guardado.
    """
    reportado = {c: _valor_json(datos.get(c)) for c in PARTY_IDENTIDAD if c in datos}
    if datos.get("partner_document_number"):
        reportado["partner_document_number"] = datos["partner_document_number"]
    return reportado if diferencias(identidad_party_dict(party), reportado) else None


def reportados_company(company: Company, datos: dict) -> Optional[dict]:
    reportado = {c: _valor_json(datos.get(c)) for c in COMPANY_IDENTIDAD if c in datos}
    if datos.get("rep_position"):
        reportado["cargo_representante"] = datos["rep_position"]
    if datos.get("rep_document_number"):
        reportado["representante_document_number"] = datos["rep_document_number"]
    return reportado if diferencias(identidad_company_dict(company), reportado) else None


def aplicar_reportados(db: Session, decl: DeclaracionUAFE) -> None:
    """Aplica a la identidad los datos que reportó el cliente (lo aprueba un empleado)."""
    rep = {k: v for k, v in (decl.datos_reportados or {}).items() if not _vacio(v)}

    if decl.tipo_sujeto == TipoSujeto.persona:
        from app.schemas.party import PartyCreate  # import local: evita ciclo

        party = decl.party
        combinado = {**identidad_party_dict(party), **rep}
        if combinado.get("marital_status") != "casado":
            combinado["partner_document_number"] = None
        # Se valida igual que un registro normal antes de tocar la identidad
        validado = PartyCreate(**combinado).model_dump()
        _asignar(party, _elegir(validado, PARTY_IDENTIDAD))

        if validado.get("marital_status") != "casado":
            vincular_conyuges(db, party, None)
        elif rep.get("partner_document_number"):
            conyuge = buscar_party(db, rep["partner_document_number"])
            if conyuge is not None:
                vincular_conyuges(db, party, conyuge)
    else:
        company = decl.company
        _asignar(company, _elegir(rep, COMPANY_IDENTIDAD))
        if rep.get("cargo_representante"):
            company.cargo_representante = rep["cargo_representante"]
        if rep.get("representante_document_number"):
            nuevo_rep = buscar_party(db, rep["representante_document_number"])
            if nuevo_rep is not None:
                company.representante = nuevo_rep

    decl.datos_reportados_estado = EstadoDatosReportados.aplicado
    db.flush()