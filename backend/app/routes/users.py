from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.system_user import SystemUser, UserRole
from app.schemas.system_user import (
    SystemUserCreate,
    SystemUserUpdate,
    SystemUserResponse,
    SystemUserCreateResponse,
    SystemUserUpdateResponse,
    MessageResponse,
    ChangePasswordRequest,
    NotarioResponse,
)
from app.models.enums import CargoNotarial, Gender
from app.services.notarios import listar_notarios, validar_cargo
from app.middleware.auth import get_current_user, is_admin
from app.utils.auth import get_password_hash, verify_password

router = APIRouter(prefix="/api/system-users", tags=["system-users"])

@router.post("", response_model=SystemUserCreateResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", include_in_schema=False, response_model=SystemUserCreateResponse, status_code=status.HTTP_201_CREATED)
def create_system_user(
    user_data: SystemUserCreate,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(is_admin)
):
    """
    POST /api/system-users - Crear usuario (solo admin)
    """
    
    # Validar datos requeridos (FastAPI ya lo hace, pero por consistencia)
    if not user_data.nombre or not user_data.username or not user_data.password or not user_data.rol:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre, username, password y rol son requeridos"
        )
    
    # Validar que el rol sea válido
    if user_data.rol not in ['admin', 'notaria', 'lexdata']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol inválido. Debe ser: admin, notaria o lexdata"
        )
    
    # Verificar si el username ya existe
    existing_user = db.query(SystemUser).filter(
        SystemUser.username == user_data.username
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El username ya existe"
        )
    
    validar_cargo(db, user_data.cargo_notarial, user_data.genero, True)

    # Crear el usuario
    new_user = SystemUser(
        nombre=user_data.nombre,
        username=user_data.username,
        password=get_password_hash(user_data.password),
        rol=UserRole[user_data.rol],  # Convertir string a enum
        iniciales=user_data.iniciales,  # 🔥 NUEVO
        cargo_notarial=CargoNotarial(user_data.cargo_notarial) if user_data.cargo_notarial else None,
        genero=Gender(user_data.genero) if user_data.genero else None,
        activo=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Retornar usuario sin password (formato idéntico a Node.js)
    return {
        "message": "Usuario creado exitosamente",
        "user": {
            "id": new_user.id,
            "nombre": new_user.nombre,
            "username": new_user.username,
            "rol": new_user.rol.value,
            "iniciales": new_user.iniciales,  # 🔥 NUEVO
            "cargo_notarial": new_user.cargo_notarial.value if new_user.cargo_notarial else None,
            "genero": new_user.genero.value if new_user.genero else None,
            "activo": new_user.activo
        }
    }

@router.get("", response_model=List[SystemUserResponse])
@router.get("/", include_in_schema=False, response_model=List[SystemUserResponse])
def get_system_users(
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(is_admin)
):
    """
    GET /api/system-users - Listar todos los usuarios del sistema (solo admin)
    """
    users = db.query(SystemUser).all()
    return users

@router.get("/notarios", response_model=List[NotarioResponse])
def get_notarios(
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    GET /api/system-users/notarios - Notario titular y suplente activos
    (para el selector de notario al generar matrices y poderes).
    """
    return listar_notarios(db)


@router.get("/{id}", response_model=SystemUserResponse)
def get_system_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(is_admin)
):
    """
    GET /api/system-users/:id - Obtener un usuario específico (solo admin)
    """
    user = db.query(SystemUser).filter(SystemUser.id == id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user

@router.put("/{id}", response_model=SystemUserUpdateResponse)
def update_system_user(
    id: int,
    user_data: SystemUserUpdate,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(is_admin)
):
    """
    Actualizar usuario del sistema (solo admin)
    """
    user = db.query(SystemUser).filter(SystemUser.id == id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar campos
    if user_data.nombre is not None:
        user.nombre = user_data.nombre
    
    if user_data.rol is not None:
        # Validar que el rol sea válido
        valid_roles = ['admin', 'notaria', 'lexdata']
        if user_data.rol not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rol inválido. Debe ser uno de: {', '.join(valid_roles)}"
            )
        user.rol = UserRole(user_data.rol)
    
    if user_data.activo is not None:
        user.activo = user_data.activo
    
    # Actualizar contraseña si se proporciona
    if user_data.password is not None and user_data.password.strip():
        user.password = get_password_hash(user_data.password)
    
    # 🔥 NUEVO: Actualizar iniciales
    if user_data.iniciales is not None:
        user.iniciales = user_data.iniciales

    # Datos notariales ("" quita el cargo)
    datos = user_data.model_dump(exclude_unset=True)
    if "cargo_notarial" in datos or "genero" in datos:
        cargo = datos.get("cargo_notarial", user.cargo_notarial.value if user.cargo_notarial else None) or None
        genero = datos.get("genero", user.genero.value if user.genero else None) or None
        validar_cargo(db, cargo, genero, user.activo, user.id)
        user.cargo_notarial = CargoNotarial(cargo) if cargo else None
        user.genero = Gender(genero) if genero else None
    elif user_data.activo and user.cargo_notarial:
        # Reactivar a un notario no puede dejar dos titulares o dos suplentes activos
        validar_cargo(db, user.cargo_notarial.value, user.genero.value if user.genero else None, True, user.id)
    
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar usuario: {str(e)}"
        )
    
    return {
        "message": "Usuario actualizado exitosamente",
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "username": user.username,
            "rol": user.rol.value,
            "iniciales": user.iniciales,  # 🔥 NUEVO
            "cargo_notarial": user.cargo_notarial.value if user.cargo_notarial else None,
            "genero": user.genero.value if user.genero else None,
            "activo": user.activo
        }
    }

@router.delete("/{id}", response_model=MessageResponse)
def delete_system_user(
    id: int,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(is_admin)
):
    """
    DELETE /api/system-users/:id - Eliminar usuario (solo admin)
    """
    user = db.query(SystemUser).filter(SystemUser.id == id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Prevenir que el admin se elimine a sí mismo
    if current_user.id == id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "Usuario eliminado exitosamente"}

@router.put("/{id}/change-password", response_model=MessageResponse)
def change_password(
    id: int,
    password_data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    PUT /api/system-users/:id/change-password - Cambiar contraseña
    Puede cambiarla el mismo usuario o un admin
    """
    
    # Validar que vengan los datos
    if not password_data.current_password or not password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual y nueva contraseña son requeridas"
        )
    
    user = db.query(SystemUser).filter(SystemUser.id == id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar que sea el mismo usuario o un admin
    if current_user.id != id and current_user.rol.value != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para cambiar esta contraseña"
        )
    
    # Si no es admin, verificar la contraseña actual
    if current_user.rol.value != 'admin':
        if not verify_password(password_data.current_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Contraseña actual incorrecta"
            )
    
    # Actualizar contraseña
    user.password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}