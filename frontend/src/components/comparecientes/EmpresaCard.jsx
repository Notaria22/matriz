import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { Card } from "../shared";
import {
  MapPin,
  Phone,
  Mail,
  User,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Users,
  Download,
} from "lucide-react";
import API_CONFIG, { apiFetch } from "../../config/api";
import { ResumenPatrimonio } from "./ResumenPatrimonio";
import { etiquetaActividad } from "../../utils/actividadesEconomicas";

const ROL_TRAMITE = {
  vendedor: "Vendedor / Transferente",
  adquirente: "Adquirente",
};

const formatMoney = (v) =>
  v === "" || v === null || v === undefined
    ? ""
    : `$${Number(v).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;

/** Bloque PEP (directo o relacionado) del representante legal */
const BloquePEP = ({ data }) => {
  if (data.repEsPep !== true && data.repEsPepIndirecto !== true) {
    if (data.repEsPep === false) {
      return (
        <p className="text-sm text-gray-700">
          <span className="font-medium">PEP:</span> No
        </p>
      );
    }
    return null;
  }
  const directo = data.repEsPep === true;
  return (
    <div
      className={`p-3 rounded-lg border text-sm space-y-1 ${
        directo
          ? "bg-amber-50 border-amber-200"
          : "bg-orange-50 border-orange-200"
      }`}
    >
      <p className="font-semibold text-gray-800">
        {directo
          ? "Es Persona Políticamente Expuesta (PEP)"
          : "Relacionado con una Persona Políticamente Expuesta"}
      </p>
      {!directo && data.repPepNombre && (
        <p>
          <span className="font-medium">PEP:</span> {data.repPepNombre}
          {data.repPepRelacionTipo && ` (${data.repPepRelacionTipo})`}
          {data.repPepGradoRelacion && ` — ${data.repPepGradoRelacion}`}
        </p>
      )}
      {data.repPepCargo && (
        <p>
          <span className="font-medium">Cargo:</span> {data.repPepCargo}
        </p>
      )}
      {data.repPepInstitucion && (
        <p>
          <span className="font-medium">Institución:</span>{" "}
          {data.repPepInstitucion}
        </p>
      )}
      {data.repPepFechaInicio && (
        <p>
          <span className="font-medium">Desde:</span> {data.repPepFechaInicio}
          {data.repPepYaNoEjerce &&
            ` — hasta: ${data.repPepFechaFin || "(sin fecha)"}`}
        </p>
      )}
      <ResumenPatrimonio patrimonio={data.repPatrimonio} nota={false} />
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 wrap-break-words">
          {value}
        </p>
      </div>
    </div>
  );
};

const EmpresaCard = ({ data }) => {
  const [descargando, setDescargando] = useState(false);
  const toast = useToast();
  if (!data) return null;

  const descargarAnexo = async () => {
    setDescargando(true);
    try {
      const res = await apiFetch(
        `${API_CONFIG.ENDPOINTS.COMPANIES}/${data.ruc}/anexo-socios`,
      );
      if (!res.ok) throw new Error("No se pudo descargar el anexo");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.anexoSociosNombre || `socios_${data.ruc}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDescargando(false);
    }
  };

  const socios = (data.socios || []).filter(
    (s) => s && (s.nombres || s.numero_documento),
  );
  const tieneInfoEmpresa =
    data.actividadEmpresa ||
    data.ingresoMensual !== "" ||
    data.origenFondos ||
    data.rolTramite;
  const tieneInfoRep =
    data.repIngresoMensual !== "" ||
    data.repOrigenFondos ||
    data.repRolTramite ||
    data.repEsPep !== null;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAddress = (prefix, d) => {
    const main = d[`${prefix}MainStreet`] || d.mainStreet;
    const num = d[`${prefix}NumberStreet`] || d.numberStreet;
    const sec = d[`${prefix}SecondaryStreet`] || d.secondaryStreet;
    const parts = [];
    if (main) parts.push(main);
    if (num) parts.push(`N° ${num}`);
    if (sec) parts.push(`y ${sec}`);
    return parts.join(" ");
  };

  return (
    <Card>
      {/* Encabezado empresa */}
      <div className="space-y-1 mb-4 pb-4 border-b">
        <h3 className="text-xl font-bold text-gray-900">{data.razonSocial}</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
            RUC: {data.ruc}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
            Empresa
          </span>
        </div>
      </div>

      {/* Datos empresa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mb-6">
        <div className="space-y-1">
          <InfoRow icon={Mail} label="Correo electrónico" value={data.email} />
          <InfoRow icon={Phone} label="Teléfono" value={data.phone} />
        </div>
        <div className="space-y-1">
          <InfoRow
            icon={MapPin}
            label="Dirección"
            value={getAddress("", data)}
          />
          <InfoRow icon={MapPin} label="Sector" value={data.sector} />
          <InfoRow icon={MapPin} label="Parroquia" value={data.parroquia} />
          <InfoRow icon={MapPin} label="Cantón" value={data.canton} />
          <InfoRow icon={MapPin} label="Provincia" value={data.province} />
        </div>
      </div>

      {/* Información financiera de la empresa */}
      {tieneInfoEmpresa && (
        <div className="mb-6 pt-4 border-t">
          <h4 className="text-base font-semibold text-gray-700 mb-3">
            Información financiera (UAFE)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div className="space-y-1">
              <InfoRow
                icon={Briefcase}
                label="Actividad de la empresa"
                value={data.actividadEmpresa}
              />
              <InfoRow
                icon={User}
                label="Rol en el trámite"
                value={ROL_TRAMITE[data.rolTramite] || data.rolTramite}
              />
            </div>
            <div className="space-y-1">
              <InfoRow
                icon={DollarSign}
                label="Ingreso mensual"
                value={formatMoney(data.ingresoMensual)}
              />
              <InfoRow
                icon={DollarSign}
                label="Egreso mensual"
                value={formatMoney(data.egresoMensual)}
              />
            </div>
          </div>
          <InfoRow
            icon={DollarSign}
            label="Origen de los fondos"
            value={data.origenFondos}
          />
        </div>
      )}

      {data.patrimonio && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-base font-semibold text-gray-700 mb-3">
            Situación patrimonial de la empresa
          </h4>
          <ResumenPatrimonio patrimonio={data.patrimonio} nota={false} />
        </div>
      )}

      {/* Socios / accionistas */}
      {(socios.length > 0 ||
        data.referenciaSupercias ||
        data.anexoSociosNombre ||
        data.autorizaConsultaSupercias) && (
        <div className="mb-6 pt-4 border-t">
          <h4 className="text-base font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Socios / accionistas
          </h4>
          {data.controladaSupercias !== null && (
            <p className="text-xs text-gray-500 mb-3">
              {data.controladaSupercias
                ? "Compañía controlada por la Superintendencia de Compañías"
                : "Compañía extranjera o no controlada por la Superintendencia de Compañías"}
            </p>
          )}
          {socios.length > 0 && (
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-1 pr-3 font-medium">Nombres</th>
                    <th className="py-1 pr-3 font-medium">Documento</th>
                    <th className="py-1 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {socios.map((s, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1 pr-3 text-gray-900">{s.nombres}</td>
                      <td className="py-1 pr-3 text-gray-700">
                        {s.numero_documento
                          ? `${s.tipo_documento === "pasaporte" ? "Pasaporte" : "CI"}: ${s.numero_documento}`
                          : "—"}
                      </td>
                      <td className="py-1 text-gray-700">
                        {s.porcentaje !== null &&
                        s.porcentaje !== undefined &&
                        s.porcentaje !== ""
                          ? `${s.porcentaje}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <InfoRow
            icon={FileText}
            label="Referencia Supercias"
            value={data.referenciaSupercias}
          />
          {data.autorizaConsultaSupercias && (
            <p className="mt-2 p-3 text-sm bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
              La empresa autorizó a la notaría a consultar la nómina de socios o
              accionistas en la web de la Superintendencia de Compañías.
            </p>
          )}
          {data.anexoSociosNombre && (
            <button
              type="button"
              onClick={descargarAnexo}
              disabled={descargando}
              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {descargando
                ? "Descargando..."
                : `Descargar listado de socios (${data.anexoSociosNombre})`}
            </button>
          )}
        </div>
      )}

      {/* Representante legal */}
      <div className="mt-2 pt-4 border-t">
        <h4 className="text-base font-semibold text-gray-700 mb-3">
          Representante Legal
        </h4>

        <div className="space-y-1 mb-3 pb-3 border-b">
          <h5 className="text-base font-medium text-gray-900">
            {data.repNames} {data.repLastNames}
          </h5>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {data.repDocumentType === "cedula" ? "CI" : "Pasaporte"}:{" "}
              {data.repDocumentNumber}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                data.repGender === "masculino"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-pink-100 text-pink-800"
              }`}
            >
              {data.repGender === "masculino" ? "Masculino" : "Femenino"}
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
              {data.repPosition}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <div className="space-y-1">
            <InfoRow
              icon={Calendar}
              label="Fecha de Nacimiento"
              value={formatDate(data.repBirthDate)}
            />
            <InfoRow
              icon={User}
              label="Nacionalidad"
              value={data.repNationality}
            />
            <InfoRow
              icon={Briefcase}
              label="Ocupación"
              value={data.repOccupation}
            />
            {data.repProfession && (
              <InfoRow
                icon={Briefcase}
                label="Profesión"
                value={data.repProfession}
              />
            )}
            <InfoRow icon={Mail} label="Email" value={data.repEmail} />
            <InfoRow icon={Phone} label="Teléfono" value={data.repPhone} />
          </div>
          <div className="space-y-1">
            <InfoRow
              icon={MapPin}
              label="Dirección"
              value={getAddress("rep", data)}
            />
            <InfoRow icon={MapPin} label="Sector" value={data.repSector} />
            <InfoRow
              icon={MapPin}
              label="Parroquia"
              value={data.repParroquia}
            />
            <InfoRow icon={MapPin} label="Cantón" value={data.repCanton} />
            <InfoRow icon={MapPin} label="Provincia" value={data.repProvince} />
          </div>
        </div>

        {tieneInfoRep && (
          <div className="mt-4 pt-3 border-t space-y-2">
            <h5 className="text-sm font-semibold text-gray-700">
              Información financiera del representante (UAFE)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow
                icon={DollarSign}
                label="Ingreso mensual"
                value={formatMoney(data.repIngresoMensual)}
              />
              <InfoRow
                icon={User}
                label="Rol en el trámite"
                value={ROL_TRAMITE[data.repRolTramite] || data.repRolTramite}
              />
              <InfoRow
                icon={Briefcase}
                label="Actividad económica"
                value={etiquetaActividad(
                  data.repActividadEconomica,
                  data.repActividadEconomicaOtra,
                )}
              />
            </div>
            <InfoRow
              icon={DollarSign}
              label="Origen de los fondos"
              value={data.repOrigenFondos}
            />
            <BloquePEP data={data} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default EmpresaCard;
