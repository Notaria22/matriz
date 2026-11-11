from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.sql import func

from app.database import Base


class Document(Base):
    """Registro de matrices generadas (auditoría)."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_type = Column(String(50), nullable=False)  # compraventa, promesa_compraventa, etc.
    protocol_number = Column(String(50), nullable=False)
    amount = Column(Numeric(14, 2), nullable=True)  # cuantía (decimal: sin errores de redondeo)

    generated_by = Column(Integer, ForeignKey("system_users.id"), nullable=False, index=True)

    notario = Column(String(200), nullable=True)
    accion_personal = Column(String(100), nullable=True)  # solo si firmó el notario suplente
    matrizador = Column(String(100), nullable=True)

    # Foto de las partes tal como se usaron en el documento
    parties_data = Column(JSON, nullable=True)

    file_path = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)