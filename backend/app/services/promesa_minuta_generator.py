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
    cuenta_a_letras,
    numeros_en_texto_a_letras,
)
# Reutilizar funciones del generador de compraventa
from .minuta_generator import (
    TEMPLATES_DIR,
    OUTPUTS_DIR,
    procesar_empresa_data,
    procesar_persona_data,
    agrupar_por_conyuges,
    procesar_linderos,
    procesar_aclaratorias_historia,
    procesar_aclaratorias_declaratoria,
    limpiar_html,
)
import re
from datetime import datetime
import uuid


# ============================================
# PLAZO — conversión a texto
# ============================================

def procesar_plazo(plazo_data: dict) -> dict:
    """
    Procesa los datos del plazo para la plantilla.
    Soporta el esquema nuevo del frontend:
    {
        esFechaFija: True/False,
        fechaFija: '2026-04-05',
        anios: '1', meses: '2', dias: '15',
        conProrroga: True/False,
        fechaProrroga: '2026-06-30',
    }
    """
    es_fecha_fija = plazo_data.get('esFechaFija', True)
    con_prorroga = plazo_data.get('conProrroga', False)

    # Texto del plazo principal
    if es_fecha_fija:
        fecha_str = plazo_data.get('fechaFija', '')
        fecha_fija_texto = formatear_fecha_notarial(fecha_str) if fecha_str else ''
        duracion_texto = ''
    else:
        anios = str(plazo_data.get('anios', '') or '').strip()
        meses = str(plazo_data.get('meses', '') or '').strip()
        dias  = str(plazo_data.get('dias',  '') or '').strip()

        partes = []
        if anios and anios != '0':
            n = int(anios)
            palabra = numero_a_letras(n).upper()
            partes.append(f"{palabra} ({n}) {'año' if n == 1 else 'años'}")
        if meses and meses != '0':
            n = int(meses)
            palabra = numero_a_letras(n).upper()
            partes.append(f"{palabra} ({n}) {'mes' if n == 1 else 'meses'}")
        if dias and dias != '0':
            n = int(dias)
            palabra = numero_a_letras(n).upper()
            partes.append(f"{palabra} ({n}) {'día' if n == 1 else 'días'}")

        duracion_texto = ' con '.join(partes) if partes else ''
        fecha_fija_texto = ''

    # Prórroga
    fecha_prorroga_texto = ''
    if con_prorroga:
        fecha_prorroga_str = plazo_data.get('fechaProrroga', '')
        fecha_prorroga_texto = formatear_fecha_notarial(fecha_prorroga_str) if fecha_prorroga_str else ''

    return {
        'es_fecha_fija': es_fecha_fija,
        'fecha_fija_texto': fecha_fija_texto,
        'duracion_texto': duracion_texto,
        'con_prorroga': con_prorroga,
        'fecha_prorroga_texto': fecha_prorroga_texto,
    }


# ============================================
# CLÁUSULA PENAL
# ============================================

def procesar_clausula_penal(penal_data: dict, precio_total) -> dict:
    """
    Procesa la cláusula penal.

    penal_data esperado:
    {
        tipoPenal: 'monto_fijo' | 'porcentaje',
        montoFijo: 10000,
        porcentaje: 10,
    }
    """
    tipo = penal_data.get('tipoPenal', 'monto_fijo')

    if tipo == 'porcentaje':
        porcentaje = float(penal_data.get('porcentaje', 0))
        try:
            precio = float(precio_total) if precio_total else 0
        except (ValueError, TypeError):
            precio = 0
        monto_calculado = round(precio * porcentaje / 100, 2)

        porcentaje_fmt = f"{porcentaje:g}"
        porcentaje_palabras = f"{numero_a_letras(porcentaje)} ({porcentaje_fmt}%)"

        return {
            'es_porcentaje': True,
            'porcentaje': porcentaje,
            'porcentaje_palabras': porcentaje_palabras,
            'monto': monto_calculado,
            'monto_palabras': formatear_dinero(monto_calculado),
            'monto_numerico': f"{monto_calculado:,.2f}",
        }
    else:
        monto = float(penal_data.get('montoFijo', 0))
        return {
            'es_porcentaje': False,
            'monto': monto,
            'monto_palabras': formatear_dinero(monto),
            'monto_numerico': f"{monto:,.2f}",
        }


# ============================================
# GENERADOR PRINCIPAL
# ============================================

def generate_promesa_minuta(data: dict, template_path: str) -> BytesIO:
    """
    Genera una minuta de promesa de compraventa en formato .docx.

    Args:
        data: Diccionario con todos los datos del formulario
        template_path: Ruta al archivo de plantilla .docx

    Returns:
        BytesIO con el documento generado
    """
    doc = DocxTemplate(template_path)
    context = {}

    # ============================================
    # COMPARECIENTES — reutiliza lógica de compraventa
    # ============================================
    vendedores = data.get('vendedores', [])
    compradores = data.get('compradores', [])

    def separar_personas_empresas(lista):
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
    tipo_propiedad = data.get('tipoPropiedad', '')
    context['es_horizontal'] = tipo_propiedad == 'horizontal'
    context['es_sin_ph'] = tipo_propiedad == 'sin_ph'  # En construcción
    context['es_comun'] = tipo_propiedad == 'comun'
    context['nombre_conjunto'] = data.get('nombreConjunto', '')

    # ============================================
    # PREDIOS (solo horizontal con PH)
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
                        n = float(val)
                        return f"{numero_a_letras(n)} ({n:.2f})"
                    except: return str(val)

                def fmt_alicuota(val):
                    if not val: return ''
                    try:
                        val_str = str(val).strip()
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

                inmueble_data = {
                    'tipo': inmueble.get('tipo', ''),
                    'tipo_otro': inmueble.get('tipoOtro', ''),
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

            def fmt_alicuota_total(val):
                if not val: return ''
                try:
                    n = float(str(val))
                    val_fmt = f"{n:.10f}".rstrip('0').rstrip('.')
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
                'inmuebles': inmuebles_procesados,
                'alicuota_total': alicuota_total,
                'alicuota_total_palabras': fmt_alicuota_total(alicuota_total),
            }
            predios_procesados.append(predio_data)

        context['predios'] = predios_procesados

    # ============================================
    # SIN PH — inmueble en construcción
    # ============================================
    if context['es_sin_ph']:
        sin_ph = data.get('sinPh', {})
        context['sin_ph'] = {
            'numero_lote': sin_ph.get('numeroLote', ''),
            'direccion': sin_ph.get('direccion', ''),
            'parroquia': sin_ph.get('parroquia', ''),
            'canton': sin_ph.get('canton', ''),
            'provincia': sin_ph.get('provincia', ''),
            'nombre_proyecto': sin_ph.get('nombreProyecto', ''),
            'descripcion_inmueble': sin_ph.get('descripcionInmueble', ''),
            'areas_aproximadas': sin_ph.get('areasAproximadas', ''),
        }

    # ============================================
    # UBICACIÓN
    # ============================================
    ubicacion = data.get('ubicacion', {})
    num_ubicacion = ubicacion.get('numero', '')
    context['ubicacion'] = {
        'lote': ubicacion.get('lote', ''),
        'numero': num_ubicacion,
        'numero_palabras': convertir_numero_casa(str(num_ubicacion)) if num_ubicacion else '',
        'parroquia': ubicacion.get('parroquia', ''),
        'canton': ubicacion.get('canton', ''),
        'provincia': ubicacion.get('provincia', ''),
    }

    # ============================================
    # HISTORIA DE DOMINIO
    # ============================================
    historia_manual_text = data.get('historiaManual', '')
    if historia_manual_text and historia_manual_text.strip():
        context['historia_manual'] = True
        context['historia_texto'] = limpiar_html(historia_manual_text)
    else:
        context['historia_manual'] = False
        historia = data.get('historiaFormulario', {})

        context['historia'] = {
            'titulo': historia.get('titulo', ''),
            'titulo_otro': historia.get('tituloOtro', ''),
            'tipo_sucesion': historia.get('tipoSucesion', ''),
            'adquirido_de': historia.get('adquiridoDe', ''),
            'fecha_otorgamiento': formatear_fecha_notarial(historia.get('fechaOtorgamiento', '')) if historia.get('fechaOtorgamiento') else '',
            'numero_notaria': historia.get('numeroNotaria', ''),
            'numero_notaria_palabras': numero_a_ordinal_notaria(historia.get('numeroNotaria', '')) if historia.get('numeroNotaria') else '',
            'canton_notaria': historia.get('cantonNotaria', ''),
            'notario': historia.get('notario', ''),
            'fecha_inscripcion': formatear_fecha_notarial(historia.get('fechaInscripcion', '')) if historia.get('fechaInscripcion') else '',
            'canton_inscripcion': historia.get('cantonInscripcion', ''),
            'mismo_canton': historia.get('cantonNotaria', '').lower() == historia.get('cantonInscripcion', '').lower() if historia.get('cantonNotaria') and historia.get('cantonInscripcion') else False,
            'es_sucesion': historia.get('titulo') == 'sucesion',
            'nombre_causante': historia.get('nombreCausante', ''),
            'causante_adquirido_de': historia.get('causanteAdquiridoDe', ''),
            'causante_titulo': historia.get('causanteTitulo', ''),
            'causante_titulo_otro': historia.get('causanteTituloOtro', ''),
            'causante_fecha_otorgamiento': formatear_fecha_notarial(historia.get('causanteFechaOtorgamiento', '')) if historia.get('causanteFechaOtorgamiento') else '',
            'causante_numero_notaria': historia.get('causanteNumeroNotaria', ''),
            'causante_numero_notaria_palabras': numero_a_ordinal_notaria(historia.get('causanteNumeroNotaria', '')) if historia.get('causanteNumeroNotaria') else '',
            'causante_canton_notaria': historia.get('causanteCantonNotaria', ''),
            'causante_notario': historia.get('causanteNotario', ''),
            'causante_fecha_inscripcion': formatear_fecha_notarial(historia.get('causanteFechaInscripcion', '')) if historia.get('causanteFechaInscripcion') else '',
            'causante_canton_inscripcion': historia.get('causanteCantonInscripcion', ''),
            'causante_mismo_canton': historia.get('causanteCantonNotaria', '').lower() == historia.get('causanteCantonInscripcion', '').lower() if historia.get('causanteCantonNotaria') and historia.get('causanteCantonInscripcion') else False,
        }
        context['historia']['aclaratorias'] = procesar_aclaratorias_historia(historia.get('aclaratorias', []))

    # ============================================
    # DECLARATORIA (solo horizontal)
    # hayDeclaratoria: True = tiene PH, False = sin PH, None = no seleccionado
    # ============================================
    if context['es_horizontal']:
        hay_declaratoria = data.get('hayDeclaratoria')
        context['hay_declaratoria'] = bool(hay_declaratoria)

        if hay_declaratoria:
            declaratoria_manual_flag = bool(data.get('declaratoriaManual'))
            context['declaratoria_manual'] = declaratoria_manual_flag

            if declaratoria_manual_flag:
                context['declaratoria_texto'] = limpiar_html(data.get('declaratoriaManual', ''))
            else:
                declaratoria = data.get('declaratoriaFormulario') or {}
                context['declaratoria'] = {
                    'fecha_otorgamiento': formatear_fecha_notarial(declaratoria.get('fechaOtorgamiento', '')) if declaratoria.get('fechaOtorgamiento') else '',
                    'numero_notaria': numero_a_ordinal_notaria(declaratoria.get('numeroNotaria', '')) if declaratoria.get('numeroNotaria') else '',
                    'canton_notaria': declaratoria.get('cantonNotaria', ''),
                    'notario': declaratoria.get('notario', ''),
                    'fecha_inscripcion': formatear_fecha_notarial(declaratoria.get('fechaInscripcion', '')) if declaratoria.get('fechaInscripcion') else '',
                    'canton_inscripcion': declaratoria.get('cantonInscripcion', ''),
                    'mismo_canton': declaratoria.get('cantonNotaria', '').lower() == declaratoria.get('cantonInscripcion', '').lower() if declaratoria.get('cantonNotaria') and declaratoria.get('cantonInscripcion') else False,
                    'aclaratorias': procesar_aclaratorias_declaratoria(declaratoria.get('aclaratorias', [])),
                }
        else:
            context['declaratoria_manual'] = False
            context['declaratoria'] = {}

    # ============================================
    # LINDEROS GENERALES
    # ============================================
    linderos_generales = data.get('linderosGenerales', {})
    context['linderos'] = procesar_linderos(linderos_generales, incluir_arriba_abajo=False)

    # ============================================
    # LINDEROS ESPECÍFICOS
    # ============================================
    context['tiene_linderos_especificos'] = False
    if context['es_horizontal'] and data.get('tieneLInderosEspecificos'):
        context['tiene_linderos_especificos'] = True
        linderos_especificos = data.get('linderosEspecificos', {})
        context['linderos_especificos'] = procesar_linderos(linderos_especificos, incluir_arriba_abajo=True)

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
            precio_total_str = formatear_dinero(precio_num)
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

            parte_data = {
                'letra': parte.get('letra', ''),
                'monto': monto,
                'monto_palabras': formatear_dinero(float(monto)) if monto else '',
                'es_cuotas': parte.get('tipoPago') == 'cuotas',
                'medio_pago': parte.get('medioPago', ''),
                'tipo_cheque': parte.get('tipoCheque', ''),
                'momento_pago': parte.get('momentoPago', ''),
                'momento_otro': parte.get('momentoOtro', ''),
                'es_credito': parte.get('esCreditoBancario', False),
                'nombre_banco': parte.get('nombreBanco', ''),
                'cuenta_destino': numeros_en_texto_a_letras(parte.get('cuentaDestino', '')),
            }

            if parte_data['es_cuotas']:
                numero_cuotas = parte.get('numeroCuotas', 0)
                valor_cuota = parte.get('valorCuota', 0)
                periodicidad = parte.get('periodicidad', '')

                parte_data['numero_cuotas'] = numero_cuotas
                parte_data['numero_cuotas_palabras'] = f"{numero_a_letras(int(numero_cuotas))} ({numero_cuotas})" if numero_cuotas else ''
                parte_data['valor_cuota'] = valor_cuota
                parte_data['valor_cuota_palabras'] = formatear_dinero(float(valor_cuota)) if valor_cuota else ''
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
    # PLAZO (QUINTA) — exclusivo de promesa
    # ============================================
    plazo_data = data.get('plazo', {})
    context['plazo'] = procesar_plazo(plazo_data)

    # ============================================
    # CLÁUSULA PENAL (SÉPTIMA) — exclusivo de promesa
    # ============================================
    penal_data = data.get('clausulaPenal', {})
    precio_total_raw = data.get('precioTotal', 0)
    context['clausula_penal'] = procesar_clausula_penal(penal_data, precio_total_raw)

    # ============================================
    # CONDICIÓN RESOLUTORIA (OCTAVA) — exclusivo de promesa
    # ============================================
    hay_condicion_resolutoria = data.get('hayCondicionResolutoria', False)
    context['hay_condicion_resolutoria'] = hay_condicion_resolutoria
    context['con_prorroga'] = context['plazo'].get('con_prorroga', False)

    # ============================================
    # PROPIEDAD INTELECTUAL (DÉCIMA SEGUNDA)
    # Solo aparece si hay condición resolutoria
    # ============================================
    if hay_condicion_resolutoria:
        prop_intelectual = data.get('propiedadIntelectual', {})
        nombre_abogado_pi = prop_intelectual.get('nombreAbogado', '')
        genero_abogado_pi = prop_intelectual.get('generoAbogado', 'femenino')
        articulo_pi = 'la abogada' if genero_abogado_pi == 'femenino' else 'el abogado'

        context['propiedad_intelectual'] = {
            'nombre_abogado': nombre_abogado_pi.upper(),
            'articulo': articulo_pi,
        }

    # ============================================
    # ABOGADO PATROCINADOR
    # ============================================
    abogado = data.get('abogado', {})
    context['abogado'] = {
        'nombre': abogado.get('nombre', ''),
        'es_mujer': abogado.get('generoAbogado', '') == 'femenino',
        'numero_matricula': abogado.get('numeroMatricula', ''),
        'tipo_matricula': abogado.get('tipoMatricula', 'cj'),
        'provincia': abogado.get('provincia', ''),
    }

    # ============================================
    # RENDERIZAR DOCUMENTO
    # ============================================
    doc.render(context)

    file_stream = BytesIO()
    doc.save(file_stream)
    file_stream.seek(0)

    return file_stream



def generate_promesa_minuta_compraventa(data: dict, current_user=None) -> str:
    """
    Genera minuta de promesa de compraventa, guarda en disco y retorna path.
    """
    template_path = TEMPLATES_DIR / "minuta_promesa_compraventa.docx"

    if not template_path.exists():
        raise FileNotFoundError(f"Plantilla no encontrada en: {template_path}")

    file_stream = generate_promesa_minuta(data, str(template_path))

    user_id = current_user.id if current_user else "unknown"
    filename = f"minuta_promesa_{user_id}_{uuid.uuid4().hex[:8]}.docx"
    output_path = OUTPUTS_DIR / filename

    with open(str(output_path), "wb") as f:
        f.write(file_stream.read())

    return str(output_path)