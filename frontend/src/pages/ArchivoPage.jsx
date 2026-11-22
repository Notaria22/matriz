/**
 * Archivo: borradores, protocolos y minutas generadas del usuario actual.
 * La ventana de Minutas solo aparece para los roles con acceso a minutas.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Download, FolderOpen, Loader2, Search, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { apiFetch } from "../config/api";
import { descargarRespuesta } from "../utils/descargas";

const TIPOS_MATRIZ = {
  compraventa: "Compraventa",
  promesa_compraventa: "Promesa de compraventa",
  cesion: "Cesión",
  donacion: "Donación",
};

const TIPOS_MINUTA = {
  compraventa: "Compraventa",
  promesa_compraventa: "Promesa de compraventa",
  compraventa_inmueble: "Compraventa",
  poderes: "Poder",
};

// Formulario donde se abre cada borrador
const RUTAS_BORRADOR = {
  matriz: {
    compraventa: "/matrices/compraventa",
    promesa_compraventa: "/matrices/promesa",
    cesion: "/matrices/cesion",
    donacion: "/matrices/donacion",
  },
  minuta: {
    compraventa: "/minutas/compraventa",
    promesa_compraventa: "/minutas/promesa",
  },
};

const formatearFecha = (valor) =>
  valor
    ? new Date(valor).toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

const Pestana = ({ activa, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activa
        ? "bg-primary-600 text-white shadow-sm"
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

const Filtros = ({ filtros, setFiltros, tipos, placeholder }) => {
  const cambiar = (campo) => (e) =>
    setFiltros((f) => ({ ...f, [campo]: e.target.value }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      <div className="relative md:col-span-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={filtros.q}
          onChange={cambiar("q")}
          placeholder={placeholder}
          className="input-field"
          style={{ paddingLeft: "2.5rem" }}
        />
      </div>
      <select
        value={filtros.tipo}
        onChange={cambiar("tipo")}
        className="input-field"
      >
        <option value="">Todos los tipos</option>
        {Object.entries(tipos).map(([valor, etiqueta]) => (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={filtros.desde}
        onChange={cambiar("desde")}
        className="input-field"
        title="Desde"
      />
      <input
        type="date"
        value={filtros.hasta}
        onChange={cambiar("hasta")}
        className="input-field"
        title="Hasta"
      />
    </div>
  );
};

const Tabla = ({ columnas, filas, cargando, vacio }) => (
  <div className="overflow-x-auto border border-gray-200 rounded-lg">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-50 text-gray-600">
        <tr>
          {columnas.map((c) => (
            <th key={c} className="px-4 py-2 text-left font-medium">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {cargando ? (
          <tr>
            <td colSpan={columnas.length} className="px-4 py-6 text-center">
              <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
            </td>
          </tr>
        ) : filas.length === 0 ? (
          <tr>
            <td
              colSpan={columnas.length}
              className="px-4 py-6 text-center text-gray-500"
            >
              {vacio}
            </td>
          </tr>
        ) : (
          filas
        )}
      </tbody>
    </table>
  </div>
);

const parametros = (filtros, extra = {}) => {
  const p = new URLSearchParams({ limite: "100", ...extra });
  if (filtros.q.trim()) p.set("q", filtros.q.trim());
  if (filtros.desde) p.set("desde", filtros.desde);
  if (filtros.hasta) p.set("hasta", filtros.hasta);
  return p.toString();
};

const FILTROS_VACIOS = { q: "", tipo: "", desde: "", hasta: "" };

// Carga la lista con un pequeño retraso mientras se escribe en el buscador
const useLista = (construirUrl, filtros) => {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const res = await apiFetch(construirUrl(filtros));
      if (!res.ok) throw new Error();
      setFilas(await res.json());
    } catch {
      setError("No se pudo cargar la lista. Intente nuevamente.");
      setFilas([]);
    } finally {
      setCargando(false);
    }
  }, [construirUrl, filtros]);

  useEffect(() => {
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
  }, [cargar]);

  return { filas, cargando, error, recargar: cargar };
};

const Borradores = ({ tipoDocumento, tipos }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [porEliminar, setPorEliminar] = useState(null);
  const construirUrl = useCallback(
    (f) =>
      `/api/templates/?${parametros(f, {
        tipo_documento: tipoDocumento,
        ...(f.tipo ? { tipo_contrato: f.tipo } : {}),
      })}`,
    [tipoDocumento],
  );
  const { filas, cargando, error, recargar } = useLista(construirUrl, filtros);

  const eliminar = async (b) => {
    const res = await apiFetch(`/api/templates/${b.id}`, { method: "DELETE" });
    setPorEliminar(null);
    if (res.ok) {
      toast.success(`Borrador ${b.codigo} eliminado`);
      recargar();
    } else {
      toast.error("No se pudo eliminar el borrador");
    }
  };

  return (
    <div className="space-y-4">
      <Filtros
        filtros={filtros}
        setFiltros={setFiltros}
        tipos={tipos}
        placeholder="Código, nombre, vendedor, nombres o cédula..."
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Tabla
        columnas={["Código", "Nombre", "Tipo", "Vendedor", "Actualizado", ""]}
        cargando={cargando}
        vacio="No hay borradores guardados"
        filas={filas.map((b) => {
          const ruta = RUTAS_BORRADOR[tipoDocumento]?.[b.tipo_contrato];
          return (
            <tr key={b.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-mono text-primary-700">
                {b.codigo}
              </td>
              <td className="px-4 py-2 text-gray-900">{b.nombre}</td>
              <td className="px-4 py-2">
                {tipos[b.tipo_contrato] || b.tipo_contrato}
              </td>
              <td className="px-4 py-2">{b.nombre_vendedor}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                {formatearFecha(b.actualizado_at || b.creado_at)}
              </td>
              <td className="px-4 py-2 text-right whitespace-nowrap">
                {porEliminar === b.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-gray-600">¿Eliminar?</span>
                    <button
                      type="button"
                      onClick={() => eliminar(b)}
                      className="text-red-600 font-medium hover:underline"
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setPorEliminar(null)}
                      className="text-gray-600 hover:underline"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-3">
                    {ruta && (
                      <button
                        type="button"
                        onClick={() => navigate(`${ruta}?borrador=${b.id}`)}
                        className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                      >
                        <FolderOpen className="w-4 h-4" /> Abrir
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPorEliminar(b.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:underline"
                      title="Eliminar borrador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      />
    </div>
  );
};

const BotonDescargar = ({ url, nombre }) => {
  const toast = useToast();
  const [bajando, setBajando] = useState(false);
  const descargar = async () => {
    setBajando(true);
    try {
      const res = await apiFetch(url);
      if (!res.ok) throw new Error();
      await descargarRespuesta(res, nombre);
    } catch {
      toast.error("No se pudo descargar el archivo");
    } finally {
      setBajando(false);
    }
  };
  return (
    <button
      type="button"
      onClick={descargar}
      disabled={bajando}
      className="inline-flex items-center gap-1 text-primary-600 hover:underline disabled:opacity-50"
    >
      {bajando ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Descargar
    </button>
  );
};

const Protocolos = () => {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const construirUrl = useCallback(
    (f) => `/api/documents?${parametros(f, f.tipo ? { tipo: f.tipo } : {})}`,
    [],
  );
  const { filas, cargando, error } = useLista(construirUrl, filtros);

  return (
    <div className="space-y-4">
      <Filtros
        filtros={filtros}
        setFiltros={setFiltros}
        tipos={TIPOS_MATRIZ}
        placeholder="Código, número de protocolo, nombres o cédula..."
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Tabla
        columnas={["Código", "Tipo", "Comparecientes", "Generado", ""]}
        cargando={cargando}
        vacio="No hay protocolos generados"
        filas={filas.map((d) => {
          const partes = d.parties_data || {};
          const nombres = [
            ...(partes.nombres1 || []),
            ...(partes.nombres2 || []),
          ];
          return (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-mono text-primary-700 whitespace-nowrap">
                {d.codigo}
              </td>
              <td className="px-4 py-2">
                {TIPOS_MATRIZ[d.document_type] || d.document_type}
              </td>
              <td className="px-4 py-2 text-gray-700">
                {nombres.length
                  ? nombres.join(", ")
                  : [...(partes.parte1 || []), ...(partes.parte2 || [])].join(
                      ", ",
                    )}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {formatearFecha(d.created_at)}
              </td>
              <td className="px-4 py-2 text-right">
                <BotonDescargar
                  url={`/api/documents/download/${d.id}`}
                  nombre={`${d.codigo}.docx`}
                />
              </td>
            </tr>
          );
        })}
      />
    </div>
  );
};

const MinutasGeneradas = () => {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const construirUrl = useCallback(
    (f) => `/api/minutes?${parametros(f, f.tipo ? { tipo: f.tipo } : {})}`,
    [],
  );
  const { filas, cargando, error } = useLista(construirUrl, filtros);
  const tipos = {
    compraventa_inmueble: "Compraventa",
    promesa_compraventa: "Promesa de compraventa",
    poderes: "Poder",
  };

  return (
    <div className="space-y-4">
      <Filtros
        filtros={filtros}
        setFiltros={setFiltros}
        tipos={tipos}
        placeholder="Código, nombres o cédula..."
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Tabla
        columnas={["Código", "Tipo", "Comparecientes", "Generada", ""]}
        cargando={cargando}
        vacio="No hay minutas generadas"
        filas={filas.map((m) => (
          <tr key={m.id} className="hover:bg-gray-50">
            <td className="px-4 py-2 font-mono text-primary-700 whitespace-nowrap">
              {m.codigo}
            </td>
            <td className="px-4 py-2">{tipos[m.tipo] || m.tipo}</td>
            <td className="px-4 py-2 text-gray-700">{m.comparecientes}</td>
            <td className="px-4 py-2 whitespace-nowrap">
              {formatearFecha(m.created_at)}
            </td>
            <td className="px-4 py-2 text-right">
              <BotonDescargar
                url={`/api/minutes/download/${m.id}`}
                nombre={`${m.codigo}.docx`}
              />
            </td>
          </tr>
        ))}
      />
    </div>
  );
};

const ArchivoPage = () => {
  const { user } = useAuth();
  const veMinutas = ["admin", "lexdata"].includes(user?.rol);
  const [ventana, setVentana] = useState("matrices");
  const [vista, setVista] = useState("borradores");

  const cambiarVentana = (v) => {
    setVentana(v);
    setVista("borradores");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Archivo</h1>
        <p className="text-gray-600 mt-1">
          Sus borradores y los documentos que ha generado.
        </p>
      </div>

      {veMinutas && (
        <div className="flex gap-2 border-b border-gray-200 pb-3">
          <Pestana
            activa={ventana === "matrices"}
            onClick={() => cambiarVentana("matrices")}
          >
            Matrices
          </Pestana>
          <Pestana
            activa={ventana === "minutas"}
            onClick={() => cambiarVentana("minutas")}
          >
            Minutas
          </Pestana>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex gap-2">
          <Pestana
            activa={vista === "borradores"}
            onClick={() => setVista("borradores")}
          >
            Borradores
          </Pestana>
          <Pestana
            activa={vista === "generados"}
            onClick={() => setVista("generados")}
          >
            {ventana === "matrices" ? "Protocolos" : "Minutas generadas"}
          </Pestana>
        </div>

        {ventana === "matrices" && vista === "borradores" && (
          <Borradores
            key="b-matriz"
            tipoDocumento="matriz"
            tipos={TIPOS_MATRIZ}
          />
        )}
        {ventana === "matrices" && vista === "generados" && <Protocolos />}
        {ventana === "minutas" && vista === "borradores" && (
          <Borradores
            key="b-minuta"
            tipoDocumento="minuta"
            tipos={{
              compraventa: TIPOS_MINUTA.compraventa,
              promesa_compraventa: TIPOS_MINUTA.promesa_compraventa,
            }}
          />
        )}
        {ventana === "minutas" && vista === "generados" && <MinutasGeneradas />}
      </div>
    </div>
  );
};

export default ArchivoPage;
