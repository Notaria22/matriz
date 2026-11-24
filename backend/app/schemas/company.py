from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from typing import Optional, Any
from datetime import date
from decimal import Decimal

import re

from app.schemas.party import error_de_campos, errores_residencia, limpiar_telefono, normalizar_numero_casa


# Identificación fiscal extranjera (NIT, EIN, CIF...): sin barras, para que sirva en las direcciones web
PATRON_ID_EXTRANJERA = re.compile(r"[A-Z0-9][A-Z0-9.\-]{1,28}[A-Z0-9]")


def errores_ruc(ruc: str) -> list[tuple[str, str]]:
    if not (ruc.isdigit() and len(ruc) == 13):
        return [("ruc", "El RUC debe tener 13 dígitos.")]
    if not ruc.endswith("001"):
        return [("ruc", "El RUC de empresa debe terminar en 001.")]
    if not 1 <= int(ruc[:2]) <= 24:
        return [("ruc", "Código de provincia inválido en el RUC.")]
    return []


class CompanyBase(BaseModel):
    """Schema base para empresas"""

    # Identificación empresa
    # RUC, o la identificación fiscal del país de domicilio si es extranjera
    ruc: str = Field(..., min_length=3, max_length=30)
    es_extranjera: Optional[bool] = False
    pais_domicilio: Optional[str] = Field(None, max_length=80)
    ciudad_domicilio: Optional[str] = Field(None, max_length=100)
    direccion_extranjero: Optional[str] = Field(None, max_length=300)
    razon_social: str = Field(..., min_length=2, max_length=200)

    # Contacto empresa
    email: EmailStr
    phone: str = Field(..., min_length=6, max_length=20)

    # Dirección empresa (en Ecuador; si es extranjera, país, ciudad y texto libre)
    province: Optional[str] = Field(None, max_length=50)
    canton: Optional[str] = Field(None, max_length=50)
    parroquia: Optional[str] = Field(None, max_length=50)
    sector: Optional[str] = Field(None, max_length=100)
    main_street: Optional[str] = Field(None, max_length=150)
    secondary_street: Optional[str] = Field(None, max_length=150)
    number_street: Optional[str] = Field(None, max_length=20)
    referencia: Optional[str] = Field(None, max_length=200)

    # Representante legal
    rep_document_type: str = Field(..., pattern="^(cedula|pasaporte)$")
    rep_document_number: str = Field(..., min_length=6, max_length=13)
    rep_names: str = Field(..., min_length=2, max_length=100)
    rep_last_names: str = Field(..., min_length=2, max_length=100)
    rep_gender: str = Field(..., pattern="^(masculino|femenino)$")
    rep_nationality: str = Field(..., min_length=2, max_length=50)
    rep_birth_date: date
    rep_email: EmailStr
    rep_phone: str = Field(..., min_length=6, max_length=20)
    rep_reside_extranjero: Optional[bool] = False
    rep_pais_residencia: Optional[str] = Field(None, max_length=80)
    rep_ciudad_residencia: Optional[str] = Field(None, max_length=100)
    rep_direccion_extranjero: Optional[str] = Field(None, max_length=300)
    rep_province: Optional[str] = Field(None, max_length=50)
    rep_canton: Optional[str] = Field(None, max_length=50)
    rep_parroquia: Optional[str] = Field(None, max_length=50)
    rep_sector: Optional[str] = Field(None, max_length=100)
    rep_main_street: Optional[str] = Field(None, max_length=150)
    rep_secondary_street: Optional[str] = Field(None, max_length=150)
    rep_number_street: Optional[str] = Field(None, max_length=20)
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
    def validar_domicilio(self):
        errores = []
        self.es_extranjera = bool(self.es_extranjera)
        self.ruc = re.sub(r"\s+", "", self.ruc or "").upper()
        tel = self.phone or ""
        nacional = re.fullmatch(r"\+?593(\d{8,9})", tel)
        if nacional and not self.es_extranjera:
            tel = self.phone = "0" + nacional.group(1)
        if self.es_extranjera:
            if not PATRON_ID_EXTRANJERA.fullmatch(self.ruc):
                errores.append(("ruc", "Escriba la identificación fiscal con letras, números, puntos o guiones (de 3 a 30)."))
            if not (self.pais_domicilio or "").strip():
                errores.append(("pais_domicilio", "Seleccione el país de domicilio."))
            elif self.pais_domicilio.strip().lower() == "ecuador":
                errores.append(("pais_domicilio", "Si está domiciliada en Ecuador, elija \"En Ecuador\" arriba."))
            if len((self.ciudad_domicilio or "").strip()) < 2:
                errores.append(("ciudad_domicilio", "Este campo es obligatorio."))
            if len((self.direccion_extranjero or "").strip()) < 5:
                errores.append(("direccion_extranjero", "Escriba la dirección completa."))
            if not re.fullmatch(r"\+?\d{6,15}", tel):
                errores.append(("phone", "Escriba el teléfono con el código del país, por ejemplo +57 601 555 1234."))
            for c in ("province", "canton", "parroquia", "sector", "main_street",
                      "secondary_street", "number_street", "referencia"):
                setattr(self, c, None)
        else:
            errores.extend(errores_ruc(self.ruc))
            for c in ("province", "canton", "main_street", "secondary_street"):
                if len((getattr(self, c) or "").strip()) < 2:
                    errores.append((c, "Este campo es obligatorio."))
            if not (self.number_street or "").strip():
                errores.append(("number_street", "Este campo es obligatorio."))
            if not re.fullmatch(r"\d{9,10}", tel):
                errores.append(("phone", "El teléfono debe tener 9 o 10 dígitos."))
            self.pais_domicilio = self.ciudad_domicilio = self.direccion_extranjero = None
        if errores:
            raise error_de_campos(errores)
        return self

    @model_validator(mode="after")
    def validar_residencia_rep(self):
        errores = errores_residencia(self, "rep_")
        if not self.rep_reside_extranjero and not (self.rep_number_street or "").strip():
            errores.append(("rep_number_street", "Este campo es obligatorio."))
        if errores:
            raise error_de_campos(errores)
        return self

    @model_validator(mode="after")
    def validar_actividad_otra_rep(self):
        if self.rep_actividad_economica == "otro" and not (self.rep_actividad_economica_otra or "").strip():
            raise ValueError("Especifique la actividad económica del representante legal")
        if self.rep_actividad_economica != "otro":
            self.rep_actividad_economica_otra = None
        return self

    @field_validator('number_street', 'rep_number_street')
    @classmethod
    def validate_number_street(cls, v):
        return normalizar_numero_casa(v)

    @field_validator('rep_phone')
    @classmethod
    def validate_rep_phone(cls, v):
        # El formato (Ecuador o internacional) se revisa junto con la residencia
        return limpiar_telefono(v)

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        # El formato (Ecuador o internacional) se revisa junto con el domicilio
        return limpiar_telefono(v)


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
    rep_document_number: Optional[str] = Field(None, min_length=6, max_length=13)
    rep_names: Optional[str] = Field(None, min_length=2, max_length=100)
    rep_last_names: Optional[str] = Field(None, min_length=2, max_length=100)
    rep_gender: Optional[str] = Field(None, pattern="^(masculino|femenino)$")
    rep_nationality: Optional[str] = Field(None, min_length=2, max_length=50)
    rep_birth_date: Optional[date] = None
    rep_email: Optional[EmailStr] = None
    rep_phone: Optional[str] = Field(None, min_length=6, max_length=20)
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