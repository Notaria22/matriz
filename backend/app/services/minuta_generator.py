from docxtpl import DocxTemplate
from io import BytesIO
from ..utils.number_to_words import (
    numero_a_letras,
    numero_a_digitos,
    formatear_fecha_notarial,
    calcular_edad,
    numero_casa_a_letras,
    numero_a_ordinal_notaria,
    convertir_numero_casa,
    nivel_a_palabras,
    formatear_dinero,
    limpiar_nombre_notario,
    formatear_referencia_notario,
    cuenta_a_letras,
    numero_casa_en_direccion,
    numeros_en_texto_a_letras,
)
from bs4 import BeautifulSoup
import re


# ============================================
# MAPEOS DE TEXTO — título de adquisición y tipo de sucesión
# (el <select> del frontend envía valores sin tildes; aquí se convierten
# al texto legible correcto antes de insertarse en el documento)
# ============================================
TITULOS_ADQUISICION = {
    'compraventa': 'compraventa',
    'donacion': 'donación',
    'permuta': 'permuta',
    'adjudicacion': 'adjudicación',
    'sucesion': 'sucesión',
}

TIPOS_SUCESION = {
    'testamento': 'testamento',
    'posesion_efectiva': 'posesión efectiva',
}


def formatear_titulo_adquisicion(titulo, titulo_otro=''):
    """Convierte el value crudo del select (ej. 'donacion', 'posesion_efectiva')
    al texto legible con tildes (ej. 'donación'). 'otro' usa el texto libre."""
    if not titulo:
        return ''
    if titulo == 'otro':
        return titulo_otro or ''
    return TITULOS_ADQUISICION.get(titulo, titulo)


def formatear_tipo_sucesion(tipo):
    """Convierte 'posesion_efectiva' -> 'posesión efectiva', etc."""
    if not tipo:
        return ''
    return TIPOS_SUCESION.get(tipo, tipo)


def procesar_empresa_data(empresa, numero_global):
    """
    Procesa los datos de una empresa para la plantilla de minuta.
    Los campos llegan en camelCase tal como los envía el frontend.
    """
    ruc = empresa.get('ruc', '')
    razon_social = empresa.get('razonSocial', '').upper()

    # Construir dirección de la empresa
    empresa_parts = []
    if empresa.get('mainStreet'):
        empresa_parts.append(empresa['mainStreet'])
    if empresa.get('numberStreet'):
        empresa_parts.append(numero_casa_en_direccion(empresa['numberStreet']))
    if empresa.get('secondaryStreet'):
        empresa_parts.append(f"y {empresa['secondaryStreet']}")
    if empresa.get('sector'):
        empresa_parts.append(f"sector {empresa['sector']}")
    if empresa.get('parroquia'):
        empresa_parts.append(f"parroquia {empresa['parroquia']}")
    if empresa.get('canton'):
        empresa_parts.append(f"cantón {empresa['canton']}")
    if empresa.get('province'):
        empresa_parts.append(f"provincia de {empresa['province']}")
    direccion_empresa = numeros_en_texto_a_letras(", ".join(empresa_parts))

    # Construir dirección del representante
    rep_parts = []
    if empresa.get('repMainStreet'):
        rep_parts.append(empresa['repMainStreet'])
    if empresa.get('repNumberStreet'):
        rep_parts.append(numero_casa_en_direccion(empresa['repNumberStreet']))
    if empresa.get('repSecondaryStreet'):
        rep_parts.append(f"y {empresa['repSecondaryStreet']}")
    if empresa.get('repSector'):
        rep_parts.append(f"sector {empresa['repSector']}")
    if empresa.get('repParroquia'):
        rep_parts.append(f"parroquia {empresa['repParroquia']}")
    if empresa.get('repCanton'):
        rep_parts.append(f"cantón {empresa['repCanton']}")
    if empresa.get('repProvince'):
        rep_parts.append(f"provincia de {empresa['repProvince']}")
    direccion_rep = numeros_en_texto_a_letras(", ".join(rep_parts))

    # Calcular edad del representante
    edad_rep = calcular_edad(empresa.get('repBirthDate', ''))

    # Profesión/ocupación representante
    rep_profesion = empresa.get('repProfession', '')
    rep_ocupacion = empresa.get('repOccupation', '')
    if rep_profesion and rep_ocupacion:
        rep_prof_ocup = f"profesión {rep_profesion}, ocupación {rep_ocupacion}"
    elif rep_ocupacion:
        rep_prof_ocup = f"ocupación {rep_ocupacion}"
    elif rep_profesion:
        rep_prof_ocup = f"profesión {rep_profesion}"
    else:
        rep_prof_ocup = ''

    # Artículo según género del representante
    genero_rep = empresa.get('repGender', '').lower()
    articulo_rep = 'el señor' if genero_rep == 'masculino' else 'la señora'

    return {
        'numero': numero_a_letras(numero_global),
        'numero_numerico': numero_global,
        'es_empresa': True,
        # Empresa
        'ruc': ruc,
        'ruc_palabras': numero_a_digitos(ruc),
        'razon_social': razon_social,
        'direccion_empresa': direccion_empresa,
        'email': empresa.get('email', ''),
        'telefono': empresa.get('phone', ''),
        # Representante legal
        'rep_cargo': empresa.get('repPosition', ''),
        'rep_articulo': articulo_rep,
        'rep_nombres_completos': f"{empresa.get('repNames', '')} {empresa.get('repLastNames', '')}".strip().upper(),
        'rep_nacionalidad': empresa.get('repNationality', 'ecuatoriana'),
        'rep_cedula': empresa.get('repDocumentNumber', ''),
        'rep_cedula_palabras': numero_a_digitos(empresa.get('repDocumentNumber', '')),
        'rep_edad': edad_rep,
        'rep_prof_ocup': rep_prof_ocup,
        'rep_direccion': direccion_rep,
    }


def construir_direccion(persona):
    """
    Construye la dirección física desde los campos individuales.
    Orden: calle principal + número + y + calle secundaria + edificio/depto, sector, parroquia, cantón, provincia
    """
    partes = []

    main_street = persona.get('mainStreet', '').strip()
    number_street = persona.get('numberStreet', '').strip()
    secondary_street = persona.get('secondaryStreet', '').strip()
    edificio = persona.get('edificio', '').strip()

    # Calle principal + número + y + calle secundaria
    if main_street:
        if number_street:
            numero_convertido = convertir_numero_casa(number_street)
            if secondary_street:
                partes.append(f"{main_street} {numero_convertido} y {secondary_street}")
            else:
                partes.append(f"{main_street} {numero_convertido}")
        else:
            if secondary_street:
                partes.append(f"{main_street} y {secondary_street}")
            else:
                partes.append(main_street)
    elif secondary_street:
        partes.append(secondary_street)

    # Edificio/conjunto/departamento
    if edificio:
        partes.append(edificio)

    if persona.get('sector'): partes.append(persona['sector'])
    if persona.get('parroquia'): partes.append(f"parroquia {persona['parroquia']}")
    if persona.get('canton'): partes.append(f"cantón {persona['canton']}")
    if persona.get('province'): partes.append(f"provincia de {persona['province']}")

    return numeros_en_texto_a_letras(', '.join(partes))


def agrupar_por_conyuges(personas):
    """
    Agrupa personas por cónyuges y solteros.
    Maneja dos casos:
    1. El cónyuge viene como compareciente separado en la lista
    2. El cónyuge viene dentro del objeto persona como 'partner'
    """
    grupos = []
    procesados = set()

    for i, persona in enumerate(personas):
        if i in procesados:
            continue

        direccion = construir_direccion(persona)

        if (persona.get('maritalStatus') == 'casado' and
                persona.get('conyugueComparece', True) and
                persona.get('partner') and
                persona['partner'].get('documentNumber')):

            pareja_doc = persona['partner']['documentNumber']
            pareja_idx = None

            # Caso 1: cónyuge como compareciente separado en la lista
            for j, otra_persona in enumerate(personas):
                if (j != i and
                        otra_persona.get('documentNumber') == pareja_doc):
                    pareja_idx = j
                    break

            if pareja_idx is not None:
                grupos.append({
                    'tipo': 'conyuges',
                    'direccion': direccion,
                    'personas': [persona, personas[pareja_idx]]
                })
                procesados.add(i)
                procesados.add(pareja_idx)
            else:
                # Caso 2: cónyuge solo viene como 'partner' dentro del objeto
                # Lo usamos directamente
                partner = persona['partner']
                grupos.append({
                    'tipo': 'conyuges',
                    'direccion': direccion,
                    'personas': [persona, partner]
                })
                procesados.add(i)
        else:
            grupos.append({
                'tipo': 'soltero',
                'direccion': direccion,
                'personas': [persona]
            })
            procesados.add(i)

    return grupos


def procesar_persona_data(persona, numero_global):
    """
    Procesa los datos de una persona para la plantilla.
    
    Args:
        persona: Diccionario con datos de la persona
        numero_global: Número correlativo global
        
    Returns:
        Diccionario con datos procesados para la plantilla
    """
    nombres_completos = f"{persona.get('names', '')} {persona.get('lastNames', '')}".strip().upper()
    cedula = persona.get('documentNumber', '')
    telefono = persona.get('phone', '')

    # Calcular edad
    edad = calcular_edad(persona.get('birthDate', ''))

    # Estado civil — considerar capitulaciones/disolución
    marital_status = persona.get('maritalStatus', 'soltero')
    conyugue_comparece = persona.get('conyugueComparece', True)
    razon_exclusion = persona.get('razonExclusionConyugue', '')

    RAZON_ESTADO_CIVIL = {
        'capitulacion': 'casado con capitulaciones matrimoniales',
        'disolucion': 'casado con disolución de sociedad conyugal',
        'adquirido_solo': 'casado',  # el bien fue adquirido antes del matrimonio
        'no_requiere_adquirente': 'casado',
        'titulo_gratuito': 'casado',  # adquiere a título gratuito (donación, herencia)
        'ingresa_sociedad': 'casado',  # el bien ingresa a la sociedad conyugal
    }

    if marital_status == 'casado' and not conyugue_comparece and razon_exclusion:
        estado_civil = RAZON_ESTADO_CIVIL.get(razon_exclusion, 'casado')
    else:
        estado_civil_map = {
            'soltero': 'soltero',
            'casado': 'casado',
            'divorciado': 'divorciado',
            'viudo': 'viudo',
            'union_libre': 'unión libre'
        }
        estado_civil = estado_civil_map.get(marital_status, 'soltero')

    # Nota especial para bien adquirido antes del matrimonio
    nota_bien_adquirido = (
        marital_status == 'casado' and
        not conyugue_comparece and
        razon_exclusion == 'adquirido_solo'
    )

    # Construir dirección desde campos individuales (con conversión de números)
    direccion_convertida = construir_direccion(persona)

    # Procesar cónyuge si existe
    conyugue = None
    if persona.get('partner') and estado_civil == 'casado':
        partner = persona['partner']
        conyugue = {
            'nombres_completos': f"{partner.get('names', '')} {partner.get('lastNames', '')}".strip().upper(),
            'cedula': partner.get('documentNumber', ''),
            'cedula_palabras': numero_a_digitos(partner.get('documentNumber', '')),
            'nacionalidad': partner.get('nationality', 'ecuatoriana'),
            'ocupacion': partner.get('occupation', ''),
            'profesion': partner.get('profession', ''),
        }

    genero = persona.get('gender', 'masculino').lower()
    articulo = 'la señora' if genero == 'femenino' else 'el señor'
    portador = 'portadora' if genero == 'femenino' else 'portador'
    domiciliado = 'domiciliada' if genero == 'femenino' else 'domiciliado'

    return {
        'numero': numero_a_letras(numero_global),
        'numero_numerico': numero_global,
        'nombres_completos': nombres_completos,
        'genero': genero,
        'articulo': articulo,
        'portador': portador,
        'domiciliado': domiciliado,
        'nacionalidad': persona.get('nationality', 'ecuatoriana'),
        'cedula': cedula,
        'cedula_palabras': numero_a_digitos(cedula),
        'edad': edad,
        'edad_palabras': f"{numero_a_letras(edad)} ({edad})" if edad else '',
        'estado_civil': estado_civil,
        'conyugue_comparece': conyugue_comparece,
        'razon_exclusion_conyugue': razon_exclusion,
        'nota_bien_adquirido': nota_bien_adquirido,
        'profesion': persona.get('profession', '').strip(),
        'ocupacion': persona.get('occupation', '').strip(),
        'telefono': telefono,
        'telefono_palabras': numero_a_digitos(telefono),
        'email': persona.get('email', ''),
        'direccion': direccion_convertida,
        'conyugue': conyugue,
        'tiene_conyugue': conyugue is not None and conyugue_comparece,
    }


def normalizar_numero(val_str):
    """Normaliza un string numérico que puede usar coma o punto como decimal."""
    if not val_str:
        return None
    s = str(val_str).strip()
    # Si tiene coma Y punto -> coma es separador de miles (ej: 1.308,40) -> quitar punto, cambiar coma
    if ',' in s and '.' in s:
        s = s.replace('.', '').replace(',', '.')
    elif ',' in s:
        # Solo coma -> es decimal (ej: 64,92 -> 64.92)
        s = s.replace(',', '.')
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def convertir_numeros_en_texto(texto):
    """
    Busca cualquier número suelto dentro de un texto libre (ej. colindancias
    como 'zanja, y lote 3') y lo convierte a 'letras (número)', dejando el
    resto del texto intacto. Soporta enteros y decimales con coma o punto.
    Ej: 'lote 3' -> 'lote tres (3)'
        'km 4.5' -> 'km cuatro punto cinco (4.5)'
    """
    if not texto:
        return texto

    def reemplazar(match):
        original = match.group(0)
        num_normalizado = normalizar_numero(original)
        if num_normalizado is None:
            return original
        if num_normalizado == int(num_normalizado) and '.' not in original and ',' not in original:
            palabras = numero_a_letras(int(num_normalizado))
        else:
            palabras = numero_a_letras(num_normalizado)
        return f"{palabras} ({original})"

    # Números con posible decimal (coma o punto), evitando partir palabras
    return re.sub(r'\d+(?:[.,]\d+)?', reemplazar, texto)


def procesar_linderos(linderos_data, incluir_arriba_abajo=False):
    """
    Procesa linderos y retorna formato plano que espera la plantilla.
    Acepta coma o punto como separador decimal, preservando el que el usuario usó.
    """
    resultado = {}
    direcciones = ['norte', 'sur', 'este', 'oeste']

    if incluir_arriba_abajo:
        direcciones.extend(['arriba', 'abajo'])

    for direccion in direcciones:
        linderos_lista = linderos_data.get(direccion, [])

        if not linderos_lista:
            linderos_lista = [{'metros': '', 'colindancia': ''}]

        metros_total = ''
        colindancias = []
        for lindero in linderos_lista:
            metros = str(lindero.get('metros', '')).strip()
            colindancia = lindero.get('colindancia', '').strip()
            # Quitar un "con " inicial si el usuario ya lo escribió, para evitar "con con..."
            if colindancia.lower().startswith('con '):
                colindancia = colindancia[4:].strip()
            if metros:
                metros_total = metros
            if colindancia:
                colindancias.append(colindancia)

        colindancia_str = ', y '.join(colindancias) if colindancias else ''
        colindancia_str = convertir_numeros_en_texto(colindancia_str)

        metros_num = normalizar_numero(metros_total)
        if metros_num is not None:
            metros_palabras = numero_a_letras(metros_num)
            # Preservar el separador decimal original que usó el usuario
            metros_fmt = metros_total
            resultado[f'{direccion}_metros_palabras'] = f"{metros_palabras} metros ({metros_fmt}m)"
        else:
            resultado[f'{direccion}_metros_palabras'] = ''
        resultado[f'{direccion}_colindancia'] = colindancia_str
        resultado[f'{direccion}_metros'] = metros_total

    # Superficie
    superficie = linderos_data.get('superficie', '')
    sup_num = normalizar_numero(superficie)
    if sup_num is not None:
        sup_palabras = numero_a_letras(sup_num)
        sup_fmt = str(superficie)
        resultado['superficie_palabras'] = f"{sup_palabras} metros cuadrados ({sup_fmt}m2)"
    else:
        resultado['superficie_palabras'] = str(superficie)
    resultado['superficie'] = superficie

    return resultado


def procesar_aclaratorias_historia(aclaratorias):
    """
    Procesa aclaratorias de historia de dominio (recursivamente).
    
    Args:
        aclaratorias: Lista de aclaratorias
        
    Returns:
        Lista de aclaratorias procesadas
    """
    if not aclaratorias:
        return []
    
    resultado = []
    
    for aclaratoria in aclaratorias:
        acl_procesada = {
            'titulo': aclaratoria.get('titulo', ''),
            'titulo_otro': aclaratoria.get('tituloOtro', ''),
            'titulo_texto': formatear_titulo_adquisicion(aclaratoria.get('titulo', ''), aclaratoria.get('tituloOtro', '')),
            'adquirido_de': aclaratoria.get('adquiridoDe', ''),
            'descripcion': aclaratoria.get('descripcion', ''),
            'fecha_otorgamiento': formatear_fecha_notarial(aclaratoria.get('fechaOtorgamiento', '')) if aclaratoria.get('fechaOtorgamiento') else '',
            'numero_notaria': aclaratoria.get('numeroNotaria', ''),
            'numero_notaria_palabras': numero_a_ordinal_notaria(aclaratoria.get('numeroNotaria', '')) if aclaratoria.get('numeroNotaria') else '',
            'canton_notaria': aclaratoria.get('cantonNotaria', ''),
            'notario': limpiar_nombre_notario(aclaratoria.get('notario', '')),
            'es_suplente': aclaratoria.get('esSuplente', False),
            'fecha_inscripcion': formatear_fecha_notarial(aclaratoria.get('fechaInscripcion', '')) if aclaratoria.get('fechaInscripcion') else '',
            'canton_inscripcion': aclaratoria.get('cantonInscripcion', ''),
            'mismo_canton': aclaratoria.get('cantonNotaria', '').lower() == aclaratoria.get('cantonInscripcion', '').lower() if aclaratoria.get('cantonNotaria') and aclaratoria.get('cantonInscripcion') else False,
        }
        
        # Procesar aclaratorias anidadas recursivamente
        if 'aclaratorias' in aclaratoria and aclaratoria['aclaratorias']:
            acl_procesada['aclaratorias'] = procesar_aclaratorias_historia(aclaratoria['aclaratorias'])
        else:
            acl_procesada['aclaratorias'] = []
        
        resultado.append(acl_procesada)
    
    return resultado


def procesar_aclaratorias_declaratoria(aclaratorias):
    """
    Procesa aclaratorias de declaratoria de propiedad horizontal (recursivamente).
    
    Args:
        aclaratorias: Lista de aclaratorias
        
    Returns:
        Lista de aclaratorias procesadas
    """
    if not aclaratorias:
        return []
    
    resultado = []
    
    for aclaratoria in aclaratorias:
        acl_procesada = {
            'descripcion': aclaratoria.get('descripcion', ''),
            'fecha_otorgamiento': formatear_fecha_notarial(aclaratoria.get('fechaOtorgamiento', '')) if aclaratoria.get('fechaOtorgamiento') else '',
            'numero_notaria': aclaratoria.get('numeroNotaria', ''),
            'numero_notaria_palabras': numero_a_ordinal_notaria(aclaratoria.get('numeroNotaria', '')) if aclaratoria.get('numeroNotaria') else '',
            'canton_notaria': aclaratoria.get('cantonNotaria', ''),
            'notario': limpiar_nombre_notario(aclaratoria.get('notario', '')),
            'es_suplente': aclaratoria.get('esSuplente', False),
            'fecha_inscripcion': formatear_fecha_notarial(aclaratoria.get('fechaInscripcion', '')) if aclaratoria.get('fechaInscripcion') else '',
            'canton_inscripcion': aclaratoria.get('cantonInscripcion', ''),
            'mismo_canton': aclaratoria.get('cantonNotaria', '').lower() == aclaratoria.get('cantonInscripcion', '').lower() if aclaratoria.get('cantonNotaria') and aclaratoria.get('cantonInscripcion') else False,
        }
        
        # Procesar aclaratorias anidadas recursivamente
        if 'aclaratorias' in aclaratoria and aclaratoria['aclaratorias']:
            acl_procesada['aclaratorias'] = procesar_aclaratorias_declaratoria(aclaratoria['aclaratorias'])
        else:
            acl_procesada['aclaratorias'] = []
        
        resultado.append(acl_procesada)
    
    return resultado


def limpiar_html(html_content):
    """Convierte HTML a texto plano manteniendo saltos de línea"""
    if not html_content:
        return ""
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Reemplazar <br> y <p> con saltos de línea
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for p in soup.find_all("p"):
        p.insert_after("\n")
    
    text = soup.get_text()
    # Limpiar múltiples saltos de línea
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()



from pathlib import Path
from datetime import datetime
import uuid

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
OUTPUTS_DIR = Path(__file__).parent.parent.parent / "generated_documents"
OUTPUTS_DIR.mkdir(exist_ok=True)


def generate_minuta_compraventa(data: dict, current_user=None) -> str:
    """
    Genera una minuta de compraventa, la guarda en disco y retorna el path.

    Args:
        data: Diccionario con todos los datos del formulario
        current_user: Usuario actual (opcional, para nombre de archivo)

    Returns:
        str con el path del archivo generado
    """
    template_path = TEMPLATES_DIR / "minuta_compraventa.docx"

    if not template_path.exists():
        raise FileNotFoundError(f"Plantilla no encontrada en: {template_path}")

    doc = DocxTemplate(str(template_path))

    # Inicializar contexto
    context = {}

    # ============================================
    # COMPARECIENTES - VENDEDORES Y COMPRADORES
    # ============================================
    vendedores = data.get('vendedores', [])
    compradores = data.get('compradores', [])

    def separar_personas_empresas(lista):
        """Separa personas naturales de empresas"""
        personas = [p for p in lista if not p.get('esEmpresa')]
        empresas = [e for e in lista if e.get('esEmpresa')]
        return personas, empresas

    vendedores_personas, vendedores_empresas = separar_personas_empresas(vendedores)
    compradores_personas, compradores_empresas = separar_personas_empresas(compradores)

    grupos_vendedores = agrupar_por_conyuges(vendedores_personas)
    grupos_compradores = agrupar_por_conyuges(compradores_personas)

    contador_global = 1
    grupos_vendedores_procesados = []

    for grupo in grupos_vendedores:
        grupo_procesado = {
            'tipo': grupo['tipo'],
            'es_empresa': False,
            'direccion': grupo['direccion'],
            'personas': []
        }
        for persona in grupo['personas']:
            persona_data = procesar_persona_data(persona, contador_global)
            grupo_procesado['personas'].append(persona_data)
            contador_global += 1
        grupos_vendedores_procesados.append(grupo_procesado)

    for empresa in vendedores_empresas:
        empresa_data = procesar_empresa_data(empresa, contador_global)
        grupos_vendedores_procesados.append({
            'tipo': 'empresa',
            'es_empresa': True,
            'direccion': empresa_data['direccion_empresa'],
            'personas': [empresa_data]
        })
        contador_global += 1

    grupos_compradores_procesados = []

    for grupo in grupos_compradores:
        grupo_procesado = {
            'tipo': grupo['tipo'],
            'es_empresa': False,
            'direccion': grupo['direccion'],
            'personas': []
        }
        for persona in grupo['personas']:
            persona_data = procesar_persona_data(persona, contador_global)
            grupo_procesado['personas'].append(persona_data)
            contador_global += 1
        grupos_compradores_procesados.append(grupo_procesado)

    for empresa in compradores_empresas:
        empresa_data = procesar_empresa_data(empresa, contador_global)
        grupos_compradores_procesados.append({
            'tipo': 'empresa',
            'es_empresa': True,
            'direccion': empresa_data['direccion_empresa'],
            'personas': [empresa_data]
        })
        contador_global += 1

    context['grupos_vendedores'] = grupos_vendedores_procesados
    context['grupos_compradores'] = grupos_compradores_procesados

    vendedores_procesados = []
    for grupo in grupos_vendedores_procesados:
        vendedores_procesados.extend(grupo['personas'])

    compradores_procesados = []
    for grupo in grupos_compradores_procesados:
        compradores_procesados.extend(grupo['personas'])

    context['vendedores'] = vendedores_procesados
    context['compradores'] = compradores_procesados
    context['num_vendedores'] = len(vendedores_procesados)

    # ============================================
    # TIPO DE PROPIEDAD
    # ============================================
    context['es_horizontal'] = data.get('tipoPropiedad') == 'horizontal'
    context['es_comun'] = data.get('tipoPropiedad') == 'comun'
    context['nombre_conjunto'] = data.get('nombreConjunto', '')

    # ============================================
    # PREDIOS (solo para horizontal)
    # ============================================
    if context['es_horizontal']:
        predios = data.get('predios', [])
        predios_procesados = []

        for predio in predios:
            inmuebles_procesados = []

            for inmueble in predio.get('inmuebles', []):
                area_cubierta = inmueble.get('areaCubierta', '')
                area_descubierta = inmueble.get('areaDescubierta', '')
                alicuota_parcial = inmueble.get('alicuotaParcial', '')

                def fmt_area(val):
                    if not val: return ''
                    try:
                        val_str = str(val).strip()
                        val_normalizado = val_str.replace(',', '.')
                        n = float(val_normalizado)
                        palabras = numero_a_letras(n)
                        # Preservar el separador que el usuario usó originalmente
                        val_fmt = f"{n:.2f}"
                        if ',' in val_str:
                            val_fmt = val_fmt.replace('.', ',')
                        return f"{palabras} metros cuadrados ({val_fmt}m2)"
                    except: return str(val)

                def fmt_alicuota(val):
                    if not val: return ''
                    try:
                        val_str = str(val).strip()
                        # Detectar separador original
                        if ',' in val_str:
                            separador = 'coma'
                            val_normalizado = val_str.replace(',', '.')
                        else:
                            separador = 'punto' if '.' in val_str else None
                            val_normalizado = val_str

                        n = float(val_normalizado)
                        parte_entera = int(n)
                        parte_decimal_str = val_normalizado.split('.')[1].rstrip('0') if '.' in val_normalizado else ''

                        palabras_entero = numero_a_letras(parte_entera)
                        if parte_decimal_str and separador:
                            digitos_dec = ' '.join([numero_a_letras(int(d)) for d in parte_decimal_str])
                            palabras = f"{palabras_entero} {separador} {digitos_dec}"
                        else:
                            palabras = palabras_entero

                        val_fmt = val_str.rstrip('0').rstrip('.').rstrip(',')
                        return f"{palabras} por ciento ({val_fmt}%)"
                    except: return str(val)

                num_inmueble = inmueble.get('numero', '').strip() or str(predio.get('numero', ''))
                num_inmueble_palabras = convertir_numero_casa(num_inmueble) if num_inmueble else ''

                # Si el predio NO es compuesto, el tipo se define a nivel de predio
                # (el formulario oculta el campo tipo del inmueble en ese caso)
                if predio.get('esCompuesto'):
                    tipo_inmueble = inmueble.get('tipo', '')
                    tipo_otro_inmueble = inmueble.get('tipoOtro', '')
                else:
                    tipo_inmueble = inmueble.get('tipo', '') or predio.get('tipo', '')
                    tipo_otro_inmueble = inmueble.get('tipoOtro', '') or predio.get('tipoOtro', '')

                inmueble_data = {
                    'tipo': tipo_inmueble,
                    'tipo_otro': tipo_otro_inmueble,
                    'numero': num_inmueble,
                    'numero_palabras': num_inmueble_palabras,
                    'nivel': nivel_a_palabras(inmueble.get('nivel', '')),
                    'nivel_raw': inmueble.get('nivel', ''),
                    'area_cubierta': area_cubierta,
                    'area_cubierta_palabras': fmt_area(area_cubierta),
                    'area_descubierta': area_descubierta,
                    'area_descubierta_palabras': fmt_area(area_descubierta),
                    'alicuota_parcial': alicuota_parcial,
                    'alicuota_parcial_palabras': fmt_alicuota(alicuota_parcial),
                }
                inmuebles_procesados.append(inmueble_data)

            if predio.get('usarAlicuotaManual'):
                alicuota_total = predio.get('alicuotaTotalManual', 0)
            else:
                alicuota_total = predio.get('alicuotaTotal', 0)

            num_predio = predio.get('numero', '')
            num_predio_palabras = convertir_numero_casa(str(num_predio)) if num_predio else ''
            num_predial = predio.get('numeroPredial', '')

            def fmt_alicuota_total(val):
                if not val: return ''
                try:
                    n = float(str(val))
                    val_fmt = f"{n:.10f}".rstrip('0').rstrip('.')
                    # Alícuota total siempre viene como número, usar punto
                    parte_entera = int(n)
                    parte_decimal_str = val_fmt.split('.')[1] if '.' in val_fmt else ''
                    palabras_entero = numero_a_letras(parte_entera)
                    if parte_decimal_str:
                        digitos_dec = ' '.join([numero_a_letras(int(d)) for d in parte_decimal_str])
                        palabras = f"{palabras_entero} punto {digitos_dec}"
                    else:
                        palabras = palabras_entero
                    return f"{palabras} por ciento ({val_fmt}%)"
                except: return str(val)

            predio_data = {
                'es_compuesto': predio.get('esCompuesto', False),
                'tipo': predio.get('tipo', ''),
                'tipo_otro': predio.get('tipoOtro', ''),
                'numero': num_predio,
                'numero_palabras': num_predio_palabras,
                'numero_predial': num_predial,
                'numero_predial_palabras': f"{numero_a_digitos(num_predial)} ({num_predial})" if num_predial else '',
                'tiene_numero_predial': bool(num_predial),
                'inmuebles': inmuebles_procesados,
                'alicuota_total': alicuota_total,
                'alicuota_total_palabras': fmt_alicuota_total(alicuota_total),
            }
            predios_procesados.append(predio_data)

        context['predios'] = predios_procesados

    # ============================================
    # UBICACIÓN
    # ============================================
    ubicacion = data.get('ubicacion', {})
    num_ubicacion = ubicacion.get('numero', '')
    num_ubicacion_palabras = convertir_numero_casa(str(num_ubicacion)) if num_ubicacion else ''

    context['ubicacion'] = {
        'lote': ubicacion.get('lote', ''),
        'numero': num_ubicacion,
        'numero_palabras': num_ubicacion_palabras,
        'parroquia': ubicacion.get('parroquia', ''),
        'canton': ubicacion.get('canton', ''),
        'provincia': ubicacion.get('provincia', ''),
    }

    # ============================================
    # HISTORIA DE DOMINIO (soporta múltiples partes de adquisición)
    # ============================================
    def procesar_historia_parte(historia, numero_parte, total_partes):
        """Procesa una parte de adquisición de la historia de dominio."""
        porcentaje = historia.get('porcentaje', '')
        porcentaje_palabras = ''
        if total_partes > 1 and porcentaje not in ('', None):
            try:
                pct = float(str(porcentaje).replace(',', '.'))
                pct_fmt = str(porcentaje).rstrip('0').rstrip('.').rstrip(',') if ('.' in str(porcentaje) or ',' in str(porcentaje)) else str(porcentaje)
                porcentaje_palabras = f"{numero_a_letras(pct)} por ciento ({pct_fmt}%)"
            except (ValueError, TypeError):
                porcentaje_palabras = str(porcentaje)

        # Se pasa el nombre TAL COMO lo escribió el usuario (sin limpiar antes)
        # para que formatear_referencia_notario extraiga el título real
        # (Doctor/Abogado/Ingeniero/etc.) y aplique el género correspondiente.
        notario_referencia = formatear_referencia_notario(
            historia.get('generoNotario', ''),
            historia.get('esSuplente', False),
            historia.get('numeroNotaria', ''),
            historia.get('cantonNotaria', ''),
            historia.get('notario', ''),
        )

        causante_notario_referencia = formatear_referencia_notario(
            historia.get('causanteGeneroNotario', ''),
            historia.get('causanteEsSuplente', False),
            historia.get('causanteNumeroNotaria', ''),
            historia.get('causanteCantonNotaria', ''),
            historia.get('causanteNotario', ''),
        )

        parte = {
            'numero_parte': numero_parte,
            'tiene_porcentaje': bool(porcentaje_palabras),
            'porcentaje_palabras': porcentaje_palabras,
            'notario_referencia': notario_referencia,
            'causante_notario_referencia': causante_notario_referencia,
            'titulo': historia.get('titulo', ''),
            'titulo_otro': historia.get('tituloOtro', ''),
            'titulo_texto': formatear_titulo_adquisicion(historia.get('titulo', ''), historia.get('tituloOtro', '')),
            'tipo_sucesion': historia.get('tipoSucesion', ''),
            'tipo_sucesion_texto': formatear_tipo_sucesion(historia.get('tipoSucesion', '')),
            'adquirido_de': historia.get('adquiridoDe', ''),
            'fecha_otorgamiento': formatear_fecha_notarial(historia.get('fechaOtorgamiento', '')) if historia.get('fechaOtorgamiento') else '',
            'numero_notaria': historia.get('numeroNotaria', ''),
            'numero_notaria_palabras': numero_a_ordinal_notaria(historia.get('numeroNotaria', '')) if historia.get('numeroNotaria') else '',
            'canton_notaria': historia.get('cantonNotaria', ''),
            'notario': limpiar_nombre_notario(historia.get('notario', '')),
            'genero_notario': historia.get('generoNotario', ''),
            'es_suplente': historia.get('esSuplente', False),
            'fecha_inscripcion': formatear_fecha_notarial(historia.get('fechaInscripcion', '')) if historia.get('fechaInscripcion') else '',
            'canton_inscripcion': historia.get('cantonInscripcion', ''),
            'mismo_canton': historia.get('cantonNotaria', '').lower() == historia.get('cantonInscripcion', '').lower() if historia.get('cantonNotaria') and historia.get('cantonInscripcion') else False,
            'es_sucesion': historia.get('titulo') == 'sucesion',
            'nombre_causante': historia.get('nombreCausante', ''),
            'causante_adquirido_de': historia.get('causanteAdquiridoDe', ''),
            'causante_titulo': historia.get('causanteTitulo', ''),
            'causante_titulo_otro': historia.get('causanteTituloOtro', ''),
            'causante_titulo_texto': formatear_titulo_adquisicion(historia.get('causanteTitulo', ''), historia.get('causanteTituloOtro', '')),
            'causante_fecha_otorgamiento': formatear_fecha_notarial(historia.get('causanteFechaOtorgamiento', '')) if historia.get('causanteFechaOtorgamiento') else '',
            'causante_numero_notaria': historia.get('causanteNumeroNotaria', ''),
            'causante_numero_notaria_palabras': numero_a_ordinal_notaria(historia.get('causanteNumeroNotaria', '')) if historia.get('causanteNumeroNotaria') else '',
            'causante_canton_notaria': historia.get('causanteCantonNotaria', ''),
            'causante_notario': limpiar_nombre_notario(historia.get('causanteNotario', '')),
            'causante_genero_notario': historia.get('causanteGeneroNotario', ''),
            'causante_es_suplente': historia.get('causanteEsSuplente', False),
            'causante_fecha_inscripcion': formatear_fecha_notarial(historia.get('causanteFechaInscripcion', '')) if historia.get('causanteFechaInscripcion') else '',
            'causante_canton_inscripcion': historia.get('causanteCantonInscripcion', ''),
            'causante_mismo_canton': historia.get('causanteCantonNotaria', '').lower() == historia.get('causanteCantonInscripcion', '').lower() if historia.get('causanteCantonNotaria') and historia.get('causanteCantonInscripcion') else False,
        }
        parte['aclaratorias'] = procesar_aclaratorias_historia(historia.get('aclaratorias', []))
        return parte

    if data.get('modoHistoria') == 'redactar':
        context['historia_manual'] = True
        context['historia_texto'] = limpiar_html(data.get('historiaManual', ''))
        context['historia_partes'] = []
    else:
        context['historia_manual'] = False
        historia_partes_raw = data.get('historiaPartes', [])
        # Compatibilidad: si llega el formato antiguo (un solo objeto historiaFormulario)
        if not historia_partes_raw and data.get('historiaFormulario'):
            historia_partes_raw = [data.get('historiaFormulario')]

        total_partes = len(historia_partes_raw)
        context['historia_partes'] = [
            procesar_historia_parte(h, i + 1, total_partes)
            for i, h in enumerate(historia_partes_raw)
        ]
        # Alias de compatibilidad — algunas plantillas/código previo referencian 'historia'
        # como la primera parte cuando solo hay una.
        context['historia'] = context['historia_partes'][0] if context['historia_partes'] else {}

    # ============================================
    # DECLARATORIA (solo horizontal)
    # ============================================
    if context['es_horizontal']:
        if data.get('modoDeclaratoria') == 'redactar':
            context['declaratoria_manual'] = True
            context['declaratoria_texto'] = limpiar_html(data.get('declaratoriaManual', ''))
        else:
            context['declaratoria_manual'] = False
            declaratoria = data.get('declaratoriaFormulario', {})

            declaratoria_notario_referencia = formatear_referencia_notario(
                declaratoria.get('generoNotario', ''),
                declaratoria.get('esSuplente', False),
                declaratoria.get('numeroNotaria', ''),
                declaratoria.get('cantonNotaria', ''),
                declaratoria.get('notario', ''),
            )

            context['declaratoria'] = {
                'notario_referencia': declaratoria_notario_referencia,
                'fecha_otorgamiento': formatear_fecha_notarial(declaratoria.get('fechaOtorgamiento', '')) if declaratoria.get('fechaOtorgamiento') else '',
                'numero_notaria': declaratoria.get('numeroNotaria', ''),
                'numero_notaria_palabras': numero_a_ordinal_notaria(declaratoria.get('numeroNotaria', '')) if declaratoria.get('numeroNotaria') else '',
                'canton_notaria': declaratoria.get('cantonNotaria', ''),
                'notario': limpiar_nombre_notario(declaratoria.get('notario', '')),
                'genero_notario': declaratoria.get('generoNotario', ''),
                'es_suplente': declaratoria.get('esSuplente', False),
                'fecha_inscripcion': formatear_fecha_notarial(declaratoria.get('fechaInscripcion', '')) if declaratoria.get('fechaInscripcion') else '',
                'canton_inscripcion': declaratoria.get('cantonInscripcion', ''),
                'mismo_canton': declaratoria.get('cantonNotaria', '').lower() == declaratoria.get('cantonInscripcion', '').lower() if declaratoria.get('cantonNotaria') and declaratoria.get('cantonInscripcion') else False,
            }

            context['declaratoria']['aclaratorias'] = procesar_aclaratorias_declaratoria(declaratoria.get('aclaratorias', []))

    # ============================================
    # LINDEROS GENERALES
    # ============================================
    linderos_generales = data.get('linderosGenerales', {})
    context['linderos'] = procesar_linderos(linderos_generales, incluir_arriba_abajo=False)

    # ============================================
    # LINDEROS ESPECÍFICOS (solo horizontal)
    # ============================================
    context['tiene_linderos_especificos'] = False

    if context['es_horizontal'] and data.get('tieneLInderosEspecificos'):
        context['tiene_linderos_especificos'] = True
        linderos_especificos = data.get('linderosEspecificos', {})
        context['linderos_especificos'] = procesar_linderos(linderos_especificos, incluir_arriba_abajo=True)

    # ============================================
    # OBJETO DEL CONTRATO
    # ============================================
    if data.get('modoSujeto') == 'manual':
        context['sujeto_manual'] = True
        context['sujeto_texto'] = limpiar_html(data.get('sujetoManual', ''))
    else:
        context['sujeto_manual'] = False

    # ============================================
    # PRECIO Y FORMA DE PAGO
    # ============================================
    if data.get('modoPrecio') == 'manual':
        context['precio_manual'] = True
        context['precio_texto'] = limpiar_html(data.get('precioManual', ''))
    else:
        context['precio_manual'] = False
        precio_total = data.get('precioTotal', 0)

        try:
            precio_num = float(precio_total)
            precio_palabras = numero_a_letras(precio_num).upper()
            precio_fmt = f"{precio_num:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            precio_total_str = f"{precio_palabras} DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA (${precio_fmt} USD)"
        except:
            precio_total_str = str(precio_total)

        context['precio'] = {
            'total': precio_total,
            'total_palabras': precio_total_str,
            'partes': []
        }

        partes_pago = data.get('partesPago', [])
        for parte in partes_pago:
            monto = parte.get('monto', 0)

            momento_otro_raw = parte.get('momentoOtro', '')
            if parte.get('momentoEsFecha') and momento_otro_raw:
                momento_otro_texto = formatear_fecha_notarial(momento_otro_raw)
            else:
                momento_otro_texto = momento_otro_raw

            parte_data = {
                'letra': parte.get('letra', ''),
                'monto': monto,
                'monto_palabras': formatear_dinero(monto),
                'es_cuotas': parte.get('tipoPago') == 'cuotas',
                'medio_pago': parte.get('medioPago', ''),
                'tipo_cheque': parte.get('tipoCheque', ''),
                'momento_pago': parte.get('momentoPago', ''),
                'momento_pago_otro': momento_otro_texto,
                'momento_otro': momento_otro_texto,
                'es_credito': parte.get('esCreditoBancario', False),
                'entidad_credito': parte.get('nombreBanco', ''),
                'nombre_banco': parte.get('nombreBanco', ''),
                'cuenta_destino': numeros_en_texto_a_letras(parte.get('cuentaDestino', '')),
                'detalle_transferencia': '',
            }

            if parte_data['es_cuotas']:
                numero_cuotas = parte.get('numeroCuotas', 0)
                valor_cuota = parte.get('valorCuota', 0)
                periodicidad = parte.get('periodicidad', '')

                parte_data['numero_cuotas'] = numero_cuotas
                parte_data['numero_cuotas_palabras'] = numero_a_letras(int(numero_cuotas)) if numero_cuotas else ''
                parte_data['valor_cuota'] = valor_cuota
                parte_data['valor_cuota_palabras'] = numero_a_letras(float(valor_cuota)) if valor_cuota else ''
                parte_data['periodicidad'] = periodicidad if periodicidad != 'otro' else parte.get('periodicidadOtra', '')

            if parte.get('tieneDetalle'):
                detalle = parte.get('detalle', {})
                parte_data['tiene_detalle'] = True
                parte_data['detalle'] = {
                    'banco_origen': detalle.get('bancoOrigen', ''),
                    'cuenta_origen': cuenta_a_letras(detalle.get('cuentaOrigen', '')),
                    'tipo_cuenta_origen': detalle.get('tipoCuentaOrigen', ''),
                    'banco_destino': detalle.get('bancoDestino', ''),
                    'cuenta_destino': cuenta_a_letras(detalle.get('cuentaDestino', '')),
                    'tipo_cuenta_destino': detalle.get('tipoCuentaDestino', ''),
                }
            else:
                parte_data['tiene_detalle'] = False

            context['precio']['partes'].append(parte_data)

    # ============================================
    # ADMINISTRADOR (solo horizontal)
    # ============================================
    if context['es_horizontal']:
        context['hay_administrador'] = data.get('hayAdministrador', False)

    # ============================================
    # ABOGADO
    # ============================================
    abogado = data.get('abogado', {})
    context['abogado'] = {
        'nombre': abogado.get('nombre', ''),
        'numero_matricula': abogado.get('numeroMatricula', ''),
        'tipo_matricula': abogado.get('tipoMatricula', 'cj'),
        'provincia': abogado.get('provincia', ''),
    }

    # ============================================
    # RENDERIZAR Y GUARDAR EN DISCO
    # ============================================
    doc.render(context)

    user_id = current_user.id if current_user else "unknown"
    filename = f"minuta_compraventa_{user_id}_{uuid.uuid4().hex[:8]}.docx"
    output_path = OUTPUTS_DIR / filename

    doc.save(str(output_path))

    return str(output_path)