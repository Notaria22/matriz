import enum

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MinuteType(enum.Enum):
    COMPRAVENTA_INMUEBLE = "compraventa_inmueble"
    PROMESA_COMPRAVENTA = "promesa_compraventa"
    PODERES = "poderes"


class Minute(Base):
    __tablename__ = "minutes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(20), nullable=False, unique=True)
    minute_type = Column(SQLEnum(MinuteType, name="minute_type"), nullable=False)
    contract_data = Column(JSON, nullable=False)
    file_path = Column(String(500), nullable=True)
    texto_busqueda = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("system_users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    creator = relationship("SystemUser", back_populates="minutes")