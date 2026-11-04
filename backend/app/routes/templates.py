from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateResponse, TemplateSearchResult
from app.middleware.auth import get_current_user, require_role
from app.models.system_user import SystemUser

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
            detail="No tienes acceso a plantillas de minutas"
        )


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", include_in_schema=False, response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    POST /api/templates - Guardar nueva plantilla
    Requiere autenticación. Permisos según tipo_documento.
    """
    check_template_access(current_user, template_data.tipo_documento)

    try:
        nueva = Template(
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


@router.get("", response_model=List[TemplateSearchResult])
@router.get("/", include_in_schema=False, response_model=List[TemplateSearchResult])
def search_templates(
    q: Optional[str] = Query(None, description="Buscar por nombre de plantilla o vendedor"),
    tipo_documento: Optional[str] = Query(None, description="Filtrar por tipo: 'minuta' o 'matriz'"),
    tipo_contrato: Optional[str] = Query(None, description="Filtrar por contrato: 'compraventa', 'promesa', etc."),
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    GET /api/templates - Buscar plantillas
    Búsqueda case-insensitive por nombre o nombre_vendedor.
    Filtros opcionales por tipo_documento y tipo_contrato.
    """
    # Verificar acceso si se filtra por tipo_documento
    if tipo_documento:
        check_template_access(current_user, tipo_documento)

    query = db.query(Template)

    # Filtro por tipo_documento
    if tipo_documento:
        query = query.filter(Template.tipo_documento == tipo_documento)

    # Filtro por tipo_contrato
    if tipo_contrato:
        query = query.filter(Template.tipo_contrato == tipo_contrato)

    # Búsqueda case-insensitive por nombre o nombre_vendedor
    if q and q.strip():
        termino = f"%{q.strip()}%"
        query = query.filter(
            Template.nombre.ilike(termino) |
            Template.nombre_vendedor.ilike(termino)
        )

    # Ordenar por más recientes primero
    query = query.order_by(Template.creado_at.desc())

    # Limitar resultados para el buscador
    resultados = query.limit(10).all()

    return resultados


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    GET /api/templates/{id} - Obtener plantilla completa con contenido
    Se llama cuando el usuario selecciona una plantilla del buscador.
    """
    plantilla = db.query(Template).filter(Template.id == template_id).first()

    if not plantilla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plantilla no encontrada"
        )

    check_template_access(current_user, plantilla.tipo_documento)

    return plantilla


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    DELETE /api/templates/{id} - Eliminar plantilla
    Preparado para la futura página de gestión de plantillas.
    """
    plantilla = db.query(Template).filter(Template.id == template_id).first()

    if not plantilla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plantilla no encontrada"
        )

    check_template_access(current_user, plantilla.tipo_documento)

    db.delete(plantilla)
    db.commit()