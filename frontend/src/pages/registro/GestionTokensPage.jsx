import { useState, useEffect, useCallback, useRef } from "react";
import API_CONFIG, { apiFetch } from "../../config/api";
import { Card, Button } from "../../components/shared";
import { useToast } from "../../hooks/useToast";

const GestionTokensPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [linkGenerado, setLinkGenerado] = useState(null);
  const [tipo, setTipo] = useState("persona");
  const [documento, setDocumento] = useState("");
  const [errorDocumento, setErrorDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [errorNombre, setErrorNombre] = useState("");

  const validarDocumento = () => {
    const doc = documento.trim().toUpperCase();
    if (tipo === "empresa") {
      if (!/^\d{13}$/.test(doc) || !doc.endsWith("001"))
        return "El RUC debe tener 13 dígitos y terminar en 001";
    } else if (!/^\d{10}$/.test(doc) && !/^[A-Z0-9]{6,13}$/.test(doc)) {
      return "Ingrese una cédula de 10 dígitos o un pasaporte válido";
    }
    return "";
  };

  const cargarTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/registro/tokens");
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    } catch {
      toastRef.current.error("Error al cargar los tokens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTokens();
  }, [cargarTokens]);

  // Si el documento ya está registrado, se trae el nombre
  const buscarNombre = async () => {
    if (nombre.trim() || validarDocumento()) return;
    const doc = documento.trim().toUpperCase();
    const base =
      tipo === "empresa"
        ? API_CONFIG.ENDPOINTS.COMPANIES
        : API_CONFIG.ENDPOINTS.PARTIES;
    try {
      const res = await apiFetch(`${base}/${encodeURIComponent(doc)}`);
      if (!res.ok) return;
      const data = await res.json();
      const encontrado =
        tipo === "empresa"
          ? data.razon_social
          : [data.names, data.last_names].filter(Boolean).join(" ");
      if (encontrado) {
        setNombre((actual) => actual || encontrado.toUpperCase());
        setErrorNombre("");
      }
    } catch {
      // si no se encuentra, se escribe a mano
    }
  };

  const generarToken = async () => {
    const error = validarDocumento();
    const faltaNombre =
      nombre.trim().length < 3 ? "Ingrese el nombre del compareciente" : "";
    setErrorDocumento(error);
    setErrorNombre(faltaNombre);
    if (error || faltaNombre) return;

    setGenerando(true);
    setLinkGenerado(null);
    try {
      const res = await apiFetch("/api/registro/generar-token", {
        method: "POST",
        body: JSON.stringify({
          tipo,
          documento: documento.trim().toUpperCase(),
          nombre: nombre.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLinkGenerado({ link: data.link, nombre: data.nombre });
        setDocumento("");
        setNombre("");
        toastRef.current.success("Enlace generado correctamente");
        cargarTokens();
      } else {
        const data = await res.json().catch(() => ({}));
        const detalle = Array.isArray(data.detail)
          ? data.detail[0]?.msg?.replace("Value error, ", "")
          : data.detail;
        toastRef.current.error(detalle || "Error al generar el enlace");
      }
    } catch {
      toastRef.current.error("Error al generar el enlace");
    } finally {
      setGenerando(false);
    }
  };

  const copiarLink = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toastRef.current.success("Enlace copiado al portapapeles");
  };

  const eliminarToken = async (tkn) => {
    if (!confirm("¿Eliminar este enlace?")) return;
    try {
      const res = await apiFetch(`/api/registro/tokens/${tkn}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        toastRef.current.success("Enlace eliminado");
        cargarTokens();
      } else {
        const data = await res.json();
        toastRef.current.error(data.detail || "Error al eliminar");
      }
    } catch {
      toastRef.current.error("Error al eliminar el enlace");
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "-";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const estaExpirado = (fechaStr) => {
    if (!fechaStr) return false;
    return new Date(fechaStr) < new Date();
  };

  const getEstado = (tkn) => {
    if (tkn.usado)
      return { texto: "Usado", color: "bg-green-100 text-green-700" };
    if (estaExpirado(tkn.expira_en))
      return { texto: "Expirado", color: "bg-red-100 text-red-700" };
    return { texto: "Pendiente", color: "bg-yellow-100 text-yellow-700" };
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Registro de Clientes
        </h1>
        <p className="text-gray-600 mt-1">
          Genera enlaces únicos para que los clientes registren sus datos antes
          de su cita.
        </p>
      </div>

      <Card title="Generar nuevo enlace" className="mb-6">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Al generar un enlace, el cliente podrá registrar sus datos
            personales sin necesidad de iniciar sesión. El enlace es válido por{" "}
            <strong>72 horas</strong> y solo puede usarse{" "}
            <strong>una vez</strong>. Solo sirve para el documento que indique
            aquí: el cliente no podrá registrar otra cédula o RUC.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de cliente
              </label>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setErrorDocumento("");
                  setNombre("");
                  setErrorNombre("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="persona">Persona natural</option>
                <option value="empresa">Empresa (persona jurídica)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tipo === "empresa"
                  ? "RUC de la empresa"
                  : "Cédula o pasaporte de quien llenará el formulario"}
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => {
                  setDocumento(e.target.value);
                  setErrorDocumento("");
                }}
                onBlur={buscarNombre}
                maxLength={13}
                placeholder={
                  tipo === "empresa" ? "1790012345001" : "1712345678"
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  errorDocumento
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300"
                }`}
              />
              {errorDocumento && (
                <p className="text-red-500 text-xs mt-1">{errorDocumento}</p>
              )}
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tipo === "empresa"
                  ? "Razón social de la empresa"
                  : "Nombre del compareciente"}
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setErrorNombre("");
                }}
                maxLength={200}
                placeholder={
                  tipo === "empresa"
                    ? "CONSTRUCTORA ANDES S.A."
                    : "NOMBRES Y APELLIDOS"
                }
                className={`w-full px-3 py-2 border rounded-lg text-sm uppercase ${
                  errorNombre ? "border-red-400 bg-red-50" : "border-gray-300"
                }`}
              />
              {errorNombre ? (
                <p className="text-red-500 text-xs mt-1">{errorNombre}</p>
              ) : (
                <p className="text-gray-500 text-xs mt-1">
                  Si el documento ya está registrado, el nombre se llena solo.
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={generarToken}
            loading={generando}
            variant="primary"
            size="lg"
          >
            🔗 Generar nuevo enlace
          </Button>

          {linkGenerado && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">
                ✅ Enlace generado para{" "}
                <span className="font-semibold">{linkGenerado.nombre}</span> —
                compártelo con el cliente por WhatsApp o email:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={linkGenerado.link}
                  className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm text-gray-700 focus:outline-none"
                />
                <Button
                  onClick={() => copiarLink(linkGenerado.link)}
                  variant="outline"
                  size="sm"
                >
                  Copiar
                </Button>
              </div>
              <div className="mt-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Estimado/a ${linkGenerado.nombre || "cliente"}, por favor complete sus datos antes de su cita en la notaría usando el siguiente enlace: ${linkGenerado.link}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  📱 Enviar por WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="Historial de enlaces">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay enlaces generados todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 pr-4">Estado</th>
                  <th className="pb-3 pr-4">Creado por</th>
                  <th className="pb-3 pr-4">Creado el</th>
                  <th className="pb-3 pr-4">Expira el</th>
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tokens.map((tkn) => {
                  const estado = getEstado(tkn);
                  return (
                    <tr key={tkn.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${estado.color}`}
                        >
                          {estado.texto}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {tkn.creado_por || "-"}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {formatearFecha(tkn.creado_en)}
                      </td>
                      <td
                        className={`py-3 pr-4 ${estaExpirado(tkn.expira_en) && !tkn.usado ? "text-red-500" : "text-gray-600"}`}
                      >
                        {formatearFecha(tkn.expira_en)}
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {tkn.nombre_compareciente && (
                          <div className="font-medium text-gray-900">
                            {tkn.nombre_compareciente}
                          </div>
                        )}
                        <span className="text-xs text-gray-500 mr-1">
                          {tkn.tipo_esperado === "empresa" ? "RUC" : "Doc."}
                        </span>
                        {tkn.documento_esperado || "-"}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {!tkn.usado &&
                            !estaExpirado(tkn.expira_en) &&
                            tkn.link && (
                              <button
                                onClick={() => copiarLink(tkn.link)}
                                className="text-blue-600 hover:text-blue-800 text-xs underline"
                              >
                                Copiar link
                              </button>
                            )}
                          {!tkn.usado && (
                            <button
                              onClick={() => eliminarToken(tkn.token)}
                              className="text-red-500 hover:text-red-700 text-xs underline"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GestionTokensPage;
