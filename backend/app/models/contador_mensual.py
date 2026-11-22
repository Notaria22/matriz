from sqlalchemy import Column, Integer, String

from app.database import Base


class ContadorMensual(Base):
    """Último número usado por tipo y mes; los códigos AAAA-MM-000001 reinician cada mes."""
    __tablename__ = "contadores_mensuales"

    tipo = Column(String(20), primary_key=True)  # borrador, minuta
    anio = Column(Integer, primary_key=True, autoincrement=False)
    mes = Column(Integer, primary_key=True, autoincrement=False)
    ultimo = Column(Integer, nullable=False, default=0)