/**
 * Muestra un envío del formulario de registro tal cual se llenó, en el mismo
 * orden del formulario. Se usa en la ficha de Comparecientes y en la
 * impresión para la firma (con `imprimible`: textos legales y firmas).
 */
import { etiquetaActividad } from "../../utils/actividadesEconomicas";
import {
  CALIDADES_PARTICIPACION,
  CONDICIONES_JURIDICAS,
  MODALIDADES_SOCIOS,
  RAZONES_EXCLUSION_CONYUGUE,
  ROLES_TRAMITE,
  TEXTO_ACEPTA_CONDICIONES,
  TEXTO_ACEPTA_PRIVACIDAD,
  TEXTO_ENCABEZADO,
  TEXTO_PRIVACIDAD,
  TIPOS_INMUEBLE_PATRIMONIO,
} from "./textosRegistro";

// ─── Formato ────────────────────────────────────────────────────────────────
const vacio = (v) => v === null || v === undefined || v === "";

const fecha = (v) => {
  if (vacio(v)) return "";
  const [a, m, d] = String(v).slice(0, 10).split("-");
  return d && m && a ? `${d}/${m}/${a}` : String(v);
};

const usd = (v) => {
  if (vacio(v)) return "";
  const n = Number(v);
  return Number.isNaN(n)
    ? String(v)
    : n.toLocaleString("es-EC", { style: "currency", currency: "USD" });
};

const siNo = (v) => (v === true ? "Sí" : v === false ? "No" : "");

const OPCIONES = {
  document_type: { cedula: "Cédula", pasaporte: "Pasaporte", ruc: "RUC" },
  gender: { masculino: "Masculino", femenino: "Femenino" },
  marital_status: {
    soltero: "Soltero/a",
    casado: "Casado/a",
    divorciado: "Divorciado/a",
    viudo: "Viudo/a",
  },
};
const opcion = (campo, v) => (vacio(v) ? "" : OPCIONES[campo]?.[v] || v);

const nombreCompleto = (p) =>
  [p?.names, p?.last_names].filter(Boolean).join(" ").toUpperCase();

// ─── Bloques de presentación ────────────────────────────────────────────────
const Campo = ({ etiqueta, valor, ancho = false }) =>
  vacio(valor) ? null : (
    <div className={`registro-campo ${ancho ? "col-span-2" : ""}`}>
      <dt className="text-xs text-gray-500">{etiqueta}</dt>
      <dd className="text-sm text-gray-900 break-words">{valor}</dd>
    </div>
  );

const Grupo = ({ titulo, children }) => (
  <div className="registro-grupo">
    {titulo && (
      <h4 className="text-sm font-semibold text-gray-700 border-t pt-2 mt-3 mb-2">
        {titulo}
      </h4>
    )}
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</dl>
  </div>
);

const Bloque = ({ titulo, children }) => (
  <section className="registro-bloque bg-white border border-gray-200 rounded-lg p-4">
    <h3 className="text-base font-semibold text-gray-900 border-b pb-2">
      {titulo}
    </h3>
    {children}
  </section>
);

// ─── Secciones del formulario ───────────────────────────────────────────────
const Direccion = ({ d, p = "", titulo = "Dirección" }) => (
  <Grupo titulo={titulo}>
    <Campo etiqueta="Provincia" valor={d[`${p}province`]} />
    <Campo etiqueta="Cantón" valor={d[`${p}canton`]} />
    <Campo etiqueta="Parroquia" valor={d[`${p}parroquia`]} />
    <Campo etiqueta="Sector / Urbanización" valor={d[`${p}sector`]} />
    <Campo etiqueta="Calle Principal" valor={d[`${p}main_street`]} />
    <Campo etiqueta="Calle Secundaria" valor={d[`${p}secondary_street`]} />
    <Campo etiqueta="Número" valor={d[`${p}number_street`]} />
    <Campo etiqueta="Referencia" valor={d[`${p}referencia`]} ancho />
  </Grupo>
);

const Lista = ({ titulo, filas, noPosee, render }) => (
  <div className="col-span-2">
    <dt className="text-xs text-gray-500">{titulo}</dt>
    <dd className="text-sm text-gray-900">
      {noPosee ? (
        "No posee"
      ) : !filas?.length ? (
        "No declarado"
      ) : (
        <ul className="list-disc ml-5">
          {filas.map((f, i) => (
            <li key={i}>{render(f)}</li>
          ))}
        </ul>
      )}
    </dd>
  </div>
);

const tituloPatrimonio = (quien) => (
  <>
    Situación patrimonial {quien === "EMPRESA" ? "de la" : "del"}{" "}
    <strong className="font-extrabold">{quien}</strong>
  </>
);

const Patrimonio = ({ pat, quien = "DECLARANTE" }) => {
  if (!pat) return null;
  const tipoInmueble = (i) =>
    i.tipo === "otro"
      ? `Otro: ${i.especificar || ""}`
      : TIPOS_INMUEBLE_PATRIMONIO.find((t) => t.value === i.tipo)?.label ||
        i.tipo;
  const total =
    (pat.inmuebles || []).reduce((t, f) => t + (Number(f.valor) || 0), 0) +
    (pat.vehiculos || []).reduce((t, f) => t + (Number(f.valor) || 0), 0) +
    (pat.acciones || []).reduce((t, f) => t + (Number(f.monto) || 0), 0);

  return (
    <Grupo titulo={tituloPatrimonio(quien)}>
      <Lista
        titulo="Propiedades inmuebles"
        filas={pat.inmuebles}
        noPosee={pat.no_posee_inmuebles}
        render={(i) =>
          [tipoInmueble(i), i.ciudad, usd(i.valor)].filter(Boolean).join(" — ")
        }
      />
      <Lista
        titulo="Vehículos"
        filas={pat.vehiculos}
        noPosee={pat.no_posee_vehiculos}
        render={(v) =>
          [v.marca, v.modelo, v.placa && `Placa ${v.placa}`, usd(v.valor)]
            .filter(Boolean)
            .join(" — ")
        }
      />
      <Campo
        etiqueta="Inversiones, pólizas, fondos de acumulación o fideicomisos"
        valor={
          pat.no_posee_inversiones
            ? "No posee"
            : pat.inversiones || "No declarado"
        }
        ancho
      />
      <Lista
        titulo="Acciones, participaciones o capital invertido en empresas"
        filas={pat.acciones}
        noPosee={pat.no_posee_acciones}
        render={(a) => [a.entidad, usd(a.monto)].filter(Boolean).join(" — ")}
      />
      <Campo etiqueta="Total de bienes declarados" valor={usd(total)} />
    </Grupo>
  );
};

// Información financiera, rol en el trámite, PEP y patrimonio
const UAFE = ({
  d,
  p = "",
  titulo = "Información Financiera",
  esRepresentado = false,
  esEmpresa = false,
  quien = "DECLARANTE",
}) => {
  const esPep = d[`${p}es_pep`] === true;
  const esIndirecto = d[`${p}es_pep_indirecto`] === true;
  const rol = d[`${p}rol_tramite`];
  return (
    <>
      <Grupo titulo={titulo}>
        <Campo
          etiqueta={
            esEmpresa ? "Actividad Económica Principal" : "Actividad Económica"
          }
          valor={
            esEmpresa
              ? d.actividad_empresa
              : etiquetaActividad(
                  d[`${p}actividad_economica`],
                  d[`${p}actividad_economica_otra`],
                )
          }
        />
        <Campo
          etiqueta="Ingreso Mensual (USD)"
          valor={usd(d[`${p}ingreso_mensual`])}
        />
        {esEmpresa && (
          <Campo
            etiqueta="Egreso Mensual (USD)"
            valor={usd(d.egreso_mensual)}
          />
        )}
        <Campo
          etiqueta="Empresa o Institución de Trabajo"
          valor={d[`${p}empresa_trabajo`]}
        />
        <Campo
          etiqueta={
            esEmpresa
              ? "¿En qué calidad participa la empresa en el trámite?"
              : "¿En qué calidad participa en el trámite?"
          }
          valor={ROLES_TRAMITE[rol] || rol}
          ancho
        />
        <Campo
          etiqueta={
            rol === "adquirente"
              ? "Origen de los fondos con los que pagará el bien que adquiere"
              : "Origen de los fondos con los que adquirió el bien que transfiere"
          }
          valor={d[`${p}origen_fondos`]}
          ancho
        />
      </Grupo>
      {!esEmpresa && (
        <Grupo titulo="Persona Políticamente Expuesta (PEP)">
          <Campo
            etiqueta={
              esRepresentado
                ? "¿Es su Mandante una Persona Políticamente Expuesta (PEP)?"
                : "¿Es usted una Persona Políticamente Expuesta (PEP)?"
            }
            valor={siNo(d[`${p}es_pep`])}
            ancho
          />
          {!esPep && (
            <Campo
              etiqueta="¿Es pariente, amigo o colaborador de una Persona Políticamente Expuesta?"
              valor={siNo(d[`${p}es_pep_indirecto`])}
              ancho
            />
          )}
          {esIndirecto && (
            <>
              <Campo etiqueta="Nombre del PEP" valor={d[`${p}pep_nombre`]} />
              <Campo
                etiqueta="Relación con el PEP"
                valor={d[`${p}pep_relacion_tipo`]}
              />
              <Campo
                etiqueta="Grado de consanguinidad, afinidad o relación"
                valor={d[`${p}pep_grado_relacion`]}
              />
            </>
          )}
          {(esPep || esIndirecto) && (
            <>
              <Campo etiqueta="Institución" valor={d[`${p}pep_institucion`]} />
              <Campo etiqueta="Cargo" valor={d[`${p}pep_cargo`]} />
              <Campo
                etiqueta="Desde qué fecha desempeña el cargo"
                valor={fecha(d[`${p}pep_fecha_inicio`])}
              />
              {d[`${p}pep_ya_no_ejerce`] && (
                <Campo
                  etiqueta="Terminó sus funciones"
                  valor={fecha(d[`${p}pep_fecha_fin`]) || "Sí"}
                />
              )}
            </>
          )}
        </Grupo>
      )}
      {!esEmpresa && (
        <Patrimonio
          pat={d[`${p}patrimonio`]}
          quien={p === "rep_" ? "REPRESENTANTE LEGAL" : quien}
        />
      )}
    </>
  );
};

const Persona = ({
  titulo,
  d,
  esRepresentado = false,
  mostrarEstadoCivil = true,
  quien = "DECLARANTE",
}) => (
  <Bloque titulo={titulo}>
    <Grupo>
      <Campo
        etiqueta="Tipo de Documento"
        valor={opcion("document_type", d.document_type)}
      />
      <Campo
        etiqueta={
          d.document_type === "cedula"
            ? "Número de Cédula"
            : "Número de Documento"
        }
        valor={d.document_number}
      />
      <Campo etiqueta="Nombres" valor={d.names} />
      <Campo etiqueta="Apellidos" valor={d.last_names} />
      <Campo etiqueta="Género" valor={opcion("gender", d.gender)} />
      {mostrarEstadoCivil && (
        <Campo
          etiqueta="Estado Civil"
          valor={opcion("marital_status", d.marital_status)}
        />
      )}
      <Campo etiqueta="Nacionalidad" valor={d.nationality} />
      <Campo etiqueta="Fecha de Nacimiento" valor={fecha(d.birth_date)} />
    </Grupo>
    <Grupo titulo="Contacto">
      <Campo etiqueta="Correo Electrónico" valor={d.email} />
      <Campo etiqueta="Teléfono Celular" valor={d.phone} />
    </Grupo>
    <Direccion d={d} />
    <Grupo titulo="Ocupación">
      <Campo etiqueta="Ocupación" valor={d.occupation} />
      <Campo etiqueta="Profesión" valor={d.profession} />
    </Grupo>
    <UAFE d={d} esRepresentado={esRepresentado} quien={quien} />
  </Bloque>
);

const ConyugeNoComparece = ({ d }) =>
  d?.marital_status === "casado" && d?.conyugue_comparece === false ? (
    <Bloque titulo="Cónyuge">
      <Grupo>
        <Campo
          etiqueta="El cónyuge no comparece en este trámite"
          valor="Sí"
          ancho
        />
        <Campo
          etiqueta="Razón de no comparecencia"
          valor={
            RAZONES_EXCLUSION_CONYUGUE.find(
              (r) => r.value === d.razon_exclusion_conyugue,
            )?.label || d.razon_exclusion_conyugue
          }
          ancho
        />
      </Grupo>
    </Bloque>
  ) : null;

const Empresa = ({ e }) => {
  const modalidad = MODALIDADES_SOCIOS.find((m) => m.v === e.socios_modalidad);
  return (
    <>
      <Bloque titulo="Datos de la Empresa">
        <Grupo>
          <Campo etiqueta="RUC" valor={e.ruc} />
          <Campo etiqueta="Razón Social" valor={e.razon_social} />
        </Grupo>
        <Grupo titulo="Contacto de la Empresa">
          <Campo etiqueta="Correo Electrónico" valor={e.email} />
          <Campo etiqueta="Teléfono" valor={e.phone} />
        </Grupo>
        <Direccion d={e} titulo="Dirección de la Empresa" />
        <UAFE d={e} esEmpresa titulo="Información Financiera de la Empresa" />
        <Patrimonio pat={e.patrimonio} quien="EMPRESA" />
        <Grupo titulo="Socios o Accionistas">
          <Campo
            etiqueta="¿La empresa está bajo el control de la Superintendencia de Compañías?"
            valor={siNo(e.controlada_supercias)}
            ancho
          />
          {e.controlada_supercias && (
            <Campo
              etiqueta="Forma de informar los socios"
              valor={modalidad?.l}
              ancho
            />
          )}
          {e.socios_modalidad === "lista" && (e.socios || []).length > 0 && (
            <div className="col-span-2">
              <table className="w-full text-sm border mt-1">
                <thead className="bg-gray-50 text-left text-xs text-gray-600">
                  <tr>
                    <th className="p-1 border">Nombres y apellidos</th>
                    <th className="p-1 border">Documento</th>
                    <th className="p-1 border">Número</th>
                    <th className="p-1 border">%</th>
                  </tr>
                </thead>
                <tbody>
                  {e.socios.map((s, i) => (
                    <tr key={i}>
                      <td className="p-1 border">{s.nombres}</td>
                      <td className="p-1 border">
                        {opcion("document_type", s.tipo_documento)}
                      </td>
                      <td className="p-1 border">{s.numero_documento}</td>
                      <td className="p-1 border">{s.porcentaje ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {e.socios_modalidad === "anexo" && (
            <Campo
              etiqueta="Nómina adjunta (PDF)"
              valor={e.anexo_socios_nombre || "Sí"}
              ancho
            />
          )}
          {e.socios_modalidad === "autorizacion" && (
            <Campo
              etiqueta="Autorización"
              valor="Autorizo a la Notaría Vigésimo Segunda del cantón Quito a consultar la nómina de socios o accionistas de la empresa en la web de la Superintendencia de Compañías."
              ancho
            />
          )}
        </Grupo>
      </Bloque>

      <Bloque titulo="Representante Legal">
        <Grupo>
          <Campo
            etiqueta="Tipo de Documento"
            valor={opcion("document_type", e.rep_document_type)}
          />
          <Campo
            etiqueta={
              e.rep_document_type === "cedula"
                ? "Número de Cédula"
                : "Número de Documento"
            }
            valor={e.rep_document_number}
          />
          <Campo etiqueta="Nombres" valor={e.rep_names} />
          <Campo etiqueta="Apellidos" valor={e.rep_last_names} />
          <Campo etiqueta="Género" valor={opcion("gender", e.rep_gender)} />
          <Campo etiqueta="Cargo" valor={e.rep_position} />
          <Campo etiqueta="Nacionalidad" valor={e.rep_nationality} />
          <Campo
            etiqueta="Fecha de Nacimiento"
            valor={fecha(e.rep_birth_date)}
          />
          <Campo etiqueta="Correo Electrónico" valor={e.rep_email} />
          <Campo etiqueta="Teléfono" valor={e.rep_phone} />
          <Campo etiqueta="Ocupación" valor={e.rep_occupation} />
          <Campo etiqueta="Profesión" valor={e.rep_profession} />
        </Grupo>
        <Direccion d={e} p="rep_" titulo="Dirección del Representante Legal" />
        <UAFE
          d={e}
          p="rep_"
          titulo="Información Financiera del Representante Legal"
        />
      </Bloque>
    </>
  );
};

// ─── Quiénes firman ─────────────────────────────────────────────────────────
const firmantes = (payload) => {
  if (payload.tipo === "empresa") {
    const e = payload.empresa || {};
    return [
      {
        nombre: [e.rep_names, e.rep_last_names]
          .filter(Boolean)
          .join(" ")
          .toUpperCase(),
        documento: e.rep_document_number,
        detalle: [
          e.rep_position,
          `${e.razon_social || ""}`.toUpperCase(),
          e.ruc && `RUC ${e.ruc}`,
        ]
          .filter(Boolean)
          .join(" — "),
      },
    ];
  }
  const lista = [
    {
      nombre: nombreCompleto(payload.titular),
      documento: payload.titular?.document_number,
    },
  ];
  // El cónyuge firma cuando comparece; si es el representado, firma el titular por él.
  const conyugeRepresentado =
    payload.calidad_participacion === "propios_y_representando" &&
    payload.representado_es_conyugue;
  if (payload.conyugue && !conyugeRepresentado) {
    lista.push({
      nombre: nombreCompleto(payload.conyugue),
      documento: payload.conyugue.document_number,
    });
  }
  return lista;
};

// ─── Componente principal ───────────────────────────────────────────────────
const VistaRegistro = ({ registro, imprimible = false }) => {
  const payload = registro?.payload || {};
  const esEmpresa = payload.tipo === "empresa";
  const calidad = payload.calidad_participacion;
  const conyugeEsRepresentado =
    calidad === "propios_y_representando" && payload.representado_es_conyugue;

  return (
    <div className="vista-registro space-y-4">
      {imprimible && (
        <header className="text-center">
          <img
            src="/logo.svg"
            alt="Notaría Vigésimo Segunda"
            className="h-16 mx-auto mb-2 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <h1 className="text-lg font-bold uppercase">
            Notaría Vigésimo Segunda del Cantón Quito
          </h1>
          <p className="text-xs font-medium mt-1 leading-snug">
            {TEXTO_ENCABEZADO}
          </p>
        </header>
      )}

      <p className="text-xs text-gray-500">
        {registro?.origen === "sistema_interno"
          ? `Registrado por la notaría${registro.registrado_por ? ` (${registro.registrado_por})` : ""}`
          : "Llenado por el cliente con el enlace de registro"}
        {registro?.fecha &&
          ` el ${new Date(registro.fecha).toLocaleString("es-EC")}`}
      </p>

      {esEmpresa ? (
        <Empresa e={payload.empresa || {}} />
      ) : (
        <>
          <Bloque titulo="Calidad en la que participa en el trámite">
            <Grupo>
              <Campo
                etiqueta="Calidad"
                valor={CALIDADES_PARTICIPACION[calidad] || calidad}
                ancho
              />
            </Grupo>
          </Bloque>

          {payload.titular && (
            <Persona
              titulo={
                calidad === "propios_derechos"
                  ? "Datos personales"
                  : "Datos del Apoderado, Mandatario, Representante (quien firma)"
              }
              d={payload.titular}
            />
          )}

          {calidad !== "representando" && (
            <ConyugeNoComparece d={payload.titular} />
          )}

          {payload.conyugue && !conyugeEsRepresentado && (
            <Persona
              titulo="Datos del cónyuge"
              d={payload.conyugue}
              quien="CÓNYUGE DEL DECLARANTE"
              mostrarEstadoCivil={false}
            />
          )}

          {calidad === "propios_y_representando" && (
            <Bloque titulo="¿El representado es su cónyuge?">
              <Grupo>
                <Campo
                  etiqueta="Respuesta"
                  valor={siNo(payload.representado_es_conyugue)}
                />
              </Grupo>
            </Bloque>
          )}

          {conyugeEsRepresentado && payload.conyugue && (
            <Persona
              titulo="Datos del Poderdante, Mandante, Representado (cónyuge)"
              d={payload.conyugue}
              quien="REPRESENTADO"
              mostrarEstadoCivil={false}
              esRepresentado
            />
          )}

          {payload.representado && (
            <>
              <Persona
                titulo="Datos del Poderdante, Mandante, Representado"
                d={payload.representado}
                quien="REPRESENTADO"
                esRepresentado
              />
              <ConyugeNoComparece d={payload.representado} />
              {payload.conyugue_representado && (
                <Persona
                  titulo="Datos del cónyuge del Poderdante, Mandante, Representado"
                  d={payload.conyugue_representado}
                  quien="CÓNYUGE DEL REPRESENTADO"
                  mostrarEstadoCivil={false}
                />
              )}
            </>
          )}
        </>
      )}

      {/* Textos aceptados */}
      <section className="registro-bloque border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-base font-semibold text-gray-900">
          Condiciones jurídicas, declaraciones y autorización
        </h3>
        {imprimible && (
          <div className="text-xs text-gray-800 space-y-2 text-justify leading-snug">
            {CONDICIONES_JURIDICAS.map((c) => (
              <p key={c.numero}>
                <strong>
                  {c.numero}.- {c.titulo}
                </strong>{" "}
                {c.texto}
              </p>
            ))}
          </div>
        )}
        <Casilla
          marcada={registro?.acepta_condiciones}
          texto={TEXTO_ACEPTA_CONDICIONES}
        />
      </section>

      <section className="registro-bloque border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-base font-semibold text-gray-900">
          Protección de Datos Personales
        </h3>
        {imprimible && (
          <p className="text-xs text-gray-800 text-justify leading-snug">
            {TEXTO_PRIVACIDAD}
          </p>
        )}
        <Casilla
          marcada={registro?.acepta_privacidad}
          texto={TEXTO_ACEPTA_PRIVACIDAD}
        />
      </section>

      {imprimible && (
        <section className="registro-firmas pt-16">
          <div className="grid grid-cols-2 gap-x-12 gap-y-20">
            {firmantes(payload).map((f, i) => (
              <div key={i} className="text-center text-sm">
                <div className="border-t border-gray-900 pt-1 font-semibold">
                  {f.nombre}
                </div>
                <div>C.I. / Pasaporte: {f.documento}</div>
                {f.detalle && <div className="text-xs">{f.detalle}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const Casilla = ({ marcada, texto }) => (
  <div className="flex items-start gap-2 text-sm">
    <span
      className="inline-flex items-center justify-center w-4 h-4 mt-0.5 border border-gray-700 rounded-sm shrink-0 text-xs leading-none"
      aria-label={marcada ? "marcado" : "sin marcar"}
    >
      {marcada ? "✓" : ""}
    </span>
    <span>{texto}</span>
  </div>
);

export default VistaRegistro;
