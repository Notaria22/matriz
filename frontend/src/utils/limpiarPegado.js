/**
 * Limpia el texto pegado en el editor de la minuta (desde Word, PDF o web):
 * conserva párrafos, negritas, cursivas y subrayados; quita estilos, márgenes,
 * líneas vacías y espacios de sobra, y vuelve a unir las líneas cortadas a la
 * mitad de una oración.
 */

const BLOQUES = new Set([
  "P",
  "DIV",
  "LI",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "TR",
  "BLOCKQUOTE",
]);
const IGNORAR = new Set(["STYLE", "SCRIPT", "META", "LINK", "TITLE", "XML"]);

const escapar = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Una línea nueva empieza párrafo si la anterior cerró la oración o si arranca
// como cláusula, numeral o viñeta.
const terminaOracion = (linea) => /[.:;!?]["»”)]*$/.test(linea);
const empiezaBloque = (linea) =>
  /^(\d+(\.\d+)*[.)-]|[a-zA-Z][.)]\s|[-•·*]\s|[A-ZÁÉÍÓÚÑ]{4,}\b)/.test(linea);

export const unirLineas = (texto) => {
  const parrafos = [];
  let actual = "";
  for (const cruda of texto.replace(/\r/g, "").split("\n")) {
    const linea = cruda.replace(/\s+/g, " ").trim();
    if (!linea) {
      if (actual) parrafos.push(actual);
      actual = "";
      continue;
    }
    if (actual && (terminaOracion(actual) || empiezaBloque(linea))) {
      parrafos.push(actual);
      actual = linea;
    } else {
      actual = actual ? `${actual} ${linea}` : linea;
    }
  }
  if (actual) parrafos.push(actual);
  return parrafos;
};

const formatoDe = (el, padre) => {
  const estilo = el.style || {};
  const peso = estilo.fontWeight || "";
  return {
    b:
      padre.b ||
      ["B", "STRONG"].includes(el.tagName) ||
      peso === "bold" ||
      Number(peso) >= 600,
    i:
      padre.i ||
      ["I", "EM"].includes(el.tagName) ||
      estilo.fontStyle === "italic",
    u:
      padre.u ||
      el.tagName === "U" ||
      (estilo.textDecoration || estilo.textDecorationLine || "").includes(
        "underline",
      ),
  };
};

const envolver = (texto, f) => {
  let html = escapar(texto);
  if (f.u) html = `<u>${html}</u>`;
  if (f.i) html = `<i>${html}</i>`;
  if (f.b) html = `<b>${html}</b>`;
  return html;
};

// Recorre el HTML pegado y arma párrafos con trozos de texto y su formato.
const parrafosDeHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const parrafos = [];
  let actual = [];
  const cerrar = () => {
    if (actual.some((t) => t.texto.trim())) parrafos.push(actual);
    actual = [];
  };
  const recorrer = (nodo, f) => {
    for (const hijo of nodo.childNodes) {
      if (hijo.nodeType === Node.TEXT_NODE) {
        actual.push({ texto: hijo.nodeValue, f });
        continue;
      }
      if (hijo.nodeType !== Node.ELEMENT_NODE || IGNORAR.has(hijo.tagName))
        continue;
      if (hijo.tagName === "BR") {
        actual.push({ texto: "\n", f });
        continue;
      }
      const bloque = BLOQUES.has(hijo.tagName);
      if (bloque) cerrar();
      recorrer(hijo, formatoDe(hijo, f));
      if (bloque) cerrar();
    }
  };
  recorrer(doc.body, { b: false, i: false, u: false });
  cerrar();
  return parrafos;
};

// Un párrafo de trozos → HTML de una línea, sin espacios repetidos.
const htmlDeTrozos = (trozos) => {
  let html = "";
  let anteriorEspacio = true;
  for (const { texto, f } of trozos) {
    let t = texto.replace(/\s+/g, " ");
    if (anteriorEspacio) t = t.replace(/^ /, "");
    if (!t) continue;
    anteriorEspacio = t.endsWith(" ");
    html += envolver(t, f);
  }
  return html.replace(/ (<\/[biu]>)*$/, "$1").trim();
};

export const limpiarPegado = (html, texto) => {
  if (html && html.trim()) {
    const parrafos = parrafosDeHtml(html);
    // Un solo bloque con saltos <br> (típico al copiar de un PDF): unir líneas
    const conSaltos = parrafos.flatMap((trozos) => {
      const plano = trozos.map((t) => t.texto).join("");
      const tieneFormato = trozos.some((t) => t.f.b || t.f.i || t.f.u);
      if (plano.includes("\n") && !tieneFormato) {
        return unirLineas(plano).map((p) => [
          { texto: p, f: { b: false, i: false, u: false } },
        ]);
      }
      return [trozos];
    });
    const limpio = conSaltos.map(htmlDeTrozos).filter(Boolean);
    if (limpio.length) return limpio.map((p) => `<p>${p}</p>`).join("");
  }
  return unirLineas(texto || "")
    .map((p) => `<p>${escapar(p)}</p>`)
    .join("");
};
