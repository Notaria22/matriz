from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base

class Template(Base):
    """Borradores de formularios (antes "plantillas"); cada usuario ve solo los suyos."""
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(20), nullable=False, unique=True)

    # Identificación
    nombre = Column(String(200), nullable=False)
    nombre_vendedor = Column(String(300), nullable=False)

    # Tipo
    tipo_contrato = Column(String(50), nullable=False)
    tipo_documento = Column(String(20), nullable=False)

    # Contenido completo del formulario
    contenido = Column(JSON, nullable=False)

    # Usuario que la creó
    creado_por = Column(Integer, ForeignKey('system_users.id'), nullable=False)

    # Timestamps
    creado_at = Column(DateTime(timezone=True), server_default=func.now())
    actualizado_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Nombres, cédulas y RUC de los comparecientes, para el buscador del Archivo
    texto_busqueda = Column(Text, nullable=True)