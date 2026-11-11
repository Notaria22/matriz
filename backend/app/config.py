from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    # CORS
    ALLOWED_ORIGINS: str = "*"

    # API Key para integración UAFE con sistemas externos
    UAFE_API_KEY: str = ""

    # "desarrollo" solo en el servidor de pruebas (habilita el script de datos falsos)
    ENTORNO: str = ""

    class Config:
        env_file = ".env"


settings = Settings()