/** Descarga la respuesta como archivo, con el nombre que manda el servidor si lo hay. */
export const descargarRespuesta = async (res, nombrePorDefecto) => {
  const disposicion = res.headers.get("Content-Disposition") || "";
  const coincide =
    disposicion.match(/filename\*=UTF-8''([^;]+)/i) ||
    disposicion.match(/filename="?([^";]+)"?/i);
  const nombre = coincide ? decodeURIComponent(coincide[1]) : nombrePorDefecto;
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
