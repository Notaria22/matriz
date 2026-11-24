import { Card } from "../shared";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Home,
} from "lucide-react";

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

const ComparecienteCard = ({ data, showPartner = false }) => {
  if (!data) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStreetAddress = (data) => {
    const parts = [];
    if (data.mainStreet) parts.push(data.mainStreet);
    if (data.numberStreet) parts.push(`N° ${data.numberStreet}`);
    if (data.secondaryStreet) parts.push(`y ${data.secondaryStreet}`);
    return parts.join(" ") || "";
  };

  return (
    <Card>
      <div className="space-y-1 mb-4 pb-4 border-b">
        <h3 className="text-xl font-bold text-gray-900">
          {data.names} {data.lastNames}
        </h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            {data.documentType === "cedula" ? "CI" : "Pasaporte"}:{" "}
            {data.documentNumber}
          </span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              data.gender === "masculino"
                ? "bg-indigo-100 text-indigo-800"
                : "bg-pink-100 text-pink-800"
            }`}
          >
            {data.gender === "masculino" ? "Masculino" : "Femenino"}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded capitalize">
            {data.maritalStatus?.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 divide-y md:divide-y-0">
        <div className="space-y-1">
          <InfoRow
            icon={Calendar}
            label="Fecha de Nacimiento"
            value={formatDate(data.birthDate)}
          />

          <InfoRow icon={User} label="Nacionalidad" value={data.nationality} />

          <InfoRow icon={Briefcase} label="Ocupación" value={data.occupation} />

          {data.profession && (
            <InfoRow
              icon={Briefcase}
              label="Profesión"
              value={data.profession}
            />
          )}

          {data.email && (
            <InfoRow icon={Mail} label="Email" value={data.email} />
          )}

          {data.phone && (
            <InfoRow icon={Phone} label="Teléfono" value={data.phone} />
          )}
        </div>

        {data.resideExtranjero ? (
          <div className="space-y-1">
            <InfoRow
              icon={Home}
              label="Domicilio (extranjero)"
              value={data.direccionExtranjero}
            />
            <InfoRow
              icon={MapPin}
              label="Ciudad"
              value={data.ciudadResidencia}
            />
            <InfoRow icon={MapPin} label="País" value={data.paisResidencia} />
          </div>
        ) : (
          <div className="space-y-1">
            <InfoRow
              icon={Home}
              label="Domicilio"
              value={getStreetAddress(data)}
            />

            {data.sector && (
              <InfoRow icon={MapPin} label="Sector" value={data.sector} />
            )}

            <InfoRow icon={MapPin} label="Parroquia" value={data.parroquia} />

            <InfoRow icon={MapPin} label="Cantón" value={data.canton} />

            <InfoRow icon={MapPin} label="Provincia" value={data.province} />
          </div>
        )}
      </div>

      {/* Datos del cónyuge */}
      {showPartner && data.partner && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Datos del Cónyuge
          </h4>

          <div className="space-y-1 mb-4 pb-4 border-b">
            <h5 className="text-base font-medium text-gray-900">
              {data.partner.names} {data.partner.lastNames}
            </h5>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                CI: {data.partner.documentNumber}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  data.partner.gender === "masculino"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-pink-100 text-pink-800"
                }`}
              >
                {data.partner.gender === "masculino" ? "Masculino" : "Femenino"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div className="space-y-1">
              <InfoRow
                icon={Calendar}
                label="Fecha de Nacimiento"
                value={formatDate(data.partner.birthDate)}
              />

              <InfoRow
                icon={User}
                label="Nacionalidad"
                value={data.partner.nationality}
              />

              <InfoRow
                icon={Briefcase}
                label="Ocupación"
                value={data.partner.occupation}
              />

              {data.partner.profession && (
                <InfoRow
                  icon={Briefcase}
                  label="Profesión"
                  value={data.partner.profession}
                />
              )}

              {data.partner.email && (
                <InfoRow icon={Mail} label="Email" value={data.partner.email} />
              )}

              {data.partner.phone && (
                <InfoRow
                  icon={Phone}
                  label="Teléfono"
                  value={data.partner.phone}
                />
              )}
            </div>

            <div className="space-y-1">
              <InfoRow
                icon={Home}
                label="Domicilio"
                value={getStreetAddress(data.partner)}
              />

              {data.partner.sector && (
                <InfoRow
                  icon={MapPin}
                  label="Sector"
                  value={data.partner.sector}
                />
              )}

              <InfoRow
                icon={MapPin}
                label="Parroquia"
                value={data.partner.parroquia}
              />

              <InfoRow
                icon={MapPin}
                label="Cantón"
                value={data.partner.canton}
              />

              <InfoRow
                icon={MapPin}
                label="Provincia"
                value={data.partner.province}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ComparecienteCard;
