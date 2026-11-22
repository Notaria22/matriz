from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateResponse, TemplateSearchResult, TemplateUpdate
from app.middleware.auth import get_current_user, require_role
from app.models.system_user import SystemUser
from app.services.archivo import siguiente_codigo, texto_de_busqueda, filtrar_busqueda

router = APIRouter(prefix="/api/templates", tags=["templates"])


def check_template_access(current_user: SystemUser, tipo_documento: str):
    """
    Verifica permisos según tipo de documento y rol:
    - minutas: solo admin y lexdata
    - matrices: admin, lexdata y notaria
    """
    rol = current_user.rol.value
    if tipo_documento == "minuta" and rol == "notaria":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a borradores de minutas"
        )


def borrador_propio(db: Session, template_id: int, current_user: SystemUser) -> Template:
    """Cada usuario solo ve y modifica sus propios borradores."""
    plantilla = db.query(Template).filter(
        Template.id == template_id,
        Template.creado_por == current_user.id,
    ).first()
    if not plantilla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Borrador no encontrado"
        )
    check_template_access(current_user, plantilla.tipo_documento)
    return plantilla


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", include_in_schema=False, response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    POST /api/templates - Guardar nuevo borrador (recibe un código AAAA-MM-000001)
    Requiere autenticación. Permisos según tipo_documento.
    """
    check_template_access(current_user, template_data.tipo_documento)

    try:
        nueva = Template(
            codigo=siguiente_codigo(db, "borrador"),
            texto_busqueda=texto_de_busqueda(template_data.contenido),
            nombre=template_data.nombre,
            nombre_vendedor=template_data.nombre_vendedor,
            tipo_contrato=template_data.tipo_contrato,
            tipo_documento=template_data.tipo_documento,
            contenido=template_data.contenido,
            creado_por=current_user.id
        )
        db.add(nueva)
        db.commit()
        db.refresh(nueva)
        return nueva

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """PUT /api/templates/{id} - Volver a guardar un borrador (conserva su código)"""
    plantilla = borrador_propio(db, template_id, current_user)
    plantilla.nombre = template_data.nombre
    plantilla.nombre_vendedor = template_data.nombre_vendedor
    plantilla.contenido = template_data.contenido
    plantilla.texto_busqueda = texto_de_busqueda(template_data.contenido)
    db.commit()
    db.refresh(plantilla)
    return plantilla


@router.get("", response_model=List[TemplateSearchResult])
@router.get("/", include_in_schema=False, response_model=List[TemplateSearchResult])
def search_templates(
    q: Optional[str] = Query(None, description="Buscar por código, nombre, vendedor, nombres o cédulas"),
    tipo_documento: Optional[str] = Query(None, description="Filtrar por tipo: 'minuta' o 'matriz'"),
    tipo_contrato: Optional[str] = Query(None, description="Filtrar por contrato: 'compraventa', 'promesa', etc."),
    desde: Optional[date] = Query(None),
    hasta: Optional[date] = Query(None),
    limite: int = Query(10, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    GET /api/templates - Buscar borradores del usuario actual
    Búsqueda case-insensitive por código, nombre, vendedor, nombres o cédulas.
    Filtros opcionales por tipo_documento, tipo_contrato y fechas.
    """
    # Verificar acceso si se filtra por tipo_documento
    if tipo_documento:
        check_template_access(current_user, tipo_documento)

    query = db.query(Template).filter(Template.creado_por == current_user.id)

    # Filtro por tipo_documento
    if tipo_documento:
        query = query.filter(Template.tipo_documento == tipo_documento)

    # Filtro por tipo_contrato
    if tipo_contrato:
        query = query.filter(Template.tipo_contrato == tipo_contrato)

    query = filtrar_busqueda(
        query,
        [Template.codigo, Template.nombre, Template.nombre_vendedor, Template.texto_busqueda],
        q, Template.actualizado_at, desde, hasta,
    )

    # Ordenar por más recientes primero
    query = query.order_by(Template.actualizado_at.desc(), Template.id.desc())

    resultados = query.limit(limite).all()

    return resultados


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    GET /api/templates/{id} - Obtener borrador completo con contenido
    Se llama cuando el usuario selecciona un borrador del buscador o del Archivo.
    """
    return borrador_propio(db, template_id, current_user)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    DELETE /api/templates/{id} - Eliminar borrador (desde el Archivo)
    """
    plantilla = borrador_propio(db, template_id, current_user)

    db.delete(plantilla)
    db.commit()