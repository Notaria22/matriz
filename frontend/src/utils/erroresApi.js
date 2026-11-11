/**
 * Convierte la respuesta de error del API en un Error que el formulario de
 * registro entiende: `message` para el aviso general y `errores` con
 * [{campo, mensaje}] para marcar en rojo cada campo.
 */
export const errorDeApi = async (res, porDefecto) => {
  const data = await res.json().catch(() => ({}));
  const detalle = data?.detail;
  if (detalle && typeof detalle === "object" && !Array.isArray(detalle)) {
    const error = new Error(detalle.mensaje || porDefecto);
    error.errores = Array.isArray(detalle.errores) ? detalle.errores : [];
    return error;
  }
  return new Error(typeof detalle === "string" ? detalle : porDefecto);
};
