import { useState, useEffect, useRef, useCallback } from "react";
import { Search, FileText, X } from "lucide-react";
import { apiFetch } from "../../config/api";

/**
 * BuscadorPlantillas
 * Props:
 *   tipoDocumento  — 'minuta' | 'matriz'
 *   tipoContrato   — 'compraventa' | 'promesa' | 'poder'
 *   onCargar       — callback (contenido, borrador) del borrador seleccionado
 */
const BuscadorPlantillas = ({ tipoDocumento, tipoContrato, onCargar }) => {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const debounceRef = useRef(null);
  const contenedorRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const buscar = useCallback(
    async (texto) => {
      setBuscando(true);
      try {
        const params = new URLSearchParams({ q: texto });
        if (tipoDocumento) params.append("tipo_documento", tipoDocumento);
        if (tipoContrato) params.append("tipo_contrato", tipoContrato);

        const response = await apiFetch(`/api/templates/?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setResultados(data);
          setAbierto(true);
        }
      } catch (error) {
        console.error("Error buscando borradores:", error);
      } finally {
        setBuscando(false);
      }
    },
    [tipoDocumento, tipoContrato],
  );

  // Debounce — espera 300ms después de que el usuario deja de escribir
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResultados([]);
      setAbierto(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      buscar(query);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, buscar]);

  const handleSeleccionar = async (plantilla) => {
    setCargando(true);
    setAbierto(false);
    setQuery("");
    try {
      const response = await apiFetch(`/api/templates/${plantilla.id}`);
      if (response.ok) {
        const data = await response.json();
        onCargar(data.contenido, data);
      }
    } catch (error) {
      console.error("Error cargando borrador:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleLimpiar = () => {
    setQuery("");
    setResultados([]);
    setAbierto(false);
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div ref={contenedorRef} className="relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar borrador por código, nombre, vendedor o cédula..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {/* Indicador de carga o botón limpiar */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {buscando || cargando ? (
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          ) : query ? (
            <button
              onClick={handleLimpiar}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown de resultados */}
      {abierto && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {resultados.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No se encontraron borradores
            </div>
          ) : (
            <ul>
              {resultados.map((plantilla) => (
                <li key={plantilla.id}>
                  <button
                    onClick={() => handleSeleccionar(plantilla)}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          <span className="font-mono text-primary-700">
                            {plantilla.codigo}
                          </span>{" "}
                          · {plantilla.nombre}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {plantilla.nombre_vendedor} ·{" "}
                          {plantilla.tipo_contrato} ·{" "}
                          {formatearFecha(plantilla.creado_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default BuscadorPlantillas;
