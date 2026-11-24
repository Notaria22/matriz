import re
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class GenerarTokenRequest(BaseModel):
    """El link se genera para un documento: el formulario solo aceptará ese."""
    tipo: str = Field(..., pattern="^(persona|empresa)$")
    documento: str = Field(..., min_length=3, max_length=30)
    nombre: str = Field(..., max_length=200)
    # El formulario se abre fijo en este tipo: cedula o pasaporte (personas), ruc o extranjera (empresas)
    tipo_documento: Optional[str] = Field(None, pattern="^(cedula|pasaporte|ruc|extranjera)$")

    @model_validator(mode="after")
    def validar_documento(self):
        self.nombre = " ".join(self.nombre.split()).upper()
        if len(self.nombre) < 3:
            raise ValueError("Ingrese el nombre del compareciente")
        doc = self.documento.strip().upper()
        if self.tipo == "empresa":
            if self.tipo_documento not in ("ruc", "extranjera"):
                self.tipo_documento = "ruc"
            if self.tipo_documento == "ruc" and not (doc.isdigit() and len(doc) == 13 and doc.endswith("001")):
                raise ValueError("El RUC debe tener 13 dígitos y terminar en 001")
            if self.tipo_documento == "extranjera" and not re.fullmatch(r"[A-Z0-9][A-Z0-9.\-]{1,28}[A-Z0-9]", doc):
                raise ValueError("La identificación fiscal debe tener de 3 a 30 letras, números, puntos o guiones")
        else:
            if self.tipo_documento not in ("cedula", "pasaporte"):
                self.tipo_documento = None
            if self.tipo_documento is None:
                self.tipo_documento = "cedula" if doc.isdigit() and len(doc) == 10 else "pasaporte"
            if self.tipo_documento == "cedula" and not (doc.isdigit() and len(doc) == 10):
                raise ValueError("La cédula debe tener 10 dígitos")
            if self.tipo_documento == "pasaporte" and not re.fullmatch(r"[A-Z0-9]{6,13}", doc):
                raise ValueError("El pasaporte debe tener entre 6 y 13 letras o números, sin espacios ni guiones")
        self.documento = doc
        return self


class TokenGenerado(BaseModel):
    """Respuesta al generar un token"""
    token: str
    link: str
    expira_en: datetime
    creado_por: str
    tipo: str
    documento: str
    nombre: Optional[str] = None
    tipo_documento: Optional[str] = None


class TokenInfo(BaseModel):
    """Info del token al verificarlo (respuesta pública)"""
    valido: bool
    mensaje: str
    # Para que el formulario se abra en el tipo correcto y con el documento fijo
    tipo: Optional[str] = None
    documento: Optional[str] = None
    tipo_documento: Optional[str] = None


class RegistrationTokenResponse(BaseModel):
    """Token para la pantalla de gestión de links"""
    id: int
    token: str
    link: Optional[str]
    usado: bool
    usado_en: Optional[datetime]
    tipo_esperado: str
    documento_esperado: str
    documento_tipo_esperado: Optional[str] = None
    nombre_compareciente: Optional[str] = None
    creado_en: datetime
    expira_en: datetime
    creado_por: Optional[str]  # username del empleado

    @field_validator("creado_en", "expira_en", "usado_en")
    @classmethod
    def marcar_utc(cls, valor):
        # La base guarda las fechas en UTC sin zona; sin esto el navegador
        # las lee como hora local y quedan corridas 5 horas
        if valor is not None and valor.tzinfo is None:
            return valor.replace(tzinfo=timezone.utc)
        return valor


class ConteosTokens(BaseModel):
    pendiente: int
    usado: int
    expirado: int
    todos: int


class PaginaTokens(BaseModel):
    items: list[RegistrationTokenResponse]
    total: int
    pagina: int
    paginas: int
    conteos: ConteosTokens