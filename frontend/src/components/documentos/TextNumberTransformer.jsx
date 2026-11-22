import React, { useState, useRef, useEffect } from "react";
import { limpiarPegado } from "../../utils/limpiarPegado";

// El elemento guardado en estado es un nodo del DOM del editor: se modifica
// directamente (no es estado de React), por eso va en funciones aparte.
const marcarTransformado = (el, valor, original) => {
  el.textContent = valor;
  el.className = "transformed";
  el.dataset.transformedFrom = original;
};

const restaurarOriginal = (el) => {
  el.textContent = el.dataset.transformedFrom;
  el.className = "marked-number";
  delete el.dataset.transformedFrom;
};

const TextNumberTransformer = ({ onChange, initialHtml = "" }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeElement, setActiveElement] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isMarked, setIsMarked] = useState(false);
  const editorRef = useRef(null);

  // Iconos SVG
  const icons = {
    edit: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    check: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20,6 9,17 4,12" />
      </svg>
    ),
    x: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    bold: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      </svg>
    ),
    italic: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="4" x2="10" y2="4" />
        <line x1="14" y1="20" x2="5" y2="20" />
        <line x1="15" y1="4" x2="9" y2="20" />
      </svg>
    ),
    underline: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
        <line x1="4" y1="21" x2="20" y2="21" />
      </svg>
    ),
    list: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    listOrdered: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="10" y1="6" x2="21" y2="6" />
        <line x1="10" y1="12" x2="21" y2="12" />
        <line x1="10" y1="18" x2="21" y2="18" />
        <path d="M4 6h1v4" />
        <path d="M4 10h2" />
        <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
      </svg>
    ),
  };

  // Función para capitalizar primera letra de cada palabra
  const capitalize = (str) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Función para convertir números a palabras
  const numberToWords = (num) => {
    const units = [
      "",
      "uno",
      "dos",
      "tres",
      "cuatro",
      "cinco",
      "seis",
      "siete",
      "ocho",
      "nueve",
    ];
    const teens = [
      "diez",
      "once",
      "doce",
      "trece",
      "catorce",
      "quince",
      "dieciséis",
      "diecisiete",
      "dieciocho",
      "diecinueve",
    ];
    const tens = [
      "",
      "",
      "veinte",
      "treinta",
      "cuarenta",
      "cincuenta",
      "sesenta",
      "setenta",
      "ochenta",
      "noventa",
    ];
    const hundreds = [
      "",
      "ciento",
      "doscientos",
      "trescientos",
      "cuatrocientos",
      "quinientos",
      "seiscientos",
      "setecientos",
      "ochocientos",
      "novecientos",
    ];

    if (num === 0) return "cero";
    if (num === 100) return "cien";
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      if (ten === 2 && unit > 0) {
        return "veinti" + units[unit];
      }
      return tens[ten] + (unit > 0 ? " y " + units[unit] : "");
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return (
        hundreds[hundred] +
        (remainder > 0 ? " " + numberToWords(remainder) : "")
      );
    }
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000);
      const remainder = num % 1000;
      const thousandsWord =
        thousands === 1 ? "mil" : numberToWords(thousands) + " mil";
      return (
        thousandsWord + (remainder > 0 ? " " + numberToWords(remainder) : "")
      );
    }
    return num.toString();
  };

  // Función para convertir números decimales con múltiples opciones
  const decimalToWordsWithOptions = (numStr) => {
    numStr = numStr.replace(",", ".");

    const parts = numStr.split(".");
    const integerPart = parseInt(parts[0]);
    const decimalPart = parts[1];

    const options = [];

    if (decimalPart) {
      let result1 = numberToWords(integerPart) + " punto ";
      result1 += decimalPart
        .split("")
        .map((digit) => numberToWords(parseInt(digit)))
        .join(" ");
      options.push({ type: "digit", value: result1 });

      const decimalAsNumber = parseInt(decimalPart);
      let result2 =
        numberToWords(integerPart) + " punto " + numberToWords(decimalAsNumber);
      options.push({ type: "number", value: result2 });
    } else {
      options.push({ type: "simple", value: numberToWords(integerPart) });
    }

    return options;
  };

  // Diccionario de prefijos/abreviaturas con género (en minúscula)
  const prefixes = {
    "ing.": { m: "ingeniero", f: "ingeniera" },
    ing: { m: "ingeniero", f: "ingeniera" },
    "arq.": { m: "arquitecto", f: "arquitecta" },
    arq: { m: "arquitecto", f: "arquitecta" },
    "dr.": { m: "doctor", f: "doctora" },
    dr: { m: "doctor", f: "doctora" },
    "dra.": { m: "doctor", f: "doctora" },
    dra: { m: "doctor", f: "doctora" },
    "lic.": { m: "licenciado", f: "licenciada" },
    lic: { m: "licenciado", f: "licenciada" },
    "abg.": { m: "abogado", f: "abogada" },
    abg: { m: "abogado", f: "abogada" },
    "econ.": { m: "economista", f: "economista" },
    econ: { m: "economista", f: "economista" },
    "prof.": { m: "profesor", f: "profesora" },
    prof: { m: "profesor", f: "profesora" },
    "sr.": { m: "señor", f: "señora" },
    sr: { m: "señor", f: "señora" },
    "sra.": { m: "señor", f: "señora" },
    sra: { m: "señor", f: "señora" },
    "av.": { m: "avenida", f: "avenida" },
    av: { m: "avenida", f: "avenida" },
    calle: { m: "calle", f: "calle" },
    "mz.": { m: "manzana", f: "manzana" },
    mz: { m: "manzana", f: "manzana" },
    "ci.": { m: "cédula de identidad", f: "cédula de identidad" },
    "no.": { m: "número", f: "número" },
    "nro.": { m: "número", f: "número" },
    ruc: {
      m: "Registro Único de Contribuyentes",
      f: "Registro Único de Contribuyentes",
    },
    "ruc.": {
      m: "Registro Único de Contribuyentes",
      f: "Registro Único de Contribuyentes",
    },
    "r.u.c.": {
      m: "Registro Único de Contribuyentes",
      f: "Registro Único de Contribuyentes",
    },
  };

  // Función para generar opciones de transformación
  const generateOptions = (originalText) => {
    const options = [];
    const text = originalText;

    // PATRÓN 1: Detectar direcciones tipo N24-660 o E13-51
    const addressPattern = /([a-zA-Z])(\d+(?:[.,]\d+)?)([-])(\d+(?:[.,]\d+)?)/i;
    if (addressPattern.test(text)) {
      const match = text.match(addressPattern);
      if (match) {
        const fullMatch = match[0];
        const letter = match[1];
        const num1 = match[2];
        const num2 = match[4];
        const letterUpper = letter.toUpperCase();

        let num1Options = [];
        if (num1.includes(".") || num1.includes(",")) {
          const decOpts = decimalToWordsWithOptions(num1);
          decOpts.forEach((opt) => {
            num1Options.push(opt.value);
          });
        } else {
          num1Options.push(numberToWords(parseInt(num1)));
        }

        let num2Options = [];
        if (num2.includes(".") || num2.includes(",")) {
          const decOpts = decimalToWordsWithOptions(num2);
          decOpts.forEach((opt) => {
            num2Options.push(opt.value);
          });
        } else {
          num2Options.push(numberToWords(parseInt(num2)));
        }

        num1Options.forEach((n1, i) => {
          num2Options.forEach((n2, j) => {
            const result = text.replace(
              addressPattern,
              letterUpper + " " + n1 + " guion " + n2,
            );
            const withParens = text.replace(
              addressPattern,
              letterUpper + " " + n1 + " guion " + n2 + " (" + fullMatch + ")",
            );

            let label = "Como dirección";
            if (i > 0 || j > 0) label += " (variante " + (i + j + 1) + ")";

            options.push({ label: label, value: result });
            options.push({
              label: label + " con paréntesis",
              value: withParens,
            });
          });
        });

        const num1Digits = num1
          .split("")
          .map((char) => {
            if (char === "." || char === ",") return "punto";
            return numberToWords(parseInt(char));
          })
          .join(" ");

        const num2Digits = num2
          .split("")
          .map((char) => {
            if (char === "." || char === ",") return "punto";
            return numberToWords(parseInt(char));
          })
          .join(" ");

        const result2 = text.replace(
          addressPattern,
          letterUpper + " " + num1Digits + " guion " + num2Digits,
        );
        const result2WithParens = text.replace(
          addressPattern,
          letterUpper +
            " " +
            num1Digits +
            " guion " +
            num2Digits +
            " (" +
            fullMatch +
            ")",
        );

        options.push({
          label: "Dirección (dígito por dígito)",
          value: result2,
        });
        options.push({
          label: "Dirección (dígito por dígito) con paréntesis",
          value: result2WithParens,
        });
      }
      return options;
    }

    // PATRÓN 2: Detectar medidas
    const measurePattern =
      /([+-]?\d+(?:[.,]\d+)?)\s*(m²|m2|m³|m3|m|cm|mm|km|kg|g|l|ml|ha)\b/i;
    if (measurePattern.test(text)) {
      const measures = {
        "m²": "metros cuadrados",
        m2: "metros cuadrados",
        "m³": "metros cúbicos",
        m3: "metros cúbicos",
        m: "metros",
        cm: "centímetros",
        mm: "milímetros",
        km: "kilómetros",
        kg: "kilogramos",
        g: "gramos",
        l: "litros",
        ml: "mililitros",
        ha: "hectáreas",
      };

      const match = text.match(measurePattern);
      if (match) {
        const fullMatch = match[0];
        const num = match[1];
        const unit = match[2];
        const cleanNum = num.replace(/[+-]/g, "");
        const isDecimal = cleanNum.includes(".") || cleanNum.includes(",");

        if (isDecimal) {
          const decOpts = decimalToWordsWithOptions(cleanNum);
          decOpts.forEach((opt, idx) => {
            let numWord = opt.value;
            if (num.startsWith("+")) numWord = "más " + numWord;
            if (num.startsWith("-")) numWord = "menos " + numWord;

            const unitWord = measures[unit.toLowerCase()] || unit;
            const label =
              idx === 0
                ? "Como medida (decimales dígito por dígito)"
                : "Como medida (decimales como número)";
            options.push({
              label: label,
              value: numWord + " " + unitWord + " (" + fullMatch + ")",
            });
          });
        } else {
          let numWord = numberToWords(parseInt(cleanNum));
          if (num.startsWith("+")) numWord = "más " + numWord;
          if (num.startsWith("-")) numWord = "menos " + numWord;

          const unitWord = measures[unit.toLowerCase()] || unit;
          options.push({
            label: "Como medida con paréntesis",
            value: numWord + " " + unitWord + " (" + fullMatch + ")",
          });
        }
      }
      return options;
    }

    // PATRÓN 3: Detectar porcentajes
    const percentPattern = /(\d+(?:[.,]\d+)?)\s*%/;
    if (percentPattern.test(text)) {
      const match = text.match(percentPattern);
      if (match) {
        const fullMatch = match[0];
        const num = match[1];
        const isDecimal = num.includes(".") || num.includes(",");

        if (isDecimal) {
          const decOpts = decimalToWordsWithOptions(num);
          decOpts.forEach((opt, idx) => {
            const label =
              idx === 0
                ? "Porcentaje (decimales dígito por dígito)"
                : "Porcentaje (decimales como número)";
            options.push({
              label: label,
              value: opt.value + " por ciento (" + fullMatch + ")",
            });
          });
        } else {
          const numWord = numberToWords(parseInt(num));
          options.push({
            label: "Porcentaje con paréntesis",
            value: numWord + " por ciento (" + fullMatch + ")",
          });
        }
      }
      return options;
    }

    // PATRÓN 4: Números con signos +/-
    const signedNumberPattern = /^([+-])(\d+(?:[.,]\d+)?)$/;
    if (signedNumberPattern.test(text)) {
      const match = text.match(signedNumberPattern);
      if (match) {
        const fullMatch = match[0];
        const sign = match[1];
        const num = match[2];
        const signWord = sign === "+" ? "más" : "menos";
        const isDecimal = num.includes(".") || num.includes(",");

        if (isDecimal) {
          const decOpts = decimalToWordsWithOptions(num);
          decOpts.forEach((opt, idx) => {
            const label =
              idx === 0
                ? "Número con signo (decimales dígito por dígito)"
                : "Número con signo (decimales como número)";
            options.push({
              label: label,
              value: signWord + " " + opt.value + " (" + fullMatch + ")",
            });
          });
        } else {
          const numWord = numberToWords(parseInt(num));
          options.push({
            label: "Número con signo y paréntesis",
            value: signWord + " " + numWord + " (" + fullMatch + ")",
          });
        }

        const digitWords = num
          .split("")
          .map((char) => {
            if (char === "." || char === ",") return "punto";
            return numberToWords(parseInt(char));
          })
          .join(" ");

        options.push({
          label: "Dígito por dígito con paréntesis",
          value: signWord + " " + digitWords + " (" + fullMatch + ")",
        });
      }
      return options;
    }

    // PATRÓN 5: Números simples
    const simpleNumberPattern = /^\d+(?:[.,]\d+)?$/;
    if (simpleNumberPattern.test(text)) {
      const isDecimal = text.includes(".") || text.includes(",");
      const isLongNumber = text.replace(/[.,]/g, "").length >= 10;

      if (isDecimal) {
        const decOpts = decimalToWordsWithOptions(text);
        decOpts.forEach((opt, idx) => {
          const label =
            idx === 0
              ? "Números a palabras (decimales dígito por dígito)"
              : "Números a palabras (decimales como número)";

          options.push({
            label: label + " con paréntesis",
            value: opt.value + " (" + text + ")",
            applyToAll: isLongNumber,
          });

          options.push({
            label: label + " sin paréntesis",
            value: opt.value,
            applyToAll: isLongNumber,
          });
        });
      } else {
        const numWord = numberToWords(parseInt(text));

        options.push({
          label: "Números a palabras con paréntesis",
          value: numWord + " (" + text + ")",
          applyToAll: isLongNumber,
        });

        options.push({
          label: "Números a palabras sin paréntesis",
          value: numWord,
          applyToAll: isLongNumber,
        });

        if (!isDecimal) {
          options.push({
            label: "Con mayúsculas (para calles)",
            value: capitalize(numWord),
            applyToAll: false,
          });
        }
      }

      const digitWords = text
        .split("")
        .map((char) => {
          if (char === "." || char === ",") return "punto";
          return numberToWords(parseInt(char));
        })
        .join(" ");

      options.push({
        label: "Dígito por dígito con paréntesis",
        value: digitWords + " (" + text + ")",
        applyToAll: isLongNumber,
      });

      options.push({
        label: "Dígito por dígito sin paréntesis",
        value: digitWords,
        applyToAll: isLongNumber,
      });

      return options;
    }

    // PATRÓN 6: Prefijos
    const lowerText = text.toLowerCase();
    for (const abbr in prefixes) {
      if (lowerText === abbr) {
        const genders = prefixes[abbr];
        if (genders.m !== genders.f) {
          options.push({ label: "Masculino", value: genders.m });
          options.push({ label: "Femenino", value: genders.f });
        } else {
          options.push({ label: "Expandir abreviatura", value: genders.m });
        }
        return options;
      }
    }

    return options;
  };

  // Función para limpiar marcas existentes
  const clearMarks = () => {
    if (!editorRef.current) return;

    const markedElements = editorRef.current.querySelectorAll(
      ".marked-number, .transformed",
    );
    markedElements.forEach((el) => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
  };

  // Función para procesar el texto y marcar elementos
  const processText = () => {
    if (!editorRef.current) return;

    setIsProcessing(true);

    if (isMarked) {
      clearMarks();
    }

    const patterns = [
      /(ing\.|arq\.|dr\.|dra\.|lic\.|sr\.|sra\.|av\.|mz\.|prof\.|abg\.|econ\.|ci\.|no\.|nro\.|ruc\.|ruc|r\.u\.c\.)/gi,
      /\b[a-zA-Z]\d+(?:[.,]\d+)?[-]\d+(?:[.,]\d+)?\b/g,
      /[+-]\d+(?:[.,]\d+)?/g,
      /\d+(?:[.,]\d+)?\s*%/g,
      /\d+(?:[.,]\d+)?\s*(m²|m2|m³|m3|m|cm|mm|km|kg|g|l|ml|ha)\b/gi,
      /\b\d+(?:[.,]\d+)?\b/g,
    ];

    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
      const text = textNode.textContent;
      const matches = [];

      patterns.forEach((pattern) => {
        const regex = new RegExp(pattern);
        let match;

        while ((match = regex.exec(text)) !== null) {
          const isDuplicate = matches.some(
            (m) =>
              (m.index <= match.index && match.index < m.index + m.length) ||
              (match.index <= m.index &&
                m.index < match.index + match[0].length),
          );

          if (!isDuplicate) {
            matches.push({
              text: match[0],
              index: match.index,
              length: match[0].length,
            });
          }
        }
      });

      matches.sort((a, b) => a.index - b.index);

      if (matches.length > 0) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach((replacement, idx) => {
          if (replacement.index > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.slice(lastIndex, replacement.index)),
            );
          }

          const span = document.createElement("span");
          span.className = "marked-number";
          span.dataset.id =
            "marked-" + Date.now() + "-" + idx + "-" + Math.random();
          span.dataset.original = replacement.text;
          span.textContent = replacement.text;
          span.addEventListener("click", handleMarkedElementClick);

          fragment.appendChild(span);
          lastIndex = replacement.index + replacement.length;
        });

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });

    setIsMarked(true);
    setIsProcessing(false);
  };

  // Manejar click en elementos marcados
  const handleMarkedElementClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const element = e.target;
    const rect = element.getBoundingClientRect();
    const originalText =
      element.dataset.original ||
      element.dataset.transformedFrom ||
      element.textContent;

    const menuWidth = 500;
    const menuHeight = 600;
    const padding = 10;

    let x = rect.right + 10;
    let y = rect.top + window.scrollY;

    if (x + menuWidth > window.innerWidth - padding) {
      x = rect.left - menuWidth - 10;

      if (x < padding) {
        x = Math.max(padding, (window.innerWidth - menuWidth) / 2);
      }
    }

    const menuBottom = rect.top + menuHeight;
    const viewportHeight = window.innerHeight;

    if (menuBottom > viewportHeight + 50) {
      const adjustedY = rect.bottom - menuHeight + window.scrollY;
      if (adjustedY > window.scrollY + padding) {
        y = adjustedY;
      }
    }

    const options = generateOptions(originalText);

    setActiveElement({
      element,
      id: element.dataset.id,
      originalText,
      options,
      isTransformed: element.classList.contains("transformed"),
    });

    setMenuPosition({ x, y });
  };

  // Aplicar opción seleccionada
  const applyOption = (option) => {
    if (activeElement) {
      const originalText = activeElement.originalText;

      if (option.applyToAll) {
        const applyAll = window.confirm(
          '¿Desea aplicar esta transformación a todos los números "' +
            originalText +
            '" en el documento?',
        );

        if (applyAll) {
          const allMarked = editorRef.current.querySelectorAll(
            ".marked-number, .transformed",
          );
          allMarked.forEach((el) => {
            if (el.dataset.original === originalText) {
              el.textContent = option.value;
              el.className = "transformed";
              el.dataset.transformedFrom = originalText;
            }
          });
        } else {
          marcarTransformado(activeElement.element, option.value, originalText);
        }
      } else {
        marcarTransformado(activeElement.element, option.value, originalText);
      }

      setSelectedOptions((prev) => ({
        ...prev,
        [activeElement.id]: option,
      }));

      // Notificar cambio inmediatamente
      handleContentChange();
    }
    setActiveElement(null);
  };

  // Nueva función para deshacer transformación
  const undoTransformation = () => {
    if (activeElement && activeElement.element.dataset.transformedFrom) {
      restaurarOriginal(activeElement.element);

      setSelectedOptions((prev) => {
        const newOptions = { ...prev };
        delete newOptions[activeElement.id];
        return newOptions;
      });

      // Notificar cambio
      handleContentChange();
    }
    setActiveElement(null);
  };

  // Cancelar transformación
  const cancelTransformation = () => {
    setActiveElement(null);
  };

  // Finalizar todas las transformaciones
  const finalizeTransformations = () => {
    clearMarks();
    setIsProcessing(false);
    setSelectedOptions({});
    setIsMarked(false);

    // Notificar cambio final
    setTimeout(() => {
      handleContentChange();
    }, 100);
  };

  // Funciones del editor de texto enriquecido
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  // Función para capturar y exportar contenido con formato HTML
  const handleContentChange = () => {
    if (editorRef.current && onChange) {
      // innerHTML preserva el formato (negritas, cursivas, etc.)
      const htmlContent = editorRef.current.innerHTML || "";
      onChange(htmlContent.trim());
    }
  };

  // Texto de un borrador: se carga una sola vez al montar
  useEffect(() => {
    if (initialHtml && editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
      handleContentChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaste = (e) => {
    e.preventDefault();
    const html = limpiarPegado(
      e.clipboardData.getData("text/html"),
      e.clipboardData.getData("text/plain"),
    );
    if (html) document.execCommand("insertHTML", false, html);
    handleContentChange();
  };

  // Sincronizar contenido cuando cambia el editor
  useEffect(() => {
    if (editorRef.current) {
      const handleInput = () => {
        handleContentChange();
      };

      const editor = editorRef.current;
      editor.addEventListener("input", handleInput);

      return () => {
        editor.removeEventListener("input", handleInput);
      };
    }
  }, []);

  // Sincronizar cuando se finalizan transformaciones
  useEffect(() => {
    if (!isMarked && editorRef.current) {
      handleContentChange();
    }
  }, [isMarked]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeElement && !e.target.closest(".options-menu")) {
        setActiveElement(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeElement]);

  return (
    <div className="w-full mx-auto">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-300 rounded-t-lg">
          <button
            onClick={() => execCommand("bold")}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Negrita"
          >
            {icons.bold}
          </button>
          <button
            onClick={() => execCommand("italic")}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Cursiva"
          >
            {icons.italic}
          </button>
          <button
            onClick={() => execCommand("underline")}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Subrayado"
          >
            {icons.underline}
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            onClick={() => execCommand("insertUnorderedList")}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Lista con viñetas"
          >
            {icons.list}
          </button>
          <button
            onClick={() => execCommand("insertOrderedList")}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Lista numerada"
          >
            {icons.listOrdered}
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <select
            onChange={(e) => execCommand("fontSize", e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
            defaultValue="3"
          >
            <option value="1">Muy pequeño</option>
            <option value="2">Pequeño</option>
            <option value="3">Normal</option>
            <option value="4">Grande</option>
            <option value="5">Muy grande</option>
          </select>
        </div>

        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            onPaste={handlePaste}
            className="w-full min-h-64 p-4 border-2 border-gray-300 border-t-0 rounded-b-lg focus:border-blue-500 focus:outline-none [&_p]:mb-2"
            style={{ whiteSpace: "pre-wrap" }}
            suppressContentEditableWarning={true}
            data-placeholder="Escriba o pegue aquí el texto de la minuta. Ejemplo: av. 12 de octubre n24-660, +2.60, 18,82%, 20m, ing. Juan"
          />

          <div className="mt-4 flex gap-3 flex-wrap">
            <button
              onClick={processText}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {icons.edit}
              {isProcessing
                ? "Procesando..."
                : isMarked
                  ? "Actualizar Marcas"
                  : "Marcar Números"}
            </button>

            {(Object.keys(selectedOptions).length > 0 || isMarked) && (
              <button
                onClick={finalizeTransformations}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {icons.check}
                Finalizar Transformación
              </button>
            )}
          </div>
        </div>

        {activeElement && (
          <div
            className="options-menu absolute bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-50"
            style={{
              left: menuPosition.x + "px",
              top: menuPosition.y + "px",
              width: "500px",
              maxHeight: "90vh",
            }}
          >
            <div className="p-3 border-b-2 border-gray-200 bg-blue-50">
              <div className="text-sm font-medium text-gray-700 break-words">
                {activeElement.isTransformed
                  ? "Elemento transformado"
                  : "Transformar"}
                :{" "}
                <span className="font-bold text-blue-600">
                  {activeElement.originalText}
                </span>
              </div>
            </div>

            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 140px)" }}
            >
              {activeElement.options.length > 0 ? (
                activeElement.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => applyOption(option)}
                    className="w-full px-4 py-2.5 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-xs font-semibold text-gray-800 mb-0.5">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-600 break-words leading-snug">
                      {option.value}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No se encontraron transformaciones disponibles
                </div>
              )}
            </div>

            <div className="border-t-2 border-gray-200 p-2 bg-gray-50 flex gap-2">
              {activeElement.isTransformed && (
                <button
                  onClick={undoTransformation}
                  className="flex items-center justify-center gap-2 flex-1 px-3 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded transition-colors font-medium"
                >
                  ↶ Deshacer
                </button>
              )}
              <button
                onClick={cancelTransformation}
                className="flex items-center justify-center gap-2 flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors font-medium"
              >
                {icons.x}
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .marked-number {
          background-color: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 4px;
          padding: 2px 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-block;
        }

        .marked-number:hover {
          background-color: #fcd34d;
          transform: scale(1.05);
        }

        .transformed {
          background-color: #d1fae5;
          border: 2px solid #10b981;
          border-radius: 4px;
          padding: 2px 4px;
          display: inline-block;
          cursor: pointer;
        }

        .transformed:hover {
          background-color: #a7f3d0;
        }

        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        [contenteditable] {
          line-height: 1.6;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
        }

        [contenteditable] li {
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
};

export default TextNumberTransformer;
