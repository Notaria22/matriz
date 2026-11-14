"""
Persona jurídica (identidad).

El representante legal es una persona de `parties`. Sus datos UAFE y los de la
empresa van en `declaraciones_uafe`.
"""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Identificación
    ruc = Column(String(13), nullable=False, unique=True, index=True)
    razon_social = Column(String(200), nullable=False)

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
    referencia = Column(String(200), nullable=True)

    # Representante legal
    representante_id = Column(
        Integer,
        ForeignKey("parties.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    cargo_representante = Column(String(100), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    representante = relationship("Party", foreign_keys=[representante_id])
    declaraciones = relationship(
        "DeclaracionUAFE",
        back_populates="company",
        foreign_keys="DeclaracionUAFE.company_id",
        order_by="(DeclaracionUAFE.fecha.desc(), DeclaracionUAFE.id.desc())",
        cascade="all, delete-orphan",
        passive_deletes=True,  # la base borra en cascada (ON DELETE CASCADE)
    )