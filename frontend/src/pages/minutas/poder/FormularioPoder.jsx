import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../../../components/shared";
import {
  DatosAdministrativos,
  DatosAbogado,
} from "../../../components/documentos";
import { ComparecienteInline } from "../../../components/comparecientes";
import { FileText, ArrowLeft } from "lucide-react";
import { useToast } from "../../../hooks/useToast";
import { apiFetch } from "../../../config/api";
import API_CONFIG from "../../../config/api";
import { descargarRespuesta } from "../../../utils/descargas";
import { TIPOS_PODER } from "./SeleccionTipoPoderPage";

const TIPOS_COMPARECENCIA = [
  {
    id: "un_poderdante",
    nombre: "Un Poderdante",
    descripcion: "Una sola persona otorga el poder.",
  },
  {
    id: "poderdantes_conyuges",
    nombre: "Dos o más Poderdantes Cónyuges",
    descripcion: "Marido y mujer otorgan el poder conjuntamente.",
  },
  {
    id: "poderdantes_comunes",
    nombre: "Dos o más Poderdantes Comunes",
    descripcion: "Varias personas sin relación conyugal otorgan el poder.",
  },
  {
    id: "poderdante_juridica",
    nombre: "Poderdante Persona Jurídica",
    descripcion:
      "Una empresa otorga el poder, representada por su representante legal.",
  },
  {
    id: "poderdante_juridica_propios",
    nombre:
      "Poderdante Persona Jurídica y Representante por sus Propios Derechos",
    descripcion:
      "El representante legal otorga el poder a la vez por sí mismo y por la empresa.",
  },
];

const FACULTADES = [
  {
    grupo: "Administración General",
    items: [
      {
        id: "administracion_general",
        label: "Administración general de bienes",
        texto:
          "Para que administre los bienes muebles e inmuebles de la parte mandante, vele por su conservación, pague impuestos, tasas, contribuciones, alícuotas, servicios y gastos ordinarios, contrate reparaciones y mejoras necesarias y urgentes; nombre y remueva empleados, fije su remuneración y conozca y resuelva sus reclamaciones; y, en general, ejecute todos los actos propios de una administración diligente y prudente.",
      },
      {
        id: "cobro_creditos",
        label: "Cobro de créditos y recepción de valores",
        texto:
          "Para que cobre judicial o extrajudicialmente créditos, obligaciones, indemnizaciones, utilidades, liquidaciones laborales, beneficios sociales y cualquier suma adeudada a la parte mandante; reciba dinero, cheques, transferencias y otros instrumentos de pago; suscriba recibos, finiquitos y cartas de pago; y realice todos los actos necesarios para el cobro efectivo de las obligaciones.",
      },
      {
        id: "representacion_admin",
        label: "Representación ante organismos públicos",
        texto:
          "Para que represente a la parte mandante ante ministerios, secretarías, embajadas, consulados, gobiernos autónomos descentralizados, superintendencias, registros, entidades de control, instituciones públicas, privadas y mixtas del Ecuador o del exterior; presente solicitudes, declaraciones y documentos; suscriba formularios y actas; y realice cualquier gestión administrativa necesaria.",
      },
      {
        id: "sri",
        label: "Trámites ante el SRI",
        texto:
          "Para que represente a la parte mandante, en calidad de contribuyente, ante el Servicio de Rentas Internas; obtenga usuarios y claves y realice cualquier tipo de trámite, tales como actualización de datos, realización de declaraciones de impuestos, obtención de certificados y demás gestiones tributarias.",
      },
      {
        id: "iess",
        label: "Trámites ante el IESS",
        texto:
          "Para que represente a la parte mandante ante el Instituto Ecuatoriano de Seguridad Social, en calidad de afiliada, jubilada, beneficiaria o empleadora, según corresponda; obtenga o actualice claves; realice trámites de afiliación, jubilación, préstamos, fondos de reserva, prestaciones de salud y demás gestiones ante dicha entidad.",
      },
      {
        id: "registro_civil",
        label: "Trámites ante el Registro Civil",
        texto:
          "Para que comparezca ante la Dirección General de Registro Civil, Identificación y Cedulación y realice todo tipo de trámite relacionado con sus nombres y apellidos, solicite correcciones, enmendaduras, actas, partidas, inscripciones y registros de identidad y estado civil de la parte mandante.",
      },
      {
        id: "tramites_vehiculares",
        label: "Trámites vehiculares y de tránsito",
        texto:
          "Para que represente a la parte mandante ante la Agencia Nacional de Tránsito, Agencia Metropolitana de Tránsito, gobiernos autónomos descentralizados competentes, entidades de matriculación y demás organismos vinculados al tránsito; realice trámites de matriculación, transferencia de dominio, revisión vehicular, licencias y demás gestiones relacionadas con vehículos.",
      },
      {
        id: "operaciones_bancarias",
        label: "Operaciones bancarias y financieras",
        texto:
          "Para que represente a la parte mandante ante bancos, cooperativas de ahorro y crédito, mutualistas y demás entidades financieras; abra, administre y cierre cuentas corrientes o de ahorro; efectúe depósitos, retiros, transferencias y pagos; solicite, acepte y cancele tarjetas de crédito, débito y prepago; gestione créditos, garantías e inversiones; y suscriba todos los documentos necesarios para el efecto.",
      },
      {
        id: "suscripcion_documentos",
        label: "Suscripción de documentos",
        texto:
          "Para que suscriba instrumentos públicos o privados, escritos, peticiones, formularios, solicitudes, actas, contratos y demás documentos directamente relacionados con las facultades conferidas en este instrumento.",
      },
    ],
  },
  {
    grupo: "Bienes Inmuebles",
    items: [
      {
        id: "adquisicion_inmuebles",
        label: "Adquisición de bienes inmuebles",
        texto:
          "Para que, en nombre y representación de la parte mandante, adquiera a cualquier título bienes muebles o inmuebles, derechos y acciones, derechos hereditarios, acciones, participaciones y demás derechos intangibles que sean de propiedad de terceros; convenga precios, formas de pago, plazos y garantías; y suscriba todos los documentos públicos o privados que sean necesarios.",
      },
      {
        id: "enajenacion_inmuebles",
        label: "Enajenación de bienes inmuebles",
        texto:
          "Para que venda, ceda o transfiera a título oneroso bienes muebles o inmuebles, derechos y acciones, derechos hereditarios, acciones, participaciones y demás derechos intangibles que sean de propiedad de la parte mandante; convenga precios, formas de pago, plazos y garantías; y suscriba todos los documentos públicos o privados que sean necesarios.",
      },
      {
        id: "arrendamiento",
        label: "Arrendamiento de bienes",
        texto:
          "Para que celebre, renueve, modifique, prorrogue o termine contratos de arrendamiento de bienes muebles o inmuebles, en los que la parte mandante intervenga como arrendadora o arrendataria; pacte cánones, plazos, garantías, formas de pago y demás condiciones; y suscriba todos los documentos necesarios.",
      },
      {
        id: "hipotecas",
        label: "Constitución de hipotecas",
        texto:
          "Para que constituya hipotecas sobre los inmuebles de la parte mandante a favor de cualquier acreedor, pudiendo garantizar obligaciones de todo tipo, pactar plazos, intereses y condiciones respecto del crédito garantizado, y suscribir todos los documentos públicos o privados que sean necesarios.",
      },
      {
        id: "cancelacion_gravamenes",
        label: "Cancelación de gravámenes",
        texto:
          "Para que solicite y gestione la cancelación, levantamiento o extinción de hipotecas, prohibiciones de enajenar, embargos, demandas inscritas, patrimonios familiares, usufructos, derechos de uso o habitación y demás gravámenes o limitaciones que pesen sobre bienes de la parte mandante; y suscriba todos los documentos necesarios.",
      },
    ],
  },
  {
    grupo: "Familia y Estado Civil",
    items: [
      {
        id: "salida_menores",
        label: "Autorización de salida del país de hijos menores",
        texto:
          "Para que a nombre y representación de la parte mandante pueda acudir ante cualquier notaría del país a realizar la autorización de salida del país, cuantas veces lo requiera, a favor de los hijos menores de edad de la parte mandante, con todos los detalles y condiciones que sean pertinentes.",
      },
      {
        id: "divorcio_mutuo",
        label: "Divorcio por mutuo consentimiento",
        texto:
          "Para que represente a la parte mandante en el trámite de divorcio por mutuo consentimiento, ante notaría, autoridad judicial o entidad competente, según corresponda; acuerde términos, condiciones y consecuencias del divorcio; suscriba solicitudes, actas y demás documentos necesarios.",
      },
      {
        id: "disolucion_sociedad",
        label: "Disolución de sociedad conyugal",
        texto:
          "Para que comparezca, conjuntamente con el otro cónyuge o dentro del procedimiento que corresponda, ante notaría, autoridad judicial o entidad competente, y solicite, declare, convenga y formalice la disolución de la sociedad conyugal; suscriba documentos y realice todos los actos necesarios para su inscripción y efectos legales.",
      },
    ],
  },
  {
    grupo: "Judicial",
    items: [
      {
        id: "procuracion_judicial",
        label: "Procuración judicial general",
        texto:
          "Para que, en calidad de procuradora o procurador judicial y como abogada o abogado legalmente habilitado, represente, patrocine y defienda a la parte mandante, en calidad de actora, demandada, peticionaria o en cualquier otra calidad procesal que corresponda, en toda clase de procesos judiciales, arbitrales, de mediación o de otra naturaleza, ante cualquier juez, tribunal, corte, árbitro o autoridad, en cualquier instancia y etapa procesal, con todas las facultades generales del mandato judicial y las especiales previstas en la ley.",
      },
      {
        id: "facultades_procesales",
        label: "Facultades especiales de disposición procesal",
        texto:
          "Para que pueda sustituir la procuración en favor de otra abogada u otro abogado; allanarse a la demanda; transigir; conciliar; aprobar convenios; desistir de la acción o del recurso; absolver posiciones; y ejercer todas las facultades especiales previstas en el Código Orgánico General de Procesos y demás normas aplicables.",
      },
      {
        id: "actos_notariales",
        label: "Actos notariales",
        texto:
          "Para que comparezca ante cualquier notario del Ecuador y otorgue, acepte o suscriba escrituras y actas relacionadas con las facultades expresamente conferidas en este instrumento y demás actos notariales que sean necesarios para su cumplimiento.",
      },
    ],
  },
];

const esTelematico = (tipoId) => tipoId.includes("telematico");
const esProcuracionJudicial = (tipoId) => tipoId.includes("procuracion");

const FormularioPoder = () => {
  const { tipoPoderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const tipoPoder = TIPOS_PODER.find((t) => t.id === tipoPoderId);
  const esTelematicoFlag = tipoPoderId ? esTelematico(tipoPoderId) : false;
  const esProcuracionFlag = tipoPoderId
    ? esProcuracionJudicial(tipoPoderId)
    : false;

  const [tipoComparecencia, setTipoComparecencia] = useState("");
  const [datosAdministrativos, setDatosAdministrativos] = useState(null);
  const [poderdantes, setPoderdantes] = useState([]);
  const [apoderados, setApoderados] = useState([]);
  const [esAbogadoApoderado, setEsAbogadoApoderado] = useState({});
  const [facultadesSeleccionadas, setFacultadesSeleccionadas] = useState({});
  const [otrosChecked, setOtrosChecked] = useState(false);
  const [otrosTexto, setOtrosTexto] = useState("");
  const [datosAbogado, setDatosAbogado] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!tipoPoder) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-600">Tipo de poder no reconocido.</p>
        <Button
          variant="outline"
          onClick={() => navigate("/minutas/poder")}
          className="mt-4"
        >
          Volver
        </Button>
      </div>
    );
  }

  const toggleFacultad = (id) => {
    setFacultadesSeleccionadas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const facultadesTexto = () => {
    const textos = [];
    FACULTADES.forEach((grupo) => {
      grupo.items.forEach((item) => {
        if (facultadesSeleccionadas[item.id]) textos.push(item.texto);
      });
    });
    if (otrosChecked && otrosTexto.trim()) textos.push(otrosTexto.trim());
    return textos;
  };

  const handleAgregarPoderdante = () => setPoderdantes([...poderdantes, null]);
  const handlePoderdanteReady = (index, data) => {
    const arr = [...poderdantes];
    arr[index] = data;
    setPoderdantes(arr);
  };
  const handleEliminarPoderdante = (index) =>
    setPoderdantes(poderdantes.filter((_, i) => i !== index));

  const handleAgregarApoderado = () => setApoderados([...apoderados, null]);
  const handleApoderadoReady = (index, data) => {
    const arr = [...apoderados];
    arr[index] = data;
    setApoderados(arr);
  };
  const handleEliminarApoderado = (index) =>
    setApoderados(apoderados.filter((_, i) => i !== index));

  const requiereMultiplesPoderdantes =
    tipoComparecencia === "poderdantes_conyuges" ||
    tipoComparecencia === "poderdantes_comunes";
  const esPersonaJuridica =
    tipoComparecencia === "poderdante_juridica" ||
    tipoComparecencia === "poderdante_juridica_propios";

  const handleGenerar = async () => {
    if (!tipoComparecencia) {
      toast.error("Seleccione el tipo de comparecencia del poderdante");
      return;
    }
    if (!datosAdministrativos?.notarioKey) {
      toast.error("Seleccione un notario");
      return;
    }
    if (poderdantes.length === 0 || poderdantes.some((p) => p === null)) {
      toast.error("Complete los datos de todos los poderdantes");
      return;
    }
    if (apoderados.length === 0 || apoderados.some((a) => a === null)) {
      toast.error("Complete los datos de todos los apoderados");
      return;
    }
    const textosFacultades = facultadesTexto();
    if (textosFacultades.length === 0) {
      toast.error("Seleccione al menos una facultad");
      return;
    }
    if (otrosChecked && !otrosTexto.trim()) {
      toast.error("Especifique el texto de la facultad adicional");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        tipoPoder: tipoPoderId,
        tipoComparecencia,
        esTelematico: esTelematicoFlag,
        esProcuracion: esProcuracionFlag,
        notario: {
          nombre: datosAdministrativos.notario?.nombre,
          titulo: datosAdministrativos.notario?.titulo,
        },
        matrizador: datosAdministrativos.matrizador,
        fechaNotarial: datosAdministrativos.fechaEscritura,
        poderdantes,
        apoderados,
        esAbogadoApoderado,
        facultades: textosFacultades,
        abogado: datosAbogado,
      };

      const response = await apiFetch(API_CONFIG.ENDPOINTS.GENERATE_PODER, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await descargarRespuesta(response, "poder.docx");
        toast.success("Poder generado exitosamente");
      } else {
        const data = await response.json();
        toast.error(data.detail || "Error al generar el poder");
      }
    } catch (error) {
      toast.error("Error al generar el poder: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={() => navigate("/minutas/poder")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Tipos de Poder
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Generar {tipoPoder.nombre}
        </h1>
        <p className="text-gray-600 mt-1">
          Complete todos los datos para generar el instrumento notarial
        </p>
        {esProcuracionFlag && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Nota:</strong> en procuraciones judiciales, quien actúa
              como procurador/a debe ser abogado/a.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* TIPO DE COMPARECENCIA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tipo de Comparecencia del Poderdante
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TIPOS_COMPARECENCIA.map((tc) => (
              <button
                key={tc.id}
                type="button"
                onClick={() => {
                  setTipoComparecencia(tc.id);
                  setPoderdantes([]);
                }}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${tipoComparecencia === tc.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className="font-semibold text-gray-900 text-sm">
                  {tc.nombre}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {tc.descripcion}
                </div>
              </button>
            ))}
          </div>
        </div>

        {tipoComparecencia && (
          <>
            <DatosAdministrativos
              onChange={setDatosAdministrativos}
              tipoContrato={tipoPoderId}
            />

            {/* PODERDANTE(S) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {esPersonaJuridica
                    ? "Representante Legal / Poderdante"
                    : requiereMultiplesPoderdantes
                      ? "Poderdantes"
                      : "Poderdante"}
                </h2>
                {requiereMultiplesPoderdantes && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAgregarPoderdante}
                  >
                    + Agregar Poderdante
                  </Button>
                )}
              </div>

              {esPersonaJuridica && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    Use el toggle "Persona Jurídica" dentro del compareciente
                    para capturar los datos de la empresa y su representante
                    legal.
                    {tipoComparecencia === "poderdante_juridica_propios" &&
                      " El representante legal comparece también por sus propios derechos."}
                  </p>
                </div>
              )}

              {poderdantes.length === 0 && (
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-gray-600">
                    No hay poderdantes agregados todavía.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAgregarPoderdante}
                    className="mt-3"
                  >
                    + Agregar Poderdante
                  </Button>
                </div>
              )}

              {poderdantes.map((p, index) => (
                <div key={index} className="relative">
                  <ComparecienteInline
                    title={`Poderdante ${index + 1}`}
                    initialData={p || null}
                    onComparecienteReady={(data) =>
                      handlePoderdanteReady(index, data)
                    }
                  />
                  {poderdantes.length > 1 && (
                    <button
                      onClick={() => handleEliminarPoderdante(index)}
                      className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* APODERADO(S) */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {esProcuracionFlag
                    ? "Procurador(es) Judicial(es)"
                    : "Apoderado(s) / Mandatario(s)"}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarApoderado}
                >
                  + Agregar {esProcuracionFlag ? "Procurador" : "Apoderado"}
                </Button>
              </div>

              {apoderados.length === 0 && (
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-gray-600">
                    No hay {esProcuracionFlag ? "procuradores" : "apoderados"}{" "}
                    agregados.
                  </p>
                </div>
              )}

              {apoderados.map((a, index) => (
                <div key={index} className="relative space-y-2">
                  <ComparecienteInline
                    title={`${esProcuracionFlag ? "Procurador" : "Apoderado"} ${index + 1}`}
                    initialData={a || null}
                    onComparecienteReady={(data) =>
                      handleApoderadoReady(index, data)
                    }
                  />
                  {esProcuracionFlag && (
                    <label className="flex items-center gap-2 px-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={esAbogadoApoderado[index] || false}
                        onChange={(e) =>
                          setEsAbogadoApoderado((prev) => ({
                            ...prev,
                            [index]: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        Confirmo que esta persona es abogado/a (requisito para
                        procuración judicial)
                      </span>
                    </label>
                  )}
                  {apoderados.length > 1 && (
                    <button
                      onClick={() => handleEliminarApoderado(index)}
                      className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>

            {esTelematicoFlag && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Comparecencia Telemática
                </h2>
                <p className="text-sm text-gray-600">
                  Este poder se otorga mediante comparecencia telemática.
                  Verifique que cuenta con los medios técnicos habilitados para
                  la firma electrónica y videoconferencia notarial antes de
                  continuar.
                </p>
              </div>
            )}

            {/* FACULTADES */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Facultades del Poder
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Seleccione las facultades que se conferirán en este instrumento.
              </p>

              <div className="space-y-6">
                {FACULTADES.map((grupo) => (
                  <div key={grupo.grupo}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">
                      {grupo.grupo}
                    </h3>
                    <div className="space-y-2">
                      {grupo.items.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={facultadesSeleccionadas[item.id] || false}
                            onChange={() => toggleFacultad(item.id)}
                            className="w-4 h-4 mt-0.5 rounded text-blue-600 flex-shrink-0"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                              {item.label}
                            </span>
                            {facultadesSeleccionadas[item.id] && (
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {item.texto}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                {/* OTROS */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b">
                    Otros
                  </h3>
                  <label className="flex items-start gap-3 cursor-pointer group mb-3">
                    <input
                      type="checkbox"
                      checked={otrosChecked}
                      onChange={(e) => setOtrosChecked(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                      Agregar facultad adicional
                    </span>
                  </label>
                  {otrosChecked && (
                    <input
                      type="text"
                      value={otrosTexto}
                      onChange={(e) => setOtrosTexto(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Describa la facultad adicional..."
                    />
                  )}
                </div>
              </div>

              {/* Resumen de seleccionadas */}
              {facultadesTexto().length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    {facultadesTexto().length} facultad
                    {facultadesTexto().length > 1 ? "es" : ""} seleccionada
                    {facultadesTexto().length > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>

            <DatosAbogado
              onChange={setDatosAbogado}
              initialData={datosAbogado}
            />

            {/* BOTÓN */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<FileText className="w-5 h-5" />}
                  onClick={handleGenerar}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? "Generando..." : "Generar Poder"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FormularioPoder;
