from docxtpl import DocxTemplate, RichText
from pathlib import Path
from datetime import datetime
from app.utils.number_to_words import (
    numero_a_letras, numero_a_digitos, formatear_fecha_notarial,
    numero_casa_en_direccion, codigo_a_letras, numeros_en_texto_a_letras,
)
from app.utils.html_to_richtext import html_to_richtext
import logging
import uuid

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
OUTPUTS_DIR = Path(__file__).parent.parent.parent / "generated_documents"

OUTPUTS_DIR.mkdir(exist_ok=True)

def calcular_edad(fecha_nacimiento_str):
    """Calcula la edad en años a partir de fecha de nacimiento"""
    from datetime import datetime
    fecha_nac = datetime.strptime(fecha_nacimiento_str, "%Y-%m-%d")
    hoy = datetime.now()
    edad = hoy.year - fecha_nac.year
    if (hoy.month, hoy.day) < (fecha_nac.month, fecha_nac.day):
        edad -= 1
    return edad

def procesar_compareciente(comp, index):
    """Procesa datos de un compareciente individual"""
    
    # Calcular edad
    edad = calcular_edad(comp['fechaNacimiento'])
    
    # Construir dirección
    direccion_parts = []
    if comp.get('callePrincipal'):
        direccion_parts.append(comp['callePrincipal'])
    if comp.get('numeroCalle'):
        direccion_parts.append(numero_casa_en_direccion(comp['numeroCalle']))
    if comp.get('calleSecundaria'):
        direccion_parts.append(f"y {comp['calleSecundaria']}")
    if comp.get('sector'):
        direccion_parts.append(f"sector {comp['sector']}")
    if comp.get('parroquia'):
        direccion_parts.append(f"parroquia {comp['parroquia']}")
    if comp.get('canton'):
        direccion_parts.append(f"cantón {comp['canton']}")
    if comp.get('provincia'):
        direccion_parts.append(f"provincia de {comp['provincia']}")
    
    direccion_completa = numeros_en_texto_a_letras(", ".join(direccion_parts))
    
    # Construir texto de profesión/ocupación
    profesion_ocupacion = ""
    if comp.get('profesion') and comp.get('ocupacion'):
        profesion_ocupacion = f"profesión {comp['profesion']}, ocupación {comp['ocupacion']}"
    elif comp.get('ocupacion'):
        profesion_ocupacion = f"ocupación {comp['ocupacion']}"
    elif comp.get('profesion'):
        profesion_ocupacion = f"profesión {comp['profesion']}"
    
    # Determinar artículo y estado civil
    genero = comp.get('genero', '').lower()
    estado_civil = comp.get('estadoCivil', '').lower()
    
    articulo = "el señor" if genero == "masculino" else "la señora"
    
    # Ajustar estado civil según género
    if estado_civil == "casado":
        estado_civil_texto = "casado" if genero == "masculino" else "casada"
    elif estado_civil == "soltero":
        estado_civil_texto = "soltero" if genero == "masculino" else "soltera"
    elif estado_civil == "divorciado":
        estado_civil_texto = "divorciado" if genero == "masculino" else "divorciada"
    elif estado_civil == "viudo":
        estado_civil_texto = "viudo" if genero == "masculino" else "viuda"
    else:
        estado_civil_texto = estado_civil
    
    return {
        'numero': index,
        'articulo': articulo,
        'nombres': comp['nombres'],
        'apellidos': comp['apellidos'],
        'nombreCompleto': f"{comp['nombres']} {comp['apellidos']}",
        'nacionalidad': comp['nacionalidad'],
        'cedula': comp['cedula'],
        'cedulaEnLetras': numero_a_digitos(comp['cedula']),
        'cedulaEnDigitos': comp['cedula'],  # conservar original sin transformar
        'edad': edad,
        'edadEnLetras': numero_a_letras(edad),
        'genero': genero,
        'estadoCivil': estado_civil,
        'estadoCivilTexto': estado_civil_texto,
        'profesionOcupacion': profesion_ocupacion,
        'telefono': comp.get('telefono', ''),
        'telefonoEnLetras': numero_a_digitos(str(comp['telefono'])) if comp.get('telefono') else '',
        'email': comp.get('email', ''),
        'direccion': direccion_completa,
        'provincia': comp.get('provincia', ''),
        'canton': comp.get('canton', ''),
        'parroquia': comp.get('parroquia', ''),
        
        # Opciones especiales
        'needsInterpreter': comp.get('needsInterpreter', False),
        'nombreInterprete': comp.get('nombreInterprete', ''),
        'generoInterprete': comp.get('generoInterprete', ''),
        'cedulaInterprete': comp.get('cedulaInterprete', ''),
        'idiomaInterprete': comp.get('idiomaInterprete', ''),
        'isNoVidente': comp.get('isNoVidente', False),
        'personaConfianzaNoVidente': comp.get('personaConfianzaNoVidente', ''),
        'isAnalfabeta': comp.get('isAnalfabeta', False),
        'personaConfianzaAnalfabeta': comp.get('personaConfianzaAnalfabeta', ''),
        'hasDiscapacidadIntelectual': comp.get('hasDiscapacidadIntelectual', False),
        'tipoDiscapacidad': comp.get('tipoDiscapacidad', ''),
        'razonExclusionConyugue': comp.get('razonExclusionConyugue', ''),
        
        # Flags
        'esTerceraEdad': edad >= 65,
        'esCasado': estado_civil == 'casado',
        'tieneConyuge': comp.get('conyuge') is not None,
        'conyuge': comp.get('conyuge')
    }

def procesar_empresa(comp, index):
    """Procesa datos de una empresa para la plantilla"""

    from datetime import datetime

    # Calcular edad del representante
    edad_rep = calcular_edad(comp['repFechaNacimiento'])

    # Construir dirección del representante
    direccion_parts = []
    if comp.get('repCallePrincipal'):
        direccion_parts.append(comp['repCallePrincipal'])
    if comp.get('repNumeroCalle'):
        direccion_parts.append(numero_casa_en_direccion(comp['repNumeroCalle']))
    if comp.get('repCalleSecundaria'):
        direccion_parts.append(f"y {comp['repCalleSecundaria']}")
    if comp.get('repSector'):
        direccion_parts.append(f"sector {comp['repSector']}")
    if comp.get('repParroquia'):
        direccion_parts.append(f"parroquia {comp['repParroquia']}")
    if comp.get('repCanton'):
        direccion_parts.append(f"cantón {comp['repCanton']}")
    if comp.get('repProvincia'):
        direccion_parts.append(f"provincia de {comp['repProvincia']}")
    direccion_rep = numeros_en_texto_a_letras(", ".join(direccion_parts))

    # Dirección de la empresa
    empresa_direccion_parts = []
    if comp.get('callePrincipal'):
        empresa_direccion_parts.append(comp['callePrincipal'])
    if comp.get('numeroCalle'):
        empresa_direccion_parts.append(numero_casa_en_direccion(comp['numeroCalle']))
    if comp.get('calleSecundaria'):
        empresa_direccion_parts.append(f"y {comp['calleSecundaria']}")
    if comp.get('sector'):
        empresa_direccion_parts.append(f"sector {comp['sector']}")
    if comp.get('parroquia'):
        empresa_direccion_parts.append(f"parroquia {comp['parroquia']}")
    if comp.get('canton'):
        empresa_direccion_parts.append(f"cantón {comp['canton']}")
    if comp.get('provincia'):
        empresa_direccion_parts.append(f"provincia de {comp['provincia']}")
    empresa_direccion = numeros_en_texto_a_letras(", ".join(empresa_direccion_parts))

    # Artículo del representante
    genero_rep = comp.get('repGenero', '').lower()
    articulo_rep = "el señor" if genero_rep == "masculino" else "la señora"

    # Profesión/ocupación del representante
    profesion_ocupacion_rep = ""
    if comp.get('repProfession') and comp.get('repOccupation'):
        profesion_ocupacion_rep = f"profesión {comp['repProfession']}, ocupación {comp['repOccupation']}"
    elif comp.get('repOccupation'):
        profesion_ocupacion_rep = f"ocupación {comp['repOccupation']}"
    elif comp.get('repProfession'):
        profesion_ocupacion_rep = f"profesión {comp['repProfession']}"

    return {
        'numero': index,
        'esEmpresa': True,
        # Datos empresa
        'ruc': comp['ruc'],
        'rucEnLetras': numero_a_digitos(comp['ruc']),
        'razonSocial': comp['razonSocial'].upper(),
        'direccionEmpresa': empresa_direccion,
        'email': comp.get('email', ''),
        'telefono': comp.get('telefono', ''),
        # Representante legal
        'repArticulo': articulo_rep,
        'repNombres': comp.get('repNames', ''),
        'repApellidos': comp.get('repLastNames', ''),
        'repNombreCompleto': f"{comp.get('repNames', '')} {comp.get('repLastNames', '')}".upper(),
        'repCargo': comp.get('repPosition', ''),
        'repNacionalidad': comp.get('repNationality', 'ecuatoriana'),
        'repCedula': comp.get('repDocumentNumber', ''),
        'repCedulaEnLetras': numero_a_digitos(comp.get('repDocumentNumber', '')),
        'repEdad': edad_rep,
        'repEdadEnLetras': numero_a_letras(edad_rep),
        'repGenero': genero_rep,
        'repProfesionOcupacion': profesion_ocupacion_rep,
        'repDireccion': direccion_rep,
        'repProvincia': comp.get('repProvincia', ''),
        'repCanton': comp.get('repCanton', ''),
        'repParroquia': comp.get('repParroquia', ''),
    }


def generate_matriz_compraventa(data: dict, template_name: str = "compraventa.docx") -> str:
    """
    Genera matriz de compraventa usando docxtpl
    """
    
    print("=" * 50)
    print("PROCESANDO DATOS PARA PLANTILLA")
    print("=" * 50)
    print("DEBUG - abogadoTexto recibido:", data.get('abogadoTexto'))
    print("DEBUG - Tipo:", type(data.get('abogadoTexto')))
    # Convertir vendedores y compradores a diccionarios si son objetos Pydantic
    vendedores_raw = data.get('vendedoresList', [])
    compradores_raw = data.get('compradoresList', [])
    
    # Convertir a dict si es necesario
    vendedores_dict = []
    for v in vendedores_raw:
        if hasattr(v, 'dict'):
            vendedores_dict.append(v.dict())
        elif hasattr(v, 'model_dump'):
            vendedores_dict.append(v.model_dump())
        else:
            vendedores_dict.append(v)
    
    compradores_dict = []
    for c in compradores_raw:
        if hasattr(c, 'dict'):
            compradores_dict.append(c.dict())
        elif hasattr(c, 'model_dump'):
            compradores_dict.append(c.model_dump())
        else:
            compradores_dict.append(c)
    
    # Procesar vendedores
    vendedores_procesados = []
    for i, vendedor in enumerate(vendedores_dict, start=1):
        if vendedor.get('esEmpresa'):
            vendedor_proc = procesar_empresa(vendedor, i)
        else:
            vendedor_proc = procesar_compareciente(vendedor, i)
        vendedores_procesados.append(vendedor_proc)

    # Procesar compradores (continuar numeración)
    compradores_procesados = []
    start_index = len(vendedores_procesados) + 1
    for i, comprador in enumerate(compradores_dict, start=start_index):
        if comprador.get('esEmpresa'):
            comprador_proc = procesar_empresa(comprador, i)
        else:
            comprador_proc = procesar_compareciente(comprador, i)
        compradores_procesados.append(comprador_proc)

    # Todos los participantes
    todos_participantes = vendedores_procesados + compradores_procesados

    # Verificar si hay alguien con necesidades especiales (solo aplica a personas naturales)
    hay_interprete = any(p.get('needsInterpreter', False) for p in todos_participantes)
    hay_no_vidente = any(p.get('isNoVidente', False) for p in todos_participantes)
    hay_analfabeta = any(p.get('isAnalfabeta', False) for p in todos_participantes)
    hay_discapacidad_intelectual = any(p.get('hasDiscapacidadIntelectual', False) for p in todos_participantes)
    hay_tercera_edad = any(p.get('esTerceraEdad', False) for p in todos_participantes)
    
    # Formatear fecha notarial
    fecha_notarial = formatear_fecha_notarial(data.get('fechaActual'))
    
    # Preparar datos para la plantilla
    context = {
        'numeroProtocolo': data.get('numeroProtocolo'),
        'tipoContrato': data.get('tipoContrato', '').upper(),
        'cuantia': data.get('cuantia'),
        'cuantiaEnLetras': numero_a_letras(int(data.get('cuantia', 0))),
        'fechaActual': data.get('fechaActual'),
        'fechaNotarial': fecha_notarial,
        'notario': data.get('notario'),
        'tituloNotario': data.get('tituloNotario'),
        'accionPersonal': codigo_a_letras(data.get('accionPersonal')) if data.get('accionPersonal') else None,
        'matrizador': data.get('matrizador'),
        
        # Listas de comparecientes procesados
        'vendedores': vendedores_procesados,
        'compradores': compradores_procesados,
        'todosParticipantes': todos_participantes,
        
        # Conteos
        'numVendedores': len(vendedores_procesados),
        'numCompradores': len(compradores_procesados),
        
        # Labels de partes según tipo de contrato
        'labelParte1': data.get('labelParte1', 'la parte vendedora'),
        'labelParte2': data.get('labelParte2', 'la parte compradora'),
        
        # Flags globales
        'hayTerceraEdad': hay_tercera_edad,
        'hayInterprete': hay_interprete,
        'hayNoVidente': hay_no_vidente,
        'hayAnalfabeta': hay_analfabeta,
        'hayDiscapacidadIntelectual': hay_discapacidad_intelectual,
        
        # Concuerdo
        'needsConcuerdo': data.get('needsConcuerdo', False),
        'datosConcuerdo': data.get('datosConcuerdo'),
        
        # Abogado
        'abogadoNombre': data.get('abogadoNombre'),
        'abogadoEsMujer': data.get('abogadoEsMujer', False),
        'abogadoNumeroMatricula': codigo_a_letras(data.get('abogadoNumeroMatricula')),
        'abogadoTipoMatricula': data.get('abogadoTipoMatricula'),
        'abogadoProvincia': data.get('abogadoProvincia'),
        'abogadoTexto': '',
    }
    
    if 'abogadoTexto' in data and data['abogadoTexto']:
        context['abogadoTexto'] = html_to_richtext(data['abogadoTexto'])
    else:
        context['abogadoTexto'] = ''
        
    # Cargar plantilla
    template_path = TEMPLATES_DIR / template_name
    
    if not template_path.exists():
        raise FileNotFoundError(f"Plantilla no encontrada en: {template_path}")
    
    doc = DocxTemplate(template_path)
    
    try:
        doc.render(context, autoescape=False)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise
    
    # Guardar
    protocol = data.get('numeroProtocolo', 'sin-protocolo')
    filename = f"matriz_{protocol}_{uuid.uuid4().hex[:8]}.docx"
    output_path = OUTPUTS_DIR / filename
    
    doc.save(str(output_path))

    return str(output_path)