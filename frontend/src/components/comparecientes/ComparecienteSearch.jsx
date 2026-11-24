import { useState } from "react";
import { Search } from "lucide-react";
import { Button, FormField } from "../shared";
import { validarCedula } from "../../utils/validarCedula";

const OPCIONES_PERSONA = [
  ["cedula", "Cédula"],
  ["pasaporte", "Pasaporte"],
];
const OPCIONES_EMPRESA = [
  ["ruc", "RUC"],
  ["extranjera", "Empresa extranjera"],
];
const ETIQUETAS = {
  cedula: "Número de Cédula",
  pasaporte: "Número de Pasaporte",
  ruc: "RUC",
  extranjera: "Identificación fiscal extranjera",
};
const EJEMPLOS = {
  cedula: "Ej: 1234567890",
  pasaporte: "Ej: PA123456",
  ruc: "Ej: 1234567890001",
  extranjera: "Ej: 900.123.456-7",
};
const LARGOS = { cedula: 10, pasaporte: 20, ruc: 13, extranjera: 30 };

const ComparecienteSearch = ({
  onSearch,
  loading,
  mode = "cedula", // 'cedula' | 'ruc'
}) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  // 'cedula' | 'pasaporte' (personas) o 'ruc' | 'extranjera' (empresas)
  const [tipoDoc, setTipoDoc] = useState(mode === "ruc" ? "ruc" : "cedula");

  const validate = (val) => {
    if (!val.trim()) return "Ingrese un valor para buscar";

    if (mode === "cedula") {
      if (tipoDoc === "cedula") {
        if (!/^\d{10}$/.test(val)) return "La cédula debe tener 10 dígitos";
        if (!validarCedula(val)) return "Cédula ecuatoriana inválida";
      }
      // Pasaporte: cualquier combinación alfanumérica de 5 a 20 caracteres
      if (tipoDoc === "pasaporte") {
        if (val.trim().length < 4)
          return "El pasaporte debe tener al menos 4 caracteres";
      }
    } else if (tipoDoc === "extranjera") {
      if (val.trim().length < 3)
        return "La identificación debe tener al menos 3 caracteres";
    } else {
      if (!/^\d{13}$/.test(val))
        return "El RUC debe tener 13 dígitos numéricos";
      if (!val.endsWith("001")) return "El RUC de empresa debe terminar en 001";
    }

    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validate(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    onSearch(value.trim().toUpperCase(), tipoDoc);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-2">
        {(mode === "ruc" ? OPCIONES_EMPRESA : OPCIONES_PERSONA).map(
          ([valor, texto]) => (
            <button
              key={valor}
              type="button"
              onClick={() => {
                setTipoDoc(valor);
                setError("");
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                tipoDoc === valor
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {texto}
            </button>
          ),
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <FormField label={ETIQUETAS[tipoDoc]} error={error} className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            className={`input-field ${error ? "border-red-500 bg-red-50" : ""}`}
            placeholder={EJEMPLOS[tipoDoc]}
            maxLength={LARGOS[tipoDoc]}
            disabled={loading}
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          icon={<Search className="w-5 h-5" />}
          loading={loading}
          disabled={loading}
        >
          Buscar
        </Button>
      </form>
    </div>
  );
};

export default ComparecienteSearch;
