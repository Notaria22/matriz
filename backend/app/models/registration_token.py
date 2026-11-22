import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import TipoSujeto, enum_column_type


class RegistrationToken(Base):
    """
    Link único para que un cliente llene el formulario público sin login.

    Se genera para un documento concreto (cédula/pasaporte o RUC del titular):
    el formulario solo acepta ese documento, así un link no sirve para otra persona.
    """
    __tablename__ = "registration_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(
        String(36), nullable=False, unique=True, index=True, default=lambda: str(uuid.uuid4())
    )
    link = Column(String(500), nullable=True)

    tipo_esperado = Column(enum_column_type(TipoSujeto, "tipo_esperado"), nullable=False)
    documento_esperado = Column(String(20), nullable=False)
    # Para que el personal sepa a quién envió cada link
    nombre_compareciente = Column(String(200), nullable=True)

    usado = Column(Boolean, default=False, server_default="0", nullable=False)
    usado_en = Column(DateTime(timezone=True), nullable=True)
    expira_en = Column(DateTime(timezone=True), nullable=False)

    creado_por = Column(Integer, ForeignKey("system_users.id", ondelete="SET NULL"), nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)