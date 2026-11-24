from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from typing import Optional, Any
from datetime import date
from decimal import Decimal
import re


# Número de casa: solo la numeración (E13-51, OE4-23, 333A, S/N). La referencia
# ("atrás de SOLCA") va en su propio campo, porque el número se escribe en letras
# en las escrituras.
PATRON_NUMERO_CASA = re.compile(r"^(S/N|(?=.*\d)[A-Z0-9]+(?:[- ][A-Z0-9]+)*)$")
MENSAJE_NUMERO_CASA = (
    "Escriba solo la numeración, por ejemplo E13-51 o S/N. "
    "Las indicaciones como \"atrás de...\" van en Referencia."
)


CAMPOS_DIRECCION_ECUADOR = (
    "province", "canton", "parroquia", "sector", "main_street",
    "secondary_street", "number_street", "referencia",
)
CAMPOS_DIRECCION_EXTRANJERO = ("pais_residencia", "ciudad_residencia", "direccion_extranjero")


def error_de_campos(errores: list[tuple[str, str]]) -> ValueError:
    """Error de todo el modelo que el formulario ubica en cada campo: 'campo::mensaje||...'."""
    return ValueError("||".join(f"{campo}::{mensaje}" for campo, mensaje in errores))


def limpiar_telefono(v):
    if v is None:
        return v
    return re.sub(r"[\s\-().]", "", str(v))


def errores_residencia(obj, prefijo: str = "") -> list[tuple[str, str]]:
    """
    Quien reside en Ecuador llena la dirección ecuatoriana; quien reside en el
    extranjero, país, ciudad y dirección libre. Se vacía la otra para no mezclar.
    """
    def valor(c):
        return (getattr(obj, f"{prefijo}{c}") or "").strip()

    errores = []
    extranjero = bool(getattr(obj, f"{prefijo}reside_extranjero"))
    setattr(obj, f"{prefijo}reside_extranjero", extranjero)
    if extranjero:
        if not valor("pais_residencia"):
            errores.append((f"{prefijo}pais_residencia", "Seleccione el país de residencia."))
        elif valor("pais_residencia").lower() == "ecuador":
            errores.append((f"{prefijo}pais_residencia", "Si reside en Ecuador, elija \"En Ecuador\" arriba."))
        if len(valor("ciudad_residencia")) < 2:
            errores.append((f"{prefijo}ciudad_residencia", "Este campo es obligatorio."))
        if len(valor("direccion_extranjero")) < 5:
            errores.append((f"{prefijo}direccion_extranjero", "Escriba la dirección completa."))
        for c in CAMPOS_DIRECCION_ECUADOR:
            setattr(obj, f"{prefijo}{c}", None)
    else:
        for c in ("province", "canton", "main_street", "secondary_street"):
            if len(valor(c)) < 2:
                errores.append((f"{prefijo}{c}", "Este campo es obligatorio."))
        for c in CAMPOS_DIRECCION_EXTRANJERO:
            setattr(obj, f"{prefijo}{c}", None)

    telefono = getattr(obj, f"{prefijo}phone") or ""
    # +593 99 123 4567 -> 0991234567
    nacional = re.fullmatch(r"\+?593(\d{8,9})", telefono)
    if nacional and not extranjero:
        telefono = "0" + nacional.group(1)
        setattr(obj, f"{prefijo}phone", telefono)
    if extranjero:
        if not re.fullmatch(r"\+?\d{6,15}", telefono):
            errores.append((f"{prefijo}phone", "Escriba el teléfono con el código del país, por ejemplo +1 305 555 1234."))
    elif not re.fullmatch(r"\d{9,10}", telefono):
        errores.append((f"{prefijo}phone", "El teléfono debe tener 9 o 10 dígitos."))
    return errores


def normalizar_numero_casa(v):
    if v is None:
        return v
    v = re.sub(r"\s+", " ", str(v).strip().upper())
    if not v:
        return None
    if v in ("SN", "S-N", "S N", "S/N.", "SIN NUMERO", "SIN NÚMERO", "SIN NRO", "SIN NO"):
        v = "S/N"
    if not PATRON_NUMERO_CASA.match(v):
        raise ValueError(MENSAJE_NUMERO_CASA)
    return v


class PartyBase(BaseModel):
    """Schema base para comparecientes"""
    document_number: str = Field(..., min_length=6, max_length=13)
    names: str = Field(..., min_length=2, max_length=100)
    last_names: str = Field(..., min_length=2, max_length=100)
    document_type: str = Field(..., pattern="^(cedula|pasaporte)$")
    gender: str = Field(..., pattern="^(masculino|femenino)$")
    marital_status: str = Field(..., pattern="^(soltero|casado|divorciado|viudo)$")
    partner_document_number: Optional[str] = Field(None, min_length=6, max_length=13)
    nationality: str = Field(..., min_length=2, max_length=50)
    birth_date: date
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=20)
    # Dirección: en Ecuador (provincia, cantón, calles) o en el extranjero (país, ciudad, texto libre)
    reside_extranjero: Optional[bool] = False
    pais_residencia: Optional[str] = Field(None, max_length=80)
    ciudad_residencia: Optional[str] = Field(None, max_length=100)
    direccion_extranjero: Optional[str] = Field(None, max_length=300)
    province: Optional[str] = Field(None, max_length=50)
    canton: Optional[str] = Field(None, max_length=50)
    parroquia: Optional[str] = Field(None, max_length=50)
    sector: Optional[str] = Field(None, max_length=100)
    main_street: Optional[str] = Field(None, max_length=150)
    secondary_street: Optional[str] = Field(None, max_length=150)
    number_street: Optional[str] = Field(None, max_length=20)
    referencia: Optional[str] = Field(None, max_length=200)
    edificio: Optional[str] = Field(None, max_length=200)
    occupation: str = Field(..., min_length=2, max_length=100)
    profession: Optional[str] = Field(None, max_length=100)

    # Campos UAFE
    actividad_economica: Optional[str] = Field(None, pattern="^(independiente|empleado|jubilado|quehaceres_domesticos|cuidador_hogar|estudiante|ninguna|funcionario_publico|empresario|comerciante|emprendedor|creador_contenido|influencer|profesional_autonomo|constructor|contratista|otro)$")
    actividad_economica_otra: Optional[str] = Field(None, max_length=200)
    empresa_trabajo: Optional[str] = Field(None, max_length=200)
    ingreso_mensual: Optional[Decimal] = None
    rol_tramite: Optional[str] = Field(None, pattern="^(vendedor|adquirente|otro)$")
    rol_tramite_otro: Optional[str] = Field(None, max_length=200)
    origen_fondos: Optional[str] = Field(None, max_length=3000)
    es_pep: Optional[bool] = None
    es_pep_indirecto: Optional[bool] = None

    # Detalle PEP
    pep_nombre: Optional[str] = Field(None, max_length=200)
    pep_institucion: Optional[str] = Field(None, max_length=200)
    pep_fecha_inicio: Optional[date] = None
    pep_cargo: Optional[str] = Field(None, max_length=200)
    pep_anios_trabajo: Optional[int] = None
    pep_grado_relacion: Optional[str] = Field(None, max_length=200)
    pep_relacion_tipo: Optional[str] = Field(None, max_length=100)
    pep_ya_no_ejerce: Optional[bool] = None
    pep_fecha_fin: Optional[date] = None
    patrimonio: Optional[dict[str, Any]] = None

    # Cónyuge no comparece
    conyugue_comparece: Optional[bool] = True
    razon_exclusion_conyugue: Optional[str] = Field(None, pattern="^(disolucion|capitulacion|adquirido_solo|no_requiere_adquirente|titulo_gratuito|ingresa_sociedad)$")

    # Calidad de participación
    calidad_participacion: Optional[str] = Field(None, pattern="^(propios_derechos|representando|propios_y_representando)$")

    @model_validator(mode="after")
    def validar_residencia(self):
        errores = errores_residencia(self)
        if errores:
            raise error_de_campos(errores)
        return self

    @model_validator(mode="after")
    def validar_actividad_otra(self):
        if self.actividad_economica == "otro" and not (self.actividad_economica_otra or "").strip():
            raise ValueError("Especifique la actividad económica")
        if self.actividad_economica != "otro":
            self.actividad_economica_otra = None
        return self

    @model_validator(mode="after")
    def validar_rol_otro(self):
        if self.rol_tramite == "otro":
            if not (self.rol_tramite_otro or "").strip():
                raise ValueError("Describa la forma en la que participa en el trámite")
            self.origen_fondos = None
        else:
            self.rol_tramite_otro = None
        return self

    @field_validator('document_number')
    @classmethod
    def validate_document_number(cls, v, info):
        document_type = info.data.get('document_type')
        if document_type == 'cedula':
            if not v.isdigit() or len(v) != 10:
                raise ValueError('Cédula ecuatoriana debe tener 10 dígitos')
            provincia = int(v[:2])
            # 30: cédulas de extranjeros residentes en Ecuador
            if not (1 <= provincia <= 24 or provincia == 30):
                raise ValueError('Código de provincia inválido en cédula')
        elif document_type == 'pasaporte':
            v = v.strip()
            if not re.fullmatch(r'[A-Za-z0-9]{6,13}', v):
                raise ValueError('El pasaporte debe tener entre 6 y 13 letras o números, sin espacios ni guiones')
        return v.upper()

    @field_validator('number_street')
    @classmethod
    def validate_number_street(cls, v):
        return normalizar_numero_casa(v)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        # El formato (Ecuador o internacional) se revisa junto con la residencia
        return limpiar_telefono(v)

    @field_validator('partner_document_number')
    @classmethod
    def validate_partner(cls, v, info):
        marital_status = info.data.get('marital_status')
        if marital_status != 'casado' and v:
            raise ValueError('Solo puede tener cónyuge si el estado civil es casado')
        return v


class PartyCreate(PartyBase):
    pass


class PartyUpdate(BaseModel):
    names: Optional[str] = Field(None, min_length=2, max_length=100)
    last_names: Optional[str] = Field(None, min_length=2, max_length=100)
    document_type: Optional[str] = Field(None, pattern="^(cedula|pasaporte)$")
    gender: Optional[str] = Field(None, pattern="^(masculino|femenino)$")
    marital_status: Optional[str] = Field(None, pattern="^(soltero|casado|divorciado|viudo)$")
    partner_document_number: Optional[str] = None
    nationality: Optional[str] = None
    birth_date: Optional[date] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    reside_extranjero: Optional[bool] = None
    pais_residencia: Optional[str] = None
    ciudad_residencia: Optional[str] = None
    direccion_extranjero: Optional[str] = None
    province: Optional[str] = None
    canton: Optional[str] = None
    parroquia: Optional[str] = None
    sector: Optional[str] = None
    main_street: Optional[str] = None
    secondary_street: Optional[str] = None
    number_street: Optional[str] = None
    referencia: Optional[str] = None
    edificio: Optional[str] = None
    occupation: Optional[str] = None
    profession: Optional[str] = None
    actividad_economica: Optional[str] = None
    actividad_economica_otra: Optional[str] = None
    empresa_trabajo: Optional[str] = None
    ingreso_mensual: Optional[Decimal] = None
    es_pep: Optional[bool] = None
    pep_nombre: Optional[str] = None
    pep_institucion: Optional[str] = None
    pep_fecha_inicio: Optional[date] = None
    pep_cargo: Optional[str] = None
    pep_anios_trabajo: Optional[int] = None
    pep_grado_relacion: Optional[str] = None
    pep_relacion_tipo: Optional[str] = None
    pep_ya_no_ejerce: Optional[bool] = None
    pep_fecha_fin: Optional[date] = None
    patrimonio: Optional[dict[str, Any]] = None
    rol_tramite: Optional[str] = None
    origen_fondos: Optional[str] = None
    es_pep_indirecto: Optional[bool] = None
    conyugue_comparece: Optional[bool] = None
    razon_exclusion_conyugue: Optional[str] = None
    calidad_participacion: Optional[str] = None


class PartyResponse(PartyBase):
    class Config:
        from_attributes = True


class PartyWithPartner(PartyResponse):
    partner: Optional[PartyResponse] = None

    class Config:
        from_attributes = True