import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class GenerarTokenRequest(BaseModel):
    """El link se genera para un documento: el formulario solo aceptará ese."""
    tipo: str = Field(..., pattern="^(persona|empresa)$")
    documento: str = Field(..., min_length=6, max_length=20)
    nombre: str = Field(..., max_length=200)

    @model_validator(mode="after")
    def validar_documento(self):
        self.nombre = " ".join(self.nombre.split()).upper()
        if len(self.nombre) < 3:
            raise ValueError("Ingrese el nombre del compareciente")
        doc = self.documento.strip().upper()
        if self.tipo == "empresa":
            if not (doc.isdigit() and len(doc) == 13 and doc.endswith("001")):
                raise ValueError("El RUC debe tener 13 dígitos y terminar en 001")
        else:
            es_cedula = doc.isdigit() and len(doc) == 10
            es_pasaporte = bool(re.fullmatch(r"[A-Z0-9]{6,13}", doc)) and not doc.isdigit()
            if not (es_cedula or es_pasaporte):
                raise ValueError("Ingrese una cédula de 10 dígitos o un pasaporte válido")
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


class TokenInfo(BaseModel):
    """Info del token al verificarlo (respuesta pública)"""
    valido: bool
    mensaje: str
    # Para que el formulario se abra en el tipo correcto y con el documento fijo
    tipo: Optional[str] = None
    documento: Optional[str] = None


class RegistrationTokenResponse(BaseModel):
    """Token para la pantalla de gestión de links"""
    id: int
    token: str
    link: Optional[str]
    usado: bool
    usado_en: Optional[datetime]
    tipo_esperado: str
    documento_esperado: str
    nombre_compareciente: Optional[str] = None
    creado_en: datetime
    expira_en: datetime
    creado_por: Optional[str]  # username del empleado