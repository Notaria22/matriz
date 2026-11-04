"""
Declaraciones UAFE.

Cada vez que un cliente llena el formulario público, o un empleado registra
datos UAFE desde la pantalla Comparecientes, se crea una declaración nueva.
Nunca se sobrescriben: así queda el historial de lo que declaró cada persona o
empresa y cuándo. El sistema UAFE externo consume la más reciente.
"""
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import (
    ActividadEconomica,
    CalidadParticipacion,
    EstadoDatosReportados,
    OrigenDeclaracion,
    RazonExclusionConyugue,
    RolTramite,
    TipoSujeto,
    enum_column_type,
)


class DeclaracionUAFE(Base):
    __tablename__ = "declaraciones_uafe"
    __table_args__ = (
        # Una declaración es de una persona o de una empresa, nunca de las dos
        CheckConstraint(
            "(tipo_sujeto = 'persona' AND party_id IS NOT NULL AND company_id IS NULL) OR "
            "(tipo_sujeto = 'empresa' AND company_id IS NOT NULL AND party_id IS NULL)",
            name="ck_declaracion_un_solo_sujeto",
        ),
        Index("ix_declaracion_party_fecha", "party_id", "fecha"),
        Index("ix_declaracion_company_fecha", "company_id", "fecha"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    # De quién es
    tipo_sujeto = Column(enum_column_type(TipoSujeto, "tipo_sujeto"), nullable=False)
    party_id = Column(Integer, ForeignKey("parties.id", ondelete="CASCADE"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)

    # Declaración del representante legal → enlazada a la declaración de su empresa
    declaracion_empresa_id = Column(
        Integer,
        ForeignKey("declaraciones_uafe.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # De dónde vino
    origen = Column(enum_column_type(OrigenDeclaracion, "origen_declaracion"), nullable=False)
    registration_token_id = Column(
        Integer,
        ForeignKey("registration_tokens.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    registrado_por = Column(
        Integer,
        ForeignKey("system_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    fecha = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Participación en el trámite
    rol_tramite = Column(enum_column_type(RolTramite, "rol_tramite"), nullable=True)
    calidad_participacion = Column(
        enum_column_type(CalidadParticipacion, "calidad_participacion"), nullable=True
    )

    # Actividad e ingresos
    actividad_economica = Column(
        enum_column_type(ActividadEconomica, "actividad_economica"), nullable=True
    )  # persona
    actividad_economica_otra = Column(String(200), nullable=True)  # cuando la actividad es "otro"
    actividad_empresa = Column(String(200), nullable=True)  # empresa
    empresa_trabajo = Column(String(200), nullable=True)
    ingreso_mensual = Column(Numeric(12, 2), nullable=True)
    egreso_mensual = Column(Numeric(12, 2), nullable=True)
    origen_fondos = Column(Text, nullable=True)

    # Cónyuge
    conyugue_comparece = Column(Boolean, nullable=True)
    razon_exclusion_conyugue = Column(
        enum_column_type(RazonExclusionConyugue, "razon_exclusion_conyugue"), nullable=True
    )

    # PEP (directo o relacionado)
    es_pep = Column(Boolean, nullable=True)
    es_pep_indirecto = Column(Boolean, nullable=True)
    pep_nombre = Column(String(200), nullable=True)
    pep_relacion_tipo = Column(String(100), nullable=True)
    pep_grado_relacion = Column(String(200), nullable=True)
    pep_institucion = Column(String(200), nullable=True)
    pep_cargo = Column(String(200), nullable=True)
    pep_fecha_inicio = Column(Date, nullable=True)
    pep_ya_no_ejerce = Column(Boolean, nullable=True)
    pep_fecha_fin = Column(Date, nullable=True)

    # Situación patrimonial: {inmuebles: [{tipo, ciudad, valor}], vehiculos: [{marca, modelo, placa, valor}], ...}
    patrimonio = Column(JSON, nullable=True)

    # Datos personales que escribió un cliente que ya estaba registrado.
    # No se aplican solos: un empleado los revisa en la pantalla Comparecientes.
    datos_reportados = Column(JSON, nullable=True)
    datos_reportados_estado = Column(
        enum_column_type(EstadoDatosReportados, "datos_reportados_estado"), nullable=True
    )

    # Solo empresa: socios / Superintendencia de Compañías
    controlada_supercias = Column(Boolean, nullable=True)
    # Cómo informó los socios una empresa controlada: lista | anexo | autorizacion
    socios_modalidad = Column(String(20), nullable=True)
    # Autorizó a la notaría a consultar los socios en la web de la Superintendencia
    autoriza_consulta_supercias = Column(Boolean, nullable=True)
    referencia_supercias = Column(String(300), nullable=True)  # ya no se pide; se conserva el historial
    anexo_socios_path = Column(String(300), nullable=True)  # ruta interna, nunca se expone
    anexo_socios_nombre = Column(String(200), nullable=True)

    party = relationship("Party", back_populates="declaraciones", foreign_keys=[party_id])
    company = relationship("Company", back_populates="declaraciones", foreign_keys=[company_id])
    declaracion_empresa = relationship(
        "DeclaracionUAFE", remote_side=[id], back_populates="declaraciones_representante"
    )
    declaraciones_representante = relationship(
        "DeclaracionUAFE",
        back_populates="declaracion_empresa",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    socios = relationship(
        "DeclaracionSocio",
        back_populates="declaracion",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="DeclaracionSocio.id",
    )


class DeclaracionSocio(Base):
    """Socio o accionista declarado en una declaración de empresa."""
    __tablename__ = "declaracion_socios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    declaracion_id = Column(
        Integer,
        ForeignKey("declaraciones_uafe.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombres = Column(String(200), nullable=False)
    tipo_documento = Column(String(20), nullable=True)  # cedula / pasaporte / ruc
    numero_documento = Column(String(20), nullable=True)
    porcentaje = Column(Numeric(5, 2), nullable=True)

    declaracion = relationship("DeclaracionUAFE", back_populates="socios")