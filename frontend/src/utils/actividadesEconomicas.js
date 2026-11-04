export const ACTIVIDADES_ECONOMICAS = [
  { value: "independiente", label: "Independiente" },
  { value: "empleado", label: "Empleado" },
  { value: "funcionario_publico", label: "Funcionario público" },
  { value: "empresario", label: "Empresario" },
  { value: "comerciante", label: "Comerciante" },
  { value: "emprendedor", label: "Emprendedor" },
  { value: "profesional_autonomo", label: "Profesional autónomo" },
  { value: "constructor", label: "Constructor" },
  { value: "contratista", label: "Contratista" },
  {
    value: "creador_contenido",
    label: "Creador de contenido",
    soloPersona: true,
  },
  { value: "influencer", label: "Influencer", soloPersona: true },
  { value: "jubilado", label: "Jubilado" },
  {
    value: "quehaceres_domesticos",
    label: "Quehaceres domésticos",
    soloPersona: true,
  },
  { value: "cuidador_hogar", label: "Cuidador del hogar", soloPersona: true },
  { value: "estudiante", label: "Estudiante" },
  { value: "ninguna", label: "Ninguna" },
  { value: "otro", label: "Otro" },
];

export const etiquetaActividad = (valor, otra) => {
  if (!valor) return "";
  if (valor === "otro") return otra ? `Otro: ${otra}` : "Otro";
  return ACTIVIDADES_ECONOMICAS.find((a) => a.value === valor)?.label || valor;
};
