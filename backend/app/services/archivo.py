"""Códigos de borradores, minutas y protocolos, y texto para el buscador del Archivo."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

# Ecuador continental no tiene horario de verano
ZONA_ECUADOR = timezone(timedelta(hours=-5))

CLAVES_BUSQUEDA = {
    "nombres", "apellidos", "names", "lastNames", "last_names", "nombreCompleto",
    "cedula", "documentNumber", "document_number", "ruc", "razonSocial", "razon_social",
    "repNames", "repLastNames", "repDocumentNumber", "nombreConjunto",
}


def ahora_ecuador() -> datetime:
    return datetime.now(ZONA_ECUADOR)


def siguiente_codigo(db: Session, tipo: str) -> str:
    """AAAA-MM-000001: el número sube de uno en uno y vuelve a 1 cada mes."""
    hoy = ahora_ecuador()
    db.execute(
        text(
            "INSERT INTO contadores_mensuales (tipo, anio, mes, ultimo) "
            "VALUES (:tipo, :anio, :mes, LAST_INSERT_ID(1)) "
            "ON DUPLICATE KEY UPDATE ultimo = LAST_INSERT_ID(ultimo + 1)"
        ),
        {"tipo": tipo, "anio": hoy.year, "mes": hoy.month},
    )
    numero = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()
    return f"{hoy.year}-{hoy.month:02d}-{numero:06d}"


def codigo_protocolo(numero_protocolo: str) -> str:
    hoy = ahora_ecuador()
    return f"{hoy.year}-{hoy.month:02d}-{numero_protocolo.strip()}"


def texto_de_busqueda(contenido) -> str:
    """Junta nombres, cédulas y RUC que aparezcan en cualquier parte del contenido."""
    valores = []

    def recorrer(x):
        if isinstance(x, dict):
            for k, v in x.items():
                if k in CLAVES_BUSQUEDA and isinstance(v, (str, int)) and str(v).strip():
                    valores.append(str(v).strip())
                else:
                    recorrer(v)
        elif isinstance(x, list):
            for v in x:
                recorrer(v)

    recorrer(contenido)
    vistos = dict.fromkeys(valores)
    return " ".join(vistos)[:5000]


def filtrar_busqueda(query, columnas, q, columna_fecha=None, desde=None, hasta=None):
    """Filtro común del Archivo: texto en cualquiera de las columnas y rango de fechas."""
    if q and q.strip():
        termino = f"%{q.strip()}%"
        condicion = columnas[0].ilike(termino)
        for col in columnas[1:]:
            condicion = condicion | col.ilike(termino)
        query = query.filter(condicion)
    if columna_fecha is not None and desde:
        query = query.filter(columna_fecha >= desde)
    if columna_fecha is not None and hasta:
        query = query.filter(columna_fecha < hasta + timedelta(days=1))
    return query