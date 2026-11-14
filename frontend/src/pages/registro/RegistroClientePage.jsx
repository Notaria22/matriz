import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Download } from "lucide-react";
import FormularioRegistro from "../../components/registro/FormularioRegistro";
import VistaRegistro from "../../components/registro/VistaRegistro";
import { errorDeApi } from "../../utils/erroresApi";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Link público que la notaría envía al cliente para que llene sus datos. */
const RegistroClientePage = () => {
  const { token } = useParams();
  const [tokenInfo, setTokenInfo] = useState(null); // null = verificando
  const [enviado, setEnviado] = useState(null); // registro enviado

  useEffect(() => {
    const verificar = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/public/registro/verificar/${token}`,
        );
        const data = await res.json();
        setTokenInfo(
          data.valido && data.tipo && data.documento
            ? { valido: true, tipo: data.tipo, documento: data.documento }
            : { valido: false },
        );
      } catch {
        setTokenInfo({ valido: false });
      }
    };
    verificar();
  }, [token]);

  const enviar = async (payload) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/public/registro/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error("Error de conexión. Intente nuevamente.");
    }
    if (!res.ok) {
      throw await errorDeApi(
        res,
        "Error al guardar los datos. Intente nuevamente.",
      );
    }
    setEnviado({
      tipo: payload.tipo,
      origen: "formulario_publico",
      fecha: new Date().toISOString(),
      acepta_condiciones: payload.acepta_condiciones,
      acepta_privacidad: payload.acepta_privacidad,
      payload,
    });
    document.title = `formulario-UAFE-notaria22UIO-${tokenInfo.documento}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (tokenInfo === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando enlace...</p>
        </div>
      </div>
    );
  }
  if (!tokenInfo.valido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
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
      <>
        <div className="no-print min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              ¡Datos registrados!
            </h1>
            <p className="text-gray-600">
              Sus datos han sido guardados correctamente. Al momento de su cita,
              el personal de la notaría ya tendrá su información disponible.
            </p>
            <p className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm font-medium text-amber-800">
              Por favor descargue el formulario, imprímalo y fírmelo
              físicamente.
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              <Download className="w-4 h-4" /> Descargar formulario
            </button>
          </div>
        </div>
        <div className="hidden print:block">
          <VistaRegistro registro={enviado} imprimible />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <FormularioRegistro
        tipo={tokenInfo.tipo}
        documento={tokenInfo.documento}
        documentoFijo
        onEnviar={enviar}
      />
    </div>
  );
};

export default RegistroClientePage;
