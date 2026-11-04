import { useState, useEffect } from "react";
import { Card, FormField } from "../shared";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../config/api";

// Los notarios (titular y suplente) vienen de Gestión de Usuarios:
// si cambia el suplente, se cambia ahí y no en el código.

const TIPOS_CONTRATO = {
  compraventa: "Compraventa",
  promesa_compraventa: "Promesa de Compraventa",
  sesion: "Sesión",
  donacion: "Donación",
};

const DatosAdministrativos = ({ onChange, tipoContrato = "compraventa" }) => {
  const { user } = useAuth();
  const [showConcuerdo, setShowConcuerdo] = useState(false);

  const [formData, setFormData] = useState({
    notarioKey: "",
    matrizador: user?.iniciales || "",
    numeroProtocolo: "",
    tipoContrato: tipoContrato,
    cuantia: "",
    fechaEscritura: new Date().toISOString().split("T")[0],
    concuerdoNumeroProtocolo: "",
    concuerdoNombres: "",
    concuerdoApellidos: "",
    concuerdoCedula: "",
    concuerdoFecha: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState({});
  const [notarios, setNotarios] = useState([]);
  const [errorNotarios, setErrorNotarios] = useState("");

  useEffect(() => {
    let activo = true;
    apiFetch("/api/system-users/notarios")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((lista) => {
        if (!activo) return;
        setNotarios(lista);
        if (lista.length === 0)
          setErrorNotarios(
            "No hay notarios configurados. Un administrador debe marcar al titular y al suplente en Gestión de Usuarios.",
          );
      })
      .catch(
        () =>
          activo && setErrorNotarios("No se pudo cargar la lista de notarios."),
      );
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const elegido = notarios.find((n) => String(n.id) === formData.notarioKey);
    const notario = elegido
      ? { nombre: elegido.nombre, titulo: elegido.titulo }
      : null;

    if (onChange) {
      onChange({
        ...formData,
        notario,
        needsConcuerdo: showConcuerdo,
      });
    }
  }, [formData, showConcuerdo, onChange, notarios]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleToggleConcuerdo = () => {
    setShowConcuerdo((prev) => {
      const newState = !prev;
      if (!newState) {
        setFormData((prev) => ({
          ...prev,
          concuerdoNumeroProtocolo: "",
          concuerdoNombres: "",
          concuerdoApellidos: "",
          concuerdoCedula: "",
          concuerdoFecha: new Date().toISOString().split("T")[0],
        }));
      }
      return newState;
    });
  };

  return (
    <Card title="Datos Administrativos">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Notario"
            required
            error={errors.notarioKey || errorNotarios}
          >
            <select
              name="notarioKey"
              value={formData.notarioKey}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Seleccione un notario</option>
              {notarios.map((n) => (
                <option key={n.id} value={String(n.id)}>
                  {n.nombre} ({n.cargo === "titular" ? "titular" : "suplente"})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Matrizador">
            <input
              type="text"
              value={
                user?.iniciales
                  ? `${formData.matrizador} (${user.nombre})`
                  : "Sin iniciales configuradas"
              }
              className="input-field bg-gray-100"
              disabled
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            label="Número de Protocolo"
            required
            error={errors.numeroProtocolo}
          >
            <input
              type="text"
              name="numeroProtocolo"
              value={formData.numeroProtocolo}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej: 123"
            />
          </FormField>

          <FormField label="Tipo de Contrato" required>
            <input
              type="text"
              value={
                TIPOS_CONTRATO[formData.tipoContrato] || formData.tipoContrato
              }
              readOnly
              className="input-field bg-gray-50 cursor-default"
            />
          </FormField>

          <FormField label="Cuantía" required error={errors.cuantia}>
            <input
              type="number"
              name="cuantia"
              value={formData.cuantia}
              onChange={handleChange}
              className="input-field"
              placeholder="Valor en USD"
              step="0.01"
            />
          </FormField>

          <FormField label="Fecha de la Escritura" required>
            <input
              type="date"
              name="fechaEscritura"
              value={formData.fechaEscritura}
              onChange={handleChange}
              className="input-field"
            />
          </FormField>
        </div>

        <div className="pt-4 border-t">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showConcuerdo}
              onChange={handleToggleConcuerdo}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Incluir Concuerdo
            </span>
          </label>
        </div>

        {showConcuerdo && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
            <h4 className="font-semibold text-blue-900">Datos del Concuerdo</h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField label="N° Protocolo" required>
                <input
                  type="text"
                  name="concuerdoNumeroProtocolo"
                  value={formData.concuerdoNumeroProtocolo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: 456"
                />
              </FormField>

              <FormField label="Fecha" required>
                <input
                  type="date"
                  name="concuerdoFecha"
                  value={formData.concuerdoFecha}
                  onChange={handleChange}
                  className="input-field"
                />
              </FormField>

              <div className="md:col-span-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Nombres del Solicitante" required>
                <input
                  type="text"
                  name="concuerdoNombres"
                  value={formData.concuerdoNombres}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombres completos"
                />
              </FormField>

              <FormField label="Apellidos del Solicitante" required>
                <input
                  type="text"
                  name="concuerdoApellidos"
                  value={formData.concuerdoApellidos}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Apellidos completos"
                />
              </FormField>

              <FormField label="Cédula" required>
                <input
                  type="text"
                  name="concuerdoCedula"
                  value={formData.concuerdoCedula}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="1234567890"
                  maxLength="10"
                />
              </FormField>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DatosAdministrativos;
