from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.system_user import SystemUser
from app.models.document import Document
from app.schemas.document import GenerateMatrizRequest, GenerateMatrizResponse
from app.middleware.auth import get_current_user
from app.services.document_generator import generate_matriz_compraventa
import os
import logging

router = APIRouter(prefix="/api/documents", tags=["documents"])
logger = logging.getLogger(__name__)
# Mapeo de tipo_contrato a las claves de partes en el payload
TIPO_CONTRATO_CONFIG = {
    "compraventa": {
        "key_parte1": "vendedores_list",
        "key_parte2": "compradores_list",
        "label_parte1": "la parte vendedora",
        "label_parte2": "la parte compradora",
    },
    "promesa_compraventa": {
        "key_parte1": "promitentes_vendedores_list",
        "key_parte2": "promitentes_compradores_list",
        "label_parte1": "la parte promitente vendedora",
        "label_parte2": "la parte promitente compradora",
    },
    "cesion": {
        "key_parte1": "cedentes_list",
        "key_parte2": "cesionarios_list",
        "label_parte1": "la parte cedente",
        "label_parte2": "la parte cesionaria",
    },
    "donacion": {
        "key_parte1": "donantes_list",
        "key_parte2": "donatarios_list",
        "label_parte1": "la parte donante",
        "label_parte2": "la parte donataria",
    },
}

# Cómo se escribe el tipo de contrato dentro de la escritura
NOMBRE_CONTRATO = {
    "compraventa": "COMPRAVENTA",
    "promesa_compraventa": "PROMESA DE COMPRAVENTA",
    "cesion": "CESIÓN",
    "donacion": "DONACIÓN",
}


@router.post("/generate-matriz", response_model=GenerateMatrizResponse)
def generate_matriz(
    request: GenerateMatrizRequest,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """
    Genera matriz — compraventa, promesa de compraventa, cesión o donación.
    """
    try:
        tipo = request.tipo_contrato.lower()

        TIPOS_VALIDOS = {"compraventa", "promesa_compraventa", "cesion", "donacion"}
        if tipo not in TIPOS_VALIDOS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Tipo de contrato '{tipo}' no válido. Valores permitidos: {', '.join(TIPOS_VALIDOS)}"
            )

        # El notario suplente firma con su número de acción de personal
        accion_personal = (request.notario.accion_personal or "").strip() or None
        if "suplente" in (request.notario.titulo or "").lower() and not accion_personal:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ingrese el número de acción de personal del notario suplente",
            )

        config = TIPO_CONTRATO_CONFIG.get(tipo)

        # Obtener las listas de partes según el tipo de contrato
        partes_map = {
            "compraventa": (request.vendedores_list, request.compradores_list),
            "promesa_compraventa": (request.promitentes_vendedores_list, request.promitentes_compradores_list),
            "cesion": (request.cedentes_list, request.cesionarios_list),
            "donacion": (request.donantes_list, request.donatarios_list),
        }
        parte1_list, parte2_list = partes_map.get(tipo, (request.vendedores_list, request.compradores_list))

        datos_para_docx = {
            "numeroProtocolo": request.numero_protocolo,
            "tipoContrato": NOMBRE_CONTRATO.get(tipo, tipo.upper()),
            "cuantia": request.cuantia,
            "fechaActual": request.fecha_escritura,
            "notario": request.notario.nombre,
            "tituloNotario": request.notario.titulo,
            # Solo cuando la matriz sale a nombre del notario suplente
            "accionPersonal": accion_personal,
            "matrizador": request.matrizador,
            "isAnyTerceraEdad": request.is_any_tercera_edad,
            "needsConcuerdo": request.needs_concuerdo,
            "datosConcuerdo": request.datos_concuerdo.dict() if request.datos_concuerdo else None,
            "abogadoNombre": request.abogado.nombre_abogado,
            "abogadoNumeroMatricula": request.abogado.numero_matricula,
            "abogadoTipoMatricula": request.abogado.tipo_matricula,
            "abogadoProvincia": request.abogado.provincia_abogado,
            "abogadoEsMujer": request.abogado.genero_abogado.lower() == "femenino",
            "abogadoTexto": request.abogado.minuta_texto,
            "participantesList": request.participantes_list,
            # Siempre enviamos como vendedores/compradores al generador
            # pero con los labels correctos según el tipo
            "vendedoresList": parte1_list,
            "compradoresList": parte2_list,
            # Labels para las partes en el documento
            "labelParte1": config["label_parte1"],
            "labelParte2": config["label_parte2"],
        }

        TEMPLATE_MAP = {
            "compraventa": "compraventa.docx",
            "promesa_compraventa": "promesa_compraventa.docx",
            "cesion": "cesion.docx",
            "donacion": "donacion.docx",
        }
        template_name = TEMPLATE_MAP.get(tipo, "compraventa.docx")
        file_path = generate_matriz_compraventa(datos_para_docx, template_name=template_name)

        def identificador(p):
            if p.get('esEmpresa'):
                return p.get('ruc', '')
            return p.get('cedula', '')

        document = Document(
            document_type=tipo,
            protocol_number=request.numero_protocolo,
            amount=request.cuantia,
            generated_by=current_user.id,
            notario=request.notario.nombre,
            accion_personal=accion_personal,
            matrizador=request.matrizador,
            parties_data={
                "parte1": [identificador(v) for v in parte1_list],
                "parte2": [identificador(c) for c in parte2_list],
            },
            file_path=file_path
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return {
            "message": "Documento generado exitosamente",
            "document_id": document.id,
            "protocol_number": request.numero_protocolo,
            "download_url": f"/api/documents/download/{document.id}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generando documento tipo={tipo}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al generar el documento. Contacte al administrador."
        )

@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: SystemUser = Depends(get_current_user)
):
    """Descargar documento generado — solo el usuario que lo generó puede descargarlo"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.generated_by == current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado en el servidor"
        )

    filename = f"matriz_{document.protocol_number}.docx"

    return FileResponse(
        document.file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename
    )