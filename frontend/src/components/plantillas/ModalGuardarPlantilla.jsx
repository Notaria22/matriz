import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { apiFetch } from "../../config/api";

/**
 * ModalGuardarPlantilla
 * Props:
 *   abierto         — boolean
 *   onCerrar        — callback al cerrar
 *   onGuardado      — callback al guardar exitosamente
 *   tipoDocumento   — 'minuta' | 'matriz'
 *   tipoContrato    — 'compraventa' | 'promesa' | 'poder'
 *   contenido       — objeto completo del formulario
 *   nombreVendedor  — string extraído automáticamente del primer vendedor
 *   borrador        — { id, codigo, nombre } si se está editando un borrador ya guardado
 */
const ModalGuardarPlantilla = ({
  abierto,
  onCerrar,
  onGuardado,
  tipoDocumento,
  tipoContrato,
  contenido,
  nombreVendedor,
  borrador = null,
}) => {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (abierto) setNombre(borrador?.nombre || "");
  }, [abierto, borrador]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  if (!abierto) return null;

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError("Ingresa un nombre para el borrador");
      return;
    }

    setError("");
    setGuardando(true);

    try {
      const datos = {
        nombre: nombre.trim(),
        nombre_vendedor: nombreVendedor || "Sin vendedor",
        contenido,
      };
      const response = borrador
        ? await apiFetch(`/api/templates/${borrador.id}`, {
            method: "PUT",
            body: JSON.stringify(datos),
          })
        : await apiFetch("/api/templates/", {
            method: "POST",
            body: JSON.stringify({
              ...datos,
              tipo_contrato: tipoContrato,
              tipo_documento: tipoDocumento,
            }),
          });

      const data = await response.json();
      if (response.ok) {
        setNombre("");
        onGuardado(data);
      } else {
        setError(data.detail || "Error al guardar el borrador");
      }
    } catch (err) {
      setError("Error de conexión", err);
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrar = () => {
    setNombre("");
    setError("");
    onCerrar();
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={handleCerrar}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">
            {borrador
              ? `Guardar borrador ${borrador.codigo}`
              : "Guardar como borrador"}
          </h3>
          <button
            onClick={handleCerrar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vendedor detectado */}
        {nombreVendedor && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-gray-500 mb-0.5">Vendedor detectado</p>
            <p className="text-sm font-medium text-gray-800">
              {nombreVendedor}
            </p>
          </div>
        )}

        {/* Campo nombre */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del borrador
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
            placeholder="Ej: Torre Amazonas Piso 3"
            autoFocus
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500
              ${error ? "border-red-400" : "border-gray-300"}`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCerrar}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalGuardarPlantilla;
