from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class LawyerData(BaseModel):
    nombre_abogado: str
    genero_abogado: str
    tipo_matricula: str
    provincia_abogado: Optional[str] = None
    numero_matricula: str
    minuta_texto: str


class NotarioData(BaseModel):
    nombre: str
    titulo: str
    # Número de acción de personal (texto libre): obligatorio para el notario suplente
    accion_personal: Optional[str] = Field(None, max_length=100)


class ConcuerdoData(BaseModel):
    numero_protocolo: str
    names: str
    last_names: str
    document_number: str
    fecha: str


class ParticipantePersona(BaseModel):
    """Datos de una persona natural con opciones especiales"""
    esEmpresa: bool = False
    cedula: str
    nombres: str
    apellidos: str
    genero: str
    estadoCivil: str
    nacionalidad: str
    fechaNacimiento: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    provincia: str
    canton: str
    parroquia: str
    sector: Optional[str] = None
    callePrincipal: str
    calleSecundaria: Optional[str] = None
    numeroCalle: Optional[str] = None
    ocupacion: str
    profesion: Optional[str] = None
    conyuge: Optional[Dict[str, Any]] = None
    # Opciones especiales
    needsInterpreter: bool = False
    nombreInterprete: Optional[str] = None
    generoInterprete: Optional[str] = None
    cedulaInterprete: Optional[str] = None
    idiomaInterprete: Optional[str] = None
    isNoVidente: bool = False
    personaConfianzaNoVidente: Optional[str] = None
    isAnalfabeta: bool = False
    personaConfianzaAnalfabeta: Optional[str] = None
    hasDiscapacidadIntelectual: bool = False
    tipoDiscapacidad: Optional[str] = None
    razonExclusionConyugue: Optional[str] = None


class ParticipanteEmpresa(BaseModel):
    """Datos de una empresa con su representante legal"""
    esEmpresa: bool = True
    ruc: str
    razonSocial: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    provincia: str
    canton: str
    parroquia: str
    sector: Optional[str] = None
    callePrincipal: str
    calleSecundaria: Optional[str] = None
    numeroCalle: Optional[str] = None
    # Representante legal
    repDocumentNumber: str
    repNames: str
    repLastNames: str
    repGenero: str
    repNationality: str
    repFechaNacimiento: str
    repOccupation: str
    repProfession: Optional[str] = None
    repPosition: str
    repProvincia: str
    repCanton: str
    repParroquia: str
    repSector: Optional[str] = None
    repCallePrincipal: str
    repCalleSecundaria: Optional[str] = None
    repNumeroCalle: Optional[str] = None


class GenerateMatrizRequest(BaseModel):
    # Datos administrativos
    numero_protocolo: str
    tipo_contrato: str
    cuantia: float
    fecha_escritura: str
    notario: NotarioData
    matrizador: str

    # Concuerdo (opcional)
    needs_concuerdo: bool = False
    datos_concuerdo: Optional[ConcuerdoData] = None

    # Participantes — lista genérica que acepta personas y empresas
    participantes_list: List[Dict[str, Any]]
    # Compraventa
    vendedores_list: Optional[List[Dict[str, Any]]] = []
    compradores_list: Optional[List[Dict[str, Any]]] = []
    # Promesa de compraventa
    promitentes_vendedores_list: Optional[List[Dict[str, Any]]] = []
    promitentes_compradores_list: Optional[List[Dict[str, Any]]] = []
    # Cesión
    cedentes_list: Optional[List[Dict[str, Any]]] = []
    cesionarios_list: Optional[List[Dict[str, Any]]] = []
    # Donación
    donantes_list: Optional[List[Dict[str, Any]]] = []
    donatarios_list: Optional[List[Dict[str, Any]]] = []

    # Abogado y minuta
    abogado: LawyerData

    # Flags
    is_any_tercera_edad: bool = False


class GenerateMatrizResponse(BaseModel):
    message: str
    document_id: int
    protocol_number: str
    download_url: str