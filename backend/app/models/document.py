from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.sql import func

from app.database import Base


class Document(Base):
    """Registro de matrices generadas (auditoría)."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_type = Column(String(50), nullable=False) 
    protocol_number = Column(String(50), nullable=False)
    codigo = Column(String(80), nullable=False, index=True)
    amount = Column(Numeric(14, 2), nullable=True)

    generated_by = Column(Integer, ForeignKey("system_users.id"), nullable=False, index=True)

    notario = Column(String(200), nullable=True)
    accion_personal = Column(String(100), nullable=True)
    matrizador = Column(String(100), nullable=True)

    parties_data = Column(JSON, nullable=True)

    file_path = Column(String(500), nullable=True)

    contenido = Column(JSON, nullable=True)
    texto_busqueda = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)