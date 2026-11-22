from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models as _models  # noqa: F401  (registra todos los modelos)
from app.routes import auth, users, parties, documents, minutes, companies, templates, registration, uafe, declaraciones

# Las tablas se crean y actualizan con Alembic (alembic upgrade head),
# ya no con create_all.

app = FastAPI(
    title="Sistema Notarial API",
    description="API para generación de matrices y minutas notariales",
    version="1.0.0"
)

import os

# CORS
# En desarrollo/pruebas se permite cualquier origen
# En producción cambiar a los dominios específicos
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")

if ALLOWED_ORIGINS == "*":
    cors_origins = ["*"]
else:
    cors_origins = [origin.strip() for origin in ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False if "*" in cors_origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Registrar rutas
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(parties.router)
app.include_router(documents.router)
app.include_router(minutes.router, prefix="/api")
app.include_router(companies.router)
app.include_router(templates.router)
app.include_router(registration.router)
app.include_router(uafe.router)
app.include_router(declaraciones.router)

@app.get("/")
def root():
    return {
        "message": "API Sistema Notarial",
        "status": "active",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}