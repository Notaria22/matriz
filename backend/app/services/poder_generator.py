from docxtpl import DocxTemplate, RichText
from pathlib import Path
from datetime import datetime
import uuid
import logging

from ..utils.number_to_words import (
    numero_a_letras,
    numero_a_digitos,
    formatear_fecha_notarial,
    calcular_edad,
    numero_a_ordinal_notaria,
    convertir_numero_casa,
    numeros_en_texto_a_letras,
)

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
OUTPUTS_DIR = Path(__file__).parent.parent.parent / "generated_documents"
OUTPUTS_DIR.mkdir(exist_ok=True)

TIPOS_PODER_NOMBRES = {
    "poder_general": "PODER GENERAL",
    "poder_general_facultades": "PODER GENERAL CON FACULTADES ESPECIALES",
    "poder_especial": "PODER ESPECIAL",
    "procuracion_judicial": "PROCURACIÓN JUDICIAL",
    "procuracion_poder_especial": "PROCURACIÓN JUDICIAL Y PODER ESPECIAL",
    "procuracion_poder_general": "PROCURACIÓN JUDICIAL Y PODER GENERAL",
    "poder_general_telematico": "PODER GENERAL CON COMPARECENCIA TELEMÁTICA",
    "poder_general_facultades_telematico": "PODER GENERAL CON FACULTADES ESPECIALES CON COMPARECENCIA TELEMÁTICA",
    "poder_especial_telematico": "PODER ESPECIAL CON COMPARECENCIA TELEMÁTICA",
    "procuracion_judicial_telematico": "PROCURACIÓN JUDICIAL CON COMPARECENCIA TELEMÁTICA",
    "procuracion_poder_especial_telematico": "PROCURACIÓN JUDICIAL Y PODER ESPECIAL CON COMPARECENCIA TELEMÁTICA",
    "procuracion_poder_general_telematico": "PROCURACIÓN JUDICIAL Y PODER GENERAL CON COMPARECENCIA TELEMÁTICA",
    "delegacion_poder_general": "DELEGACIÓN DE PODER GENERAL",
    "delegacion_poder_especial": "DELEGACIÓN DE PODER ESPECIAL",
    "delegacion_procuracion_judicial": "DELEGACIÓN DE PROCURACIÓN JUDICIAL",
    "delegacion_poder_general_telematico": "DELEGACIÓN DE PODER GENERAL CON COMPARECENCIA TELEMÁTICA",
    "delegacion_poder_especial_telematico": "DELEGACIÓN DE PODER ESPECIAL CON COMPARECENCIA TELEMÁTICA",
    "delegacion_procuracion_judicial_telematico": "DELEGACIÓN DE PROCURACIÓN JUDICIAL CON COMPARECENCIA TELEMÁTICA",
}

ES_PODER_GENERAL = lambda tipo: "general" in tipo and "especial" not in tipo
ES_PROCURACION = lambda tipo: "procuracion" in tipo
ES_DELEGACION = lambda tipo: "delegacion" in tipo
ES_TELEMATICO = lambda tipo: "telematico" in tipo


def construir_direccion_poder(persona):
    """Construye dirección desde campos individuales."""
    partes = []
    main = persona.get('mainStreet', '').strip()
    num = persona.get('numberStreet', '').strip()
    sec = persona.get('secondaryStreet', '').strip()

    if main:
        if num:
            nc = convertir_numero_casa(num)
            partes.append(f"{main} {nc} y {sec}" if sec else f"{main} {nc}")
        else:
            partes.append(f"{main} y {sec}" if sec else main)

    if persona.get('sector'): partes.append(persona['sector'])
    if persona.get('parroquia'): partes.append(f"parroquia {persona['parroquia']}")
    if persona.get('canton'): partes.append(f"cantón {persona['canton']}")
    if persona.get('province'): partes.append(f"provincia de {persona['province']}")

    return numeros_en_texto_a_letras(', '.join(partes))


def procesar_compareciente_poder(persona, numero, es_apoderado=False):
    """
    Procesa un compareciente para poder — persona natural.
    Retorna el texto de la cláusula de comparecencia.
    """
    nombres = f"{persona.get('names', '')} {persona.get('lastNames', '')}".strip().upper()
    cedula = persona.get('documentNumber', '')
    cedula_palabras = numero_a_digitos(cedula)
    edad = calcular_edad(persona.get('birthDate', ''))
    edad_palabras = f"{numero_a_letras(edad)} ({edad})" if edad else ''
    telefono = persona.get('phone', '')
    telefono_palabras = numero_a_digitos(telefono) if telefono else ''

    marital = persona.get('maritalStatus', 'soltero')
    conyugue_comparece = persona.get('conyugueComparece', True)
    razon_exclusion = persona.get('razonExclusionConyugue', '')

    RAZON_ESTADO_CIVIL = {
        'capitulacion': 'casado/a con capitulaciones matrimoniales',
        'disolucion': 'casado/a con disolución de sociedad conyugal',
        'adquirido_solo': 'casado/a',
        'no_requiere_adquirente': 'casado/a',
        'titulo_gratuito': 'casado/a',
        'ingresa_sociedad': 'casado/a',
    }
    ESTADO_CIVIL_MAP = {
        'soltero': 'soltero/a',
        'casado': 'casado/a',
        'divorciado': 'divorciado/a',
        'viudo': 'viudo/a',
        'union_libre': 'en unión libre',
    }

    if marital == 'casado' and not conyugue_comparece and razon_exclusion:
        estado_civil = RAZON_ESTADO_CIVIL.get(razon_exclusion, 'casado/a')
    else:
        estado_civil = ESTADO_CIVIL_MAP.get(marital, 'soltero/a')

    ocupacion = persona.get('occupation', '')
    profesion = persona.get('profession', '')
    prof_ocup = f"de profesión {profesion} y de ocupación {ocupacion}" if profesion and ocupacion else (
        f"de ocupación {ocupacion}" if ocupacion else (f"de profesión {profesion}" if profesion else ''))

    direccion = construir_direccion_poder(persona)
    email = persona.get('email', '')

    texto = (
        f"{nombres}, de nacionalidad {persona.get('nationality', 'ecuatoriana')}, "
        f"portador/a de la cédula de ciudadanía número {cedula_palabras} ({cedula}), "
        f"de {edad_palabras} años de edad, de estado civil {estado_civil}"
    )
    if prof_ocup:
        texto += f", {prof_ocup}"
    if telefono:
        texto += f", teléfono celular número {telefono_palabras} ({telefono})"
    if email:
        texto += f", con domicilio electrónico en el correo {email}"
    if direccion:
        texto += f", domiciliado/a físicamente en {direccion}"

    return texto


def procesar_empresa_poder(empresa):
    """Procesa empresa (persona jurídica) para poder."""
    razon_social = empresa.get('razonSocial', '').upper()
    ruc = empresa.get('ruc', '')

    rep_nombres = f"{empresa.get('repNames', '')} {empresa.get('repLastNames', '')}".strip().upper()
    rep_cedula = empresa.get('repDocumentNumber', '')
    rep_cedula_palabras = numero_a_digitos(rep_cedula)
    rep_edad = calcular_edad(empresa.get('repBirthDate', ''))
    rep_edad_palabras = f"{numero_a_letras(rep_edad)} ({rep_edad})" if rep_edad else ''
    rep_cargo = empresa.get('repPosition', 'Representante Legal')
    rep_ocup = empresa.get('repOccupation', '')
    rep_prof = empresa.get('repProfession', '')
    prof_ocup = f"de profesión {rep_prof} y de ocupación {rep_ocup}" if rep_prof and rep_ocup else (
        f"de ocupación {rep_ocup}" if rep_ocup else '')

    return (
        f"La compañía {razon_social}, con RUC número {ruc}, "
        f"representada legalmente por su {rep_cargo}, {rep_nombres}, "
        f"de nacionalidad {empresa.get('repNationality', 'ecuatoriana')}, "
        f"portador de la cédula de ciudadanía número {rep_cedula_palabras} ({rep_cedula}), "
        f"de {rep_edad_palabras} años de edad"
        + (f", {prof_ocup}" if prof_ocup else "")
    )


def construir_clausula_primera(data):
    """Construye la cláusula PRIMERA de comparecientes."""
    tipo_comparecencia = data.get('tipoComparecencia', 'un_poderdante')
    poderdantes = data.get('poderdantes', [])
    apoderados = data.get('apoderados', [])
    es_procuracion = ES_PROCURACION(data.get('tipoPoder', ''))
    es_telematico = ES_TELEMATICO(data.get('tipoPoder', ''))

    notario = data.get('notario', '')
    titulo_notario = data.get('tituloNotario', '')
    fecha_notarial = data.get('fechaNotarial', '')

    # Encabezado según tipo de comparecencia
    if tipo_comparecencia == 'un_poderdante':
        encabezado = "PRIMERA.- COMPARECIENTE:"
        intro = "Comparece a la celebración del presente instrumento"
    elif tipo_comparecencia == 'poderdantes_conyuges':
        encabezado = "PRIMERA.- COMPARECIENTES:"
        intro = "Comparecen a la celebración del presente instrumento los cónyuges"
    else:
        encabezado = "PRIMERA.- COMPARECIENTES:"
        intro = "Comparecen a la celebración del presente instrumento las siguientes personas"

    # Texto de poderdantes
    textos_poderdantes = []
    for i, p in enumerate(poderdantes):
        if p.get('esEmpresa'):
            texto = procesar_empresa_poder(p)
        else:
            texto = procesar_compareciente_poder(p, i + 1)
        textos_poderdantes.append(f"{i + 1}.- {texto}")

    poderdantes_str = "; y, ".join(textos_poderdantes)

    # Denominación parte mandante
    if len(poderdantes) > 1:
        denominacion_mandante = "a quienes en adelante se les denominará LA PARTE MANDANTE"
    else:
        denominacion_mandante = "a quien en adelante se le denominará LA PARTE MANDANTE"

    # Texto de apoderados
    label_apoderado = "PROCURADOR/A JUDICIAL" if es_procuracion else "PARTE MANDATARIA"
    textos_apoderados = []
    offset = len(poderdantes)
    for i, a in enumerate(apoderados):
        if a.get('esEmpresa'):
            texto = procesar_empresa_poder(a)
        else:
            texto = procesar_compareciente_poder(a, offset + i + 1, es_apoderado=True)
        textos_apoderados.append(f"{offset + i + 1}.- {texto}")

    apoderados_str = "; y, ".join(textos_apoderados)

    if len(apoderados) > 1:
        denominacion_apoderado = f"a quienes en adelante se les denominará {label_apoderado}"
    else:
        denominacion_apoderado = f"a quien en adelante se le denominará {label_apoderado}"

    # Texto telemático
    if es_telematico:
        texto_telematico = (
            "Esta escritura se otorga mediante comparecencia telemática, "
            "al amparo de lo dispuesto en la Ley Notarial y las disposiciones reglamentarias vigentes, "
            "habiéndose verificado la identidad de los comparecientes mediante los medios tecnológicos habilitados para el efecto. "
        )
    else:
        texto_telematico = ""

    # Texto de capacidad legal
    texto_capacidad = (
        "Para proceder a autorizar el presente instrumento, mi actuación se enmarca en el estricto cumplimiento "
        "de los principios de la administración pública, en el respeto de los derechos de los usuarios garantizados "
        "en la Constitución de la República, y he procedido conforme a lo determinado en la Ley Notarial. "
        f"{texto_telematico}"
        "En consecuencia, dentro de la reunión practicada con los comparecientes, quienes han exhibido los documentos "
        "que habilitan su intervención, observo que son de nacionalidad ecuatoriana, legalmente capaces para contratar "
        "y obligarse; que acuden al otorgamiento del presente instrumento en forma libre y voluntaria, manifestando que "
        "su actuación no obedece a ningún tipo de coacción, amenazas, temor reverencial, promesa o seducción; expresan "
        "conocer el contenido del instrumento que desean otorgar, declarando saber sus consecuencias, obligaciones y "
        "derechos, puesto que refieren haber recibido asesoría jurídica pertinente; así como en este despacho se les "
        "ha brindado claras explicaciones. Doy fe de conocer a los comparecientes por haber exhibido sus cédulas de "
        "ciudadanía, que con su autorización he procedido a verificar en el Sistema Nacional de Identificación "
        "Ciudadana del Registro Civil."
    )

    clausula = (
        f"{encabezado} {intro}: {poderdantes_str}; {denominacion_mandante}; "
        f"y, {apoderados_str}; {denominacion_apoderado}. {texto_capacidad}"
    )

    return clausula


def construir_clausula_segunda(data):
    """Construye la cláusula SEGUNDA de objeto del poder."""
    tipo_poder = data.get('tipoPoder', 'poder_general')
    tipo_poder_nombre = TIPOS_PODER_NOMBRES.get(tipo_poder, 'PODER')
    apoderados = data.get('apoderados', [])
    es_procuracion = ES_PROCURACION(tipo_poder)
    es_delegacion = ES_DELEGACION(tipo_poder)

    nombres_apoderados = []
    for a in apoderados:
        if a.get('esEmpresa'):
            nombres_apoderados.append(a.get('razonSocial', '').upper())
        else:
            nombres_apoderados.append(
                f"{a.get('names', '')} {a.get('lastNames', '')}".strip().upper()
            )

    if len(nombres_apoderados) > 1:
        apoderados_str = ", ".join(nombres_apoderados[:-1]) + " y " + nombres_apoderados[-1]
    else:
        apoderados_str = nombres_apoderados[0] if nombres_apoderados else "LA PARTE MANDATARIA"

    if es_procuracion:
        objeto = (
            f"Con estos antecedentes, LA PARTE MANDANTE confiere {tipo_poder_nombre}, "
            f"amplia y suficiente cual en derecho se requiere, a favor de {apoderados_str}, "
            "para que en calidad de procuradora/or judicial y como abogada/o legalmente habilitado/a, "
            "la represente, patrocine y defienda en los términos que se especifican en las facultades "
            "del presente instrumento."
        )
    elif es_delegacion:
        objeto = (
            f"Con estos antecedentes, LA PARTE MANDANTE delega las facultades conferidas mediante "
            f"{tipo_poder_nombre}, a favor de {apoderados_str}, "
            "en los términos y con los límites que se especifican en el presente instrumento."
        )
    else:
        objeto = (
            f"Con estos antecedentes, LA PARTE MANDANTE confiere {tipo_poder_nombre}, "
            f"amplio y suficiente cual en derecho se requiere, a favor de {apoderados_str}, "
            "para que la represente con las facultades que se especifican a continuación; "
            "a quien en adelante se le denominará LA PARTE MANDATARIA."
        )

    return f"SEGUNDA.- OBJETO: {objeto}"


def construir_clausula_facultades(data):
    """Construye el texto de las facultades seleccionadas."""
    facultades = data.get('facultades', [])
    if not facultades:
        return ""

    partes = []
    for texto in facultades:
        partes.append(texto.strip())

    return "\n\n".join(partes)


def construir_frase_lectura(data):
    """Construye la frase de lectura según las condiciones del instrumento."""
    return (
        "Su contenido completo fue íntegramente leído por los comparecientes, quienes expresan su total "
        "conformidad por estar elaborado de acuerdo con sus intereses y requerimientos; por lo tanto, lo "
        "suscriben y aprueban, firmándolo de forma autógrafa conmigo, el Notario, en unidad de acto. "
        "Una vez cumplidas todas las formalidades, procedo a incorporar la matriz original del presente "
        "instrumento al protocolo a mi cargo, indexándola con el número generado por el Sistema "
        "Informático Notarial, de todo lo cual "
    )


def construir_firmas(personas, label):
    """Construye el bloque de firmas."""
    lineas = []
    for p in personas:
        if p.get('esEmpresa'):
            nombres = p.get('razonSocial', '').upper()
            rep = f"{p.get('repNames', '')} {p.get('repLastNames', '')}".strip().upper()
            ruc = p.get('ruc', '')
            rep_cedula = p.get('repDocumentNumber', '')
            lineas.append(f"{rep}\nC.C. {rep_cedula}\nEN REPRESENTACIÓN DE {nombres}\nRUC {ruc}")
        else:
            nombres = f"{p.get('names', '')} {p.get('lastNames', '')}".strip().upper()
            cedula = p.get('documentNumber', '')
            lineas.append(f"{nombres}\nC.C. {cedula}\n{label}")

    return "\n\n".join(lineas)


def generate_poder(data: dict, current_user=None) -> str:
    """
    Genera el documento Word de poder/procuración/delegación.
    """
    tipo_poder = data.get('tipoPoder', 'poder_general')
    tipo_poder_nombre = TIPOS_PODER_NOMBRES.get(tipo_poder, 'PODER')

    # Construir cláusulas
    clausula_primera = construir_clausula_primera(data)
    clausula_segunda = construir_clausula_segunda(data)
    clausula_facultades = construir_clausula_facultades(data)
    frase_lectura = construir_frase_lectura(data)

    poderdantes = data.get('poderdantes', [])
    apoderados = data.get('apoderados', [])

    firmas_poderdantes = construir_firmas(poderdantes, "LA PARTE MANDANTE")
    firmas_apoderados = construir_firmas(apoderados, "LA PARTE MANDATARIA")

    notario_data = data.get('notario', {})
    notario_nombre = notario_data.get('nombre', '')
    notario_titulo = notario_data.get('titulo', '')

    abogado = data.get('abogado', {})

    # Contexto para la plantilla
    context = {
        'tipo_poder_nombre': tipo_poder_nombre,
        'clausula_primera': RichText(clausula_primera),
        'clausula_segunda': RichText(clausula_segunda),
        'clausula_facultades': RichText(clausula_facultades),
        'frase_lectura': RichText(frase_lectura),
        'firmas_poderdantes': RichText(firmas_poderdantes),
        'firmas_apoderados': RichText(firmas_apoderados),
        'notario': notario_nombre,
        'titulo_notario': notario_titulo,
        'abogado_nombre': abogado.get('nombreAbogado', ''),
        'abogado_matricula': abogado.get('numeroMatricula', ''),
    }

    template_path = TEMPLATES_DIR / "minuta_poder.docx"
    if not template_path.exists():
        raise FileNotFoundError(f"Plantilla no encontrada: {template_path}")

    doc = DocxTemplate(template_path)
    doc.render(context, autoescape=False)

    user_id = current_user.id if current_user else "unknown"
    filename = f"poder_{user_id}_{uuid.uuid4().hex[:8]}.docx"
    output_path = OUTPUTS_DIR / filename
    doc.save(str(output_path))

    return str(output_path)