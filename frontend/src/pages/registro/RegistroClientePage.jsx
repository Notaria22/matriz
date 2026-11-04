import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { ACTIVIDADES_ECONOMICAS } from "../../utils/actividadesEconomicas";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const PROVINCIAS_ECUADOR = [
  "Azuay",
  "Bolívar",
  "Cañar",
  "Carchi",
  "Chimborazo",
  "Cotopaxi",
  "El Oro",
  "Esmeraldas",
  "Galápagos",
  "Guayas",
  "Imbabura",
  "Loja",
  "Los Ríos",
  "Manabí",
  "Morona Santiago",
  "Napo",
  "Orellana",
  "Pastaza",
  "Pichincha",
  "Santa Elena",
  "Santo Domingo de los Tsáchilas",
  "Sucumbíos",
  "Tungurahua",
  "Zamora Chinchipe",
];

const RAZONES_EXCLUSION_CONYUGUE = [
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
const ORIGENES_FONDOS = [
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
const CONDICIONES_JURIDICAS = [
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

const TIPOS_INMUEBLE_PATRIMONIO = [
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "solar", label: "Solar" },
  { value: "departamento", label: "Departamento" },
  { value: "suite", label: "Suite" },
  { value: "oficina", label: "Oficina" },
  { value: "otro", label: "Otro" },
];

const inmuebleInicial = () => ({
  tipo: "",
  especificar: "",
  ciudad: "",
  valor: "",
});
const vehiculoInicial = () => ({ marca: "", modelo: "", placa: "", valor: "" });
const accionInicial = () => ({ entidad: "", monto: "" });

// Cada inmueble, vehículo y participación en empresas es una fila con sus datos.
const patrimonioInicial = () => ({
  inmuebles: [inmuebleInicial()],
  no_posee_inmuebles: false,
  vehiculos: [vehiculoInicial()],
  no_posee_vehiculos: false,
  inversiones: "",
  no_posee_inversiones: false,
  acciones: [accionInicial()],
  no_posee_acciones: false,
});

// Total informativo: inmuebles + vehículos + acciones o participaciones
const totalPatrimonio = (pat) => {
  const suma = (lista, campo, excluido) =>
    excluido
      ? 0
      : (lista || []).reduce((t, f) => t + (parseFloat(f[campo]) || 0), 0);
  return (
    suma(pat.inmuebles, "valor", pat.no_posee_inmuebles) +
    suma(pat.vehiculos, "valor", pat.no_posee_vehiculos) +
    suma(pat.acciones, "monto", pat.no_posee_acciones)
  );
};

const formatoUSD = (n) =>
  n.toLocaleString("es-EC", { style: "currency", currency: "USD" });

const socioInicial = () => ({
  nombres: "",
  tipo_documento: "cedula",
  numero_documento: "",
  porcentaje: "",
});

// Arma el texto legible del origen de fondos que se guarda en la base y se
// muestra en el sistema interno / endpoint UAFE.
const construirOrigenFondosTexto = (datos, prefijo = "") => {
  const lista = datos[`${prefijo}origen_fondos_lista`] || [];
  const detalle = datos[`${prefijo}origen_fondos_detalle`] || {};
  return ORIGENES_FONDOS.filter((o) => lista.includes(o.value))
    .map((o) => {
      if (!o.detalles) return o.label;
      if (o.value === "otro")
        return `Otro: ${detalle[`${o.value}_descripcion`] || ""}`;
      const partes = o.detalles
        .map((d) => {
          const v = (detalle[`${o.value}_${d.key}`] || "").trim();
          if (!v) return null;
          if (d.key === "tiempo") return `vendida hace ${v}`;
          if (d.key === "precio") return `precio de venta $${v}`;
          return v;
        })
        .filter(Boolean);
      return partes.length ? `${o.label} (${partes.join(", ")})` : o.label;
    })
    .join("; ");
};

// Limpia el patrimonio: si marcó "no posee", vacía los campos relacionados.
const limpiarPatrimonio = (pat) => {
  if (!pat) return null;
  const p = { ...patrimonioInicial(), ...pat };
  const limpiar = (fila) =>
    Object.fromEntries(
      Object.entries(fila).map(([k, v]) => [k, String(v ?? "").trim()]),
    );
  const conDatos = (fila) => Object.values(fila).some((v) => v !== "");
  p.inmuebles = p.no_posee_inmuebles
    ? []
    : p.inmuebles
        .map(limpiar)
        .map((i) => (i.tipo === "otro" ? i : { ...i, especificar: "" }))
        .filter(conDatos);
  p.acciones = p.no_posee_acciones
    ? []
    : (p.acciones || []).map(limpiar).filter(conDatos);
  p.vehiculos = p.no_posee_vehiculos
    ? []
    : p.vehiculos
        .map(limpiar)
        .map((v) => ({ ...v, placa: v.placa.toUpperCase() }))
        .filter(conDatos);
  if (p.no_posee_inversiones) p.inversiones = "";
  return p;
};

const RELACIONES_PEP = [
  "Cónyuge/Conviviente",
  "Ascendiente/Padres/Abuelos/Suegros",
  "Descendientes/Hijos/Nietos/Yerno-Nuera",
  "Hermanos/Cuñados",
  "Tíos directos",
  "Primos directos",
  "Colaborador",
  "Amigo",
];

const personaInicial = () => ({
  document_type: "cedula",
  document_number: "",
  names: "",
  last_names: "",
  gender: "",
  marital_status: "",
  partner_document_number: "",
  nationality: "ecuatoriana",
  birth_date: "",
  email: "",
  phone: "",
  province: "",
  canton: "",
  parroquia: "",
  sector: "",
  main_street: "",
  secondary_street: "",
  number_street: "",
  occupation: "",
  profession: "",
  actividad_economica: "",
  actividad_economica_otra: "",
  empresa_trabajo: "",
  ingreso_mensual: "",
  rol_tramite: "",
  origen_fondos: "",
  conyugue_comparece: true,
  razon_exclusion_conyugue: "",
  es_pep: "",
  es_pep_indirecto: "",
  pep_relacion_tipo: "",
  pep_nombre: "",
  pep_institucion: "",
  pep_fecha_inicio: "",
  pep_cargo: "",
  pep_anios_trabajo: "",
  pep_grado_relacion: "",
  pep_ya_no_ejerce: false,
  pep_fecha_fin: "",
  patrimonio: patrimonioInicial(),
  origen_fondos_lista: [],
  origen_fondos_detalle: {},
});

const empresaInicial = () => ({
  ruc: "",
  razon_social: "",
  email: "",
  phone: "",
  province: "",
  canton: "",
  parroquia: "",
  sector: "",
  main_street: "",
  secondary_street: "",
  number_street: "",
  ingreso_mensual: "",
  egreso_mensual: "",
  actividad_empresa: "",
  rol_tramite: "",
  origen_fondos_lista: [],
  origen_fondos_detalle: {},
  controlada_supercias: "",
  socios_modalidad: "",
  autoriza_consulta_supercias: false,
  socios: [socioInicial()],
  referencia_supercias: "",
  anexo_socios_base64: "",
  anexo_socios_nombre: "",
  rep_document_type: "cedula",
  rep_document_number: "",
  rep_names: "",
  rep_last_names: "",
  rep_gender: "",
  rep_nationality: "ecuatoriana",
  rep_birth_date: "",
  rep_email: "",
  rep_phone: "",
  rep_province: "",
  rep_canton: "",
  rep_parroquia: "",
  rep_sector: "",
  rep_main_street: "",
  rep_secondary_street: "",
  rep_number_street: "",
  rep_occupation: "",
  rep_profession: "",
  rep_position: "",
  rep_actividad_economica: "",
  rep_actividad_economica_otra: "",
  rep_empresa_trabajo: "",
  rep_ingreso_mensual: "",
  rep_rol_tramite: "",
  rep_origen_fondos: "",
  rep_es_pep: "",
  rep_es_pep_indirecto: "",
  rep_pep_relacion_tipo: "",
  rep_pep_nombre: "",
  rep_pep_institucion: "",
  rep_pep_fecha_inicio: "",
  rep_pep_cargo: "",
  rep_pep_anios_trabajo: "",
  rep_pep_grado_relacion: "",
  rep_pep_ya_no_ejerce: false,
  rep_pep_fecha_fin: "",
  rep_patrimonio: patrimonioInicial(),
  rep_origen_fondos_lista: [],
  rep_origen_fondos_detalle: {},
});

// ============================================
// HELPERS
// ============================================
const inputClass = (errors, field) =>
  `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
    errors[field] ? "border-red-400 bg-red-50" : "border-gray-300"
  }`;

const SeccionDireccion = ({
  datos,
  onChange,
  errors,
  prefijo = "",
  titulo = "Dirección",
}) => (
  <>
    <h3 className="font-medium text-gray-700 pt-2 border-t">{titulo}</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provincia
        </label>
        <select
          value={datos[`${prefijo}province`]}
          onChange={(e) => onChange(`${prefijo}province`, e.target.value)}
          className={inputClass(errors, `${prefijo}province`)}
        >
          <option value="">Seleccione</option>
          {PROVINCIAS_ECUADOR.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors[`${prefijo}province`] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[`${prefijo}province`]}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantón
        </label>
        <input
          type="text"
          value={datos[`${prefijo}canton`]}
          onChange={(e) => onChange(`${prefijo}canton`, e.target.value)}
          className={inputClass(errors, `${prefijo}canton`)}
          placeholder="Ej: Quito"
        />
        {errors[`${prefijo}canton`] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[`${prefijo}canton`]}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parroquia
        </label>
        <input
          type="text"
          value={datos[`${prefijo}parroquia`]}
          onChange={(e) => onChange(`${prefijo}parroquia`, e.target.value)}
          className={inputClass(errors, `${prefijo}parroquia`)}
          placeholder="Ej: Nayón"
        />
        {errors[`${prefijo}parroquia`] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[`${prefijo}parroquia`]}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sector / Urbanización (opcional)
        </label>
        <input
          type="text"
          value={datos[`${prefijo}sector`]}
          onChange={(e) => onChange(`${prefijo}sector`, e.target.value)}
          className={inputClass(errors, `${prefijo}sector`)}
          placeholder="Ej: Valle Colores"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Calle Principal
        </label>
        <input
          type="text"
          value={datos[`${prefijo}main_street`]}
          onChange={(e) => onChange(`${prefijo}main_street`, e.target.value)}
          className={inputClass(errors, `${prefijo}main_street`)}
          placeholder="Ej: Av. Los Eucaliptos"
        />
        {errors[`${prefijo}main_street`] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[`${prefijo}main_street`]}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Calle Secundaria
        </label>
        <input
          type="text"
          value={datos[`${prefijo}secondary_street`]}
          onChange={(e) =>
            onChange(`${prefijo}secondary_street`, e.target.value)
          }
          className={inputClass(errors, `${prefijo}secondary_street`)}
          placeholder="Ej: Calle Eugenio Espejo"
        />
        {errors[`${prefijo}secondary_street`] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[`${prefijo}secondary_street`]}
          </p>
        )}
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número / Referencia
        </label>
        <input
          type="text"
          value={datos[`${prefijo}number_street`]}
          onChange={(e) => onChange(`${prefijo}number_street`, e.target.value)}
          className={inputClass(errors, `${prefijo}number_street`)}
          placeholder="Ej: E4-23, Casa 2"
        />
        {errors[`${prefijo}number_street`] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[`${prefijo}number_street`]}
          </p>
        )}
      </div>
    </div>
  </>
);

// Checkbox cónyuge no comparece
const SeccionConyugue = ({ datos, onChange, errors, prefijo = "" }) => {
  if (datos[`${prefijo}marital_status`] !== "casado") return null;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!datos[`${prefijo}conyugue_comparece`]}
            onChange={(e) =>
              onChange(`${prefijo}conyugue_comparece`, !e.target.checked)
            }
            className="w-4 h-4 text-gray-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            El cónyuge no comparece en este trámite.
          </span>
        </label>
      </div>
      {!datos[`${prefijo}conyugue_comparece`] && (
        <div className="p-4 bg-white">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Razón de no comparecencia
          </label>
          <select
            value={datos[`${prefijo}razon_exclusion_conyugue`] || ""}
            onChange={(e) =>
              onChange(`${prefijo}razon_exclusion_conyugue`, e.target.value)
            }
            className={inputClass(errors, `${prefijo}razon_exclusion_conyugue`)}
          >
            <option value="">Seleccione una razón</option>
            {RAZONES_EXCLUSION_CONYUGUE.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {errors[`${prefijo}razon_exclusion_conyugue`] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[`${prefijo}razon_exclusion_conyugue`]}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const FormularioPEP = ({
  datos,
  onChange,
  errors,
  prefijo = "",
  mostrarGrado = false,
  mostrarNombre = true,
}) => (
  <div className="grid grid-cols-2 gap-4">
    {mostrarNombre && (
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del PEP
        </label>
        <input
          type="text"
          value={datos[`${prefijo}pep_nombre`]}
          onChange={(e) =>
            onChange(`${prefijo}pep_nombre`, e.target.value.toUpperCase())
          }
          className={inputClass(errors, `${prefijo}pep_nombre`)}
          placeholder="Nombre completo"
        />
        {errors[`${prefijo}pep_nombre`] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[`${prefijo}pep_nombre`]}
          </p>
        )}
      </div>
    )}
    <div className="col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        ¿En qué institución?
      </label>
      <input
        type="text"
        value={datos[`${prefijo}pep_institucion`]}
        onChange={(e) => onChange(`${prefijo}pep_institucion`, e.target.value)}
        className={inputClass(errors, `${prefijo}pep_institucion`)}
        placeholder="Ej: Ministerio de Finanzas"
      />
      {errors[`${prefijo}pep_institucion`] && (
        <p className="text-red-500 text-xs mt-1">
          {errors[`${prefijo}pep_institucion`]}
        </p>
      )}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        ¿Desde qué fecha desempeña el cargo?
      </label>
      <input
        type="date"
        value={datos[`${prefijo}pep_fecha_inicio`]}
        onChange={(e) => onChange(`${prefijo}pep_fecha_inicio`, e.target.value)}
        className={inputClass(errors, `${prefijo}pep_fecha_inicio`)}
      />
      {errors[`${prefijo}pep_fecha_inicio`] && (
        <p className="text-red-500 text-xs mt-1">
          {errors[`${prefijo}pep_fecha_inicio`]}
        </p>
      )}
    </div>
    <div className="flex items-end pb-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!datos[`${prefijo}pep_ya_no_ejerce`]}
          onChange={(e) => {
            onChange(`${prefijo}pep_ya_no_ejerce`, e.target.checked);
            if (!e.target.checked) onChange(`${prefijo}pep_fecha_fin`, "");
          }}
          className="w-4 h-4 rounded text-blue-600"
        />
        <span className="text-sm text-gray-700">Ya no ejerce el cargo</span>
      </label>
    </div>
    {datos[`${prefijo}pep_ya_no_ejerce`] && (
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ¿Cuándo terminó sus funciones?
        </label>
        <input
          type="date"
          value={datos[`${prefijo}pep_fecha_fin`] || ""}
          onChange={(e) => onChange(`${prefijo}pep_fecha_fin`, e.target.value)}
          className={inputClass(errors, `${prefijo}pep_fecha_fin`)}
        />
        {errors[`${prefijo}pep_fecha_fin`] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[`${prefijo}pep_fecha_fin`]}
          </p>
        )}
      </div>
    )}
    <div className="col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        ¿Qué cargo desempeña o desempeñó?
      </label>
      <input
        type="text"
        value={datos[`${prefijo}pep_cargo`]}
        onChange={(e) => onChange(`${prefijo}pep_cargo`, e.target.value)}
        className={inputClass(errors, `${prefijo}pep_cargo`)}
        placeholder="Ej: Director General"
      />
      {errors[`${prefijo}pep_cargo`] && (
        <p className="text-red-500 text-xs mt-1">
          {errors[`${prefijo}pep_cargo`]}
        </p>
      )}
    </div>
    {mostrarGrado && (
      <>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relación con el PEP
          </label>
          <select
            value={datos[`${prefijo}pep_relacion_tipo`] || ""}
            onChange={(e) =>
              onChange(`${prefijo}pep_relacion_tipo`, e.target.value)
            }
            className={inputClass(errors, `${prefijo}pep_relacion_tipo`)}
          >
            <option value="">Seleccione</option>
            {RELACIONES_PEP.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors[`${prefijo}pep_relacion_tipo`] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[`${prefijo}pep_relacion_tipo`]}
            </p>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Grado de Consanguinidad, Afinidad o Relación de Colaboración que
            tiene con el PEP
          </label>
          <input
            type="text"
            value={datos[`${prefijo}pep_grado_relacion`]}
            onChange={(e) =>
              onChange(`${prefijo}pep_grado_relacion`, e.target.value)
            }
            className={inputClass(errors, `${prefijo}pep_grado_relacion`)}
            placeholder="Ej: Primer grado de consanguinidad"
          />
          {errors[`${prefijo}pep_grado_relacion`] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[`${prefijo}pep_grado_relacion`]}
            </p>
          )}
        </div>
      </>
    )}
  </div>
);

// ============================================
// ORIGEN DE FONDOS (checklist con detalles condicionales)
// ============================================
const SeccionOrigenFondos = ({
  datos,
  onChange,
  errors,
  prefijo = "",
  label,
}) => {
  const lista = datos[`${prefijo}origen_fondos_lista`] || [];
  const detalle = datos[`${prefijo}origen_fondos_detalle`] || {};

  const toggle = (valor) => {
    const nuevo = lista.includes(valor)
      ? lista.filter((v) => v !== valor)
      : [...lista, valor];
    onChange(`${prefijo}origen_fondos_lista`, nuevo);
  };

  const setDetalle = (clave, valor) => {
    onChange(`${prefijo}origen_fondos_detalle`, { ...detalle, [clave]: valor });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        className={`space-y-2 p-3 border rounded-lg ${errors[`${prefijo}origen_fondos`] ? "border-red-400 bg-red-50" : "border-gray-300"}`}
      >
        {ORIGENES_FONDOS.map((opcion) => {
          const checked = lista.includes(opcion.value);
          return (
            <div key={opcion.value}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opcion.value)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">{opcion.label}</span>
              </label>
              {checked && opcion.detalles && (
                <div className="ml-6 mt-2 mb-1 grid grid-cols-1 gap-2">
                  {opcion.detalles.map((d) => {
                    const clave = `${opcion.value}_${d.key}`;
                    const errKey = `${prefijo}origen_fondos_${clave}`;
                    return (
                      <div key={clave}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {d.label}
                        </label>
                        <input
                          type={d.key === "precio" ? "number" : "text"}
                          min={d.key === "precio" ? "0" : undefined}
                          value={detalle[clave] || ""}
                          onChange={(e) => setDetalle(clave, e.target.value)}
                          className={inputClass(errors, errKey)}
                          placeholder={d.placeholder}
                        />
                        {errors[errKey] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[errKey]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {errors[`${prefijo}origen_fondos`] && (
        <p className="text-red-500 text-xs mt-1">
          {errors[`${prefijo}origen_fondos`]}
        </p>
      )}
    </div>
  );
};

// ============================================
// SITUACIÓN PATRIMONIAL (PEP directo o relacionado con PEP)
// ============================================
const SeccionPatrimonio = ({ datos, onChange, errors, prefijo = "" }) => {
  const pat = {
    ...patrimonioInicial(),
    ...(datos[`${prefijo}patrimonio`] || {}),
  };
  const guardar = (cambios) =>
    onChange(`${prefijo}patrimonio`, { ...pat, ...cambios });
  const set = (campo, valor) => guardar({ [campo]: valor });
  const key = (campo) => `${prefijo}patrimonio_${campo}`;
  const errorMsg = (campo) =>
    errors[key(campo)] ? (
      <p className="text-red-500 text-xs mt-1">{errors[key(campo)]}</p>
    ) : null;

  // Edición de filas (inmuebles / vehículos)
  const setFila = (lista, i, campo, valor) =>
    guardar({
      [lista]: pat[lista].map((f, j) =>
        j === i ? { ...f, [campo]: valor } : f,
      ),
    });
  const agregarFila = (lista, nueva) =>
    guardar({ [lista]: [...pat[lista], nueva] });
  const quitarFila = (lista, i) =>
    guardar({ [lista]: pat[lista].filter((_, j) => j !== i) });
  const toggleNoPosee = (campoNoPosee, lista, nueva, marcado) =>
    guardar({
      [campoNoPosee]: marcado,
      // Al desmarcar se deja una fila vacía lista para llenar
      [lista]: marcado ? [] : pat[lista].length ? pat[lista] : [nueva()],
    });

  const botonQuitar = (lista, i) =>
    pat[lista].length > 1 && (
      <button
        type="button"
        onClick={() => quitarFila(lista, i)}
        className="text-xs text-red-600 hover:underline"
      >
        Quitar
      </button>
    );

  return (
    <div className="space-y-4 pt-3 border-t border-amber-200">
      <div>
        <p className="text-sm font-semibold text-gray-800">
          Situación patrimonial
        </p>
        <p className="text-xs text-gray-600">
          Estimado usuario, por cumplimiento de la normativa UAFE, proporcione
          la siguiente información sobre su situación patrimonial.
        </p>
      </div>

      {/* Inmuebles */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Identifique las propiedades inmuebles de las que es propietario.
        </label>
        {!pat.no_posee_inmuebles && (
          <div className="space-y-3">
            {pat.inmuebles.map((inm, i) => (
              <div
                key={i}
                className="p-3 bg-white border border-gray-200 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Inmueble {i + 1}
                  </span>
                  {botonQuitar("inmuebles", i)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Tipo
                    </label>
                    <select
                      value={inm.tipo}
                      onChange={(e) =>
                        setFila("inmuebles", i, "tipo", e.target.value)
                      }
                      className={inputClass(errors, key(`inmuebles_${i}_tipo`))}
                    >
                      <option value="">Seleccione</option>
                      {TIPOS_INMUEBLE_PATRIMONIO.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {errorMsg(`inmuebles_${i}_tipo`)}
                    {inm.tipo === "otro" && (
                      <>
                        <input
                          type="text"
                          value={inm.especificar || ""}
                          onChange={(e) =>
                            setFila(
                              "inmuebles",
                              i,
                              "especificar",
                              e.target.value,
                            )
                          }
                          className={`mt-2 ${inputClass(
                            errors,
                            key(`inmuebles_${i}_especificar`),
                          )}`}
                          placeholder="Especifique: Ej. bodega, local comercial"
                        />
                        {errorMsg(`inmuebles_${i}_especificar`)}
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={inm.ciudad}
                      onChange={(e) =>
                        setFila("inmuebles", i, "ciudad", e.target.value)
                      }
                      className={inputClass(
                        errors,
                        key(`inmuebles_${i}_ciudad`),
                      )}
                      placeholder="Ej: Quito"
                    />
                    {errorMsg(`inmuebles_${i}_ciudad`)}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Valoración aproximada (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={inm.valor}
                      onChange={(e) =>
                        setFila("inmuebles", i, "valor", e.target.value)
                      }
                      className={inputClass(
                        errors,
                        key(`inmuebles_${i}_valor`),
                      )}
                      placeholder="Ej: 150000"
                    />
                    {errorMsg(`inmuebles_${i}_valor`)}
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => agregarFila("inmuebles", inmuebleInicial())}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Agregar otro inmueble
            </button>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pat.no_posee_inmuebles}
            onChange={(e) =>
              toggleNoPosee(
                "no_posee_inmuebles",
                "inmuebles",
                inmuebleInicial,
                e.target.checked,
              )
            }
            className="w-4 h-4 rounded text-gray-600"
          />
          <span className="text-sm text-gray-600">
            No posee bienes inmuebles.
          </span>
        </label>
        {errorMsg("inmuebles")}
      </div>

      {/* Vehículos */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Identifique los vehículos de los que es propietario.
        </label>
        {!pat.no_posee_vehiculos && (
          <div className="space-y-3">
            {pat.vehiculos.map((veh, i) => (
              <div
                key={i}
                className="p-3 bg-white border border-gray-200 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Vehículo {i + 1}
                  </span>
                  {botonQuitar("vehiculos", i)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={veh.marca}
                      onChange={(e) =>
                        setFila("vehiculos", i, "marca", e.target.value)
                      }
                      className={inputClass(
                        errors,
                        key(`vehiculos_${i}_marca`),
                      )}
                      placeholder="Ej: Toyota"
                    />
                    {errorMsg(`vehiculos_${i}_marca`)}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={veh.modelo}
                      onChange={(e) =>
                        setFila("vehiculos", i, "modelo", e.target.value)
                      }
                      className={inputClass(
                        errors,
                        key(`vehiculos_${i}_modelo`),
                      )}
                      placeholder="Ej: Hilux"
                    />
                    {errorMsg(`vehiculos_${i}_modelo`)}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Placa
                    </label>
                    <input
                      type="text"
                      value={veh.placa}
                      onChange={(e) =>
                        setFila(
                          "vehiculos",
                          i,
                          "placa",
                          e.target.value.toUpperCase(),
                        )
                      }
                      className={inputClass(
                        errors,
                        key(`vehiculos_${i}_placa`),
                      )}
                      placeholder="Ej: PBC-1234"
                      maxLength={10}
                    />
                    {errorMsg(`vehiculos_${i}_placa`)}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Valoración aproximada (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={veh.valor}
                      onChange={(e) =>
                        setFila("vehiculos", i, "valor", e.target.value)
                      }
                      className={inputClass(
                        errors,
                        key(`vehiculos_${i}_valor`),
                      )}
                      placeholder="Ej: 30000"
                    />
                    {errorMsg(`vehiculos_${i}_valor`)}
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => agregarFila("vehiculos", vehiculoInicial())}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Agregar otro vehículo
            </button>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pat.no_posee_vehiculos}
            onChange={(e) =>
              toggleNoPosee(
                "no_posee_vehiculos",
                "vehiculos",
                vehiculoInicial,
                e.target.checked,
              )
            }
            className="w-4 h-4 rounded text-gray-600"
          />
          <span className="text-sm text-gray-600">No posee vehículos.</span>
        </label>
        {errorMsg("vehiculos")}
      </div>

      {/* Inversiones */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Si tiene inversiones, pólizas, fondos de acumulación o fideicomisos,
          indique las entidades donde los mantiene.
        </label>
        {!pat.no_posee_inversiones && (
          <input
            type="text"
            value={pat.inversiones}
            onChange={(e) => set("inversiones", e.target.value)}
            className={inputClass(errors, key("inversiones"))}
            placeholder="Ej: Póliza en Banco Pichincha, fideicomiso en Fiducia S.A."
          />
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pat.no_posee_inversiones}
            onChange={(e) => set("no_posee_inversiones", e.target.checked)}
            className="w-4 h-4 rounded text-gray-600"
          />
          <span className="text-sm text-gray-600">
            No posee inversiones, pólizas, fondos ni fideicomisos.
          </span>
        </label>
        {errorMsg("inversiones")}
      </div>

      {/* Acciones o participaciones */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Si tiene acciones, participaciones o capital invertido en empresas
          nacionales o extranjeras, indique las entidades y el monto de sus
          inversiones.
        </label>
        {!pat.no_posee_acciones && (
          <div className="space-y-3">
            {(pat.acciones || []).map((acc, i) => (
              <div
                key={i}
                className="p-3 bg-white border border-gray-200 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Inversión {i + 1}
                  </span>
                  {botonQuitar("acciones", i)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">
                      Empresa o entidad
                    </label>
                    <input
                      type="text"
                      value={acc.entidad}
                      onChange={(e) =>
                        setFila("acciones", i, "entidad", e.target.value)
                      }
                      className={inputClass(
                        errors,
                        key(`acciones_${i}_entidad`),
                      )}
                      placeholder="Ej: Constructora Andes S.A."
                    />
                    {errorMsg(`acciones_${i}_entidad`)}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Monto invertido (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={acc.monto}
                      onChange={(e) =>
                        setFila("acciones", i, "monto", e.target.value)
                      }
                      className={inputClass(errors, key(`acciones_${i}_monto`))}
                      placeholder="Ej: 20000"
                    />
                    {errorMsg(`acciones_${i}_monto`)}
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => agregarFila("acciones", accionInicial())}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Agregar otra inversión
            </button>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pat.no_posee_acciones}
            onChange={(e) =>
              toggleNoPosee(
                "no_posee_acciones",
                "acciones",
                accionInicial,
                e.target.checked,
              )
            }
            className="w-4 h-4 rounded text-gray-600"
          />
          <span className="text-sm text-gray-600">
            No posee acciones, participaciones ni capital invertido en empresas.
          </span>
        </label>
        {errorMsg("acciones")}
      </div>

      {/* Total informativo */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-800">
            Total de bienes declarados
          </p>
          <p className="text-xs text-gray-500">
            Suma informativa de inmuebles, vehículos y acciones o
            participaciones.
          </p>
        </div>
        <p className="text-lg font-semibold text-gray-900">
          {formatoUSD(totalPatrimonio(pat))}
        </p>
      </div>
    </div>
  );
};

// ============================================
// SOCIOS / ACCIONISTAS (persona jurídica)
// ============================================
const MAX_ANEXO_MB = 5;

const SeccionSocios = ({ datos, onChange, errors }) => {
  const [errorArchivo, setErrorArchivo] = useState("");
  const controlada = datos.controlada_supercias;
  const socios = datos.socios?.length ? datos.socios : [socioInicial()];

  const setSocio = (i, campo, valor) => {
    const nuevos = socios.map((s, idx) =>
      idx === i ? { ...s, [campo]: valor } : s,
    );
    onChange("socios", nuevos);
  };
  const agregar = () => onChange("socios", [...socios, socioInicial()]);
  const quitar = (i) =>
    onChange(
      "socios",
      socios.filter((_, idx) => idx !== i),
    );

  const handleArchivo = (e) => {
    const file = e.target.files?.[0];
    setErrorArchivo("");
    if (!file) return;
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setErrorArchivo("El archivo debe ser PDF.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_ANEXO_MB * 1024 * 1024) {
      setErrorArchivo(`El archivo supera ${MAX_ANEXO_MB} MB.`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange("anexo_socios_base64", reader.result);
      onChange("anexo_socios_nombre", file.name);
    };
    reader.onerror = () => setErrorArchivo("No se pudo leer el archivo.");
    reader.readAsDataURL(file);
  };

  const quitarArchivo = () => {
    onChange("anexo_socios_base64", "");
    onChange("anexo_socios_nombre", "");
  };

  // Empresa controlada: elige UNA forma de informar los socios.
  // Extranjera o no controlada: siempre la lista con documento.
  const modalidad = controlada === "si" ? datos.socios_modalidad : "lista";
  const docObligatorio = controlada === "no";

  const MODALIDADES = [
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

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 pt-2 border-t">
        Socios o Accionistas
      </h3>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          ¿La empresa está bajo el control de la Superintendencia de Compañías?
        </label>
        <div className="flex gap-3">
          {[
            { v: "si", l: "Sí" },
            { v: "no", l: "No (extranjera o no controlada)" },
          ].map(({ v, l }) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange("controlada_supercias", v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${controlada === v ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {l}
            </button>
          ))}
        </div>
        {errors.controlada_supercias && (
          <p className="text-red-500 text-xs mt-1">
            {errors.controlada_supercias}
          </p>
        )}
      </div>

      {controlada === "si" && (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Indique los nombres y apellidos de los socios o accionistas. O, si
            lo prefiere, adjunte la nómina correspondiente o autorice el acceso
            a la información disponible en la web de la Superintendencia de
            Compañías.
          </p>
          <div className="space-y-2">
            {MODALIDADES.map(({ v, l }) => (
              <label
                key={v}
                className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer ${
                  modalidad === v
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="socios_modalidad"
                  checked={modalidad === v}
                  onChange={() => onChange("socios_modalidad", v)}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-800">{l}</span>
              </label>
            ))}
          </div>
          {errors.socios_modalidad && (
            <p className="text-red-500 text-xs">{errors.socios_modalidad}</p>
          )}
        </div>
      )}

      {controlada === "no" && (
        <p className="text-sm text-gray-700">
          Indique los socios o accionistas con su número de cédula
          (ecuatorianos) o pasaporte (extranjeros).
        </p>
      )}

      {controlada && modalidad === "lista" && (
        <div className="space-y-3">
          {socios.map((socio, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="col-span-12 md:col-span-5">
                <label className="block text-xs text-gray-600 mb-1">
                  Nombres y apellidos
                </label>
                <input
                  type="text"
                  value={socio.nombres}
                  onChange={(e) =>
                    setSocio(i, "nombres", e.target.value.toUpperCase())
                  }
                  className={inputClass(errors, `socios_${i}_nombres`)}
                  placeholder="NOMBRES Y APELLIDOS"
                />
                {errors[`socios_${i}_nombres`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`socios_${i}_nombres`]}
                  </p>
                )}
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">
                  Documento
                </label>
                <select
                  value={socio.tipo_documento}
                  onChange={(e) =>
                    setSocio(i, "tipo_documento", e.target.value)
                  }
                  className={inputClass(errors, `socios_${i}_tipo_documento`)}
                >
                  <option value="cedula">Cédula</option>
                  <option value="pasaporte">Pasaporte</option>
                </select>
              </div>
              <div className="col-span-8 md:col-span-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Número{docObligatorio ? "" : " (opcional)"}
                </label>
                <input
                  type="text"
                  value={socio.numero_documento}
                  onChange={(e) =>
                    setSocio(
                      i,
                      "numero_documento",
                      e.target.value.toUpperCase(),
                    )
                  }
                  className={inputClass(errors, `socios_${i}_numero_documento`)}
                  maxLength={socio.tipo_documento === "cedula" ? 10 : 20}
                />
                {errors[`socios_${i}_numero_documento`] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[`socios_${i}_numero_documento`]}
                  </p>
                )}
              </div>
              <div className="col-span-8 md:col-span-1">
                <label className="block text-xs text-gray-600 mb-1">%</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={socio.porcentaje}
                  onChange={(e) => setSocio(i, "porcentaje", e.target.value)}
                  className={inputClass(errors, `socios_${i}_porcentaje`)}
                />
              </div>
              <div className="col-span-4 md:col-span-1 flex items-end">
                {socios.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitar(i)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium pb-2"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={agregar}
            className="text-sm px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            + Agregar socio o accionista
          </button>
        </div>
      )}

      {controlada === "si" && modalidad === "anexo" && (
        <div className="p-3 border border-gray-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nómina de socios o accionistas (PDF)
          </label>
          {datos.anexo_socios_nombre ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-700">{datos.anexo_socios_nombre}</span>
              <button
                type="button"
                onClick={quitarArchivo}
                className="text-red-600 hover:text-red-800 text-xs font-medium"
              >
                Quitar
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleArchivo}
              className="block text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          )}
          <p className="text-xs text-gray-500 mt-1">
            Máximo {MAX_ANEXO_MB} MB.
          </p>
          {errorArchivo && (
            <p className="text-red-500 text-xs mt-1">{errorArchivo}</p>
          )}
          {errors.anexo_socios && (
            <p className="text-red-500 text-xs mt-1">{errors.anexo_socios}</p>
          )}
        </div>
      )}

      {controlada === "si" && modalidad === "autorizacion" && (
        <label className="flex items-start gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={!!datos.autoriza_consulta_supercias}
            onChange={(e) =>
              onChange("autoriza_consulta_supercias", e.target.checked)
            }
            className="mt-0.5"
          />
          <span className="text-sm text-gray-800">
            Autorizo a la Notaría Vigésimo Segunda del cantón Quito a consultar
            la nómina de socios o accionistas de la empresa en la web de la
            Superintendencia de Compañías.
          </span>
        </label>
      )}
      {errors.autoriza_consulta_supercias && (
        <p className="text-red-500 text-xs">
          {errors.autoriza_consulta_supercias}
        </p>
      )}

      {errors.socios && <p className="text-red-500 text-xs">{errors.socios}</p>}
    </div>
  );
};

const SeccionUAFE = ({
  datos,
  onChange,
  errors,
  prefijo = "",
  mostrarOrigenFondos = false,
  esRepresentado = false,
  tituloFinanciero = "Información Financiera",
}) => {
  const esPepDirecto = datos[`${prefijo}es_pep`] === "si";
  const noesPep = datos[`${prefijo}es_pep`] === "no";
  const esPepIndirecto =
    noesPep && datos[`${prefijo}es_pep_indirecto`] === "si";
  const noEsPepIndirecto =
    noesPep && datos[`${prefijo}es_pep_indirecto`] === "no";
  const actEco = datos[`${prefijo}actividad_economica`];
  // El representante legal de una empresa no ve las opciones solo de personas
  const esRepresentanteEmpresa = prefijo === "rep_";
  const labelOrigenFondos =
    datos[`${prefijo}rol_tramite`] === "adquirente"
      ? "Origen de los fondos con los que pagará el bien que adquiere"
      : "Origen de los fondos con los que adquirió el bien que transfiere";

  return (
    <>
      <h3 className="font-medium text-gray-700 pt-2 border-t">
        {tituloFinanciero}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Actividad Económica
          </label>
          <select
            value={datos[`${prefijo}actividad_economica`]}
            onChange={(e) =>
              onChange(`${prefijo}actividad_economica`, e.target.value)
            }
            className={inputClass(errors, `${prefijo}actividad_economica`)}
          >
            <option value="">Seleccione</option>
            {ACTIVIDADES_ECONOMICAS.filter(
              (a) => !(esRepresentanteEmpresa && a.soloPersona),
            ).map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          {errors[`${prefijo}actividad_economica`] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[`${prefijo}actividad_economica`]}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingreso Mensual (USD)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={datos[`${prefijo}ingreso_mensual`]}
            onChange={(e) =>
              onChange(`${prefijo}ingreso_mensual`, e.target.value)
            }
            className={inputClass(errors, `${prefijo}ingreso_mensual`)}
            placeholder="Ej: 1500"
          />
          {errors[`${prefijo}ingreso_mensual`] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[`${prefijo}ingreso_mensual`]}
            </p>
          )}
        </div>
        {actEco === "otro" && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especifique su actividad económica
            </label>
            <input
              type="text"
              value={datos[`${prefijo}actividad_economica_otra`] || ""}
              onChange={(e) =>
                onChange(`${prefijo}actividad_economica_otra`, e.target.value)
              }
              className={inputClass(
                errors,
                `${prefijo}actividad_economica_otra`,
              )}
              placeholder="Ej: Agricultor"
              maxLength={200}
            />
            {errors[`${prefijo}actividad_economica_otra`] && (
              <p className="text-red-500 text-xs mt-1">
                {errors[`${prefijo}actividad_economica_otra`]}
              </p>
            )}
          </div>
        )}
        {(actEco === "empleado" || actEco === "independiente") && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa o Institución de Trabajo
            </label>
            <input
              type="text"
              value={datos[`${prefijo}empresa_trabajo`]}
              onChange={(e) =>
                onChange(`${prefijo}empresa_trabajo`, e.target.value)
              }
              className={inputClass(errors, `${prefijo}empresa_trabajo`)}
              placeholder="Ej: Empresa XYZ S.A."
            />
          </div>
        )}
      </div>

      {mostrarOrigenFondos && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            ¿En qué calidad participa en el trámite?
          </label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onChange(`${prefijo}rol_tramite`, "vendedor")}
              className={`px-3 py-2 rounded-lg text-xs font-medium text-left ${datos[`${prefijo}rol_tramite`] === "vendedor" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              TRADENTE/S – VENDEDOR/ES – DONANTE/S – CEDENTE/S – ADJUDICANTE/S -
              ACREEDORES - OTORGANTES
            </button>
            <button
              type="button"
              onClick={() => onChange(`${prefijo}rol_tramite`, "adquirente")}
              className={`px-3 py-2 rounded-lg text-xs font-medium text-left ${datos[`${prefijo}rol_tramite`] === "adquirente" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              ADQUIRIENTE/S – COMPRADOR/ES – DONATARIO/S – CESIONARIO/S –
              ADJUDICATARIO/S - DEUDORES - BENEFICIARIOS
            </button>
          </div>
          {errors[`${prefijo}rol_tramite`] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[`${prefijo}rol_tramite`]}
            </p>
          )}
          {datos[`${prefijo}rol_tramite`] && (
            <SeccionOrigenFondos
              datos={datos}
              onChange={onChange}
              errors={errors}
              prefijo={prefijo}
              label={labelOrigenFondos}
            />
          )}
        </div>
      )}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {esRepresentado
            ? "¿Es su Mandante una Persona Políticamente Expuesta (PEP)?"
            : "¿Es usted una Persona Políticamente Expuesta (PEP)?"}
        </label>
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs text-blue-800 leading-relaxed">
            Una <strong>Persona Políticamente Expuesta (PEP)</strong> es alguien
            que desempeña o ha desempeñado funciones públicas de alto perfil
            (Presidente, Ministros, Alcaldes, Asambleístas, entre otros), o sus
            familiares cercanos. Esta consulta es{" "}
            <strong>únicamente informativa</strong> y de cumplimiento legal — el
            ser PEP o tener un familiar PEP{" "}
            <strong>no afecta de ninguna manera</strong> el trámite notarial.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              onChange(`${prefijo}es_pep`, "si");
              onChange(`${prefijo}es_pep_indirecto`, "");
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${esPepDirecto ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => onChange(`${prefijo}es_pep`, "no")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${noesPep ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            No
          </button>
        </div>
        {errors[`${prefijo}es_pep`] && (
          <p className="text-red-500 text-xs mt-1">
            {errors[`${prefijo}es_pep`]}
          </p>
        )}
      </div>

      {esPepDirecto && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg space-y-4">
          <p className="text-sm text-amber-800 font-medium">
            (SI USTED ES UNA PERSONA EXPUESTA POLÍTICAMENTE) Complete la
            siguiente información:
          </p>
          <FormularioPEP
            datos={datos}
            onChange={onChange}
            errors={errors}
            prefijo={prefijo}
            mostrarGrado={false}
            mostrarNombre={false}
          />
          <SeccionPatrimonio
            datos={datos}
            onChange={onChange}
            errors={errors}
            prefijo={prefijo}
          />
        </div>
      )}

      {noesPep && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            ¿Es pariente, amigo o colaborador de una Persona Políticamente
            Expuesta?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange(`${prefijo}es_pep_indirecto`, "si")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${esPepIndirecto ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => onChange(`${prefijo}es_pep_indirecto`, "no")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${noEsPepIndirecto ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              No
            </button>
          </div>
          {errors[`${prefijo}es_pep_indirecto`] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[`${prefijo}es_pep_indirecto`]}
            </p>
          )}
        </div>
      )}

      {esPepIndirecto && (
        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg space-y-4">
          <p className="text-sm text-orange-800 font-medium">
            Complete los datos de la Persona Políticamente Expuesta (PEP) con
            quien tiene relación:
          </p>
          <FormularioPEP
            datos={datos}
            onChange={onChange}
            errors={errors}
            prefijo={prefijo}
            mostrarGrado={true}
            mostrarNombre={true}
          />
          <SeccionPatrimonio
            datos={datos}
            onChange={onChange}
            errors={errors}
            prefijo={prefijo}
          />
        </div>
      )}
    </>
  );
};

// ============================================
// FORMULARIO PERSONA NATURAL
// ============================================
const FormularioPersona = ({
  titulo,
  datos,
  onChange,
  errors,
  mostrarEstadoCivil = true,
  mostrarRolTramite = true,
  esRepresentado = false,
  mismaDir,
  onToggleMismaDir,
  documentoFijo = false,
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
    <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">
      {titulo}
    </h2>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Documento
        </label>
        <select
          value={datos.document_type}
          onChange={(e) => onChange("document_type", e.target.value)}
          className={inputClass(errors, "document_type")}
          disabled={documentoFijo}
        >
          <option value="cedula">Cédula</option>
          <option value="pasaporte">Pasaporte</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {datos.document_type === "cedula"
            ? "Número de Cédula"
            : "Número de Pasaporte"}
        </label>
        <input
          type="text"
          value={datos.document_number}
          onChange={(e) => onChange("document_number", e.target.value)}
          className={inputClass(errors, "document_number")}
          placeholder={
            datos.document_type === "cedula" ? "0000000000" : "AB123456"
          }
          maxLength={datos.document_type === "cedula" ? 10 : 13}
          readOnly={documentoFijo}
        />
        {documentoFijo && (
          <p className="text-xs text-gray-500 mt-1">
            Este enlace fue generado para este documento.
          </p>
        )}
        {errors.document_number && (
          <p className="text-red-500 text-xs mt-1">{errors.document_number}</p>
        )}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombres
        </label>
        <input
          type="text"
          value={datos.names}
          onChange={(e) => onChange("names", e.target.value.toUpperCase())}
          className={inputClass(errors, "names")}
          placeholder="NOMBRES"
        />
        {errors.names && (
          <p className="text-red-500 text-xs mt-1">{errors.names}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Apellidos
        </label>
        <input
          type="text"
          value={datos.last_names}
          onChange={(e) => onChange("last_names", e.target.value.toUpperCase())}
          className={inputClass(errors, "last_names")}
          placeholder="APELLIDOS"
        />
        {errors.last_names && (
          <p className="text-red-500 text-xs mt-1">{errors.last_names}</p>
        )}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Género
        </label>
        <select
          value={datos.gender}
          onChange={(e) => onChange("gender", e.target.value)}
          className={inputClass(errors, "gender")}
        >
          <option value="">Seleccione</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
        </select>
        {errors.gender && (
          <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
        )}
      </div>
      {mostrarEstadoCivil && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado Civil
          </label>
          <select
            value={datos.marital_status}
            onChange={(e) => onChange("marital_status", e.target.value)}
            className={inputClass(errors, "marital_status")}
          >
            <option value="">Seleccione</option>
            <option value="soltero">Soltero/a</option>
            <option value="casado">Casado/a</option>
            <option value="divorciado">Divorciado/a</option>
            <option value="viudo">Viudo/a</option>
          </select>
          {errors.marital_status && (
            <p className="text-red-500 text-xs mt-1">{errors.marital_status}</p>
          )}
        </div>
      )}
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nacionalidad
        </label>
        <input
          type="text"
          value={datos.nationality}
          onChange={(e) =>
            onChange("nationality", e.target.value.toLowerCase())
          }
          className={inputClass(errors, "nationality")}
          placeholder="ecuatoriana"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de Nacimiento
        </label>
        <input
          type="date"
          value={datos.birth_date}
          onChange={(e) => onChange("birth_date", e.target.value)}
          className={inputClass(errors, "birth_date")}
        />
        {errors.birth_date && (
          <p className="text-red-500 text-xs mt-1">{errors.birth_date}</p>
        )}
      </div>
    </div>

    <h3 className="font-medium text-gray-700 pt-2 border-t">Contacto</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo Electrónico
        </label>
        <input
          type="email"
          value={datos.email}
          onChange={(e) => onChange("email", e.target.value)}
          className={inputClass(errors, "email")}
          placeholder="correo@ejemplo.com"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono Celular
        </label>
        <input
          type="text"
          value={datos.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className={inputClass(errors, "phone")}
          placeholder="0987654321"
          maxLength={10}
        />
        {errors.phone && (
          <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
        )}
      </div>
    </div>

    {onToggleMismaDir !== undefined && (
      <label className="flex items-center gap-2 cursor-pointer pt-2 border-t">
        <input
          type="checkbox"
          checked={mismaDir}
          onChange={onToggleMismaDir}
          className="w-4 h-4 rounded text-blue-600"
        />
        <span className="text-sm text-gray-700">
          Misma dirección que el titular
        </span>
      </label>
    )}

    {!onToggleMismaDir || !mismaDir ? (
      <SeccionDireccion datos={datos} onChange={onChange} errors={errors} />
    ) : (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500">
          ✓ Usando la misma dirección del titular
        </p>
      </div>
    )}

    <h3 className="font-medium text-gray-700 pt-2 border-t">Ocupación</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ocupación
        </label>
        <input
          type="text"
          value={datos.occupation}
          onChange={(e) => onChange("occupation", e.target.value)}
          className={inputClass(errors, "occupation")}
          placeholder="Ej: comerciante"
        />
        {errors.occupation && (
          <p className="text-red-500 text-xs mt-1">{errors.occupation}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profesión (opcional)
        </label>
        <input
          type="text"
          value={datos.profession}
          onChange={(e) => onChange("profession", e.target.value)}
          className={inputClass(errors, "profession")}
          placeholder="Ej: Ingeniero Civil"
        />
      </div>
    </div>

    <SeccionUAFE
      datos={datos}
      onChange={onChange}
      errors={errors}
      mostrarOrigenFondos={mostrarRolTramite}
      esRepresentado={esRepresentado}
    />
  </div>
);

// ============================================
// FORMULARIO EMPRESA
// ============================================
const FormularioEmpresa = ({
  datos,
  onChange,
  errors,
  documentoFijo = false,
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
    <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">
      Datos de la Empresa
    </h2>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          RUC
        </label>
        <input
          type="text"
          value={datos.ruc}
          onChange={(e) => onChange("ruc", e.target.value)}
          className={inputClass(errors, "ruc")}
          placeholder="0000000000001"
          maxLength={13}
          readOnly={documentoFijo}
        />
        {documentoFijo && (
          <p className="text-xs text-gray-500 mt-1">
            Este enlace fue generado para este RUC.
          </p>
        )}

        {errors.ruc && (
          <p className="text-red-500 text-xs mt-1">{errors.ruc}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Razón Social
        </label>
        <input
          type="text"
          value={datos.razon_social}
          onChange={(e) =>
            onChange("razon_social", e.target.value.toUpperCase())
          }
          className={inputClass(errors, "razon_social")}
          placeholder="EMPRESA XYZ S.A."
        />
        {errors.razon_social && (
          <p className="text-red-500 text-xs mt-1">{errors.razon_social}</p>
        )}
      </div>
    </div>
    <h3 className="font-medium text-gray-700 pt-2 border-t">
      Contacto de la Empresa
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo Electrónico
        </label>
        <input
          type="email"
          value={datos.email}
          onChange={(e) => onChange("email", e.target.value)}
          className={inputClass(errors, "email")}
          placeholder="empresa@ejemplo.com"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        <input
          type="text"
          value={datos.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className={inputClass(errors, "phone")}
          placeholder="0987654321"
          maxLength={10}
        />
        {errors.phone && (
          <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
        )}
      </div>
    </div>
    <SeccionDireccion
      datos={datos}
      onChange={onChange}
      errors={errors}
      titulo="Dirección de la Empresa"
    />
    <h3 className="font-medium text-gray-700 pt-2 border-t">
      Información Financiera de la Empresa
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Actividad Económica Principal
        </label>
        <input
          type="text"
          value={datos.actividad_empresa}
          onChange={(e) => onChange("actividad_empresa", e.target.value)}
          className={inputClass(errors, "actividad_empresa")}
          placeholder="Ej: Comercialización de materiales de construcción"
        />
        {errors.actividad_empresa && (
          <p className="text-red-500 text-xs mt-1">
            {errors.actividad_empresa}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ingreso Mensual (USD)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={datos.ingreso_mensual}
          onChange={(e) => onChange("ingreso_mensual", e.target.value)}
          className={inputClass(errors, "ingreso_mensual")}
          placeholder="Ej: 50000"
        />
        {errors.ingreso_mensual && (
          <p className="text-red-500 text-xs mt-1">{errors.ingreso_mensual}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Egreso Mensual (USD)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={datos.egreso_mensual}
          onChange={(e) => onChange("egreso_mensual", e.target.value)}
          className={inputClass(errors, "egreso_mensual")}
          placeholder="Ej: 35000"
        />
        {errors.egreso_mensual && (
          <p className="text-red-500 text-xs mt-1">{errors.egreso_mensual}</p>
        )}
      </div>
    </div>
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        ¿En qué calidad participa la empresa en el trámite?
      </label>
      <div className="flex flex-col gap-2">
        {[
          {
            v: "vendedor",
            l: "TRADENTE – VENDEDORA – DONANTE – CEDENTE – ADJUDICANTE - ACREEDORA - OTORGANTE",
          },
          {
            v: "adquirente",
            l: "ADQUIRIENTE – COMPRADORA – DONATARIA – CESIONARIA – ADJUDICATARIA - DEUDORA - BENEFICIARIA",
          },
        ].map(({ v, l }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange("rol_tramite", v)}
            className={`px-3 py-2 rounded-lg text-xs font-medium text-left ${datos.rol_tramite === v ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {errors.rol_tramite && (
        <p className="text-red-500 text-xs mt-1">{errors.rol_tramite}</p>
      )}
      {datos.rol_tramite && (
        <SeccionOrigenFondos
          datos={datos}
          onChange={onChange}
          errors={errors}
          prefijo=""
          label={
            datos.rol_tramite === "adquirente"
              ? "Origen de los fondos con los que la empresa pagará el bien que adquiere"
              : "Origen de los fondos con los que la empresa adquirió el bien que transfiere"
          }
        />
      )}
    </div>
    <SeccionSocios datos={datos} onChange={onChange} errors={errors} />
    <div className="border-t-2 border-blue-200 pt-4">
      <h2 className="font-semibold text-blue-900 text-lg mb-4">
        Representante Legal
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento
          </label>
          <select
            value={datos.rep_document_type}
            onChange={(e) => onChange("rep_document_type", e.target.value)}
            className={inputClass(errors, "rep_document_type")}
          >
            <option value="cedula">Cédula</option>
            <option value="pasaporte">Pasaporte</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {datos.rep_document_type === "cedula"
              ? "Número de Cédula"
              : "Número de Pasaporte"}
          </label>
          <input
            type="text"
            value={datos.rep_document_number}
            onChange={(e) => onChange("rep_document_number", e.target.value)}
            className={inputClass(errors, "rep_document_number")}
            placeholder="0000000000"
            maxLength={datos.rep_document_type === "cedula" ? 10 : 13}
          />
          {errors.rep_document_number && (
            <p className="text-red-500 text-xs mt-1">
              {errors.rep_document_number}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombres
          </label>
          <input
            type="text"
            value={datos.rep_names}
            onChange={(e) =>
              onChange("rep_names", e.target.value.toUpperCase())
            }
            className={inputClass(errors, "rep_names")}
            placeholder="NOMBRES"
          />
          {errors.rep_names && (
            <p className="text-red-500 text-xs mt-1">{errors.rep_names}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellidos
          </label>
          <input
            type="text"
            value={datos.rep_last_names}
            onChange={(e) =>
              onChange("rep_last_names", e.target.value.toUpperCase())
            }
            className={inputClass(errors, "rep_last_names")}
            placeholder="APELLIDOS"
          />
          {errors.rep_last_names && (
            <p className="text-red-500 text-xs mt-1">{errors.rep_last_names}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Género
          </label>
          <select
            value={datos.rep_gender}
            onChange={(e) => onChange("rep_gender", e.target.value)}
            className={inputClass(errors, "rep_gender")}
          >
            <option value="">Seleccione</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
          {errors.rep_gender && (
            <p className="text-red-500 text-xs mt-1">{errors.rep_gender}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cargo
          </label>
          <input
            type="text"
            value={datos.rep_position}
            onChange={(e) => onChange("rep_position", e.target.value)}
            className={inputClass(errors, "rep_position")}
            placeholder="Ej: Gerente General"
          />
          {errors.rep_position && (
            <p className="text-red-500 text-xs mt-1">{errors.rep_position}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nacionalidad
          </label>
          <input
            type="text"
            value={datos.rep_nationality}
            onChange={(e) =>
              onChange("rep_nationality", e.target.value.toLowerCase())
            }
            className={inputClass(errors, "rep_nationality")}
            placeholder="ecuatoriana"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Nacimiento
          </label>
          <input
            type="date"
            value={datos.rep_birth_date}
            onChange={(e) => onChange("rep_birth_date", e.target.value)}
            className={inputClass(errors, "rep_birth_date")}
          />
          {errors.rep_birth_date && (
            <p className="text-red-500 text-xs mt-1">{errors.rep_birth_date}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={datos.rep_email}
            onChange={(e) => onChange("rep_email", e.target.value)}
            className={inputClass(errors, "rep_email")}
            placeholder="rep@empresa.com"
          />
          {errors.rep_email && (
            <p className="text-red-500 text-xs mt-1">{errors.rep_email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="text"
            value={datos.rep_phone}
            onChange={(e) => onChange("rep_phone", e.target.value)}
            className={inputClass(errors, "rep_phone")}
            placeholder="0987654321"
            maxLength={10}
          />
          {errors.rep_phone && (
            <p className="text-red-500 text-xs mt-1">{errors.rep_phone}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ocupación
          </label>
          <input
            type="text"
            value={datos.rep_occupation}
            onChange={(e) => onChange("rep_occupation", e.target.value)}
            className={inputClass(errors, "rep_occupation")}
            placeholder="Ej: empresario"
          />
          {errors.rep_occupation && (
            <p className="text-red-500 text-xs mt-1">{errors.rep_occupation}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profesión (opcional)
          </label>
          <input
            type="text"
            value={datos.rep_profession}
            onChange={(e) => onChange("rep_profession", e.target.value)}
            className={inputClass(errors, "rep_profession")}
            placeholder="Ej: Ingeniero"
          />
        </div>
      </div>
      <SeccionDireccion
        datos={datos}
        onChange={onChange}
        errors={errors}
        prefijo="rep_"
        titulo="Dirección del Representante Legal"
      />
      <SeccionUAFE
        datos={datos}
        onChange={onChange}
        errors={errors}
        prefijo="rep_"
        mostrarOrigenFondos={true}
        tituloFinanciero="Información Financiera del Representante Legal"
      />
    </div>
  </div>
);

// ============================================
// PREPARACIÓN DEL PAYLOAD
// ============================================
// El backend rechaza "" en fechas, números y campos con opciones fijas.
const vaciosANull = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === "" ? null : v]),
  );

// Campos que solo existen en el formulario (no en la base de datos)
const quitarCamposTemporales = (obj, p = "") => {
  const copia = { ...obj };
  delete copia[`${p}origen_fondos_lista`];
  delete copia[`${p}origen_fondos_detalle`];
  delete copia[`${p}origen_fondos_otros_check`];
  delete copia[`${p}origen_fondos_otros`];
  return copia;
};

// Normaliza los datos UAFE (origen de fondos, PEP, patrimonio) con un prefijo
// ("" para personas, "rep_" para el representante legal de una empresa).
const prepararUAFE = (datos, p = "") => {
  const esPep = datos[`${p}es_pep`] === "si";
  const esIndirecto = !esPep && datos[`${p}es_pep_indirecto`] === "si";
  const tienePep = esPep || esIndirecto;
  const yaNoEjerce = tienePep && !!datos[`${p}pep_ya_no_ejerce`];
  const val = (campo) => datos[`${p}${campo}`] || null;

  return {
    [`${p}origen_fondos`]: datos[`${p}rol_tramite`]
      ? construirOrigenFondosTexto(datos, p) || null
      : null,
    [`${p}actividad_economica_otra`]:
      datos[`${p}actividad_economica`] === "otro"
        ? (datos[`${p}actividad_economica_otra`] || "").trim() || null
        : null,
    [`${p}es_pep`]: esPep,
    [`${p}es_pep_indirecto`]: datos[`${p}es_pep`] === "no" ? esIndirecto : null,
    [`${p}pep_nombre`]: esIndirecto ? val("pep_nombre") : null,
    [`${p}pep_institucion`]: tienePep ? val("pep_institucion") : null,
    [`${p}pep_cargo`]: tienePep ? val("pep_cargo") : null,
    [`${p}pep_fecha_inicio`]: tienePep ? val("pep_fecha_inicio") : null,
    [`${p}pep_ya_no_ejerce`]: tienePep ? yaNoEjerce : null,
    [`${p}pep_fecha_fin`]: yaNoEjerce ? val("pep_fecha_fin") : null,
    [`${p}pep_relacion_tipo`]: esIndirecto ? val("pep_relacion_tipo") : null,
    [`${p}pep_grado_relacion`]: esIndirecto ? val("pep_grado_relacion") : null,
    [`${p}pep_anios_trabajo`]: null,
    [`${p}patrimonio`]: tienePep
      ? limpiarPatrimonio(datos[`${p}patrimonio`])
      : null,
  };
};

// ============================================
// VALIDACIONES
// ============================================
// El cónyuge, el representado y su cónyuge guardan sus datos SIN prefijo
// (names, email...), pero sus errores se muestran con prefijo (c_, r_, cr_)
// para no mezclarse con los del titular: se valida sin prefijo y luego se agrega.
const conPrefijo = (errores, prefijo) =>
  Object.fromEntries(
    Object.entries(errores).map(([campo, msg]) => [prefijo + campo, msg]),
  );

const validarPersona = (datos, prefijo = "") => {
  const e = {};
  const p = prefijo;
  if (!datos[`${p}document_number`]) e[`${p}document_number`] = "Requerido";
  else if (
    datos[`${p}document_type`] === "cedula" &&
    !/^\d{10}$/.test(datos[`${p}document_number`])
  )
    e[`${p}document_number`] = "La cédula debe tener 10 dígitos.";
  if (!datos[`${p}names`]?.trim()) e[`${p}names`] = "Requerido";
  if (!datos[`${p}last_names`]?.trim()) e[`${p}last_names`] = "Requerido";
  if (!datos[`${p}gender`]) e[`${p}gender`] = "Requerido";
  if (!datos[`${p}birth_date`]) e[`${p}birth_date`] = "Requerido";
  if (!datos[`${p}email`]) e[`${p}email`] = "Requerido";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos[`${p}email`]))
    e[`${p}email`] = "Correo electrónico inválido.";
  if (!datos[`${p}phone`]) e[`${p}phone`] = "Requerido";
  if (!datos[`${p}province`]) e[`${p}province`] = "Requerido";
  if (!datos[`${p}canton`]) e[`${p}canton`] = "Requerido";
  if (!datos[`${p}parroquia`]) e[`${p}parroquia`] = "Requerido";
  if (!datos[`${p}main_street`]) e[`${p}main_street`] = "Requerido";
  if (!datos[`${p}secondary_street`]) e[`${p}secondary_street`] = "Requerido";
  if (!datos[`${p}occupation`]) e[`${p}occupation`] = "Requerido";
  return e;
};

const validarOrigenFondos = (datos, p = "") => {
  const e = {};
  const lista = datos[`${p}origen_fondos_lista`] || [];
  const detalle = datos[`${p}origen_fondos_detalle`] || {};
  if (lista.length === 0) {
    e[`${p}origen_fondos`] = "Seleccione al menos una opción.";
    return e;
  }
  ORIGENES_FONDOS.filter((o) => lista.includes(o.value) && o.detalles).forEach(
    (o) => {
      o.detalles.forEach((d) => {
        const clave = `${o.value}_${d.key}`;
        if (!(detalle[clave] || "").toString().trim())
          e[`${p}origen_fondos_${clave}`] = "Requerido";
      });
    },
  );
  return e;
};

const validarPatrimonio = (datos, p = "") => {
  const e = {};
  const pat = { ...patrimonioInicial(), ...(datos[`${p}patrimonio`] || {}) };
  const k = (c) => `${p}patrimonio_${c}`;
  const vacio = (v) => !String(v ?? "").trim();

  if (!pat.no_posee_inmuebles) {
    if (pat.inmuebles.length === 0)
      e[k("inmuebles")] = "Agregue sus inmuebles o marque que no posee.";
    pat.inmuebles.forEach((inm, i) => {
      if (vacio(inm.tipo)) e[k(`inmuebles_${i}_tipo`)] = "Requerido";
      else if (inm.tipo === "otro" && vacio(inm.especificar))
        e[k(`inmuebles_${i}_especificar`)] = "Especifique el tipo de inmueble.";
      if (vacio(inm.ciudad)) e[k(`inmuebles_${i}_ciudad`)] = "Requerido";
      if (vacio(inm.valor)) e[k(`inmuebles_${i}_valor`)] = "Requerido";
    });
  }

  if (!pat.no_posee_vehiculos) {
    if (pat.vehiculos.length === 0)
      e[k("vehiculos")] = "Agregue sus vehículos o marque que no posee.";
    pat.vehiculos.forEach((veh, i) => {
      if (vacio(veh.marca)) e[k(`vehiculos_${i}_marca`)] = "Requerido";
      if (vacio(veh.modelo)) e[k(`vehiculos_${i}_modelo`)] = "Requerido";
      if (vacio(veh.placa)) e[k(`vehiculos_${i}_placa`)] = "Requerido";
      else if (!/^[A-Z0-9-]{5,10}$/i.test(veh.placa.trim()))
        e[k(`vehiculos_${i}_placa`)] = "Placa inválida.";
      if (vacio(veh.valor)) e[k(`vehiculos_${i}_valor`)] = "Requerido";
    });
  }

  if (!pat.no_posee_inversiones && vacio(pat.inversiones))
    e[k("inversiones")] = "Indique las entidades o marque que no posee.";

  if (!pat.no_posee_acciones) {
    const acciones = pat.acciones || [];
    if (acciones.length === 0)
      e[k("acciones")] = "Agregue sus inversiones o marque que no posee.";
    acciones.forEach((acc, i) => {
      if (vacio(acc.entidad)) e[k(`acciones_${i}_entidad`)] = "Requerido";
      if (vacio(acc.monto)) e[k(`acciones_${i}_monto`)] = "Requerido";
    });
  }
  return e;
};

const validarDatosPEP = (datos, p = "", esIndirecto = false) => {
  const e = {};
  if (!datos[`${p}pep_cargo`]) e[`${p}pep_cargo`] = "Requerido";
  if (!datos[`${p}pep_institucion`]) e[`${p}pep_institucion`] = "Requerido";
  if (!datos[`${p}pep_fecha_inicio`]) e[`${p}pep_fecha_inicio`] = "Requerido";
  if (datos[`${p}pep_ya_no_ejerce`]) {
    if (!datos[`${p}pep_fecha_fin`]) e[`${p}pep_fecha_fin`] = "Requerido";
    else if (
      datos[`${p}pep_fecha_inicio`] &&
      datos[`${p}pep_fecha_fin`] < datos[`${p}pep_fecha_inicio`]
    )
      e[`${p}pep_fecha_fin`] = "No puede ser anterior a la fecha de inicio.";
  }
  if (esIndirecto) {
    if (!datos[`${p}pep_nombre`]) e[`${p}pep_nombre`] = "Requerido";
    if (!datos[`${p}pep_relacion_tipo`])
      e[`${p}pep_relacion_tipo`] = "Requerido";
    if (!datos[`${p}pep_grado_relacion`])
      e[`${p}pep_grado_relacion`] = "Requerido";
  }
  return { ...e, ...validarPatrimonio(datos, p) };
};

const validarUAFE = (datos, prefijo = "", validarOrigen = false) => {
  let e = {};
  const p = prefijo;
  if (!datos[`${p}actividad_economica`])
    e[`${p}actividad_economica`] = "Requerido";
  else if (
    datos[`${p}actividad_economica`] === "otro" &&
    !(datos[`${p}actividad_economica_otra`] || "").trim()
  )
    e[`${p}actividad_economica_otra`] = "Especifique su actividad.";
  if (!datos[`${p}ingreso_mensual`]) e[`${p}ingreso_mensual`] = "Requerido";
  if (validarOrigen) {
    if (!datos[`${p}rol_tramite`]) e[`${p}rol_tramite`] = "Requerido";
    else e = { ...e, ...validarOrigenFondos(datos, p) };
  }
  if (!datos[`${p}es_pep`]) e[`${p}es_pep`] = "Requerido";
  if (datos[`${p}es_pep`] === "si")
    e = { ...e, ...validarDatosPEP(datos, p, false) };
  if (datos[`${p}es_pep`] === "no") {
    if (!datos[`${p}es_pep_indirecto`]) e[`${p}es_pep_indirecto`] = "Requerido";
    if (datos[`${p}es_pep_indirecto`] === "si")
      e = { ...e, ...validarDatosPEP(datos, p, true) };
  }
  return e;
};

const validarSocios = (datos) => {
  const e = {};
  if (!datos.controlada_supercias) {
    e.controlada_supercias = "Requerido";
    return e;
  }
  const controlada = datos.controlada_supercias === "si";
  const modalidad = controlada ? datos.socios_modalidad : "lista";

  if (!modalidad) {
    e.socios_modalidad = "Elija cómo va a informar los socios o accionistas.";
    return e;
  }
  if (modalidad === "anexo") {
    if (!datos.anexo_socios_base64)
      e.anexo_socios = "Adjunte la nómina en PDF.";
    return e;
  }
  if (modalidad === "autorizacion") {
    if (!datos.autoriza_consulta_supercias)
      e.autoriza_consulta_supercias = "Debe marcar la autorización.";
    return e;
  }

  const socios = (datos.socios || []).filter(
    (s) => s.nombres.trim() || s.numero_documento.trim(),
  );
  (datos.socios || []).forEach((s, i) => {
    const tieneAlgo = s.nombres.trim() || s.numero_documento.trim();
    if (!tieneAlgo) return;
    if (!s.nombres.trim()) e[`socios_${i}_nombres`] = "Requerido";
    const num = s.numero_documento.trim();
    if (!controlada && !num) e[`socios_${i}_numero_documento`] = "Requerido";
    if (num && s.tipo_documento === "cedula" && !/^\d{10}$/.test(num))
      e[`socios_${i}_numero_documento`] = "La cédula debe tener 10 dígitos.";
  });
  if (socios.length === 0) e.socios = "Ingrese al menos un socio o accionista.";
  return e;
};

const validarEmpresa = (datos) => {
  const e = {};
  if (!datos.ruc) e.ruc = "Requerido";
  else if (!/^\d{13}$/.test(datos.ruc)) e.ruc = "El RUC debe tener 13 dígitos.";
  if (!datos.razon_social?.trim()) e.razon_social = "Requerido";
  if (!datos.email) e.email = "Requerido";
  if (!datos.phone) e.phone = "Requerido";
  if (!datos.province) e.province = "Requerido";
  if (!datos.canton) e.canton = "Requerido";
  if (!datos.parroquia) e.parroquia = "Requerido";
  if (!datos.main_street) e.main_street = "Requerido";
  if (!datos.secondary_street) e.secondary_street = "Requerido";
  if (!datos.number_street) e.number_street = "Requerido";
  if (!datos.actividad_empresa?.trim()) e.actividad_empresa = "Requerido";
  if (!datos.ingreso_mensual) e.ingreso_mensual = "Requerido";
  if (!datos.egreso_mensual) e.egreso_mensual = "Requerido";
  if (!datos.rol_tramite) e.rol_tramite = "Requerido";
  const errorsOrigen = datos.rol_tramite ? validarOrigenFondos(datos, "") : {};
  const errorsSocios = validarSocios(datos);
  const errorsRep = validarPersona(datos, "rep_");
  // La empresa exige número en la dirección del representante (backend)
  if (!datos.rep_number_street) errorsRep.rep_number_street = "Requerido";
  if (!datos.rep_position) errorsRep.rep_position = "Requerido";
  const errorsRepUAFE = validarUAFE(datos, "rep_", true);
  return {
    ...e,
    ...errorsOrigen,
    ...errorsSocios,
    ...errorsRep,
    ...errorsRepUAFE,
  };
};

// ============================================
// PÁGINA PRINCIPAL
// ============================================
const RegistroClientePage = () => {
  const { token } = useParams();

  const [tokenValido, setTokenValido] = useState(null);
  const [tipoRegistro, setTipoRegistro] = useState("persona");
  // Tipo y documento para los que se generó el link (vienen del backend)
  const [tokenInfo, setTokenInfo] = useState(null);
  const [calidadParticipacion, setCalidadParticipacion] = useState("");
  const [representadoEsConyugue, setRepresentadoEsConyugue] = useState(null);
  const [titular, setTitular] = useState(personaInicial());
  const [conyugue, setConyugue] = useState(personaInicial());
  const [representado, setRepresentado] = useState(personaInicial());
  const [conyugueRepresentado, setConyugueRepresentado] =
    useState(personaInicial());
  const [empresa, setEmpresa] = useState(empresaInicial());
  const [mismaDir, setMismaDir] = useState(true);
  const [mismaDirRepresentado, setMismaDirRepresentado] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [aceptaCondiciones, setAceptaCondiciones] = useState(false);
  const [modalCondiciones, setModalCondiciones] = useState(false);

  const esCasadoTitular = titular.marital_status === "casado";
  const esCasadoRepresentado = representado.marital_status === "casado";
  const titularConyugueComparece = titular.conyugue_comparece !== false;
  const representadoConyugueComparece =
    representado.conyugue_comparece !== false;

  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/public/registro/verificar/${token}`,
        );
        const data = await res.json();
        setTokenValido(data.valido);
        if (data.valido && data.tipo && data.documento) {
          setTokenInfo({ tipo: data.tipo, documento: data.documento });
          setTipoRegistro(data.tipo);
          if (data.tipo === "empresa") {
            setEmpresa((prev) => ({ ...prev, ruc: data.documento }));
          } else {
            setTitular((prev) => ({
              ...prev,
              document_number: data.documento,
              document_type: /^\d{10}$/.test(data.documento)
                ? "cedula"
                : "pasaporte",
            }));
          }
        }
      } catch {
        setTokenValido(false);
      }
    };
    verificar();
  }, [token]);

  // Sincronizar dirección del cónyuge del titular
  useEffect(() => {
    if (
      mismaDir &&
      esCasadoTitular &&
      calidadParticipacion === "propios_derechos"
    ) {
      setConyugue((prev) => ({
        ...prev,
        province: titular.province,
        canton: titular.canton,
        parroquia: titular.parroquia,
        sector: titular.sector,
        main_street: titular.main_street,
        secondary_street: titular.secondary_street,
        number_street: titular.number_street,
      }));
    }
  }, [
    mismaDir,
    esCasadoTitular,
    calidadParticipacion,
    titular.province,
    titular.canton,
    titular.parroquia,
    titular.sector,
    titular.main_street,
    titular.secondary_street,
    titular.number_street,
  ]);

  // Sincronizar dirección del cónyuge del representado
  useEffect(() => {
    if (mismaDirRepresentado && esCasadoRepresentado) {
      setConyugueRepresentado((prev) => ({
        ...prev,
        province: representado.province,
        canton: representado.canton,
        parroquia: representado.parroquia,
        sector: representado.sector,
        main_street: representado.main_street,
        secondary_street: representado.secondary_street,
        number_street: representado.number_street,
      }));
    }
  }, [
    mismaDirRepresentado,
    esCasadoRepresentado,
    representado.province,
    representado.canton,
    representado.parroquia,
    representado.sector,
    representado.main_street,
    representado.secondary_street,
    representado.number_street,
  ]);

  const handleTitularChange = (field, value) => {
    setTitular((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const handleConyugueChange = (field, value) => {
    setConyugue((prev) => ({ ...prev, [field]: value }));
    if (errors[`c_${field}`])
      setErrors((prev) => ({ ...prev, [`c_${field}`]: "" }));
  };
  const handleRepresentadoChange = (field, value) => {
    setRepresentado((prev) => ({ ...prev, [field]: value }));
    if (errors[`r_${field}`])
      setErrors((prev) => ({ ...prev, [`r_${field}`]: "" }));
  };
  const handleConyugueRepresentadoChange = (field, value) => {
    setConyugueRepresentado((prev) => ({ ...prev, [field]: value }));
    if (errors[`cr_${field}`])
      setErrors((prev) => ({ ...prev, [`cr_${field}`]: "" }));
  };
  const handleEmpresaChange = (field, value) => {
    setEmpresa((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validar = () => {
    let e = {};
    if (tipoRegistro === "empresa") {
      e = { ...e, ...validarEmpresa(empresa) };
    } else {
      if (!calidadParticipacion) e.calidadParticipacion = "Requerido";

      // Validar titular siempre
      e = { ...e, ...validarPersona(titular) };
      e = {
        ...e,
        ...validarUAFE(titular, "", true),
      };
      if (
        calidadParticipacion === "propios_derechos" ||
        calidadParticipacion === "propios_y_representando"
      ) {
        if (!titular.marital_status) e.marital_status = "Requerido";
      }

      // Cónyuge del titular
      if (
        (calidadParticipacion === "propios_derechos" ||
          calidadParticipacion === "propios_y_representando") &&
        esCasadoTitular &&
        titularConyugueComparece
      ) {
        if (
          calidadParticipacion === "propios_y_representando" &&
          representadoEsConyugue
        ) {
          // No validar cónyuge separado
        } else {
          const errC = {
            ...conPrefijo(validarPersona(conyugue), "c_"),
            ...conPrefijo(validarUAFE(conyugue, "", false), "c_"),
          };
          if (mismaDir)
            [
              "c_province",
              "c_canton",
              "c_parroquia",
              "c_main_street",
              "c_secondary_street",
              "c_number_street",
            ].forEach((k) => delete errC[k]);
          e = { ...e, ...errC };
        }
      }

      // Validar representado
      if (
        calidadParticipacion === "representando" ||
        calidadParticipacion === "propios_y_representando"
      ) {
        if (
          calidadParticipacion === "propios_y_representando" &&
          representadoEsConyugue === null
        )
          e.representadoEsConyugue = "Requerido";

        const usarRepresentadoSeparado = !(
          calidadParticipacion === "propios_y_representando" &&
          representadoEsConyugue
        );
        if (usarRepresentadoSeparado) {
          const errR = {
            ...conPrefijo(validarPersona(representado), "r_"),
            ...conPrefijo(validarUAFE(representado, "", true), "r_"),
          };
          e = { ...e, ...errR };
          // Cónyuge del representado
          if (esCasadoRepresentado && representadoConyugueComparece) {
            const errCR = {
              ...conPrefijo(validarPersona(conyugueRepresentado), "cr_"),
              ...conPrefijo(
                validarUAFE(conyugueRepresentado, "", false),
                "cr_",
              ),
            };
            if (mismaDirRepresentado)
              [
                "cr_province",
                "cr_canton",
                "cr_parroquia",
                "cr_main_street",
                "cr_secondary_street",
                "cr_number_street",
              ].forEach((k) => delete errCR[k]);
            e = { ...e, ...errCR };
          }
        }
      }
    }
    if (!aceptaPrivacidad)
      e.privacidad = "Debe aceptar el tratamiento de sus datos.";
    if (!aceptaCondiciones)
      e.condiciones = "Debe aceptar las condiciones jurídicas.";
    return e;
  };

  const prepararPersona = (datos) => {
    const base = { ...vaciosANull(datos), ...prepararUAFE(datos, "") };
    if (datos.conyugue_comparece !== false)
      base.razon_exclusion_conyugue = null;
    return quitarCamposTemporales(base, "");
  };

  const handleSubmit = async () => {
    const e = validar();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setLoading(true);
    try {
      let payload;
      if (tipoRegistro === "empresa") {
        const esControlada = empresa.controlada_supercias === "si";
        const modalidad = esControlada ? empresa.socios_modalidad : "lista";
        const sociosValidos =
          modalidad === "lista"
            ? (empresa.socios || [])
                .filter((x) => x.nombres.trim() || x.numero_documento.trim())
                .map((x) => ({
                  nombres: x.nombres.trim(),
                  tipo_documento: x.tipo_documento,
                  numero_documento: x.numero_documento.trim() || null,
                  porcentaje: x.porcentaje === "" ? null : x.porcentaje,
                }))
            : [];

        let empresaPrep = {
          ...vaciosANull(empresa),
          ...prepararUAFE(empresa, "rep_"),
          origen_fondos: empresa.rol_tramite
            ? construirOrigenFondosTexto(empresa, "") || null
            : null,
          controlada_supercias: esControlada,
          socios_modalidad: modalidad,
          socios: sociosValidos,
          autoriza_consulta_supercias:
            modalidad === "autorizacion" &&
            !!empresa.autoriza_consulta_supercias,
          referencia_supercias: null,
          anexo_socios_base64:
            modalidad === "anexo" ? empresa.anexo_socios_base64 || null : null,
          anexo_socios_nombre:
            modalidad === "anexo" ? empresa.anexo_socios_nombre || null : null,
        };
        empresaPrep = quitarCamposTemporales(empresaPrep, "rep_");
        empresaPrep = quitarCamposTemporales(empresaPrep, "");

        payload = { tipo: "empresa", empresa: empresaPrep };
      } else {
        const titularPrep = prepararPersona(titular, titular.es_pep);
        let conyuguePrep = null;
        let representadoPrep = null;
        let conyugueRepresentadoPrep = null;

        if (
          (calidadParticipacion === "propios_derechos" ||
            calidadParticipacion === "propios_y_representando") &&
          esCasadoTitular &&
          titularConyugueComparece
        ) {
          if (
            !(
              calidadParticipacion === "propios_y_representando" &&
              representadoEsConyugue
            )
          ) {
            conyuguePrep = {
              ...prepararPersona(conyugue, conyugue.es_pep),
              marital_status: "casado",
              partner_document_number: titular.document_number,
            };
            titularPrep.partner_document_number = conyugue.document_number;
          }
        }

        if (
          calidadParticipacion === "representando" ||
          calidadParticipacion === "propios_y_representando"
        ) {
          if (
            calidadParticipacion === "propios_y_representando" &&
            representadoEsConyugue
          ) {
            // El representado es el cónyuge del titular
            conyuguePrep = prepararPersona(conyugue, conyugue.es_pep);
            titularPrep.partner_document_number = conyugue.document_number;
          } else {
            representadoPrep = prepararPersona(
              representado,
              representado.es_pep,
            );
            if (esCasadoRepresentado && representadoConyugueComparece) {
              conyugueRepresentadoPrep = {
                ...prepararPersona(
                  conyugueRepresentado,
                  conyugueRepresentado.es_pep,
                ),
                marital_status: "casado",
                partner_document_number: representado.document_number,
              };
              representadoPrep.partner_document_number =
                conyugueRepresentado.document_number;
            }
          }
        }

        payload = {
          tipo: "persona",
          calidad_participacion: calidadParticipacion,
          representado_es_conyugue:
            calidadParticipacion === "propios_y_representando"
              ? representadoEsConyugue
              : null,
          titular: titularPrep,
          conyugue: conyuguePrep,
          representado: representadoPrep,
          conyugue_representado: conyugueRepresentadoPrep,
        };
      }

      const res = await fetch(`${API_BASE}/api/public/registro/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEnviado(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const data = await res.json();
        setErrors({
          general:
            data.detail || "Error al guardar los datos. Intente nuevamente.",
        });
      }
    } catch {
      setErrors({ general: "Error de conexión. Intente nuevamente." });
    } finally {
      setLoading(false);
    }
  };

  // ---- ESTADOS DE PANTALLA ----
  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando enlace...</p>
        </div>
      </div>
    );
  }
  if (!tokenValido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4"></div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Enlace no válido
          </h1>
          <p className="text-gray-600">
            Este enlace no es válido, ya fue utilizado o ha expirado. Por favor
            contacte a la notaría para obtener un nuevo enlace.
          </p>
        </div>
      </div>
    );
  }
  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4"></div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            ¡Datos registrados!
          </h1>
          <p className="text-gray-600">
            Sus datos han sido guardados correctamente. Al momento de su cita,
            el personal de la notaría ya tendrá su información disponible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ENCABEZADO */}
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="Notaría Vigésimo Segunda"
            className="h-20 mx-auto mb-4 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <h1 className="text-xl font-bold text-gray-900 uppercase">
            Notaría Vigésimo Segunda del Cantón Quito
          </h1>
          <p className="text-sm text-gray-700 mt-2 font-medium leading-relaxed">
            FORMULARIO QUE REGISTRA INFORMACIÓN CUMPLIENDO LO DISPUESTO EN EL
            ART. 58 DE LA LEY PREVENCIÓN DE LAVADO DE ACTIVOS Y DE LA
            FINANCIACIÓN DE DELITOS Y ART. 3 NUMERAL 5 DE SU REGLAMENTO.
          </p>
        </div>

        {errors.general && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.general}
          </div>
        )}
        {Object.keys(errors).filter(
          (k) => k !== "general" && k !== "privacidad" && k !== "condiciones",
        ).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Por favor corrija los campos marcados en rojo antes de continuar.
          </div>
        )}

        <div className="space-y-6">
          {/* MODAL CONDICIONES */}
          {modalCondiciones && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                      Condiciones jurídicas, declaraciones y autorización
                    </h2>
                    <button
                      onClick={() => setModalCondiciones(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 space-y-4 leading-relaxed">
                    {CONDICIONES_JURIDICAS.map((c) => (
                      <div key={c.numero}>
                        <p className="font-semibold text-gray-900">
                          {c.numero}.- {c.titulo}
                        </p>
                        <p className="text-justify">{c.texto}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setAceptaCondiciones(true);
                      setModalCondiciones(false);
                    }}
                    className="mt-6 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    He leído y acepto estas condiciones
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TOGGLE PERSONA / EMPRESA (el link ya define el tipo) */}
          {!tokenInfo && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Cómo va a participar en el trámite?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTipoRegistro("persona");
                    setErrors({});
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${tipoRegistro === "persona" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="text-2xl mb-1"></div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Persona Natural
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Como individuo
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoRegistro("empresa");
                    setErrors({});
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${tipoRegistro === "empresa" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="text-2xl mb-1"></div>
                  <div className="font-semibold text-gray-900 text-sm">
                    Persona Jurídica
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    En representación de una empresa
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PERSONA NATURAL */}
          {tipoRegistro === "persona" && (
            <>
              {/* CALIDAD DE PARTICIPACIÓN */}
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Calidad en la que participa en el trámite
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCalidadParticipacion("propios_derechos");
                      setErrors({});
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${calidadParticipacion === "propios_derechos" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">
                      Por sus propios derechos
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalidadParticipacion("representando");
                      setErrors({});
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${calidadParticipacion === "representando" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">
                      Representando a:
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Mandatario, apoderado, representante
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalidadParticipacion("propios_y_representando");
                      setErrors({});
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${calidadParticipacion === "propios_y_representando" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">
                      Por sus propios derechos y representando a:
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Comparece en doble calidad
                    </div>
                  </button>
                </div>
                {errors.calidadParticipacion && (
                  <p className="text-red-500 text-xs">
                    {errors.calidadParticipacion}
                  </p>
                )}
              </div>

              {/* DATOS DEL COMPARECIENTE */}
              {calidadParticipacion && (
                <FormularioPersona
                  titulo={
                    calidadParticipacion === "propios_derechos"
                      ? "Sus datos personales"
                      : "Datos del Apoderado, Mandatario, Representante (quien firma)"
                  }
                  datos={titular}
                  onChange={handleTitularChange}
                  errors={errors}
                  documentoFijo={!!tokenInfo}
                  mostrarEstadoCivil={true}
                  mostrarRolTramite={true}
                />
              )}

              {/* CÓNYUGE NO COMPARECE — titular por propios derechos o propios+representando */}
              {calidadParticipacion &&
                calidadParticipacion !== "representando" &&
                esCasadoTitular && (
                  <SeccionConyugue
                    datos={titular}
                    onChange={handleTitularChange}
                    errors={errors}
                  />
                )}

              {/* CÓNYUGE DEL TITULAR */}
              {calidadParticipacion &&
                calidadParticipacion !== "representando" &&
                esCasadoTitular &&
                titularConyugueComparece &&
                !(
                  calidadParticipacion === "propios_y_representando" &&
                  representadoEsConyugue
                ) && (
                  <div className="border-2 border-blue-200 rounded-xl overflow-hidden">
                    <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
                      <p className="text-sm font-medium text-blue-800">
                        {" "}
                        Como está casado/a, necesitamos también los datos de su
                        cónyuge.
                      </p>
                    </div>
                    <FormularioPersona
                      titulo="Datos del cónyuge"
                      datos={conyugue}
                      onChange={handleConyugueChange}
                      errors={Object.fromEntries(
                        Object.entries(errors)
                          .filter(([k]) => k.startsWith("c_"))
                          .map(([k, v]) => [k.replace("c_", ""), v]),
                      )}
                      mostrarEstadoCivil={false}
                      mostrarRolTramite={false}
                      mismaDir={mismaDir}
                      onToggleMismaDir={() => setMismaDir((prev) => !prev)}
                    />
                  </div>
                )}

              {/* ¿EL REPRESENTADO ES SU CÓNYUGE? — solo para propios_y_representando */}
              {calidadParticipacion === "propios_y_representando" && (
                <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    ¿El representado es su cónyuge?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setRepresentadoEsConyugue(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${representadoEsConyugue === true ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepresentadoEsConyugue(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${representadoEsConyugue === false ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      No
                    </button>
                  </div>
                  {errors.representadoEsConyugue && (
                    <p className="text-red-500 text-xs">
                      {errors.representadoEsConyugue}
                    </p>
                  )}

                  {/* Si es su cónyuge — formulario del cónyuge con rol en trámite */}
                  {representadoEsConyugue === true && (
                    <div className="border-2 border-purple-200 rounded-xl overflow-hidden mt-4">
                      <FormularioPersona
                        titulo="Datos del Poderdante, Mandante, Representado (cónyuge)"
                        datos={conyugue}
                        onChange={handleConyugueChange}
                        errors={Object.fromEntries(
                          Object.entries(errors)
                            .filter(([k]) => k.startsWith("c_"))
                            .map(([k, v]) => [k.replace("c_", ""), v]),
                        )}
                        mostrarEstadoCivil={false}
                        mostrarRolTramite={true}
                        esRepresentado={true}
                        mismaDir={mismaDir}
                        onToggleMismaDir={() => setMismaDir((prev) => !prev)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* FORMULARIO DEL REPRESENTADO — cuando no es el cónyuge */}
              {(calidadParticipacion === "representando" ||
                (calidadParticipacion === "propios_y_representando" &&
                  representadoEsConyugue === false)) && (
                <div className="border-2 border-purple-200 rounded-xl overflow-hidden">
                  <FormularioPersona
                    titulo="Datos del Poderdante, Mandante, Representado"
                    datos={representado}
                    onChange={handleRepresentadoChange}
                    errors={Object.fromEntries(
                      Object.entries(errors)
                        .filter(([k]) => k.startsWith("r_"))
                        .map(([k, v]) => [k.replace("r_", ""), v]),
                    )}
                    mostrarEstadoCivil={true}
                    mostrarRolTramite={true}
                    esRepresentado={true}
                  />

                  {/* Cónyuge no comparece — representado */}
                  {esCasadoRepresentado && (
                    <div className="px-6 pb-4">
                      <SeccionConyugue
                        datos={representado}
                        onChange={handleRepresentadoChange}
                        errors={Object.fromEntries(
                          Object.entries(errors)
                            .filter(([k]) => k.startsWith("r_"))
                            .map(([k, v]) => [k.replace("r_", ""), v]),
                        )}
                      />
                    </div>
                  )}

                  {/* Cónyuge del representado */}
                  {esCasadoRepresentado && representadoConyugueComparece && (
                    <div className="border-t-2 border-purple-200">
                      <FormularioPersona
                        titulo="Datos del cónyuge del Poderdante, Mandante, Representado"
                        datos={conyugueRepresentado}
                        onChange={handleConyugueRepresentadoChange}
                        errors={Object.fromEntries(
                          Object.entries(errors)
                            .filter(([k]) => k.startsWith("cr_"))
                            .map(([k, v]) => [k.replace("cr_", ""), v]),
                        )}
                        mostrarEstadoCivil={false}
                        mostrarRolTramite={false}
                        mismaDir={mismaDirRepresentado}
                        onToggleMismaDir={() =>
                          setMismaDirRepresentado((prev) => !prev)
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* EMPRESA */}
          {tipoRegistro === "empresa" && (
            <FormularioEmpresa
              datos={empresa}
              onChange={handleEmpresaChange}
              errors={errors}
              documentoFijo={!!tokenInfo}
            />
          )}

          {/* CONDICIONES JURÍDICAS */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h2 className="font-semibold text-amber-900 mb-3">
              Condiciones jurídicas, declaraciones y autorización
            </h2>
            <button
              type="button"
              onClick={() => setModalCondiciones(true)}
              className="text-sm text-amber-700 underline hover:text-amber-900 mb-3 block"
            >
              Ver condiciones jurídicas completas
            </button>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aceptaCondiciones}
                onChange={(e) => {
                  setAceptaCondiciones(e.target.checked);
                  if (errors.condiciones)
                    setErrors((prev) => ({ ...prev, condiciones: "" }));
                }}
                className="w-4 h-4 mt-0.5 rounded text-amber-600"
              />
              <span className="text-sm text-amber-800">
                He leído y acepto las condiciones jurídicas, declaraciones y
                autorización establecidas por la Notaría Vigésimo Segunda del
                cantón Quito.
              </span>
            </label>
            {errors.condiciones && (
              <p className="text-red-500 text-xs mt-2">{errors.condiciones}</p>
            )}
          </div>

          {/* PRIVACIDAD */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="font-semibold text-blue-900 mb-3">
              Protección de Datos Personales
            </h2>
            <p className="text-sm text-blue-800 mb-4">
              Sus datos personales serán tratados por la notaría exclusivamente
              para la celebración del instrumento público solicitado, en
              cumplimiento de la{" "}
              <strong>
                Ley Orgánica de Protección de Datos Personales del Ecuador
                (LOPDP)
              </strong>
              . Usted tiene derecho a acceder, rectificar, cancelar u oponerse
              al tratamiento de sus datos contactando directamente a la notaría.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aceptaPrivacidad}
                onChange={(e) => {
                  setAceptaPrivacidad(e.target.checked);
                  if (errors.privacidad)
                    setErrors((prev) => ({ ...prev, privacidad: "" }));
                }}
                className="w-4 h-4 mt-0.5 rounded text-blue-600"
              />
              <span className="text-sm text-blue-800">
                Acepto el tratamiento de mis datos personales para los fines
                notariales descritos.
              </span>
            </label>
            {errors.privacidad && (
              <p className="text-red-500 text-xs mt-2">{errors.privacidad}</p>
            )}
          </div>

          {/* BOTÓN */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Enviar mis datos"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistroClientePage;
