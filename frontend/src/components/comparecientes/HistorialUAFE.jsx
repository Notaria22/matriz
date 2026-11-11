import { useEffect, useState } from "react";
import { Card } from "../shared";
import { AlertTriangle, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "../../config/api";
import { useToast } from "../../hooks/useToast";
import { ResumenPatrimonio } from "./ResumenPatrimonio";
import { etiquetaActividad } from "../../utils/actividadesEconomicas";

const ETIQUETAS = {
  document_type: "Tipo de documento",
  document_number: "Número de documento",
  names: "Nombres",
  last_names: "Apellidos",
  gender: "Género",
  marital_status: "Estado civil",
  nationality: "Nacionalidad",
  birth_date: "Fecha de nacimiento",
  email: "Correo electrónico",
  phone: "Teléfono",
  province: "Provincia",
  canton: "Cantón",
  parroquia: "Parroquia",
  sector: "Sector",
  main_street: "Calle principal",
  secondary_street: "Calle secundaria",
  number_street: "Número",
  edificio: "Edificio / departamento",
  occupation: "Ocupación",
  profession: "Profesión",
  partner_document_number: "Cédula del cónyuge",
  ruc: "RUC",
  razon_social: "Razón social",
  cargo_representante: "Cargo del representante",
  representante_document_number: "Cédula del representante",
};

const ORIGEN = {
  formulario_publico: "Formulario del cliente",
  sistema_interno: "Sistema interno",
};

const ROL = { vendedor: "Vendedor / transferente", adquirente: "Adquirente" };

const formatoFecha = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

/** Cambios de datos personales que reportó el cliente, con aplicar / descartar. */
const CambiosPendientes = ({ titulo, pendientes, onActualizado }) => {
  const toast = useToast();
  const [procesando, setProcesando] = useState(null);

  const resolver = async (id, accion) => {
    if (
      accion === "aplicar" &&
      !confirm("¿Aplicar estos cambios a los datos registrados?")
    )
      return;
    setProcesando(id);
    try {
      const res = await apiFetch(
        `/api/declaraciones/${id}/datos-reportados/${accion}`,
        { method: "POST" },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "No se pudo procesar");
      toast.success(
        accion === "aplicar" ? "Cambios aplicados" : "Cambios descartados",
      );
      onActualizado?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesando(null);
    }
  };

  if (!pendientes?.length) return null;

  return pendientes.map((p) => (
    <div
      key={p.declaracion_id}
      className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-3"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {titulo}: el cliente reportó cambios en sus datos
          </p>
          <p className="text-xs text-amber-800">
            {formatoFecha(p.fecha)} · Revise antes de aplicarlos; hasta entonces
            se siguen usando los datos registrados.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-amber-900/70">
              <th className="py-1 pr-3 font-medium">Campo</th>
              <th className="py-1 pr-3 font-medium">Registrado</th>
              <th className="py-1 font-medium">Reportado por el cliente</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(p.cambios).map(([campo, v]) => (
              <tr key={campo} className="border-t border-amber-200">
                <td className="py-1 pr-3 text-gray-700">
                  {ETIQUETAS[campo] || campo}
                </td>
                <td className="py-1 pr-3 text-gray-500">{v.actual ?? "—"}</td>
                <td className="py-1 font-medium text-gray-900">
                  {v.reportado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={procesando === p.declaracion_id}
          onClick={() => resolver(p.declaracion_id, "aplicar")}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          <Check className="w-4 h-4" /> Aplicar cambios
        </button>
        <button
          type="button"
          disabled={procesando === p.declaracion_id}
          onClick={() => resolver(p.declaracion_id, "descartar")}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 disabled:opacity-50"
        >
          <X className="w-4 h-4" /> Descartar
        </button>
      </div>
    </div>
  ));
};

/** Detalle de una declaración (se carga al abrirla). */
const DetalleDeclaracion = ({ id }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    apiFetch(`/api/declaraciones/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => activo && setData(d))
      .catch(() => activo && setError("No se pudo cargar la declaración"));
    return () => {
      activo = false;
    };
  }, [id]);

  if (error) return <p className="text-xs text-red-600 py-2">{error}</p>;

  if (!data) return <p className="text-xs text-gray-500 py-2">Cargando...</p>;

  const fila = (label, valor) =>
    valor === null || valor === undefined || valor === "" ? null : (
      <div className="flex gap-2 text-sm">
        <span className="text-gray-500 min-w-[10rem]">{label}:</span>
        <span className="text-gray-900">{String(valor)}</span>
      </div>
    );
  const siNo = (v) => (v === true ? "Sí" : v === false ? "No" : null);

  return (
    <div className="pt-2 pb-1 space-y-1">
      {fila("Rol en el trámite", ROL[data.rol_tramite] || data.rol_tramite)}
      {fila(
        "Actividad económica",
        etiquetaActividad(
          data.actividad_economica,
          data.actividad_economica_otra,
        ),
      )}
      {fila("Empresa donde trabaja", data.empresa_trabajo)}
      {fila(
        "Ingreso mensual",
        data.ingreso_mensual && `$${data.ingreso_mensual}`,
      )}
      {fila("Egreso mensual", data.egreso_mensual && `$${data.egreso_mensual}`)}
      {fila("Origen de los fondos", data.origen_fondos)}
      {fila("Cónyuge comparece", siNo(data.conyugue_comparece))}
      {fila("Razón de no comparecencia", data.razon_exclusion_conyugue)}
      {fila("Es PEP", siNo(data.es_pep))}
      {fila("Relacionado con PEP", siNo(data.es_pep_indirecto))}
      {fila("Nombre del PEP", data.pep_nombre)}
      {fila("Relación con el PEP", data.pep_relacion_tipo)}
      {fila("Cargo PEP", data.pep_cargo)}
      {fila("Institución PEP", data.pep_institucion)}
      {fila("Desde", data.pep_fecha_inicio)}
      {fila("Hasta", data.pep_fecha_fin)}
      {data.socios?.length > 0 &&
        fila(
          "Socios",
          data.socios
            .map(
              (s) =>
                `${s.nombres}${s.porcentaje != null ? ` (${s.porcentaje}%)` : ""}`,
            )
            .join(", "),
        )}
      {fila("Referencia Supercias", data.referencia_supercias)}
      {fila(
        "Socios informados mediante",
        {
          lista: "Lista de socios",
          anexo: "Nómina adjunta (PDF)",
          autorizacion: "Autorización de consulta en la web de la Supercias",
        }[data.socios_modalidad],
      )}
      {data.situacion_patrimonial && (
        <ResumenPatrimonio
          patrimonio={data.situacion_patrimonial}
          nota={false}
        />
      )}
    </div>
  );
};

/**
 * Declaraciones UAFE de un compareciente o empresa: cambios pendientes de
 * revisión e historial completo (cada declaración se guarda por separado).
 */
const HistorialUAFE = ({
  declaraciones = [],
  pendientes = [],
  onActualizado,
}) => {
  const [abierta, setAbierta] = useState(null);

  return (
    <Card title="Declaraciones UAFE">
      <div className="space-y-4">
        {pendientes.map((grupo) => (
          <CambiosPendientes
            key={grupo.titulo}
            titulo={grupo.titulo}
            pendientes={grupo.items}
            onActualizado={onActualizado}
          />
        ))}

        {declaraciones.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía no hay declaraciones UAFE registradas.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {declaraciones.map((d, i) => (
              <li key={d.id} className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => setAbierta(abierta === d.id ? null : d.id)}
                  className="w-full flex items-center justify-between text-left gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {formatoFecha(d.fecha)}
                      {i === 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">
                          Vigente
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {ORIGEN[d.origen] || d.origen}
                      {d.rol_tramite &&
                        ` · ${ROL[d.rol_tramite] || d.rol_tramite}`}
                      {d.es_pep && " · PEP"}
                      {d.es_pep_indirecto && " · Relacionado con PEP"}
                    </p>
                  </div>
                  {abierta === d.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {abierta === d.id && <DetalleDeclaracion id={d.id} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

export default HistorialUAFE;
