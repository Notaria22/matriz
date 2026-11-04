from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from typing import Optional, Any
from datetime import date
from decimal import Decimal


class PartyBase(BaseModel):
    """Schema base para comparecientes"""
    document_number: str = Field(..., min_length=10, max_length=13)
    names: str = Field(..., min_length=2, max_length=100)
    last_names: str = Field(..., min_length=2, max_length=100)
    document_type: str = Field(..., pattern="^(cedula|pasaporte)$")
    gender: str = Field(..., pattern="^(masculino|femenino)$")
    marital_status: str = Field(..., pattern="^(soltero|casado|divorciado|viudo)$")
    partner_document_number: Optional[str] = Field(None, min_length=10, max_length=13)
    nationality: str = Field(..., min_length=2, max_length=50)
    birth_date: date
    email: EmailStr
    phone: str = Field(..., min_length=9, max_length=15)
    province: str = Field(..., min_length=2, max_length=50)
    canton: str = Field(..., min_length=2, max_length=50)
    parroquia: str = Field(..., min_length=2, max_length=50)
    sector: Optional[str] = Field(None, max_length=100)
    main_street: str = Field(..., min_length=2, max_length=150)
    secondary_street: str = Field(..., min_length=2, max_length=150)
    number_street: Optional[str] = Field(None, max_length=20)
    edificio: Optional[str] = Field(None, max_length=200)
    occupation: str = Field(..., min_length=2, max_length=100)
    profession: Optional[str] = Field(None, max_length=100)

    # Campos UAFE
    actividad_economica: Optional[str] = Field(None, pattern="^(independiente|empleado|jubilado|quehaceres_domesticos|cuidador_hogar|estudiante|ninguna|funcionario_publico|empresario|comerciante|emprendedor|creador_contenido|influencer|profesional_autonomo|constructor|contratista|otro)$")
    actividad_economica_otra: Optional[str] = Field(None, max_length=200)
    empresa_trabajo: Optional[str] = Field(None, max_length=200)
    ingreso_mensual: Optional[Decimal] = None
    rol_tramite: Optional[str] = Field(None, pattern="^(vendedor|adquirente)$")
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
    def validar_actividad_otra(self):
        if self.actividad_economica == "otro" and not (self.actividad_economica_otra or "").strip():
            raise ValueError("Especifique la actividad económica")
        if self.actividad_economica != "otro":
            self.actividad_economica_otra = None
        return self

    @field_validator('document_number')
    @classmethod
    def validate_document_number(cls, v, info):
        document_type = info.data.get('document_type')
        if document_type == 'cedula':
            if not v.isdigit() or len(v) != 10:
                raise ValueError('Cédula ecuatoriana debe tener 10 dígitos')
            provincia = int(v[:2])
            if provincia < 1 or provincia > 24:
                raise ValueError('Código de provincia inválido en cédula')
        elif document_type == 'pasaporte':
            if len(v) < 6 or len(v) > 13:
                raise ValueError('Pasaporte debe tener entre 6 y 13 caracteres')
        return v.upper()

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        v = v.replace(' ', '').replace('-', '')
        if not v.isdigit():
            raise ValueError('Teléfono debe contener solo números')
        if len(v) not in [9, 10]:
            raise ValueError('Teléfono debe tener 9 o 10 dígitos')
        return v

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
    province: Optional[str] = None
    canton: Optional[str] = None
    parroquia: Optional[str] = None
    sector: Optional[str] = None
    main_street: Optional[str] = None
    secondary_street: Optional[str] = None
    number_street: Optional[str] = None
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