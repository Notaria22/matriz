import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { apiFetch } from "../../config/api";

/** Abre el borrador indicado en ?borrador=<id> (viene del Archivo). */
const useBorradorDeUrl = (onCargar) => {
  const [params] = useSearchParams();
  const id = params.get("borrador");

  useEffect(() => {
    if (!id) return;
    let vigente = true;
    apiFetch(`/api/templates/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (vigente && data) onCargar(data.contenido, data);
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
    // solo cuando cambia el borrador de la URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
};

export default useBorradorDeUrl;
