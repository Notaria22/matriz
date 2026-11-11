from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

# Schema para crear usuario (solo admin)
class SystemUserCreate(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100, description="Nombre completo")
    username: str = Field(..., min_length=3, max_length=100, description="Nombre de usuario único")
    password: str = Field(..., min_length=6, description="Contraseña (mínimo 6 caracteres)")
    rol: str = Field(..., pattern="^(admin|notaria|lexdata)$", description="Rol del usuario")
    iniciales: Optional[str] = Field(None, max_length=10, description="Iniciales del usuario")  # 🔥 NUEVO
    
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').replace('.', '').isalnum():
            raise ValueError('Username debe ser alfanumérico (puede incluir _ y .)')
        return v.lower()

# Schema para actualizar usuario
class SystemUserUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=100)
    password: Optional[str] = Field(None, min_length=6)
    rol: Optional[str] = Field(None, pattern="^(admin|notaria|lexdata)$")
    iniciales: Optional[str] = Field(None, max_length=10)  # 🔥 NUEVO
    activo: Optional[bool] = None

# Schema para respuesta (sin password)
class SystemUserResponse(BaseModel):
    id: int
    nombre: str
    username: str
    rol: str
    iniciales: Optional[str] = None  # 🔥 NUEVO
    activo: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Schema para login
class LoginRequest(BaseModel):
    username: str
    password: str

# Schema para respuesta de login (igual que Node.js)
class LoginResponse(BaseModel):
    message: str
    token: str
    user: dict  # {id, nombre, username, rol}

# Schema para token (para compatibilidad)
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Schema para datos del usuario en respuestas
class UserData(BaseModel):
    id: int
    nombre: str
    username: str
    rol: str
    iniciales: Optional[str] = None  # 🔥 NUEVO

# Schema para verify endpoint
class VerifyResponse(BaseModel):
    user: UserData
    
# Schema para respuesta de creación de usuario
class SystemUserCreateResponse(BaseModel):
    message: str
    user: dict  # {id, nombre, username, rol, iniciales, activo}  # 🔥 ACTUALIZADO COMENTARIO

# Schema para respuesta de actualización
class SystemUserUpdateResponse(BaseModel):
    message: str
    user: dict  # {id, nombre, username, rol, iniciales, activo}  # 🔥 ACTUALIZADO COMENTARIO

# Schema para respuesta simple con mensaje
class MessageResponse(BaseModel):
    message: str

# Schema para cambio de contraseña
class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, alias="currentPassword")
    new_password: str = Field(..., min_length=6, alias="newPassword")
    
    class Config:
        populate_by_name = True