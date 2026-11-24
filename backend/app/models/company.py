"""
Persona jurídica (identidad).

El representante legal es una persona de `parties`. Sus datos UAFE y los de la
empresa van en `declaraciones_uafe`.
"""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, false as sa_false
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Identificación
    # RUC, o la identificación fiscal del país de domicilio si es extranjera
    ruc = Column(String(30), nullable=False, unique=True, index=True)
    es_extranjera = Column(Boolean, nullable=False, default=False, server_default=sa_false())
    pais_domicilio = Column(String(80), nullable=True)
    ciudad_domicilio = Column(String(100), nullable=True)
    direccion_extranjero = Column(String(300), nullable=True)
    razon_social = Column(String(200), nullable=False)

    # Contacto
    email = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)

    # Dirección
    province = Column(String(50), nullable=True)
    canton = Column(String(50), nullable=True)
    parroquia = Column(String(50), nullable=True)
    sector = Column(String(100), nullable=True)
    main_street = Column(String(150), nullable=True)
    secondary_street = Column(String(150), nullable=True)
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