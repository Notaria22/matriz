import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Printer } from "lucide-react";
import VistaRegistro from "../components/registro/VistaRegistro";
import { apiFetch } from "../config/api";

/** Declaración vigente de un compareciente, lista para imprimir y firmar. */
const ImprimirDeclaracionPage = () => {
  const { tipo, documento } = useParams();
  const [registro, setRegistro] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await apiFetch(
          `/api/registro/vigente/${tipo}/${encodeURIComponent(documento)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok) setRegistro(data);
        else setError(data.detail || "No se pudo cargar la declaración.");
      } catch {
        setError("Error de conexión.");
      }
    };
    cargar();
  }, [tipo, documento]);

  useEffect(() => {
    document.title = `Declaración ${documento}`;
  }, [documento]);

  if (error) {
    return <div className="p-8 text-red-700">{error}</div>;
  }
  if (!registro) {
    return <div className="p-8 text-gray-600">Cargando...</div>;
  }

  return (
    <div className="hoja-impresion bg-white min-h-screen">
      <div className="no-print sticky top-0 bg-gray-100 border-b px-6 py-3 flex justify-between items-center">
        <span className="text-sm text-gray-700">
          Declaración vigente de {documento}
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>
      <div className="max-w-3xl mx-auto p-8 print:px-1 print:py-0 print:max-w-none">
        <VistaRegistro registro={registro} imprimible />
      </div>
    </div>
  );
};

export default ImprimirDeclaracionPage;
