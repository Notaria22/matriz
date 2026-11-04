"""
Listas de opciones fijas compartidas por todos los modelos.

Se guardan en la base con su valor en minúsculas (ej. "cedula"), no con el
nombre de la clase. Agregar una opción nueva requiere una migración de Alembic.
"""
import enum

from sqlalchemy import Enum as SQLEnum


def enum_column_type(enum_cls: type[enum.Enum], name: str) -> SQLEnum:
    """Tipo de columna que guarda el *valor* del enum (no su nombre)."""
    return SQLEnum(
        enum_cls,
        name=name,
        values_callable=lambda cls: [m.value for m in cls],
        validate_strings=True,
    )


class DocumentType(enum.Enum):
    cedula = "cedula"
    pasaporte = "pasaporte"


class Gender(enum.Enum):
    masculino = "masculino"
    femenino = "femenino"


class MaritalStatus(enum.Enum):
    soltero = "soltero"
    casado = "casado"
    divorciado = "divorciado"
    viudo = "viudo"


class ActividadEconomica(enum.Enum):
    independiente = "independiente"
    empleado = "empleado"
    jubilado = "jubilado"
    quehaceres_domesticos = "quehaceres_domesticos"
    cuidador_hogar = "cuidador_hogar"
    estudiante = "estudiante"
    ninguna = "ninguna"
    funcionario_publico = "funcionario_publico"
    empresario = "empresario"
    comerciante = "comerciante"
    emprendedor = "emprendedor"
    creador_contenido = "creador_contenido"
    influencer = "influencer"
    profesional_autonomo = "profesional_autonomo"
    constructor = "constructor"
    contratista = "contratista"
    otro = "otro"  # se especifica en actividad_economica_otra


class TipoSujeto(enum.Enum):
    persona = "persona"
    empresa = "empresa"


class OrigenDeclaracion(enum.Enum):
    formulario_publico = "formulario_publico"
    sistema_interno = "sistema_interno"


class RolTramite(enum.Enum):
    vendedor = "vendedor"
    adquirente = "adquirente"


class CalidadParticipacion(enum.Enum):
    propios_derechos = "propios_derechos"
    representando = "representando"
    propios_y_representando = "propios_y_representando"


class RazonExclusionConyugue(enum.Enum):
    disolucion = "disolucion"
    capitulacion = "capitulacion"
    adquirido_solo = "adquirido_solo"
    no_requiere_adquirente = "no_requiere_adquirente"
    titulo_gratuito = "titulo_gratuito"


class EstadoDatosReportados(enum.Enum):
    """Datos personales que reportó un cliente ya registrado (formulario público)."""
    pendiente = "pendiente"
    aplicado = "aplicado"
    descartado = "descartado"


class CargoNotarial(enum.Enum):
    """Solo los usuarios con cargo notarial aparecen como notario en las matrices."""
    titular = "titular"
    suplente = "suplente"


class EstadoRepresentacion(enum.Enum):
    pendiente = "pendiente"
    utilizada = "utilizada"
    expirada = "expirada"