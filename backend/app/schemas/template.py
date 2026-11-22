from pydantic import BaseModel
from typing import Any, Dict, Optional
from datetime import datetime


class TemplateCreate(BaseModel):
    nombre: str
    nombre_vendedor: str
    tipo_contrato: str
    tipo_documento: str
    contenido: Dict[str, Any]


class TemplateUpdate(BaseModel):
    nombre: str
    nombre_vendedor: str
    contenido: Dict[str, Any]


class TemplateResponse(BaseModel):
    id: int
    codigo: str
    nombre: str
    nombre_vendedor: str
    tipo_contrato: str
    tipo_documento: str
    contenido: Dict[str, Any]
    creado_por: int
    creado_at: datetime
    actualizado_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TemplateSearchResult(BaseModel):
    """Respuesta simplificada para el buscador — sin contenido completo"""
    id: int
    codigo: str
    nombre: str
    nombre_vendedor: str
    tipo_contrato: str
    tipo_documento: str
    creado_at: datetime
    actualizado_at: Optional[datetime] = None

    class Config:
        from_attributes = True