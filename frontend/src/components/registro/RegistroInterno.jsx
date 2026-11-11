/**
 * El mismo formulario del cliente, llenado por el personal de la notaría.
 *
 *  - modo "nuevo": primero se pide el documento; si ya está registrado se
 *    bloquea ("use Actualizar").
 *  - modo "actualizar": se precarga la identidad actual y la parte UAFE va
 *    vacía; al guardar se crea una declaración nueva.
 */
import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import FormularioRegistro from "./FormularioRegistro";
import API_CONFIG, { apiFetch } from "../../config/api";
import { errorDeApi } from "../../utils/erroresApi";

const endpointDe = (tipo, documento) =>
  `${tipo === "empresa" ? API_CONFIG.ENDPOINTS.COMPANIES : API_CONFIG.ENDPOINTS.PARTIES}/${encodeURIComponent(documento)}`;

const leerError = async (res, porDefecto) => {
  const data = await res.json().catch(() => ({}));
  return typeof data.detail === "string" ? data.detail : porDefecto;
};

const RegistroInterno = ({
  tipo = "persona",
  modo = "nuevo",
  documento: documentoInicial = "",
  onGuardado, // (datos del compareciente o empresa, como los devuelve la API)
  onCancelar,
  onActualizar = null, // (documento) => void: ir a Actualizar si ya existe
}) => {
  const esEmpresa = tipo === "empresa";
  const [documento, setDocumento] = useState(documentoInicial);
  const [paso, setPaso] = useState(
    modo === "actualizar" || documentoInicial ? "cargando" : "documento",
  );
  const [datosIniciales, setDatosIniciales] = useState(null);
  const [error, setError] = useState("");
  const [yaExiste, setYaExiste] = useState(false);

  // Comprueba el documento: "nuevo" exige que no exista; "actualizar", que sí.
  const comprobar = async (doc) => {
    setError("");
    setYaExiste(false);
    const limpio = doc.trim().toUpperCase();
    if (!limpio) {
      setError("Ingrese el número de documento.");
      setPaso("documento");
      return;
    }
    setPaso("cargando");
    try {
      const res = await apiFetch(endpointDe(tipo, limpio));
      if (modo === "nuevo") {
        if (res.ok) {
          setError(
            `${esEmpresa ? "El RUC" : "El documento"} ${limpio} ya está registrado, use Actualizar.`,
          );
          setYaExiste(true);
          setPaso("documento");
          return;
        }
        if (res.status !== 404) {
          setError(await leerError(res, "No se pudo verificar el documento."));
          setPaso("documento");
          return;
        }
        setDocumento(limpio);
        setDatosIniciales(null);
        setPaso("formulario");
      } else {
        if (!res.ok) {
          setError(await leerError(res, "No se encontró el registro."));
          setPaso("error");
          return;
        }
        const data = await res.json();
        setDocumento(limpio);
        setDatosIniciales(
          esEmpresa
            ? { empresa: data }
            : { titular: data, conyugue: data.partner || null },
        );
        setPaso("formulario");
      }
    } catch {
      setError("Error de conexión. Intente nuevamente.");
      setPaso(modo === "nuevo" ? "documento" : "error");
    }
  };

  useEffect(() => {
    if (paso === "cargando" && documentoInicial) comprobar(documentoInicial);
    // solo al abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviar = async (payload) => {
    let res;
    try {
      res = await apiFetch(`/api/registro/interno?modo=${modo}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error("Error de conexión. Intente nuevamente.");
    }
    if (!res.ok) {
      throw await errorDeApi(res, "No se pudieron guardar los datos.");
    }
    const ok = await res.json();
    const datos = await apiFetch(endpointDe(ok.tipo, ok.documento));
    onGuardado?.(datos.ok ? await datos.json() : null, ok.documento);
  };

  if (paso === "cargando") {
    return (
      <div className="flex items-center gap-2 text-gray-600 p-6">
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
      </div>
    );
  }

  if (paso === "error") {
    return (
      <div className="max-w-2xl p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
        {onCancelar && (
          <button onClick={onCancelar} className="block mt-3 underline">
            Volver
          </button>
        )}
      </div>
    );
  }

  if (paso === "documento") {
    return (
      <div className="max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">
          {esEmpresa ? "Nueva empresa" : "Nuevo compareciente"}
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {esEmpresa ? "RUC" : "Cédula o pasaporte"}
          </label>
          <input
            type="text"
            value={documento}
            onChange={(e) => {
              setDocumento(e.target.value);
              setError("");
              setYaExiste(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && comprobar(documento)}
            maxLength={esEmpresa ? 13 : 13}
            placeholder={esEmpresa ? "0000000000001" : "0000000000"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              {error}
              {yaExiste && onActualizar && (
                <button
                  type="button"
                  onClick={() => onActualizar(documento.trim().toUpperCase())}
                  className="block mt-1 font-medium underline"
                >
                  Ir a Actualizar
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={() => comprobar(documento)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormularioRegistro
      key={`${modo}-${documento}`}
      tipo={tipo}
      documento={documento}
      documentoFijo
      datosIniciales={datosIniciales}
      encabezado={false}
      textoBoton={modo === "actualizar" ? "Guardar actualización" : "Guardar"}
      onEnviar={enviar}
      onCancelar={onCancelar}
    />
  );
};

export default RegistroInterno;
