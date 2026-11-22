import { useState, useEffect } from "react";
import { Card, FormField } from "../shared";
import { useAuth } from "../../context/AuthContext";

// Notarios de la notaría. Si cambia el suplente, se cambia aquí.
// suplente: true → se pide el número de acción de personal.
const NOTARIOS = {
  "alex-mejia": {
    nombre: "ALEX DAVID MEJÍA VITERI",
    titulo: "Notario Público Vigésimo Segundo del Cantón Quito",
    suplente: false,
  },
  "christian-yandun": {
    nombre: "CHRISTIAN ERNESTO YANDÚN TORRES",
    titulo: "Notario Público Suplente Vigésimo Segundo del Cantón Quito",
    suplente: true,
  },
};

const TIPOS_CONTRATO = {
  compraventa: "Compraventa",
  promesa_compraventa: "Promesa de Compraventa",
  cesion: "Cesión",
  donacion: "Donación",
};

const DatosAdministrativos = ({
  onChange,
  tipoContrato = "compraventa",
  initialData = null, // datos guardados en un borrador
}) => {
  const { user } = useAuth();
  const [showConcuerdo, setShowConcuerdo] = useState(
    Boolean(initialData?.needsConcuerdo),
  );

  const [formData, setFormData] = useState({
    notarioKey: initialData?.notarioKey || "",
    accionPersonal: initialData?.accionPersonal || "",
    matrizador: user?.iniciales || "",
    numeroProtocolo: initialData?.numeroProtocolo || "",
    tipoContrato: tipoContrato,
    cuantia: initialData?.cuantia ?? "",
    fechaEscritura:
      initialData?.fechaEscritura || new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const elegido = NOTARIOS[formData.notarioKey];
    const notario = elegido
      ? {
          nombre: elegido.nombre,
          titulo: elegido.titulo,
          suplente: elegido.suplente,
          accionPersonal: elegido.suplente
            ? formData.accionPersonal.trim()
            : "",
        }
      : null;

    if (onChange) {
      onChange({
        ...formData,
        notario,
        needsConcuerdo: showConcuerdo,
      });
    }
  }, [formData, showConcuerdo, onChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleToggleConcuerdo = () => setShowConcuerdo((prev) => !prev);

  return (
    <Card title="Datos Administrativos">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Notario" required error={errors.notarioKey}>
            <select
              name="notarioKey"
              value={formData.notarioKey}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Seleccione un notario</option>
              {Object.entries(NOTARIOS).map(([key, n]) => (
                <option key={key} value={key}>
                  {n.nombre} ({n.suplente ? "suplente" : "titular"})
                </option>
              ))}
            </select>
          </FormField>

          {NOTARIOS[formData.notarioKey]?.suplente && (
            <FormField
              label="Número de acción de personal"
              required
              hint="Aparece en la matriz junto al nombre del notario suplente."
            >
              <input
                type="text"
                name="accionPersonal"
                value={formData.accionPersonal}
                onChange={handleChange}
                className="input-field"
                placeholder="Ej: AP-2026-0123"
                maxLength={100}
              />
            </FormField>
          )}

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
          <p className="text-sm text-gray-600">
            Al final de la matriz se imprimen los dos concuerdos, sin
            peticionario. Los concuerdos adicionales se generan después desde el
            Archivo.
          </p>
        )}
      </div>
    </Card>
  );
};

export default DatosAdministrativos;
