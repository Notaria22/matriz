from docxtpl import RichText
import re
from bs4 import BeautifulSoup

def html_to_richtext(html_content):
    """
    Convierte HTML a RichText de docxtpl preservando formato
    """
    print("=" * 50)
    print("DEBUG html_to_richtext - Contenido recibido:")
    print(html_content[:500] if html_content else "VACIO")
    print("=" * 50)
    
    if not html_content or html_content.strip() == '':
        print("DEBUG: Contenido vacío, retornando RichText vacío")
        return RichText()
    
    try:
        # Limpiar HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        rt = RichText()
        
        print("DEBUG: BeautifulSoup parseó el HTML correctamente")
        print("DEBUG: Texto extraído:", soup.get_text()[:200])
        
        # Procesar el contenido del HTML
        process_element(soup, rt)
        
        print("DEBUG: RichText procesado exitosamente")
        return rt
    except Exception as e:
        print(f"ERROR en html_to_richtext: {e}")
        import traceback
        traceback.print_exc()
        # Fallback: retornar texto plano
        soup = BeautifulSoup(html_content, 'html.parser')
        rt = RichText()
        rt.add(soup.get_text())
        return rt

def process_element(element, rt, bold=False, italic=False, underline=False):
    """
    Procesa recursivamente elementos HTML y los agrega a RichText
    """
    for child in element.children:
        if isinstance(child, str):
            # Es texto directo
            text = child
            if text.strip():
                print(f"DEBUG: Agregando texto: '{text[:50]}...' (bold={bold}, italic={italic})")
                rt.add(text, bold=bold, italic=italic, underline=underline)
        else:
            # Es un tag HTML
            tag_name = child.name.lower() if child.name else ''
            
            # Determinar formato según el tag
            is_bold = bold or tag_name in ['b', 'strong']
            is_italic = italic or tag_name in ['i', 'em']
            is_underline = underline or tag_name in ['u']
            
            if tag_name == 'br':
                rt.add('\n')
            elif tag_name in ['p', 'div']:
                # Procesar contenido del párrafo
                process_element(child, rt, is_bold, is_italic, is_underline)
                rt.add('\n')
            elif tag_name in ['ul', 'ol']:
                # Listas
                process_element(child, rt, is_bold, is_italic, is_underline)
            elif tag_name == 'li':
                rt.add('• ', bold=is_bold, italic=is_italic, underline=is_underline)
                process_element(child, rt, is_bold, is_italic, is_underline)
                rt.add('\n')
            else:
                # Procesar cualquier otro elemento recursivamente
                process_element(child, rt, is_bold, is_italic, is_underline)

BLOQUES = {'p', 'div', 'br', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'table'}


def html_a_richtext_en_linea(html_content):
    """
    Igual que html_to_richtext, pero todo de corrido: los párrafos, saltos y
    viñetas se vuelven un espacio. Conserva negritas, cursivas y subrayados.
    """
    rt = RichText()
    if not html_content or not html_content.strip():
        return rt

    trozos = []  # (texto, negrita, cursiva, subrayado)

    def recorrer(elemento, bold=False, italic=False, underline=False):
        for hijo in elemento.children:
            if isinstance(hijo, str):
                trozos.append((str(hijo), bold, italic, underline))
                continue
            nombre = (hijo.name or '').lower()
            if nombre in BLOQUES:
                trozos.append((' ', False, False, False))
            recorrer(
                hijo,
                bold or nombre in ('b', 'strong'),
                italic or nombre in ('i', 'em'),
                underline or nombre == 'u',
            )
            if nombre in BLOQUES:
                trozos.append((' ', False, False, False))

    recorrer(BeautifulSoup(html_content, 'html.parser'))

    anterior_espacio = True  # evita espacios al inicio
    pendientes = []
    for texto, b, i, u in trozos:
        texto = re.sub(r'\s+', ' ', texto.replace(' ', ' '))
        if anterior_espacio:
            texto = texto.lstrip(' ')
        if not texto:
            continue
        anterior_espacio = texto.endswith(' ')
        pendientes.append([texto, b, i, u])

    if pendientes:
        pendientes[-1][0] = pendientes[-1][0].rstrip(' ')
    for texto, b, i, u in pendientes:
        if texto:
            rt.add(texto, bold=b, italic=i, underline=u)
    return rt