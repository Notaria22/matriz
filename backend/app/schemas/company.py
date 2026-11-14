from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from typing import Optional, Any
from datetime import date
from decimal import Decimal

from app.schemas.party import normalizar_numero_casa


class CompanyBase(BaseModel):
    """Schema base para empresas"""

    # Identificación empresa
    ruc: str = Field(..., min_length=13, max_length=13)
    razon_social: str = Field(..., min_length=2, max_length=200)

    # Contacto empresa
    email: EmailStr
    phone: str = Field(..., min_length=9, max_length=15)

    # Dirección empresa
    province: str = Field(..., min_length=2, max_length=50)
    canton: str = Field(..., min_length=2, max_length=50)
    parroquia: Optional[str] = Field(None, max_length=50)
    sector: str = Field(..., min_length=2, max_length=100)
    main_street: str = Field(..., min_length=2, max_length=150)
    secondary_street: str = Field(..., min_length=2, max_length=150)
    number_street: str = Field(..., min_length=1, max_length=20)
    referencia: Optional[str] = Field(None, max_length=200)

    # Representante legal
    rep_document_type: str = Field(..., pattern="^(cedula|pasaporte)$")
    rep_document_number: str = Field(..., min_length=10, max_length=13)
    rep_names: str = Field(..., min_length=2, max_length=100)
    rep_last_names: str = Field(..., min_length=2, max_length=100)
    rep_gender: str = Field(..., pattern="^(masculino|femenino)$")
    rep_nationality: str = Field(..., min_length=2, max_length=50)
    rep_birth_date: date
    rep_email: EmailStr
    rep_phone: str = Field(..., min_length=9, max_length=15)
    rep_province: str = Field(..., min_length=2, max_length=50)
    rep_canton: str = Field(..., min_length=2, max_length=50)
    rep_parroquia: Optional[str] = Field(None, max_length=50)
    rep_sector: str = Field(..., min_length=2, max_length=100)
    rep_main_street: str = Field(..., min_length=2, max_length=150)
    rep_secondary_street: str = Field(..., min_length=2, max_length=150)
    rep_number_street: str = Field(..., min_length=1, max_length=20)
    rep_referencia: Optional[str] = Field(None, max_length=200)
    rep_occupation: str = Field(..., min_length=2, max_length=100)
    rep_profession: Optional[str] = Field(None, max_length=100)
    rep_position: str = Field(..., min_length=2, max_length=100)

    # Financiero empresa
    ingreso_mensual: Optional[Decimal] = None
    egreso_mensual: Optional[Decimal] = None
    actividad_empresa: Optional[str] = Field(None, max_length=200)
    rol_tramite: Optional[str] = Field(None, pattern="^(vendedor|adquirente|otro)$")
    rol_tramite_otro: Optional[str] = Field(None, max_length=200)
    origen_fondos: Optional[str] = Field(None, max_length=3000)

    # Socios / accionistas
    controlada_supercias: Optional[bool] = None
    socios: Optional[list[dict[str, Any]]] = None
    referencia_supercias: Optional[str] = Field(None, max_length=300)
    socios_modalidad: Optional[str] = Field(None, pattern="^(lista|anexo|autorizacion)$")
    autoriza_consulta_supercias: Optional[bool] = None

    # UAFE representante legal
    # Para el representante de una empresa no aplican quehaceres domésticos, cuidador del hogar,
    # influencer ni creador de contenido
    rep_actividad_economica: Optional[str] = Field(None, pattern="^(independiente|empleado|jubilado|estudiante|ninguna|funcionario_publico|empresario|comerciante|emprendedor|profesional_autonomo|constructor|contratista|otro)$")
    rep_actividad_economica_otra: Optional[str] = Field(None, max_length=200)
    rep_empresa_trabajo: Optional[str] = Field(None, max_length=200)
    rep_ingreso_mensual: Optional[Decimal] = None
    rep_rol_tramite: Optional[str] = Field(None, pattern="^(vendedor|adquirente)$")
    rep_origen_fondos: Optional[str] = Field(None, max_length=3000)
    rep_es_pep: Optional[bool] = None
    rep_pep_nombre: Optional[str] = Field(None, max_length=200)
    rep_pep_institucion: Optional[str] = Field(None, max_length=200)
    rep_pep_fecha_inicio: Optional[date] = None
    rep_pep_cargo: Optional[str] = Field(None, max_length=200)
    rep_pep_anios_trabajo: Optional[int] = None
    rep_pep_grado_relacion: Optional[str] = Field(None, max_length=200)
    rep_es_pep_indirecto: Optional[bool] = None
    rep_pep_relacion_tipo: Optional[str] = Field(None, max_length=100)
    rep_pep_ya_no_ejerce: Optional[bool] = None
    rep_pep_fecha_fin: Optional[date] = None
    rep_patrimonio: Optional[dict[str, Any]] = None
    patrimonio: Optional[dict[str, Any]] = None

    @model_validator(mode="after")
    def validar_rol_otro(self):
        if self.rol_tramite == "otro":
            if not (self.rol_tramite_otro or "").strip():
                raise ValueError("Describa la forma en la que participa en el trámite")
            self.origen_fondos = None
        else:
            self.rol_tramite_otro = None
        return self

    @model_validator(mode="after")
    def validar_actividad_otra_rep(self):
        if self.rep_actividad_economica == "otro" and not (self.rep_actividad_economica_otra or "").strip():
            raise ValueError("Especifique la actividad económica del representante legal")
        if self.rep_actividad_economica != "otro":
            self.rep_actividad_economica_otra = None
        return self

    @field_validator('ruc')
    @classmethod
    def validate_ruc(cls, v):
        if not v.isdigit():
            raise ValueError('El RUC debe contener solo dígitos')
        if len(v) != 13:
            raise ValueError('El RUC debe tener exactamente 13 dígitos')
        if not v.endswith('001'):
            raise ValueError('El RUC de empresa debe terminar en 001')
        provincia = int(v[:2])
        if provincia < 1 or provincia > 24:
            raise ValueError('Código de provincia inválido en RUC')
        return v

    @field_validator('number_street', 'rep_number_street')
    @classmethod
    def validate_number_street(cls, v):
        return normalizar_numero_casa(v)

    @field_validator('phone', 'rep_phone')
    @classmethod
    def validate_phone(cls, v):
        v = v.replace(' ', '').replace('-', '')
        if not v.isdigit():
            raise ValueError('Teléfono debe contener solo números')
        if len(v) not in [9, 10]:
            raise ValueError('Teléfono debe tener 9 o 10 dígitos')
        return v


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    """Schema para actualizar empresa - todos los campos opcionales"""
    razon_social: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=9, max_length=15)
    province: Optional[str] = Field(None, min_length=2, max_length=50)
    canton: Optional[str] = Field(None, min_length=2, max_length=50)
    parroquia: Optional[str] = Field(None, min_length=2, max_length=50)
    sector: Optional[str] = Field(None, min_length=2, max_length=100)
    main_street: Optional[str] = Field(None, min_length=2, max_length=150)
    secondary_street: Optional[str] = Field(None, min_length=2, max_length=150)
    number_street: Optional[str] = Field(None, min_length=1, max_length=20)
    referencia: Optional[str] = Field(None, max_length=200)
    rep_document_type: Optional[str] = Field(None, pattern="^(cedula|pasaporte)$")
    rep_document_number: Optional[str] = Field(None, min_length=10, max_length=13)
    rep_names: Optional[str] = Field(None, min_length=2, max_length=100)
    rep_last_names: Optional[str] = Field(None, min_length=2, max_length=100)
    rep_gender: Optional[str] = Field(None, pattern="^(masculino|femenino)$")
    rep_nationality: Optional[str] = Field(None, min_length=2, max_length=50)
    rep_birth_date: Optional[date] = None
    rep_email: Optional[EmailStr] = None
    rep_phone: Optional[str] = Field(None, min_length=9, max_length=15)
    rep_province: Optional[str] = Field(None, min_length=2, max_length=50)
    rep_canton: Optional[str] = Field(None, min_length=2, max_length=50)
    rep_parroquia: Optional[str] = Field(None, min_length=2, max_length=50)
    rep_sector: Optional[str] = Field(None, min_length=2, max_length=100)
    rep_main_street: Optional[str] = Field(None, min_length=2, max_length=150)
    rep_secondary_street: Optional[str] = Field(None, min_length=2, max_length=150)
    rep_number_street: Optional[str] = Field(None, min_length=1, max_length=20)
    rep_referencia: Optional[str] = Field(None, max_length=200)
    rep_occupation: Optional[str] = Field(None, min_length=2, max_length=100)
    rep_profession: Optional[str] = Field(None, max_length=100)
    rep_position: Optional[str] = Field(None, min_length=2, max_length=100)