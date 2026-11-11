import { useState } from "react";
import {
  BuscadorPlantillas,
  ModalGuardarPlantilla,
} from "../../components/plantillas";
import { Button } from "../../components/shared";
import {
  DatosAdministrativos,
  DatosAbogado,
  TextNumberTransformer,
} from "../../components/documentos";
import { ComparecienteInline } from "../../components/comparecientes";
import { FileText, Download } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { apiFetch } from "../../config/api";
import API_CONFIG from "../../config/api";

const FormularioMatrizBase = ({
  titulo,
  tipoContrato,
  labelParte1,
  labelParte1Plural,
  labelParte2,
  labelParte2Plural,
  keyParte1 = "vendedores",
  keyParte2 = "compradores",
}) => {
  const [datosAdministrativos, setDatosAdministrativos] = useState(null);
  const [parte1, setParte1] = useState([]);
  const [parte2, setParte2] = useState([]);
  const [datosAbogado, setDatosAbogado] = useState(null);
  const [minuta, setMinuta] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalPlantillaAbierto, setModalPlantillaAbierto] = useState(false);
  const [plantillaKey, setPlantillaKey] = useState(0);
  const toast = useToast();

  const handleCargarPlantilla = (contenido) => {
    if (contenido[keyParte1] !== undefined) setParte1(contenido[keyParte1]);
    if (contenido[keyParte2] !== undefined) setParte2(contenido[keyParte2]);
    if (contenido.datosAbogado !== undefined)
      setDatosAbogado(contenido.datosAbogado);
    setPlantillaKey((k) => k + 1);
  };

  const handleAgregarParte1 = () => setParte1([...parte1, null]);
  const handleParte1Ready = (index, data) => {
    const arr = [...parte1];
    arr[index] = data;
    setParte1(arr);
  };
  const handleEliminarParte1 = (index) =>
    setParte1(parte1.filter((_, i) => i !== index));

  const handleAgregarParte2 = () => setParte2([...parte2, null]);
  const handleParte2Ready = (index, data) => {
    const arr = [...parte2];
    arr[index] = data;
    setParte2(arr);
  };
  const handleEliminarParte2 = (index) =>
    setParte2(parte2.filter((_, i) => i !== index));

  const validateForm = () => {
    const errors = [];
    if (!datosAdministrativos?.notarioKey) errors.push("Seleccione un notario");
    else if (
      datosAdministrativos.notario?.suplente &&
      !datosAdministrativos.notario.accionPersonal
    )
      errors.push(
        "Ingrese el número de acción de personal del notario suplente",
      );
    if (!datosAdministrativos?.matrizador)
      errors.push("Configure las iniciales del matrizador en su perfil");
    if (!datosAdministrativos?.numeroProtocolo)
      errors.push("Ingrese el número de protocolo");
    if (!datosAdministrativos?.cuantia) errors.push("Ingrese la cuantía");
    if (parte1.length === 0)
      errors.push(`Debe agregar al menos un ${labelParte1}`);
    if (parte1.some((v) => v === null))
      errors.push(`Complete todos los datos de los ${labelParte1Plural}`);
    if (parte2.length === 0)
      errors.push(`Debe agregar al menos un ${labelParte2}`);
    if (parte2.some((c) => c === null))
      errors.push(`Complete todos los datos de los ${labelParte2Plural}`);
    if (!minuta.trim()) errors.push("Ingrese la minuta del contrato");
    if (!datosAbogado?.nombreAbogado)
      errors.push("Ingrese el nombre del abogado");
    if (!datosAbogado?.generoAbogado)
      errors.push("Seleccione el género del abogado");
    if (!datosAbogado?.numeroMatricula)
      errors.push("Ingrese el número de matrícula del abogado");
    if (
      datosAbogado?.tipoMatricula === "colegio" &&
      !datosAbogado?.provinciaAbogado
    )
      errors.push("Seleccione la provincia del colegio de abogados");
    if (datosAdministrativos?.needsConcuerdo) {
      if (!datosAdministrativos?.concuerdoNumeroProtocolo)
        errors.push("Ingrese el número de protocolo del concuerdo");
      if (!datosAdministrativos?.concuerdoNombres)
        errors.push("Ingrese los nombres del solicitante del concuerdo");
      if (!datosAdministrativos?.concuerdoApellidos)
        errors.push("Ingrese los apellidos del solicitante del concuerdo");
      if (!datosAdministrativos?.concuerdoCedula)
        errors.push("Ingrese la cédula del solicitante del concuerdo");
    }
    return errors;
  };

  const transformarParticipante = (p) => {
    if (p.esEmpresa) {
      return {
        esEmpresa: true,
        ruc: p.ruc,
        razonSocial: p.razonSocial,
        email: p.email || "",
        telefono: p.phone || "",
        provincia: p.province,
        canton: p.canton,
        parroquia: p.parroquia,
        sector: p.sector || "",
        callePrincipal: p.mainStreet,
        calleSecundaria: p.secondaryStreet || "",
        numeroCalle: p.numberStreet || "",
        repDocumentNumber: p.repDocumentNumber,
        repNames: p.repNames,
        repLastNames: p.repLastNames,
        repGenero: p.repGender,
        repNationality: p.repNationality,
        repFechaNacimiento: p.repBirthDate,
        repOccupation: p.repOccupation,
        repProfession: p.repProfession || "",
        repPosition: p.repPosition,
        repProvincia: p.repProvince,
        repCanton: p.repCanton,
        repParroquia: p.repParroquia,
        repSector: p.repSector || "",
        repCallePrincipal: p.repMainStreet,
        repCalleSecundaria: p.repSecondaryStreet || "",
        repNumeroCalle: p.repNumberStreet || "",
      };
    }
    return {
      esEmpresa: false,
      cedula: p.documentNumber,
      nombres: p.names,
      apellidos: p.lastNames,
      genero: p.gender,
      estadoCivil: p.maritalStatus,
      nacionalidad: p.nationality,
      fechaNacimiento: p.birthDate,
      email: p.email || "",
      telefono: p.phone || "",
      provincia: p.province,
      canton: p.canton,
      parroquia: p.parroquia,
      sector: p.sector || "",
      callePrincipal: p.mainStreet,
      calleSecundaria: p.secondaryStreet || "",
      numeroCalle: p.numberStreet || "",
      ocupacion: p.occupation,
      profesion: p.profession || "",
      conyuge: p.partner
        ? {
            cedula: p.partner.documentNumber,
            nombres: p.partner.names,
            apellidos: p.partner.lastNames,
            genero: p.partner.gender,
            nacionalidad: p.partner.nationality,
            fechaNacimiento: p.partner.birthDate,
            ocupacion: p.partner.occupation,
          }
        : null,
      needsInterpreter: p.needsInterpreter || false,
      nombreInterprete: p.nombreInterprete || null,
      generoInterprete: p.generoInterprete || null,
      cedulaInterprete: p.cedulaInterprete || null,
      idiomaInterprete: p.idiomaInterprete || null,
      isNoVidente: p.isNoVidente || false,
      personaConfianzaNoVidente: p.personaConfianzaNoVidente || null,
      isAnalfabeta: p.isAnalfabeta || false,
      personaConfianzaAnalfabeta: p.personaConfianzaAnalfabeta || null,
      hasDiscapacidadIntelectual: p.hasDiscapacidadIntelectual || false,
      tipoDiscapacidad: p.tipoDiscapacidad || null,
      razonExclusionConyugue: p.razonExclusionConyugue || null,
    };
  };

  const handleGenerarMatriz = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    setLoading(true);
    try {
      const parte1List = parte1.map(transformarParticipante);
      const parte2List = parte2.map(transformarParticipante);
      const participantesList = [...parte1List, ...parte2List];

      const isAnyTerceraEdad = participantesList.some((p) => {
        if (p.esEmpresa) return false;
        const age = Math.floor(
          (new Date() - new Date(p.fechaNacimiento)) /
            (365.25 * 24 * 60 * 60 * 1000),
        );
        return age >= 65;
      });

      const payload = {
        numero_protocolo: datosAdministrativos.numeroProtocolo,
        tipo_contrato: tipoContrato,
        cuantia: parseFloat(datosAdministrativos.cuantia),
        fecha_escritura: datosAdministrativos.fechaEscritura,
        notario: {
          nombre: datosAdministrativos.notario.nombre,
          titulo: datosAdministrativos.notario.titulo,
          accion_personal: datosAdministrativos.notario.accionPersonal || null,
        },
        matrizador: datosAdministrativos.matrizador,
        needs_concuerdo: datosAdministrativos.needsConcuerdo || false,
        datos_concuerdo: datosAdministrativos.needsConcuerdo
          ? {
              numero_protocolo: datosAdministrativos.concuerdoNumeroProtocolo,
              names: datosAdministrativos.concuerdoNombres,
              last_names: datosAdministrativos.concuerdoApellidos,
              document_number: datosAdministrativos.concuerdoCedula,
              fecha: datosAdministrativos.concuerdoFecha,
            }
          : null,
        participantes_list: participantesList,
        [keyParte1 + "_list"]: parte1List,
        [keyParte2 + "_list"]: parte2List,
        abogado: {
          nombre_abogado: datosAbogado.nombreAbogado,
          genero_abogado: datosAbogado.generoAbogado,
          tipo_matricula: datosAbogado.tipoMatricula,
          provincia_abogado: datosAbogado.provinciaAbogado || null,
          numero_matricula: datosAbogado.numeroMatricula,
          minuta_texto: minuta,
        },
        is_any_tercera_edad: isAnyTerceraEdad,
      };

      const response = await apiFetch(API_CONFIG.ENDPOINTS.GENERATE_MATRIZ, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const downloadResponse = await apiFetch(data.download_url);
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `matriz_${datosAdministrativos.numeroProtocolo}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Matriz generada exitosamente");
      } else {
        const data = await response.json();
        toast.error(data.detail || "Error al generar matriz");
      }
    } catch (error) {
      toast.error("Error al generar matriz: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nombrePrimero = (() => {
    const v = parte1[0];
    if (!v) return "";
    if (v.esEmpresa) return v.razonSocial || "";
    return (
      [v.nombres, v.apellidos].filter(Boolean).join(" ") ||
      v.nombreCompleto ||
      ""
    );
  })();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{titulo}</h1>
          <p className="text-gray-600 mt-1">
            Complete todos los datos para generar la matriz notarial
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Cargar desde plantilla
          </p>
          <BuscadorPlantillas
            tipoDocumento="matriz"
            tipoContrato={tipoContrato}
            onCargar={handleCargarPlantilla}
          />
          <p className="text-xs text-amber-600 mt-2">
            Busca por nombre de proyecto o {labelParte1.toLowerCase()}. Al
            seleccionar una plantilla se cargarán todos los datos del
            formulario.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <DatosAdministrativos
          onChange={setDatosAdministrativos}
          tipoContrato={tipoContrato}
        />

        {/* PARTE 1 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {labelParte1Plural}
            </h2>
            <Button variant="outline" size="sm" onClick={handleAgregarParte1}>
              + Agregar {labelParte1}
            </Button>
          </div>
          {parte1.length === 0 && (
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600">
                No hay {labelParte1Plural.toLowerCase()} agregados. Click en
                "Agregar {labelParte1}" para comenzar.
              </p>
            </div>
          )}
          {parte1.map((v, index) => (
            <div key={index} className="relative">
              <ComparecienteInline
                key={`${keyParte1}-${plantillaKey}-${index}`}
                title={`${labelParte1} ${index + 1}`}
                initialData={v || null}
                onComparecienteReady={(data) => handleParte1Ready(index, data)}
              />
              {parte1.length > 1 && (
                <button
                  onClick={() => handleEliminarParte1(index)}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>

        {/* PARTE 2 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {labelParte2Plural}
            </h2>
            <Button variant="outline" size="sm" onClick={handleAgregarParte2}>
              + Agregar {labelParte2}
            </Button>
          </div>
          {parte2.length === 0 && (
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600">
                No hay {labelParte2Plural.toLowerCase()} agregados. Click en
                "Agregar {labelParte2}" para comenzar.
              </p>
            </div>
          )}
          {parte2.map((c, index) => (
            <div key={index} className="relative">
              <ComparecienteInline
                key={`${keyParte2}-${plantillaKey}-${index}`}
                title={`${labelParte2} ${index + 1}`}
                initialData={c || null}
                onComparecienteReady={(data) => handleParte2Ready(index, data)}
              />
              {parte2.length > 1 && (
                <button
                  onClick={() => handleEliminarParte2(index)}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>

        {/* MINUTA */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Minuta del Contrato
          </h2>
          <TextNumberTransformer onChange={setMinuta} />
        </div>

        <DatosAbogado onChange={setDatosAbogado} initialData={datosAbogado} />

        {/* BOTONES */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setModalPlantillaAbierto(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Guardar como plantilla
            </button>
            <Button
              variant="primary"
              size="lg"
              icon={
                loading ? (
                  <Download className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )
              }
              onClick={handleGenerarMatriz}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Generando..." : "Generar Matriz"}
            </Button>
          </div>
        </div>
      </div>

      <ModalGuardarPlantilla
        abierto={modalPlantillaAbierto}
        onCerrar={() => setModalPlantillaAbierto(false)}
        onGuardado={() => {
          setModalPlantillaAbierto(false);
          toast.success("Plantilla guardada correctamente");
        }}
        tipoDocumento="matriz"
        tipoContrato={tipoContrato}
        nombreVendedor={nombrePrimero}
        contenido={{
          [keyParte1]: parte1,
          [keyParte2]: parte2,
          datosAdministrativos,
          datosAbogado,
          minuta,
        }}
      />
    </div>
  );
};

export default FormularioMatrizBase;
