import { useState, useEffect, useCallback, useRef } from "react";
import API_CONFIG, { apiFetch } from "../../config/api";
import { Card, Button } from "../../components/shared";
import { useToast } from "../../hooks/useToast";

const DIAS_VIGENCIA = 7;
const ETIQUETA_DOCUMENTO = {
  cedula: "Número de cédula",
  pasaporte: "Número de pasaporte",
  ruc: "RUC de la empresa",
  extranjera: "Identificación fiscal o tributaria del país de domicilio",
};
const EJEMPLO_DOCUMENTO = {
  cedula: "1712345678",
  pasaporte: "AB123456",
  ruc: "1790012345001",
  extranjera: "Ej: 900.123.456-7",
};
const POR_PAGINA = 20;
const PESTANAS = [
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "usado", etiqueta: "Usados" },
  { valor: "expirado", etiqueta: "Expirados" },
  { valor: "todos", etiqueta: "Todos" },
];

const GestionTokensPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  const [datos, setDatos] = useState({
    items: [],
    total: 0,
    pagina: 1,
    paginas: 1,
    conteos: { pendiente: 0, usado: 0, expirado: 0, todos: 0 },
  });
  const [estado, setEstado] = useState("pendiente");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [ahora, setAhora] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [linkGenerado, setLinkGenerado] = useState(null);
  const [tipo, setTipo] = useState("persona");
  const [documento, setDocumento] = useState("");
  const [errorDocumento, setErrorDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [errorNombre, setErrorNombre] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("cedula");

  const validarDocumento = () => {
    const doc = documento.trim().toUpperCase();
    if (tipoDocumento === "ruc") {
      if (!/^\d{13}$/.test(doc) || !doc.endsWith("001"))
        return "El RUC debe tener 13 dígitos y terminar en 001";
    } else if (tipoDocumento === "extranjera") {
      if (!/^[A-Z0-9][A-Z0-9.-]{1,28}[A-Z0-9]$/.test(doc))
        return "La identificación fiscal debe tener de 3 a 30 letras, números, puntos o guiones";
    } else if (tipoDocumento === "cedula" && !/^\d{10}$/.test(doc)) {
      return "La cédula debe tener 10 dígitos";
    } else if (tipoDocumento === "pasaporte" && !/^[A-Z0-9]{6,13}$/.test(doc)) {
      return "El pasaporte debe tener entre 6 y 13 letras o números, sin espacios ni guiones";
    }
    return "";
  };

  const cargarTokens = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        estado,
        pagina: String(pagina),
        por_pagina: String(POR_PAGINA),
      });
      if (busqueda.trim()) params.set("q", busqueda.trim());
      const res = await apiFetch(`/api/registro/tokens?${params}`);
      if (res.ok) {
        setDatos(await res.json());
        setAhora(Date.now());
      }
    } catch {
      toastRef.current.error("Error al cargar los tokens");
    } finally {
      setLoading(false);
    }
  }, [estado, pagina, busqueda]);

  // Espera a que termine de escribir antes de buscar
  useEffect(() => {
    const t = setTimeout(cargarTokens, busqueda ? 300 : 0);
    return () => clearTimeout(t);
  }, [cargarTokens, busqueda]);

  // El tiempo restante se actualiza cada minuto
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const cambiarBusqueda = (valor) => {
    setBusqueda(valor);
    setPagina(1);
    // La búsqueda mira todos los estados; las pestañas sirven para acotar
    setEstado(valor.trim() ? "todos" : "pendiente");
  };

  const cambiarEstado = (valor) => {
    setEstado(valor);
    setPagina(1);
  };

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
      if (tipo === "persona" && data.document_type)
        setTipoDocumento(data.document_type);
      if (tipo === "empresa")
        setTipoDocumento(data.es_extranjera ? "extranjera" : "ruc");
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
          tipo_documento: tipoDocumento,
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
    return new Date(fechaStr).getTime() < ahora;
  };

  const tiempoRestante = (tkn) => {
    if (tkn.usado) return { texto: "Usado", clase: "text-gray-500" };
    const minutos = Math.floor(
      (new Date(tkn.expira_en).getTime() - ahora) / 60000,
    );
    if (minutos < 0)
      return { texto: "Vencido", clase: "text-red-600 font-medium" };
    if (minutos < 1)
      return { texto: "menos de 1 min", clase: "text-red-600 font-medium" };
    const dias = Math.floor(minutos / 1440);
    const horas = Math.floor((minutos % 1440) / 60);
    const mins = minutos % 60;
    const texto =
      dias > 0
        ? `${dias} ${dias === 1 ? "día" : "días"} ${horas} h`
        : horas > 0
          ? `${horas} h ${mins} min`
          : `${mins} min`;
    return {
      texto,
      clase: minutos < 1440 ? "text-amber-600 font-medium" : "text-gray-700",
    };
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
            <strong>{DIAS_VIGENCIA} días</strong> y solo puede usarse{" "}
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
                  setTipoDocumento(
                    e.target.value === "empresa" ? "ruc" : "cedula",
                  );
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tipo === "empresa"
                  ? "Domicilio de la empresa"
                  : "Tipo de documento"}
              </label>
              <select
                value={tipoDocumento}
                onChange={(e) => {
                  setTipoDocumento(e.target.value);
                  setErrorDocumento("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {tipo === "empresa" ? (
                  <>
                    <option value="ruc">Ecuatoriana (RUC)</option>
                    <option value="extranjera">
                      Extranjera (identificación fiscal)
                    </option>
                  </>
                ) : (
                  <>
                    <option value="cedula">Cédula</option>
                    <option value="pasaporte">Pasaporte</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {ETIQUETA_DOCUMENTO[tipoDocumento]}
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => {
                  setDocumento(e.target.value);
                  setErrorDocumento("");
                }}
                onBlur={buscarNombre}
                maxLength={tipoDocumento === "extranjera" ? 30 : 13}
                placeholder={EJEMPLO_DOCUMENTO[tipoDocumento]}
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
        <div className="space-y-4">
          <div className="relative max-w-md">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => cambiarBusqueda(e.target.value)}
              placeholder="Buscar por cédula, RUC o nombre..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => cambiarBusqueda("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {PESTANAS.map(({ valor, etiqueta }) => (
              <button
                key={valor}
                type="button"
                onClick={() => cambiarEstado(valor)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  estado === valor
                    ? "bg-primary-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {etiqueta} ({datos.conteos[valor]})
              </button>
            ))}
          </div>

          {loading && datos.items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : datos.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {busqueda.trim()
                ? "No se encontraron enlaces con esa búsqueda."
                : "No hay enlaces en esta pestaña."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 pr-4">Estado</th>
                    <th className="pb-3 pr-4">Cliente</th>
                    <th className="pb-3 pr-4">Vence en</th>
                    <th className="pb-3 pr-4">Creado</th>
                    <th className="pb-3 pr-4">Expira el</th>
                    <th className="pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {datos.items.map((tkn) => {
                    const estadoTkn = getEstado(tkn);
                    const restante = tiempoRestante(tkn);
                    return (
                      <tr key={tkn.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${estadoTkn.color}`}
                          >
                            {estadoTkn.texto}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          {tkn.nombre_compareciente && (
                            <div className="font-medium text-gray-900">
                              {tkn.nombre_compareciente}
                            </div>
                          )}
                          <span className="text-xs text-gray-500 mr-1">
                            {tkn.tipo_esperado === "empresa"
                              ? tkn.documento_tipo_esperado === "extranjera"
                                ? "Id. fiscal"
                                : "RUC"
                              : tkn.documento_tipo_esperado === "pasaporte"
                                ? "Pasaporte"
                                : "Cédula"}
                          </span>
                          {tkn.documento_esperado || "-"}
                        </td>
                        <td
                          className={`py-3 pr-4 whitespace-nowrap ${restante.clase}`}
                        >
                          {restante.texto}
                        </td>
                        <td className="py-3 pr-4 text-gray-600">
                          {formatearFecha(tkn.creado_en)}
                          <div className="text-xs text-gray-400">
                            {tkn.creado_por || "-"}
                          </div>
                        </td>
                        <td
                          className={`py-3 pr-4 ${estaExpirado(tkn.expira_en) && !tkn.usado ? "text-red-500" : "text-gray-600"}`}
                        >
                          {formatearFecha(tkn.expira_en)}
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

          {datos.paginas > 1 && (
            <div className="flex items-center justify-between pt-2 text-sm">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={datos.pagina <= 1 || loading}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <span className="text-gray-600">
                Página {datos.pagina} de {datos.paginas} · {datos.total}{" "}
                {datos.total === 1 ? "enlace" : "enlaces"}
              </span>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(datos.paginas, p + 1))}
                disabled={datos.pagina >= datos.paginas || loading}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GestionTokensPage;
