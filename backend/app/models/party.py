"""
Persona natural (identidad).

Aquí solo van los datos que identifican a la persona y que usan las minutas y
matrices. Lo que declara para la UAFE va en `declaraciones_uafe`, una fila por
cada declaración, para no perder el historial.
"""
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import (  # noqa: F401  (se re-exportan por compatibilidad)
    ActividadEconomica,
    DocumentType,
    Gender,
    MaritalStatus,
    enum_column_type,
)


class Party(Base):
    __tablename__ = "parties"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Identificación (la cédula es única pero se puede corregir sin romper referencias)
    document_type = Column(enum_column_type(DocumentType, "document_type"), nullable=False)
    document_number = Column(String(20), nullable=False, unique=True, index=True)
    names = Column(String(100), nullable=False)
    last_names = Column(String(100), nullable=False)

    # Datos personales
    gender = Column(enum_column_type(Gender, "gender"), nullable=False)
    # Puede quedar vacío cuando la persona se registró solo como representante legal de una empresa
    marital_status = Column(enum_column_type(MaritalStatus, "marital_status"), nullable=True)
    nationality = Column(String(50), nullable=False)
    birth_date = Column(Date, nullable=False)

    # Cónyuge: el backend mantiene sincronizados los dos lados
    partner_id = Column(
        Integer,
        ForeignKey("parties.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Contacto
    email = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False)

    # Dirección
    province = Column(String(50), nullable=False)
    canton = Column(String(50), nullable=False)
    parroquia = Column(String(50), nullable=True)
    sector = Column(String(100), nullable=True)
    main_street = Column(String(150), nullable=False)
    secondary_street = Column(String(150), nullable=False)
    number_street = Column(String(20), nullable=True)
    referencia = Column(String(200), nullable=True)  # "atrás de SOLCA", etc.
    edificio = Column(String(200), nullable=True)

    # Ocupación
    occupation = Column(String(100), nullable=False)
    profession = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    partner = relationship("Party", remote_side=[id], foreign_keys=[partner_id], post_update=True)
    empresas_representadas = relationship(
        "Company", foreign_keys="Company.representante_id", viewonly=True, order_by="Company.razon_social"
    )
    declaraciones = relationship(
        "DeclaracionUAFE",
        back_populates="party",
        foreign_keys="DeclaracionUAFE.party_id",
        order_by="(DeclaracionUAFE.fecha.desc(), DeclaracionUAFE.id.desc())",
        cascade="all, delete-orphan",
        passive_deletes=True,  # la base borra en cascada (ON DELETE CASCADE)
    )