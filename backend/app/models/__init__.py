"""
Importa todos los modelos para que queden registrados en Base.metadata
(lo necesitan Alembic y las relaciones entre modelos).
"""
from app.models.system_user import SystemUser, UserRole
from app.models.party import Party
from app.models.company import Company
from app.models.registration_token import RegistrationToken
from app.models.registro import Registro
from app.models.declaracion_uafe import DeclaracionUAFE, DeclaracionSocio
from app.models.representation import Representacion
from app.models.document import Document
from app.models.minute import Minute, MinuteType
from app.models.template import Template
from app.models.access_log import AccessLog

__all__ = [
    "SystemUser",
    "UserRole",
    "Party",
    "Company",
    "RegistrationToken",
    "Registro",
    "DeclaracionUAFE",
    "DeclaracionSocio",
    "Representacion",
    "Document",
    "Minute",
    "MinuteType",
    "Template",
    "AccessLog",
]