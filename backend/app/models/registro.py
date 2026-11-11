"""
Envío completo del formulario de registro (público o interno).

Guarda exactamente lo que se llenó, en el mismo formato del formulario, para
mostrarlo en Comparecientes en el mismo orden e imprimirlo para la firma.
Cada declaración UAFE creada por el envío apunta a su registro.
"""
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import OrigenDeclaracion, TipoSujeto, enum_column_type


class Registro(Base):
    __tablename__ = "registros"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tipo = Column(enum_column_type(TipoSujeto, "tipo_registro"), nullable=False)
    origen = Column(enum_column_type(OrigenDeclaracion, "origen_registro"), nullable=False)
    registration_token_id = Column(
        Integer, ForeignKey("registration_tokens.id", ondelete="SET NULL"), nullable=True
    )
    registrado_por = Column(Integer, ForeignKey("system_users.id", ondelete="SET NULL"), nullable=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Lo que se llenó, tal cual (sin el PDF de socios, que se guarda aparte)
    payload = Column(JSON, nullable=False)

    # Aceptación obligatoria para poder guardar el formulario
    acepta_condiciones = Column(Boolean, nullable=False)
    acepta_privacidad = Column(Boolean, nullable=False)