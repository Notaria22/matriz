/**
 * Textos y listas de opciones del formulario de registro.
 * Los usan el formulario y la vista/impresión de la declaración, para que el
 * cliente firme exactamente lo que aceptó.
 */

export const RAZONES_EXCLUSION_CONYUGUE = [
  { value: "disolucion", label: "Disolución de sociedad conyugal" },
  { value: "capitulacion", label: "Capitulación matrimonial" },
  { value: "adquirido_solo", label: "Bien adquirido soltero/viudo/divorciado" },
  {
    value: "no_requiere_adquirente",
    label:
      "No requiere comparecencia del cónyuge — actúa como parte adquirente",
  },
  { value: "titulo_gratuito", label: "Adquiero a título gratuito" },
];

// Cada opción puede pedir detalles adicionales cuando se marca.
export const ORIGENES_FONDOS = [
  { value: "ahorro", label: "Ahorro" },
  { value: "utilidades", label: "Utilidades" },
  {
    value: "venta_propiedad",
    label: "Venta de propiedad",
    detalles: [
      {
        key: "propiedad",
        label: "¿Qué propiedad vendió?",
        placeholder: "Ej: Casa en Cumbayá",
      },
      {
        key: "tiempo",
        label: "¿Hace qué tiempo la vendió?",
        placeholder: "Ej: 2 años",
      },
      {
        key: "precio",
        label: "Precio de venta (USD)",
        placeholder: "Ej: 80000",
      },
    ],
  },
  { value: "poliza", label: "Póliza" },
  { value: "prestamo_hipotecario", label: "Préstamo hipotecario" },
  {
    value: "prestamo_entidad",
    label: "Préstamo personal de entidad financiera",
    detalles: [
      {
        key: "entidad",
        label: "Nombre de la entidad financiera",
        placeholder: "Ej: Banco Pichincha",
      },
    ],
  },
  {
    value: "prestamo_personal",
    label: "Préstamo personal",
    detalles: [
      {
        key: "prestamista",
        label:
          "Nombres y apellidos de la persona, o razón social de la persona jurídica, que le otorgó el crédito",
        placeholder: "Ej: JUAN PÉREZ GARCÍA",
      },
    ],
  },
  {
    value: "otro",
    label: "Otro",
    detalles: [
      {
        key: "descripcion",
        label: "Especifique el origen de los fondos",
        placeholder: "Ej: Herencia",
      },
    ],
  },
];

// Texto entregado por la notaría (Condiciones jurídicas, declaraciones y autorización)
// Texto entregado por la notaría (Condiciones jurídicas, declaraciones y autorización)
export const CONDICIONES_JURIDICAS = [
  {
    numero: "1",
    titulo: "Información de identificación incorporada al acto notarial.",
    texto:
      "De conformidad con los principios de la administración pública previstos en el artículo 227 de la Constitución de la República, el principio de no duplicidad de información establecido en el artículo 3 numeral 13 de la Ley Orgánica para la Optimización y Eficiencia de Trámites Administrativos, y la prohibición prevista en el artículo 11 de la misma Ley, que impide exigir al usuario información que ya se encuentre disponible, se deja constancia de que los datos de identificación de las personas naturales y jurídicas, así como de sus representantes, constan en la escritura pública o actuación notarial identificada en este formulario y en sus respectivos documentos habilitantes; por lo tanto, no serán requeridos nuevamente.",
  },
  {
    numero: "2",
    titulo: "Información del acto, contrato u operación.",
    texto:
      "Por las mismas razones y fundamentos jurídicos señalados en el numeral anterior, la información correspondiente al valor de la operación, transacción económica, acto o contrato; fecha de realización; moneda utilizada; formas y medios de pago; y demás información económica incorporada al instrumento, consta detallada en la escritura pública o actuación notarial identificada en este formulario. En consecuencia, dicha información no será requerida ni reproducida nuevamente.",
  },
  {
    numero: "3",
    titulo: "Información para cumplimiento de obligaciones UAFE.",
    texto:
      "El usuario declara que la información proporcionada en este formulario es verdadera, completa y actualizada. Cuando corresponda, proporcionará la información necesaria para identificar socios, accionistas, beneficiarios finales y demás personas naturales que ejerzan propiedad o control efectivo sobre sociedades, fideicomisos u otras estructuras jurídicas.",
  },
  {
    numero: "4",
    titulo: "Autorización para consulta y tratamiento de datos.",
    texto:
      "El usuario autoriza a la Notaría Vigésimo Segunda del cantón Quito a recopilar, consultar, verificar, contrastar, almacenar y tratar los datos personales y patrimoniales proporcionados, así como a consultar las bases de datos públicas o legalmente accesibles que resulten necesarias para verificar dicha información y cumplir las obligaciones legales aplicables, especialmente aquellas relacionadas con la prevención, detección y erradicación del lavado de activos y financiamiento de delitos.",
  },
  {
    numero: "5",
    titulo: "Reserva y confidencialidad.",
    texto:
      "La Notaría, el Notario, el Oficial de Cumplimiento y el personal autorizado mantendrán la reserva y confidencialidad de la información obtenida. Esta será utilizada exclusivamente para el cumplimiento de las finalidades legales correspondientes y únicamente será comunicada a la UAFE y a las demás autoridades u organismos de control cuando exista obligación o requerimiento legal.",
  },
  {
    numero: "6",
    titulo: "Declaración sobre licitud de fondos.",
    texto:
      "El usuario declara que los fondos y bienes relacionados con el acto u operación tienen origen lícito y no provienen ni están destinados al lavado de activos, financiamiento del terrorismo u otras actividades ilícitas. Asimismo, asume responsabilidad por la veracidad de la información proporcionada y reconoce que la intervención del Notario se limita al ejercicio de sus atribuciones legales.",
  },
  {
    numero: "7",
    titulo: "Consentimiento y conocimiento del acto.",
    texto:
      "El usuario manifiesta que conoce y comprende el contenido, alcance y efectos del acto o contrato que celebra; que actúa libre y voluntariamente; y que ha recibido las explicaciones jurídicas correspondientes del abogado patrocinador, cuando lo hubiere, y del Notario dentro del ámbito de sus competencias.",
  },
  {
    numero: "8",
    titulo: "Prevención de riesgos.",
    texto:
      "El usuario declara haber sido informado sobre los riesgos de realizar operaciones con personas desconocidas o sin referencias suficientes y reconoce la importancia de verificar los antecedentes e información de las personas con quienes contrata.",
  },
  {
    numero: "9",
    titulo: "Personas que no saben leer ni escribir.",
    texto:
      "Cuando el usuario no sepa leer ni escribir, declara que el contenido de este documento le ha sido leído y explicado en forma clara, con intervención de su testigo de confianza cuando corresponda, y expresa su conformidad mediante la impresión de su huella digital.",
  },
];

export const TIPOS_INMUEBLE_PATRIMONIO = [
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "solar", label: "Solar" },
  { value: "departamento", label: "Departamento" },
  { value: "suite", label: "Suite" },
  { value: "oficina", label: "Oficina" },
  { value: "otro", label: "Otro" },
];

export const RELACIONES_PEP = [
  "Cónyuge/Conviviente",
  "Ascendiente/Padres/Abuelos/Suegros",
  "Descendientes/Hijos/Nietos/Yerno-Nuera",
  "Hermanos/Cuñados",
  "Tíos directos",
  "Primos directos",
  "Colaborador",
  "Amigo",
];

export const MODALIDADES_SOCIOS = [
  {
    v: "lista",
    l: "Escribir los nombres y apellidos de los socios o accionistas.",
  },
  { v: "anexo", l: "Adjuntar la nómina de socios o accionistas (PDF)." },
  {
    v: "autorizacion",
    l: "Autorizar a la notaría a consultar la información en la web de la Superintendencia de Compañías.",
  },
];

export const ROLES_TRAMITE = {
  vendedor:
    "TRADENTE/S – VENDEDOR/ES – DONANTE/S – CEDENTE/S – ADJUDICANTE/S - ACREEDORES - OTORGANTES",
  adquirente:
    "ADQUIRIENTE/S – COMPRADOR/ES – DONATARIO/S – CESIONARIO/S – ADJUDICATARIO/S - DEUDORES - BENEFICIARIOS",
};

export const CALIDADES_PARTICIPACION = {
  propios_derechos: "Por sus propios derechos",
  representando: "Representando a: (mandatario, apoderado, representante)",
  propios_y_representando: "Por sus propios derechos y representando a:",
};

export const TEXTO_ACEPTA_CONDICIONES =
  "He leído y acepto las condiciones jurídicas, declaraciones y autorización establecidas por la Notaría Vigésimo Segunda del cantón Quito.";

export const TEXTO_PRIVACIDAD =
  "Sus datos personales serán tratados por la notaría exclusivamente para la celebración del instrumento público solicitado, en cumplimiento de la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP). Usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento de sus datos contactando directamente a la notaría.";

export const TEXTO_ACEPTA_PRIVACIDAD =
  "Acepto el tratamiento de mis datos personales para los fines notariales descritos.";

export const TEXTO_ENCABEZADO =
  "FORMULARIO QUE REGISTRA INFORMACIÓN CUMPLIENDO LO DISPUESTO EN EL ART. 58 DE LA LEY PREVENCIÓN DE LAVADO DE ACTIVOS Y DE LA FINANCIACIÓN DE DELITOS Y ART. 3 NUMERAL 5 DE SU REGLAMENTO.";
