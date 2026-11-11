import re


def numero_a_digitos(numero):
    """
    Convierte número a dígitos en letras: 123 -> 'uno dos tres'
    Maneja strings y números
    """
    if not numero:
        return ""
    
    # Convertir a string y limpiar
    numero_str = str(numero).strip()
    
    unidades = [
        "cero", "uno", "dos", "tres", "cuatro", "cinco",
        "seis", "siete", "ocho", "nueve"
    ]
    
    # Convertir cada dígito
    digitos_letras = []
    for char in numero_str:
        if char.isdigit():
            digitos_letras.append(unidades[int(char)])
        elif char == '-':
            digitos_letras.append("guión")
    
    return " ".join(digitos_letras)


def numero_casa_a_letras(numero_str):
    """
    Convierte número de casa dígito por dígito: E13-51 → E uno tres guión cinco uno
    """
    if not numero_str:
        return ""
    
    numero_str = str(numero_str).strip()
    
    unidades = [
        "cero", "uno", "dos", "tres", "cuatro", "cinco",
        "seis", "siete", "ocho", "nueve"
    ]
    
    resultado = []
    for char in numero_str:
        if char.isdigit():
            resultado.append(unidades[int(char)])
        elif char == '-':
            resultado.append("guión")
        elif char.isalpha():
            resultado.append(char.upper())
    
    return " ".join(resultado)


def dia_mes_letras(n):
    """Convierte día/mes a letras (1-31)"""
    # Casos especiales para 20-29
    especiales_veinte = {
        20: "veinte",
        21: "veintiuno",
        22: "veintidós",
        23: "veintitrés",
        24: "veinticuatro",
        25: "veinticinco",
        26: "veintiséis",
        27: "veintisiete",
        28: "veintiocho",
        29: "veintinueve"
    }
    
    if n in especiales_veinte:
        return especiales_veinte[n]
    
    menores_veinte = [
        "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis",
        "siete", "ocho", "nueve", "diez", "once", "doce", "trece",
        "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"
    ]
    
    if n < 20:
        return menores_veinte[n]
    if n == 30:
        return "treinta"
    if n == 31:
        return "treinta y uno"
    return ""


def numero_a_letras(n):
    """
    Convierte número a letras completo
    Maneja: int, float, str (con conversión automática)
    """
    # Manejar None, vacío o 0
    if n is None or n == "":
        return "cero"
    
    # Si es string, convertir a número
    if isinstance(n, str):
        try:
            n = n.strip().replace(',', '.')
            # Si tiene punto decimal, convertir a float
            if '.' in n:
                n = float(n)
            else:
                n = int(n)
        except (ValueError, AttributeError):
            print(f"⚠️ No se pudo convertir '{n}' a número, devolviendo como está")
            return str(n)
    
    # Manejar cero explícitamente
    if n == 0:
        return "cero"
    
    # Si es float, manejar parte decimal
    if isinstance(n, float):
        # Convertir a string para preservar los decimales exactos incluyendo ceros iniciales
        n_str = f"{n:.10f}".rstrip('0')  # hasta 10 decimales, quitar ceros finales
        if '.' not in n_str:
            return numero_a_letras(int(n))

        partes = n_str.split('.')
        parte_entera_str = partes[0]
        parte_decimal_str = partes[1]  # preserva "03", "012", etc.

        if not parte_decimal_str or int(parte_decimal_str) == 0:
            return numero_a_letras(int(n))

        # Convertir cada dígito decimal individualmente para preservar ceros iniciales
        digitos_decimales = numero_a_digitos(parte_decimal_str)

        return f"{numero_a_letras(int(parte_entera_str))} coma {digitos_decimales}"
    
    # Convertir a int para evitar problemas con comparaciones
    n = int(n)
    
    if n == 0:
        return "cero"
    
    # Casos especiales para 20-29
    especiales_veinte = {
        20: "veinte",
        21: "veintiuno",
        22: "veintidós",
        23: "veintitrés",
        24: "veinticuatro",
        25: "veinticinco",
        26: "veintiséis",
        27: "veintisiete",
        28: "veintiocho",
        29: "veintinueve"
    }
    
    if n in especiales_veinte:
        return especiales_veinte[n]
    
    especiales = {
        30: "treinta", 40: "cuarenta", 50: "cincuenta",
        60: "sesenta", 70: "setenta", 80: "ochenta", 90: "noventa",
        100: "cien"
    }
    
    menores_veinte = [
        "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis",
        "siete", "ocho", "nueve", "diez", "once", "doce", "trece",
        "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"
    ]
    
    if n < 20:
        return menores_veinte[n]
    
    if n in especiales:
        return especiales[n]
    
    if n < 100:
        decena = (n // 10) * 10
        unidad = n % 10
        return f"{especiales[decena]} y {numero_a_letras(unidad)}"
    
    if n < 200:
        resto = n - 100
        if resto == 0:
            return "cien"
        return f"ciento {numero_a_letras(resto)}"
    
    centenas = {
        200: "doscientos", 300: "trescientos", 400: "cuatrocientos",
        500: "quinientos", 600: "seiscientos", 700: "setecientos",
        800: "ochocientos", 900: "novecientos"
    }
    
    if n < 1000:
        centena = (n // 100) * 100
        resto = n % 100
        if resto == 0:
            return centenas[centena]
        return f"{centenas[centena]} {numero_a_letras(resto)}"
    
    if n < 2000:
        resto = n - 1000
        if resto == 0:
            return "mil"
        return f"mil {numero_a_letras(resto)}"
    
    if n < 1000000:
        miles = n // 1000
        resto = n % 1000
        if resto == 0:
            return f"{numero_a_letras(miles)} mil"
        return f"{numero_a_letras(miles)} mil {numero_a_letras(resto)}"
    
    if n < 2000000:
        resto = n - 1000000
        if resto == 0:
            return "un millón"
        return f"un millón {numero_a_letras(resto)}"
    
    millones = n // 1000000
    resto = n % 1000000
    if resto == 0:
        return f"{numero_a_letras(millones)} millones"
    return f"{numero_a_letras(millones)} millones {numero_a_letras(resto)}"


ORDINALES_FEMENINO = {
    1: "Primera", 2: "Segunda", 3: "Tercera", 4: "Cuarta", 5: "Quinta",
    6: "Sexta", 7: "Séptima", 8: "Octava", 9: "Novena", 10: "Décima",
    11: "Undécima", 12: "Duodécima", 13: "Décimo Tercera", 14: "Décimo Cuarta",
    15: "Décimo Quinta", 16: "Décimo Sexta", 17: "Décimo Séptima",
    18: "Décimo Octava", 19: "Décimo Novena"
}
ORDINALES_MASCULINO = {
    1: "Primero", 2: "Segundo", 3: "Tercero", 4: "Cuarto", 5: "Quinto",
    6: "Sexto", 7: "Séptimo", 8: "Octavo", 9: "Noveno", 10: "Décimo",
    11: "Undécimo", 12: "Duodécimo", 13: "Décimo Tercero", 14: "Décimo Cuarto",
    15: "Décimo Quinto", 16: "Décimo Sexto", 17: "Décimo Séptimo",
    18: "Décimo Octavo", 19: "Décimo Noveno"
}
DECENAS_FEMENINO = {
    20: "Vigésima", 30: "Trigésima", 40: "Cuadragésima", 50: "Quincuagésima",
    60: "Sexagésima", 70: "Septuagésima", 80: "Octogésima", 90: "Nonagésima"
}
DECENAS_MASCULINO = {
    20: "Vigésimo", 30: "Trigésimo", 40: "Cuadragésimo", 50: "Quincuagésimo",
    60: "Sexagésimo", 70: "Septuagésimo", 80: "Octogésimo", 90: "Nonagésimo"
}


def numero_a_ordinal_genero(numero, genero='femenino'):
    """
    Convierte número a ordinal con concordancia de género completa (ambas
    partes del ordinal compuesto en el mismo género, sin mezclar).
    Ej: numero_a_ordinal_genero(12, 'masculino') -> 'Duodécimo'
        numero_a_ordinal_genero(22, 'masculino') -> 'Vigésimo Segundo'
        numero_a_ordinal_genero(22, 'femenino')  -> 'Vigésima Segunda'
    """
    if isinstance(numero, str):
        import re
        match = re.search(r'\d+', numero)
        if match:
            numero = int(match.group())
        else:
            return numero

    numero = int(numero)
    es_masculino = genero == 'masculino'
    especiales = ORDINALES_MASCULINO if es_masculino else ORDINALES_FEMENINO
    decenas = DECENAS_MASCULINO if es_masculino else DECENAS_FEMENINO

    if numero in especiales:
        return especiales[numero]

    if 20 <= numero < 100:
        decena = (numero // 10) * 10
        unidad = numero % 10
        if unidad == 0:
            return decenas[decena]
        return f"{decenas[decena]} {especiales[unidad]}"

    return f"Número {numero}"


def formatear_referencia_notario(genero, es_suplente, numero_notaria, canton_notaria, nombre_notario_raw):
    """
    Arma la referencia completa al notario como persona (no como oficina),
    con género, suplencia, ordinal concordado, y el tratamiento tal como lo
    escribió el usuario (Doctor/Abogado/Ingeniero/etc.) con su género correcto.
    Si el usuario no escribió ningún tratamiento, no se agrega ninguno.
    Ej: 'Doctora Miriam Herrera' + femenino -> 'la notaria ..., doctora MIRIAM HERRERA'
        'Abogado Juan Pérez' + masculino    -> 'el notario ..., abogado JUAN PÉREZ'
        'Juan Pérez' + masculino            -> 'el notario ..., JUAN PÉREZ'
    """
    genero = genero if genero in ('masculino', 'femenino') else 'femenino'
    es_femenino = genero == 'femenino'
    persona = 'la notaria' if es_femenino else 'el notario'
    suplente_txt = 'Suplente ' if es_suplente else ''
    ordinal = numero_a_ordinal_genero(numero_notaria, genero) if numero_notaria else ''

    titulo_base, nombre_limpio = separar_titulo_nombre(nombre_notario_raw)
    if titulo_base:
        tratamiento = TITULOS_NOTARIALES_GENERO[titulo_base][genero] + ' '
    else:
        tratamiento = ''

    texto = f"{persona} {suplente_txt}{ordinal} del cantón {canton_notaria}"
    if nombre_limpio:
        texto += f", {tratamiento}{nombre_limpio}"
    return texto


def numero_a_ordinal_notaria(numero):
    """
    Convierte número a ordinal femenino para notarías
    1 -> Primera, 2 -> Segunda, 14 -> Décimo Cuarta, 22 -> Vigésimo Segunda
    """
    if isinstance(numero, str):
        # Si viene como texto, intentar extraer el número
        import re
        match = re.search(r'\d+', numero)
        if match:
            numero = int(match.group())
        else:
            return numero  # Devolver como está si no tiene número
    
    numero = int(numero)
    
    # Ordinales especiales (1-19)
    ordinales_especiales = {
        1: "Primera", 2: "Segunda", 3: "Tercera", 4: "Cuarta", 5: "Quinta",
        6: "Sexta", 7: "Séptima", 8: "Octava", 9: "Novena", 10: "Décima",
        11: "Undécima", 12: "Duodécima", 13: "Décimo Tercera", 14: "Décimo Cuarta",
        15: "Décimo Quinta", 16: "Décimo Sexta", 17: "Décimo Séptima",
        18: "Décimo Octava", 19: "Décimo Novena"
    }
    
    if numero in ordinales_especiales:
        return ordinales_especiales[numero]
    
    # Para 20-99
    decenas = {
        20: "Vigésima", 30: "Trigésima", 40: "Cuadragésima", 50: "Quincuagésima",
        60: "Sexagésima", 70: "Septuagésima", 80: "Octogésima", 90: "Nonagésima"
    }
    
    unidades_ordinal = {
        1: "Primera", 2: "Segunda", 3: "Tercera", 4: "Cuarta", 5: "Quinta",
        6: "Sexta", 7: "Séptima", 8: "Octava", 9: "Novena"
    }
    
    if 20 <= numero < 100:
        decena = (numero // 10) * 10
        unidad = numero % 10
        
        if unidad == 0:
            return decenas[decena]
        else:
            return f"{decenas[decena].replace('a', 'o')} {unidades_ordinal[unidad]}"
    
    # Para números mayores a 99, usar formato "Notaría No. X"
    return f"Notaría No. {numero}"


def formatear_fecha_notarial(fecha_str):
    """
    Convierte fecha ISO (YYYY-MM-DD) a formato notarial
    Ejemplo: 2026-01-28 -> 'veinte y ocho de enero del año dos mil veinte y seis'
    """
    from datetime import datetime

    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]

    fecha = datetime.strptime(fecha_str, "%Y-%m-%d")
    dia = dia_mes_letras(fecha.day)
    mes = meses[fecha.month - 1]
    anio = numero_a_letras(fecha.year)

    return f"{dia} de {mes} del año {anio}"


def calcular_edad(fecha_nacimiento_str):
    """
    Calcula la edad a partir de fecha de nacimiento (formato YYYY-MM-DD)
    
    Args:
        fecha_nacimiento_str: Fecha en formato ISO (YYYY-MM-DD)
    
    Returns:
        int: Edad en años
    """
    if not fecha_nacimiento_str:
        return 0
    
    from datetime import datetime
    try:
        fecha_nacimiento = datetime.strptime(fecha_nacimiento_str, '%Y-%m-%d')
        hoy = datetime.now()
        edad = hoy.year - fecha_nacimiento.year
        # Ajustar si aún no ha cumplido años este año
        if (hoy.month, hoy.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
            edad -= 1
        return edad
    except Exception as e:
        print(f"⚠️ Error calculando edad de '{fecha_nacimiento_str}': {e}")
        return 0


def convertir_numero_casa(numero_str):
    """
    Convierte número de casa/predio a palabras con el número entre paréntesis.
    Ej: 'E13-51' → 'E trece guión cincuenta y uno (E13-51)'
        'A 202'  → 'A doscientos dos (A 202)'
        '333A'   → 'trescientos treinta y tres A (333A)'
        '2b'     → 'dos b (2b)'
        '4'      → 'cuatro (4)'
    Siempre devuelve letras en MAYÚSCULAS.
    """
    if not numero_str:
        return ''
    s = str(numero_str).strip()
    s_upper = s.upper()  # siempre mayúsculas en el texto
    if s_upper.replace(' ', '') in ('S/N', 'SN', 'S-N'):
        return 'sin número'

    # Patrón: letra(s) + número + guión + número (ej: E13-51, Oe4-23)
    match_guion = re.match(r'^([A-Za-z]+)(\d+)-(\d+)$', s)
    if match_guion:
        letras = match_guion.group(1).upper()
        n1 = int(match_guion.group(2))
        n2 = int(match_guion.group(3))
        palabras = f"{letras} {numero_a_letras(n1)} guión {numero_a_letras(n2)}"
        return f"{palabras} ({s_upper})"

    # Patrón: letra(s) + espacio + número (ej: A 202, B 15)
    match_letra_espacio = re.match(r'^([A-Za-z]+)\s+(\d+)$', s)
    if match_letra_espacio:
        letras = match_letra_espacio.group(1).upper()
        n = int(match_letra_espacio.group(2))
        palabras = f"{letras} {numero_a_letras(n)}"
        return f"{palabras} ({s_upper})"

    # Patrón: número + letra(s) (ej: 333A, 2b)
    match_num_letra = re.match(r'^(\d+)([A-Za-z]+)$', s)
    if match_num_letra:
        n = int(match_num_letra.group(1))
        letras = match_num_letra.group(2).upper()
        palabras = f"{numero_a_letras(n)} {letras}"
        return f"{palabras} ({s_upper})"

    # Patrón: solo número (ej: 4, 99)
    if s.isdigit():
        return f"{numero_a_letras(int(s))} ({s})"

    # Patrón: lista de números separados por "y"/"," (ej: '1 y 2', '1, 2 y 3')
    # Cada número recibe su propio paréntesis, preservando el separador tal
    # como lo escribió el usuario (incluida su capitalización, ej. "Y").
    if re.match(r'^\d+([\s,]+[yY]\s+\d+|[\s,]+\d+)*$', s):
        return re.sub(r'\d+', lambda m: f"{numero_a_letras(int(m.group(0)))} ({m.group(0)})", s)

    # Cualquier otra combinación (OE4-23A, N52-15 Y 2, ...): letra por letra y
    # número por número
    return codigo_a_letras(s)


def nivel_a_palabras(nivel_str):
    """
    Convierte notación de nivel arquitectónico a palabras notariales.
    Ej: 'n+3.00'  → 'N más tres punto cero cero (n+3.00)'
        'n-1.12'  → 'N menos uno punto uno dos (n-1.12)'
        'n+20,03' → 'N más veinte coma cero tres (n+20,03)'
        'PB'      → 'PB'
    """
    if not nivel_str:
        return ''
    nivel = str(nivel_str).strip()

    match = re.match(r'^([nN])([+\-])(\d+(?:[.,]\d+)?)$', nivel)
    if not match:
        return nivel

    letra = 'N'  # siempre mayúscula
    signo = 'más' if match.group(2) == '+' else 'menos'
    numero_raw = match.group(3)

    # Detectar si usa punto o coma como separador decimal
    if ',' in numero_raw:
        separador_palabra = 'coma'
        partes = numero_raw.split(',')
    elif '.' in numero_raw:
        separador_palabra = 'punto'
        partes = numero_raw.split('.')
    else:
        separador_palabra = None
        partes = [numero_raw]

    try:
        parte_entera = int(partes[0])
        palabras_entero = numero_a_letras(parte_entera)

        if separador_palabra and len(partes) > 1 and partes[1]:
            # Convertir cada dígito decimal individualmente para preservar ceros iniciales
            digitos_dec = ' '.join([numero_a_letras(int(d)) for d in partes[1]])
            palabras_num = f"{palabras_entero} {separador_palabra} {digitos_dec}"
        else:
            palabras_num = palabras_entero

        return f"{letra} {signo} {palabras_num} ({nivel})"
    except (ValueError, TypeError):
        return nivel


VARIANTES_TITULO_NOTARIAL = {
    'doctor': 'doctor', 'doctora': 'doctor', 'dr': 'doctor', 'dra': 'doctor',
    'abogado': 'abogado', 'abogada': 'abogado', 'ab': 'abogado', 'abg': 'abogado',
    'ingeniero': 'ingeniero', 'ingeniera': 'ingeniero', 'ing': 'ingeniero',
    'licenciado': 'licenciado', 'licenciada': 'licenciado', 'lcdo': 'licenciado', 'lcda': 'licenciado',
    'arquitecto': 'arquitecto', 'arquitecta': 'arquitecto', 'arq': 'arquitecto',
}

TITULOS_NOTARIALES_GENERO = {
    'doctor': {'masculino': 'doctor', 'femenino': 'doctora'},
    'abogado': {'masculino': 'abogado', 'femenino': 'abogada'},
    'ingeniero': {'masculino': 'ingeniero', 'femenino': 'ingeniera'},
    'licenciado': {'masculino': 'licenciado', 'femenino': 'licenciada'},
    'arquitecto': {'masculino': 'arquitecto', 'femenino': 'arquitecta'},
}

# Lista de todos los títulos que existen (para retrocompatibilidad con limpiar_nombre_notario)
TITULOS_NOTARIALES = [
    'doctora', 'doctor', 'dra.', 'dr.', 'dra', 'dr',
    'abogada', 'abogado', 'abg.', 'abg', 'ab.', 'ab',
    'licenciada', 'licenciado', 'lcda.', 'lcdo.', 'lcda', 'lcdo',
    'ingeniera', 'ingeniero', 'ing.', 'ing',
    'arquitecta', 'arquitecto', 'arq.', 'arq',
]


def separar_titulo_nombre(nombre):
    """
    Separa el título/tratamiento (si el usuario lo escribió) del nombre.
    Retorna (titulo_base, nombre_limpio) donde titulo_base es una clave de
    TITULOS_NOTARIALES_GENERO ('doctor', 'abogado', etc.) o None si no
    escribió ningún título — en ese caso no se debe agregar tratamiento alguno.
    Ej: 'Doctora Miriam Herrera' -> ('doctor', 'MIRIAM HERRERA')
        'Abogado Juan Pérez'    -> ('abogado', 'JUAN PÉREZ')
        'Miriam Herrera'        -> (None, 'MIRIAM HERRERA')
    """
    if not nombre:
        return None, ''
    nombre = nombre.strip()
    partes = nombre.split(' ', 1)
    if len(partes) == 2:
        primera_palabra = partes[0].lower().rstrip('.')
        if primera_palabra in VARIANTES_TITULO_NOTARIAL:
            titulo_base = VARIANTES_TITULO_NOTARIAL[primera_palabra]
            return titulo_base, partes[1].strip().upper()
    return None, nombre.strip().upper()


def limpiar_nombre_notario(nombre):
    """
    Quita un título/tratamiento inicial (Doctor, Doctora, Dr., Ab., etc.) si el
    usuario lo escribió junto al nombre, y devuelve el nombre en MAYÚSCULAS.
    Ej: 'Doctora Miriam Herrera' -> 'MIRIAM HERRERA'
        'Dr. Juan Pérez'         -> 'JUAN PÉREZ'
        'Miriam Herrera'         -> 'MIRIAM HERRERA'
    """
    _, nombre_limpio = separar_titulo_nombre(nombre)
    return nombre_limpio


def formatear_dinero(monto):
    """
    Convierte monto a formato notarial completo.
    Ej: 50000 → 'CINCUENTA MIL DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA ($50.000,00 USD)'
    """
    if not monto and monto != 0:
        return ''
    try:
        num = float(str(monto))
        palabras = numero_a_letras(num).upper()
        num_fmt = f"{num:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        return f"{palabras} DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA (${num_fmt} USD)"
    except (ValueError, TypeError):
        return str(monto)

# ---------------------------------------------------------------------------
# Números dentro de códigos y textos (acción de personal, matrícula, cuentas,
# calles): en las escrituras todo número se escribe en letras.
# ---------------------------------------------------------------------------

def numero_casa_en_direccion(numero_str) -> str:
    """'E13-51' -> 'número E trece guión ... (E13-51)'; 'S/N' -> 'sin número'."""
    texto = convertir_numero_casa(numero_str)
    return texto if texto == 'sin número' else f"número {texto}"


def _grupo_digitos_a_letras(digitos: str) -> str:
    """'0457' -> 'cero cuatrocientos cincuenta y siete' (los ceros a la izquierda se leen)."""
    sin_ceros = digitos.lstrip('0')
    ceros = len(digitos) - len(sin_ceros)
    partes = ['cero'] * ceros
    if sin_ceros:
        partes.append(numero_a_letras(int(sin_ceros)))
    return ' '.join(partes)


_SIGNOS = {'-': 'guión', '/': 'barra', '.': 'punto'}


def codigo_a_letras(codigo) -> str:
    """
    Código con letras y números, en letras y con el original entre paréntesis.
    Ej: 'AP-2026-0457' -> 'AP guión dos mil veintiséis guión cero cuatrocientos
        cincuenta y siete (AP-2026-0457)'
        '17-2010-123'  -> 'diecisiete guión dos mil diez guión ciento veintitrés (17-2010-123)'
    Si no tiene números se devuelve tal cual.
    """
    if codigo is None:
        return ''
    s = str(codigo).strip()
    if not s or not re.search(r'\d', s):
        return s
    palabras = []
    for tok in re.findall(r'\d+|[^\W\d_]+|[-/.]|\S', s):
        if tok.isdigit():
            palabras.append(_grupo_digitos_a_letras(tok))
        elif tok in _SIGNOS:
            palabras.append(_SIGNOS[tok])
        elif tok.isalpha():
            palabras.append(tok.upper())
        else:
            palabras.append(tok)
    return f"{' '.join(palabras)} ({s.upper()})"


def cuenta_a_letras(numero) -> str:
    """Número de cuenta, dígito por dígito como la cédula: 'cero dos uno ... (021...)'."""
    if numero is None:
        return ''
    s = str(numero).strip()
    if not s or not re.search(r'\d', s):
        return s
    if re.fullmatch(r'[\d\s-]+', s):
        solo_digitos = re.sub(r'\D', '', s)
        return f"{numero_a_digitos(solo_digitos)} ({s})"
    return codigo_a_letras(s)


def numeros_en_texto_a_letras(texto) -> str:
    """
    Convierte a letras los números sueltos de un texto libre (nombres de calles,
    sector, referencia). No toca lo que está entre paréntesis, que ya es el
    original de algo convertido.
    Ej: 'Av. 10 de Agosto' -> 'Av. diez de Agosto'; 'calle N52' -> 'calle N cincuenta y dos'
    """
    if not texto:
        return texto or ''
    partes = re.split(r'(\([^)]*\))', str(texto))
    for i, parte in enumerate(partes):
        if parte.startswith('('):
            continue
        parte = re.sub(r'(?<=[^\W\d_])(?=\d)', ' ', parte)
        parte = re.sub(r'(?<=\d)(?=[^\W\d_])', ' ', parte)
        partes[i] = re.sub(r'\d+', lambda m: _grupo_digitos_a_letras(m.group(0)), parte)
    return ''.join(partes)