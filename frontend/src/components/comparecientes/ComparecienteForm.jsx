import { useState, useEffect, useMemo } from "react";
import { Button, FormField, Card } from "../shared";
import SeccionUAFEForm from "./SeccionUAFEForm";
import { getProvincias, getCantones } from "../../utils/datosEcuador";
import { validarCedula } from "../../utils/validarCedula";
import { transformToSnakeCase } from "../../utils/transformPartyData";
import { apiFetch } from "../../config/api";
import API_CONFIG from "../../config/api";
import { useToast } from "../../hooks/useToast";
import { Save, X } from "lucide-react";

const ComparecienteForm = ({
  initialData = null,
  isEditing = false,
  onSuccess,
  onCancel,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    documentNumber: "",
    names: "",
    lastNames: "",
    documentType: "cedula",
    gender: "",
    maritalStatus: "",
    conyugueComparece: true,
    razonExclusionConyugue: "",
    nationality: "ecuatoriana",
    birthDate: "",
    email: "",
    phone: "",
    province: "",
    canton: "",
    parroquia: "",
    sector: "",
    mainStreet: "",
    secondaryStreet: "",
    numberStreet: "",
    edificio: "",
    occupation: "",
    profession: "",
    partnerDocumentNumber: "",
    partnerNames: "",
    partnerLastNames: "",
    partnerGender: "",
    partnerNationality: "ecuatoriana",
    partnerBirthDate: "",
    partnerEmail: "",
    partnerPhone: "",
    partnerOccupation: "",
    partnerProfession: "",
    partnerSameAddress: true,
    partnerProvince: "",
    partnerCanton: "",
    partnerParroquia: "",
    partnerSector: "",
    partnerMainStreet: "",
    partnerSecondaryStreet: "",
    partnerNumberStreet: "",
    // Campos UAFE del cónyuge (opcionales)
    partnerActividadEconomica: "",
    partnerActividadEconomicaOtra: "",
    partnerEmpresaTrabajo: "",
    partnerIngresoMensual: "",
    partnerEsPep: "",
    partnerEsPepIndirecto: "",
    partnerPepNombre: "",
    partnerPepInstitucion: "",
    partnerPepFechaInicio: "",
    partnerPepCargo: "",
    partnerPepAniosTrabajo: "",
    partnerPepGradoRelacion: "",
    partnerPepRelacionTipo: "",
    partnerPepYaNoEjerce: false,
    partnerPepFechaFin: "",
    partnerPatrimonio: null,
    partnerOrigenFondos: "",
    // Campos UAFE (opcionales)
    actividadEconomica: "",
    actividadEconomicaOtra: "",
    empresaTrabajo: "",
    ingresoMensual: "",
    esPep: "",
    esPepIndirecto: "",
    pepNombre: "",
    pepInstitucion: "",
    pepFechaInicio: "",
    pepCargo: "",
    pepAniosTrabajo: "",
    pepGradoRelacion: "",
    pepRelacionTipo: "",
    pepYaNoEjerce: false,
    pepFechaFin: "",
    patrimonio: null,
    origenFondos: "",
  });

  // Cargar datos iniciales - Los datos ya vienen en camelCase
  useEffect(() => {
    if (initialData) {
      const data = initialData;

      const newFormData = {
        documentNumber: data.documentNumber || "",
        names: data.names || "",
        lastNames: data.lastNames || "",
        documentType: data.documentType || "cedula",
        gender: data.gender || "",
        maritalStatus: data.maritalStatus || "",
        conyugueComparece: data.conyugueComparece !== false,
        razonExclusionConyugue: data.razonExclusionConyugue || "",
        nationality: data.nationality || "ecuatoriana",
        birthDate: data.birthDate || "",
        email: data.email || "",
        phone: data.phone || "",
        province: data.province || "",
        canton: data.canton || "",
        parroquia: data.parroquia || "",
        sector: data.sector || "",
        mainStreet: data.mainStreet || "",
        secondaryStreet: data.secondaryStreet || "",
        numberStreet: data.numberStreet || "",
        edificio: data.edificio || "",
        occupation: data.occupation || "",
        profession: data.profession || "",
        partnerDocumentNumber: data.partner?.documentNumber || "",
        partnerNames: data.partner?.names || "",
        partnerLastNames: data.partner?.lastNames || "",
        partnerGender: data.partner?.gender || "",
        partnerNationality: data.partner?.nationality || "ecuatoriana",
        partnerBirthDate: data.partner?.birthDate || "",
        partnerEmail: data.partner?.email || "",
        partnerPhone: data.partner?.phone || "",
        partnerOccupation: data.partner?.occupation || "",
        partnerProfession: data.partner?.profession || "",
        partnerSameAddress: false,
        partnerProvince: data.partner?.province || "",
        partnerCanton: data.partner?.canton || "",
        partnerParroquia: data.partner?.parroquia || "",
        partnerSector: data.partner?.sector || "",
        partnerMainStreet: data.partner?.mainStreet || "",
        partnerSecondaryStreet: data.partner?.secondaryStreet || "",
        partnerNumberStreet: data.partner?.numberStreet || "",
        // Campos UAFE del cónyuge
        partnerActividadEconomica: data.partner?.actividadEconomica || "",
        partnerActividadEconomicaOtra:
          data.partner?.actividadEconomicaOtra || "",
        partnerEmpresaTrabajo: data.partner?.empresaTrabajo || "",
        partnerIngresoMensual: data.partner?.ingresoMensual ?? "",
        partnerEsPep:
          data.partner?.esPep === true
            ? "si"
            : data.partner?.esPep === false
              ? "no"
              : "",
        partnerEsPepIndirecto:
          data.partner?.esPepIndirecto === true
            ? "si"
            : data.partner?.esPepIndirecto === false
              ? "no"
              : "",
        partnerPepNombre: data.partner?.pepNombre || "",
        partnerPepInstitucion: data.partner?.pepInstitucion || "",
        partnerPepFechaInicio: data.partner?.pepFechaInicio || "",
        partnerPepCargo: data.partner?.pepCargo || "",
        partnerPepAniosTrabajo: data.partner?.pepAniosTrabajo || "",
        partnerPepGradoRelacion: data.partner?.pepGradoRelacion || "",
        partnerPepRelacionTipo: data.partner?.pepRelacionTipo || "",
        partnerPepYaNoEjerce: data.partner?.pepYaNoEjerce === true,
        partnerPepFechaFin: data.partner?.pepFechaFin || "",
        partnerPatrimonio: data.partner?.patrimonio || null,
        partnerOrigenFondos: data.partner?.origenFondos || "",
        // Campos UAFE
        actividadEconomica: data.actividadEconomica || "",
        actividadEconomicaOtra: data.actividadEconomicaOtra || "",
        empresaTrabajo: data.empresaTrabajo || "",
        ingresoMensual: data.ingresoMensual || "",
        esPep: data.esPep === true ? "si" : data.esPep === false ? "no" : "",
        esPepIndirecto:
          data.esPepIndirecto === true
            ? "si"
            : data.esPepIndirecto === false
              ? "no"
              : "",
        pepNombre: data.pepNombre || "",
        pepInstitucion: data.pepInstitucion || "",
        pepFechaInicio: data.pepFechaInicio || "",
        pepCargo: data.pepCargo || "",
        pepAniosTrabajo: data.pepAniosTrabajo || "",
        pepGradoRelacion: data.pepGradoRelacion || "",
        pepRelacionTipo: data.pepRelacionTipo || "",
        pepYaNoEjerce: data.pepYaNoEjerce === true,
        pepFechaFin: data.pepFechaFin || "",
        patrimonio: data.patrimonio || null,
        origenFondos: data.origenFondos || "",
      };

      setFormData(newFormData);

      if (data.partner) {
        setShowPartnerForm(true);
      }
    }
    // Se depende del documentNumber (valor primitivo estable) en lugar de la
    // referencia del objeto `initialData` completo — así, si el componente padre
    // recrea el objeto en cada render (ej. tras un toast), no se resetea el formulario
    // mientras el documento siga siendo el mismo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.documentNumber]);

  // Cantones derivados de la provincia — sin useEffect, sin condición de carrera.
  // Al cargar datos (edición), provincia y cantón llegan juntos en un solo setFormData,
  // así que esta lista siempre está sincronizada con el valor real, sin importar el orden
  // en que React procese los efectos.
  const cantones = useMemo(
    () => (formData.province ? getCantones(formData.province) : []),
    [formData.province],
  );
  const partnerCantones = useMemo(
    () =>
      formData.partnerProvince ? getCantones(formData.partnerProvince) : [],
    [formData.partnerProvince],
  );

  // Resetear pregunta de cónyuge cuando deja de ser casado.
  // Con estado civil vacío (al abrir el formulario, antes de cargar los datos)
  // no se toca nada: si no, este efecto borraba lo que acababa de cargarse.
  useEffect(() => {
    if (formData.maritalStatus && formData.maritalStatus !== "casado") {
      setFormData((prev) => ({
        ...prev,
        conyugueComparece: true,
        razonExclusionConyugue: "",
      }));
    }
  }, [formData.maritalStatus]);

  // Mostrar/ocultar formulario de cónyuge — solo si es casado Y el cónyuge comparece
  useEffect(() => {
    if (formData.maritalStatus === "casado" && formData.conyugueComparece) {
      setShowPartnerForm(true);
    } else if (formData.maritalStatus) {
      // Igual que arriba: solo se limpia cuando hay un estado civil elegido,
      // para no borrar los datos del cónyuge que se están cargando al editar.
      setShowPartnerForm(false);
      setFormData((prev) => ({
        ...prev,
        partnerDocumentNumber: "",
        partnerNames: "",
        partnerLastNames: "",
        partnerGender: "",
        partnerNationality: "ecuatoriana",
        partnerBirthDate: "",
        partnerEmail: "",
        partnerPhone: "",
        partnerOccupation: "",
        partnerProfession: "",
        partnerSameAddress: true,
        partnerProvince: "",
        partnerCanton: "",
        partnerParroquia: "",
        partnerSector: "",
        partnerMainStreet: "",
        partnerSecondaryStreet: "",
        partnerNumberStreet: "",
      }));
    }
  }, [formData.maritalStatus, formData.conyugueComparece]);

  // Sincronizar dirección del cónyuge
  useEffect(() => {
    if (
      formData.partnerSameAddress &&
      showPartnerForm &&
      formData.maritalStatus === "casado"
    ) {
      setFormData((prev) => ({
        ...prev,
        partnerProvince: prev.province,
        partnerCanton: prev.canton,
        partnerParroquia: prev.parroquia,
        partnerSector: prev.sector,
        partnerMainStreet: prev.mainStreet,
        partnerSecondaryStreet: prev.secondaryStreet,
        partnerNumberStreet: prev.numberStreet,
      }));
    }
  }, [
    formData.partnerSameAddress,
    formData.province,
    formData.canton,
    formData.parroquia,
    formData.sector,
    formData.mainStreet,
    formData.secondaryStreet,
    formData.numberStreet,
    showPartnerForm,
    formData.maritalStatus,
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Al cambiar la provincia manualmente, resetear el cantón si ya no aplica
    // a la nueva provincia (esto NO afecta la carga inicial de datos al editar,
    // porque en ese caso provincia y cantón se setean juntos en un solo golpe).
    if (name === "province") {
      const nuevosCantones = getCantones(value);
      setFormData((prev) => ({
        ...prev,
        province: value,
        canton: nuevosCantones.includes(prev.canton) ? prev.canton : "",
      }));
      if (errors.province) setErrors((prev) => ({ ...prev, province: "" }));
      return;
    }

    if (name === "partnerProvince") {
      const nuevosCantones = getCantones(value);
      setFormData((prev) => ({
        ...prev,
        partnerProvince: value,
        partnerCanton: nuevosCantones.includes(prev.partnerCanton)
          ? prev.partnerCanton
          : "",
      }));
      if (errors.partnerProvince)
        setErrors((prev) => ({ ...prev, partnerProvince: "" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validarCedula(formData.documentNumber)) {
      newErrors.documentNumber = "Cédula inválida";
    }

    if (!formData.names.trim()) {
      newErrors.names = "Los nombres son requeridos";
    }

    if (!formData.lastNames.trim()) {
      newErrors.lastNames = "Los apellidos son requeridos";
    }

    if (!formData.gender) {
      newErrors.gender = "El género es requerido";
    }

    if (!formData.maritalStatus) {
      newErrors.maritalStatus = "El estado civil es requerido";
    }

    if (
      formData.maritalStatus === "casado" &&
      !formData.conyugueComparece &&
      !formData.razonExclusionConyugue
    ) {
      newErrors.razonExclusionConyugue =
        "Seleccione la razón por la que el cónyuge no comparece";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida";
    }

    if (!formData.province) {
      newErrors.province = "La provincia es requerida";
    }

    if (!formData.canton) {
      newErrors.canton = "El cantón es requerido";
    }

    if (!formData.parroquia.trim()) {
      newErrors.parroquia = "La parroquia es requerida";
    }

    if (!formData.mainStreet.trim()) {
      newErrors.mainStreet = "La calle principal es requerida";
    }

    if (!formData.occupation.trim()) {
      newErrors.occupation = "La ocupación es requerida";
    }

    if (showPartnerForm && formData.maritalStatus === "casado") {
      if (!validarCedula(formData.partnerDocumentNumber)) {
        newErrors.partnerDocumentNumber = "Cédula del cónyuge inválida";
      }

      if (!formData.partnerNames.trim()) {
        newErrors.partnerNames = "Los nombres del cónyuge son requeridos";
      }

      if (!formData.partnerLastNames.trim()) {
        newErrors.partnerLastNames = "Los apellidos del cónyuge son requeridos";
      }

      if (!formData.partnerGender) {
        newErrors.partnerGender = "El género del cónyuge es requerido";
      }

      if (!formData.partnerBirthDate) {
        newErrors.partnerBirthDate =
          "La fecha de nacimiento del cónyuge es requerida";
      }

      if (!formData.partnerOccupation.trim()) {
        newErrors.partnerOccupation = "La ocupación del cónyuge es requerida";
      }

      if (!formData.partnerSameAddress) {
        if (!formData.partnerProvince) {
          newErrors.partnerProvince = "La provincia del cónyuge es requerida";
        }
        if (!formData.partnerCanton) {
          newErrors.partnerCanton = "El cantón del cónyuge es requerido";
        }
        if (!formData.partnerParroquia.trim()) {
          newErrors.partnerParroquia = "La parroquia del cónyuge es requerida";
        }
        if (!formData.partnerMainStreet.trim()) {
          newErrors.partnerMainStreet =
            "La calle principal del cónyuge es requerida";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrija los errores en el formulario");
      return;
    }

    setLoading(true);

    try {
      const dataToSend = transformToSnakeCase(formData);

      // Campos que transformToSnakeCase no mapea — se agregan manualmente
      dataToSend.edificio = formData.edificio || null;
      dataToSend.conyugue_comparece =
        formData.maritalStatus === "casado" ? formData.conyugueComparece : true;
      dataToSend.razon_exclusion_conyugue =
        formData.maritalStatus === "casado" && !formData.conyugueComparece
          ? formData.razonExclusionConyugue
          : null;

      // Campos UAFE (transformToSnakeCase no los incluye, se mapean aquí)
      const esPepBool =
        formData.esPep === "si" ? true : formData.esPep === "no" ? false : null;
      const esPepIndBool =
        formData.esPepIndirecto === "si"
          ? true
          : formData.esPepIndirecto === "no"
            ? false
            : null;
      const tienePep = esPepBool === true || esPepIndBool === true;
      Object.assign(dataToSend, {
        actividad_economica: formData.actividadEconomica || null,
        actividad_economica_otra:
          formData.actividadEconomica === "otro"
            ? formData.actividadEconomicaOtra || null
            : null,
        empresa_trabajo: formData.empresaTrabajo || null,
        ingreso_mensual: formData.ingresoMensual || null,
        origen_fondos: formData.origenFondos || null,
        es_pep: esPepBool,
        es_pep_indirecto: esPepIndBool,
        pep_nombre: formData.pepNombre || null,
        pep_institucion: formData.pepInstitucion || null,
        pep_fecha_inicio: formData.pepFechaInicio || null,
        pep_cargo: formData.pepCargo || null,
        pep_anios_trabajo: formData.pepAniosTrabajo || null,
        pep_grado_relacion: formData.pepGradoRelacion || null,
        pep_relacion_tipo: formData.pepRelacionTipo || null,
        pep_ya_no_ejerce: tienePep ? formData.pepYaNoEjerce === true : null,
        pep_fecha_fin:
          tienePep && formData.pepYaNoEjerce
            ? formData.pepFechaFin || null
            : null,
      });
      // El patrimonio no se edita aquí: no se envía, así el backend lo conserva.
      // Eliminar campos del frontend que no van al backend
      delete dataToSend.e_s_pep;
      delete dataToSend.e_s_pep_indirecto;

      if (showPartnerForm && formData.maritalStatus === "casado") {
        const partnerData = {
          documentNumber: formData.partnerDocumentNumber,
          names: formData.partnerNames,
          lastNames: formData.partnerLastNames,
          documentType: "cedula",
          gender: formData.partnerGender,
          maritalStatus: "casado",
          nationality: formData.partnerNationality,
          birthDate: formData.partnerBirthDate,
          email: formData.partnerEmail,
          phone: formData.partnerPhone,
          province: formData.partnerProvince,
          canton: formData.partnerCanton,
          parroquia: formData.partnerParroquia,
          sector: formData.partnerSector,
          mainStreet: formData.partnerMainStreet,
          secondaryStreet: formData.partnerSecondaryStreet,
          numberStreet: formData.partnerNumberStreet,
          occupation: formData.partnerOccupation,
          profession: formData.partnerProfession,
        };

        dataToSend.partner_document_number = formData.partnerDocumentNumber;

        const partnerPayload = transformToSnakeCase(partnerData);
        partnerPayload.actividad_economica =
          formData.partnerActividadEconomica || null;
        partnerPayload.actividad_economica_otra =
          formData.partnerActividadEconomica === "otro"
            ? formData.partnerActividadEconomicaOtra || null
            : null;
        partnerPayload.empresa_trabajo = formData.partnerEmpresaTrabajo || null;
        partnerPayload.ingreso_mensual = formData.partnerIngresoMensual || null;
        partnerPayload.origen_fondos = formData.partnerOrigenFondos || null;
        partnerPayload.es_pep =
          formData.partnerEsPep === "si"
            ? true
            : formData.partnerEsPep === "no"
              ? false
              : null;
        partnerPayload.es_pep_indirecto =
          formData.partnerEsPepIndirecto === "si"
            ? true
            : formData.partnerEsPepIndirecto === "no"
              ? false
              : null;
        partnerPayload.pep_nombre = formData.partnerPepNombre || null;
        partnerPayload.pep_institucion = formData.partnerPepInstitucion || null;
        partnerPayload.pep_fecha_inicio =
          formData.partnerPepFechaInicio || null;
        partnerPayload.pep_cargo = formData.partnerPepCargo || null;
        partnerPayload.pep_anios_trabajo =
          formData.partnerPepAniosTrabajo || null;
        partnerPayload.pep_grado_relacion =
          formData.partnerPepGradoRelacion || null;
        partnerPayload.pep_relacion_tipo =
          formData.partnerPepRelacionTipo || null;
        partnerPayload.pep_ya_no_ejerce =
          formData.partnerPepYaNoEjerce === true;
        partnerPayload.pep_fecha_fin = formData.partnerPepYaNoEjerce
          ? formData.partnerPepFechaFin || null
          : null;

        const partnerResponse = await apiFetch(API_CONFIG.ENDPOINTS.PARTIES, {
          method: "POST",
          body: JSON.stringify(partnerPayload),
        });

        if (!partnerResponse.ok) {
          const errorData = await partnerResponse.json();
          throw new Error(
            errorData.detail || "Error al guardar datos del cónyuge",
          );
        }
      }

      // El backend hace upsert en POST /api/users — no existe endpoint PUT
      const response = await apiFetch(API_CONFIG.ENDPOINTS.PARTIES, {
        method: "POST",
        body: JSON.stringify(dataToSend),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_e) {
        // El backend no devolvió JSON válido (ej. error 405/500 en HTML)
      }

      if (response.ok) {
        toast.success(
          isEditing ? "Compareciente actualizado" : "Compareciente creado",
        );
        if (onSuccess) {
          onSuccess(data);
        }
      } else if (response.status === 405) {
        throw new Error(
          "Operación no permitida por el servidor (405). Verifique que esté creando y no editando un registro inexistente.",
        );
      } else if (response.status === 404) {
        throw new Error("No se encontró el registro a actualizar.");
      } else if (response.status === 422) {
        const detalle = Array.isArray(data?.detail)
          ? data.detail.map((d) => d.msg).join(", ")
          : data?.detail ||
            "Datos inválidos. Revise los campos del formulario.";
        throw new Error(detalle);
      } else if (response.status >= 500) {
        throw new Error(
          "Error interno del servidor. Intente de nuevo o contacte al administrador.",
        );
      } else {
        throw new Error(
          data?.detail ||
            `Error al guardar compareciente (código ${response.status})`,
        );
      }
    } catch (error) {
      const msg =
        typeof error?.message === "string"
          ? error.message
          : "Error inesperado al guardar el compareciente. Intente de nuevo.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* DATOS PERSONALES */}
      <Card title="Datos Personales">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Número de Cédula"
            required
            error={errors.documentNumber}
          >
            <input
              type="text"
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleChange}
              className="input-field"
              maxLength="10"
              disabled={!!initialData || loading}
            />
          </FormField>

          <FormField label="Tipo de Documento" required>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            >
              <option value="cedula">Cédula</option>
              <option value="pasaporte">Pasaporte</option>
            </select>
          </FormField>

          <FormField label="Nombres" required error={errors.names}>
            <input
              type="text"
              name="names"
              value={formData.names}
              onChange={handleChange}
              className="input-field"
              placeholder="Nombres completos"
              disabled={loading}
            />
          </FormField>

          <FormField label="Apellidos" required error={errors.lastNames}>
            <input
              type="text"
              name="lastNames"
              value={formData.lastNames}
              onChange={handleChange}
              className="input-field"
              placeholder="Apellidos completos"
              disabled={loading}
            />
          </FormField>

          <FormField label="Género" required error={errors.gender}>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            >
              <option value="">Seleccione</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </FormField>

          <FormField label="Estado Civil" required error={errors.maritalStatus}>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            >
              <option value="">Seleccione</option>
              <option value="soltero">Soltero/a</option>
              <option value="casado">Casado/a</option>
              <option value="divorciado">Divorciado/a</option>
              <option value="viudo">Viudo/a</option>
              <option value="union_libre">Unión Libre</option>
            </select>
          </FormField>

          {formData.maritalStatus === "casado" && (
            <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <FormField label="¿El cónyuge comparece en este trámite?">
                <div className="flex gap-3 mt-1">
                  {["si", "no"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          conyugueComparece: v === "si",
                          razonExclusionConyugue:
                            v === "si" ? "" : prev.razonExclusionConyugue,
                        }))
                      }
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.conyugueComparece === (v === "si")
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {v === "si" ? "Sí" : "No"}
                    </button>
                  ))}
                </div>
              </FormField>

              {!formData.conyugueComparece && (
                <FormField
                  label="Razón por la que no comparece"
                  required
                  error={errors.razonExclusionConyugue}
                >
                  <select
                    value={formData.razonExclusionConyugue}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        razonExclusionConyugue: e.target.value,
                      }))
                    }
                    className="input-field text-sm"
                    disabled={loading}
                  >
                    <option value="">Seleccione una razón</option>
                    <option value="disolucion">
                      Disolución de sociedad conyugal
                    </option>
                    <option value="capitulacion">
                      Capitulación matrimonial
                    </option>
                    <option value="adquirido_solo">
                      Bien adquirido soltero/viudo/divorciado
                    </option>
                    <option value="no_requiere_adquirente">
                      No se requiere comparecencia (cónyuge adquirente)
                    </option>
                    <option value="titulo_gratuito">
                      Adquiere a título gratuito
                    </option>
                  </select>
                </FormField>
              )}
            </div>
          )}

          <FormField label="Nacionalidad" required>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            />
          </FormField>

          <FormField
            label="Fecha de Nacimiento"
            required
            error={errors.birthDate}
          >
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="correo@ejemplo.com"
              disabled={loading}
            />
          </FormField>

          <FormField label="Teléfono">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="0991234567"
              disabled={loading}
            />
          </FormField>

          <FormField label="Ocupación" required error={errors.occupation}>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej: Comerciante"
              disabled={loading}
            />
          </FormField>

          <FormField label="Profesión">
            <input
              type="text"
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej: Ingeniero"
              disabled={loading}
            />
          </FormField>
        </div>
      </Card>

      {/* DIRECCIÓN */}
      <Card title="Dirección">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Provincia" required error={errors.province}>
            <select
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            >
              <option value="">Seleccione</option>
              {getProvincias().map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Cantón" required error={errors.canton}>
            <select
              name="canton"
              value={formData.canton}
              onChange={handleChange}
              className="input-field"
              disabled={!formData.province || loading}
            >
              <option value="">Seleccione</option>
              {cantones.map((cant) => (
                <option key={cant} value={cant}>
                  {cant}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Parroquia" required error={errors.parroquia}>
            <input
              type="text"
              name="parroquia"
              value={formData.parroquia}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            />
          </FormField>

          <FormField label="Sector">
            <input
              type="text"
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            />
          </FormField>

          <FormField label="Calle Principal" required error={errors.mainStreet}>
            <input
              type="text"
              name="mainStreet"
              value={formData.mainStreet}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            />
          </FormField>

          <FormField label="Calle Secundaria">
            <input
              type="text"
              name="secondaryStreet"
              value={formData.secondaryStreet}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            />
          </FormField>

          <FormField label="Número (opcional)">
            <input
              type="text"
              name="numberStreet"
              value={formData.numberStreet}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej: N24-660 o E13-51"
              disabled={loading}
            />
          </FormField>

          <FormField
            label="Edificio / Conjunto / Departamento"
            className="col-span-2"
          >
            <input
              type="text"
              name="edificio"
              value={formData.edificio || ""}
              onChange={handleChange}
              className="input-field"
              placeholder="Ej: Edificio Porticello departamento 3B (opcional)"
              disabled={loading}
            />
          </FormField>
        </div>
      </Card>

      <SeccionUAFEForm
        titulo="Información UAFE (opcional)"
        get={(key) => formData[key] ?? ""}
        set={(key, value) => setFormData((prev) => ({ ...prev, [key]: value }))}
      />

      {/* DATOS DEL CÓNYUGE */}
      {showPartnerForm && formData.maritalStatus === "casado" && (
        <Card title="Datos del Cónyuge">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Cédula del Cónyuge"
              required
              error={errors.partnerDocumentNumber}
            >
              <input
                type="text"
                name="partnerDocumentNumber"
                value={formData.partnerDocumentNumber}
                onChange={handleChange}
                className="input-field"
                maxLength="10"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Género del Cónyuge"
              required
              error={errors.partnerGender}
            >
              <select
                name="partnerGender"
                value={formData.partnerGender}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              >
                <option value="">Seleccione</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
            </FormField>

            <FormField
              label="Nombres del Cónyuge"
              required
              error={errors.partnerNames}
            >
              <input
                type="text"
                name="partnerNames"
                value={formData.partnerNames}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Apellidos del Cónyuge"
              required
              error={errors.partnerLastNames}
            >
              <input
                type="text"
                name="partnerLastNames"
                value={formData.partnerLastNames}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </FormField>

            <FormField label="Nacionalidad" required>
              <input
                type="text"
                name="partnerNationality"
                value={formData.partnerNationality}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Fecha de Nacimiento"
              required
              error={errors.partnerBirthDate}
            >
              <input
                type="date"
                name="partnerBirthDate"
                value={formData.partnerBirthDate}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </FormField>

            <FormField label="Email">
              <input
                type="email"
                name="partnerEmail"
                value={formData.partnerEmail}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </FormField>

            <FormField label="Teléfono">
              <input
                type="tel"
                name="partnerPhone"
                value={formData.partnerPhone}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Ocupación"
              required
              error={errors.partnerOccupation}
            >
              <input
                type="text"
                name="partnerOccupation"
                value={formData.partnerOccupation}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </FormField>

            <FormField label="Profesión">
              <input
                type="text"
                name="partnerProfession"
                value={formData.partnerProfession}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </FormField>

            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="partnerSameAddress"
                  checked={formData.partnerSameAddress}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">
                  Misma dirección que el titular
                </span>
              </label>
            </div>

            {!formData.partnerSameAddress && (
              <>
                <FormField
                  label="Provincia"
                  required
                  error={errors.partnerProvince}
                >
                  <select
                    name="partnerProvince"
                    value={formData.partnerProvince}
                    onChange={handleChange}
                    className="input-field"
                    disabled={loading}
                  >
                    <option value="">Seleccione</option>
                    {getProvincias().map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Cantón" required error={errors.partnerCanton}>
                  <select
                    name="partnerCanton"
                    value={formData.partnerCanton}
                    onChange={handleChange}
                    className="input-field"
                    disabled={!formData.partnerProvince || loading}
                  >
                    <option value="">Seleccione</option>
                    {partnerCantones.map((cant) => (
                      <option key={cant} value={cant}>
                        {cant}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Parroquia"
                  required
                  error={errors.partnerParroquia}
                >
                  <input
                    type="text"
                    name="partnerParroquia"
                    value={formData.partnerParroquia}
                    onChange={handleChange}
                    className="input-field"
                    disabled={loading}
                  />
                </FormField>

                <FormField label="Sector">
                  <input
                    type="text"
                    name="partnerSector"
                    value={formData.partnerSector}
                    onChange={handleChange}
                    className="input-field"
                    disabled={loading}
                  />
                </FormField>

                <FormField
                  label="Calle Principal"
                  required
                  error={errors.partnerMainStreet}
                >
                  <input
                    type="text"
                    name="partnerMainStreet"
                    value={formData.partnerMainStreet}
                    onChange={handleChange}
                    className="input-field"
                    disabled={loading}
                  />
                </FormField>

                <FormField label="Calle Secundaria">
                  <input
                    type="text"
                    name="partnerSecondaryStreet"
                    value={formData.partnerSecondaryStreet}
                    onChange={handleChange}
                    className="input-field"
                    disabled={loading}
                  />
                </FormField>

                <FormField label="Número (opcional)">
                  <input
                    type="text"
                    name="partnerNumberStreet"
                    value={formData.partnerNumberStreet}
                    onChange={handleChange}
                    className="input-field"
                    disabled={loading}
                  />
                </FormField>
              </>
            )}
          </div>
        </Card>
      )}

      {showPartnerForm && formData.maritalStatus === "casado" && (
        <SeccionUAFEForm
          titulo="Información UAFE del Cónyuge (opcional)"
          descripcion="Datos opcionales del cónyuge para cumplimiento UAFE. Si no aplica, puede dejarse en blanco."
          get={(key) =>
            formData["partner" + key.charAt(0).toUpperCase() + key.slice(1)] ??
            ""
          }
          set={(key, value) =>
            setFormData((prev) => ({
              ...prev,
              ["partner" + key.charAt(0).toUpperCase() + key.slice(1)]: value,
            }))
          }
        />
      )}

      {/* BOTONES */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            icon={<X className="w-5 h-5" />}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="success"
          loading={loading}
          disabled={loading}
          icon={<Save className="w-5 h-5" />}
        >
          {isEditing ? "Actualizar" : "Guardar"} Compareciente
        </Button>
      </div>
    </form>
  );
};

export default ComparecienteForm;
