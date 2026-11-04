"""
Notarios de la notaría: el titular y el suplente se marcan en Gestión de Usuarios.
El título que va en la escritura se arma con el cargo y el género.
"""
from sqlalchemy.orm import Session

from app.models.enums import CargoNotarial, Gender
from app.models.system_user import SystemUser

TITULOS = {
    (CargoNotarial.titular, Gender.masculino): "Notario Público Vigésimo Segundo del Cantón Quito",
    (CargoNotarial.titular, Gender.femenino): "Notaria Pública Vigésima Segunda del Cantón Quito",
    (CargoNotarial.suplente, Gender.masculino): "Notario Público Suplente Vigésimo Segundo del Cantón Quito",
    (CargoNotarial.suplente, Gender.femenino): "Notaria Pública Suplente Vigésima Segunda del Cantón Quito",
}


def titulo_notarial(cargo: CargoNotarial, genero: Gender) -> str:
    return TITULOS[(cargo, genero)]


def listar_notarios(db: Session) -> list[dict]:
    """Usuarios activos con cargo notarial; primero el titular."""
    usuarios = (
        db.query(SystemUser)
        .filter(SystemUser.activo.is_(True), SystemUser.cargo_notarial.isnot(None), SystemUser.genero.isnot(None))
        .all()
    )
    usuarios.sort(key=lambda u: 0 if u.cargo_notarial == CargoNotarial.titular else 1)
    return [
        {
            "id": u.id,
            "nombre": u.nombre.strip().upper(),
            "titulo": titulo_notarial(u.cargo_notarial, u.genero),
            "cargo": u.cargo_notarial.value,
            "genero": u.genero.value,
        }
        for u in usuarios
    ]


def validar_cargo(db: Session, cargo: str | None, genero: str | None, activo: bool, usuario_id: int | None = None) -> None:
    """Un solo titular y un solo suplente activos; el cargo exige el género."""
    from fastapi import HTTPException

    if not cargo:
        return
    if not genero:
        raise HTTPException(status_code=400, detail="Indique el género del notario (para los tratamientos en la escritura).")
    if not activo:
        return
    otro = (
        db.query(SystemUser)
        .filter(SystemUser.cargo_notarial == CargoNotarial(cargo), SystemUser.activo.is_(True))
        .filter(SystemUser.id != (usuario_id or 0))
        .first()
    )
    if otro:
        raise HTTPException(
            status_code=400,
            detail=f"Ya hay un notario {cargo} activo: {otro.nombre}. Quítele el cargo antes de asignarlo a otro usuario.",
        )