from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(enum.Enum):
    admin = "admin"
    notaria = "notaria"
    lexdata = "lexdata"

class SystemUser(Base):
    __tablename__ = "system_users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    username = Column(String(100), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    rol = Column(Enum(UserRole, name="user_role"), nullable=False)
    iniciales = Column(String(10), nullable=True)
    activo = Column(Boolean, default=True, server_default="1", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    minutes = relationship("Minute", back_populates="creator")