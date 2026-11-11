import { useEffect, useState } from "react";
import { Button } from "../components/shared";
import ComparecienteSearch from "../components/comparecientes/ComparecienteSearch";
import ComparecienteCard from "../components/comparecientes/ComparecienteCard";
import EmpresaCard from "../components/comparecientes/EmpresaCard";
import RegistroInterno from "../components/registro/RegistroInterno";
import VistaRegistro from "../components/registro/VistaRegistro";
import HistorialUAFE from "../components/comparecientes/HistorialUAFE";
import { apiFetch } from "../config/api";
import API_CONFIG from "../config/api";
import { useToast } from "../hooks/useToast";
import { transformToCamelCase } from "../utils/transformPartyData";
import { Plus, Edit, ArrowLeft, User, Building2, Printer } from "lucide-react";

const ComparecientesPage = () => {
  // 'persona' | 'empresa'
  const [entityType, setEntityType] = useState("persona");

  // Estados compartidos por los dos modos
  const [view, setView] = useState("search"); // 'search' | 'create' | 'edit' | 'view'
  const [loading, setLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState(null);
  const [currentEmpresa, setCurrentEmpresa] = useState(null);
  // Documento a actualizar cuando se llega desde "Nuevo" (ya registrado)
  const [documentoEditar, setDocumentoEditar] = useState("");
  // Último formulario llenado (se muestra en el orden del formulario)
  const [registroVigente, setRegistroVigente] = useState(null);
  const toast = useToast();

  // ─── Helpers de navegación ───────────────────────────────────────────────
  const handleBackToSearch = () => {
    setView("search");
    if (entityType === "persona") setCurrentPersona(null);
    else setCurrentEmpresa(null);
  };

  const handleSwitchType = (type) => {
    if (type === entityType) return;
    setEntityType(type);
    setView("search");
    setCurrentPersona(null);
    setCurrentEmpresa(null);
  };

  const documentoActual =
    entityType === "persona"
      ? currentPersona?.documentNumber
      : currentEmpresa?.ruc;

  useEffect(() => {
    if (view !== "view" || !documentoActual) return;
    let cancelado = false;
    setRegistroVigente(null);
    apiFetch(
      `/api/registro/vigente/${entityType}/${encodeURIComponent(documentoActual)}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelado && setRegistroVigente(data))
      .catch(() => !cancelado && setRegistroVigente(null));
    return () => {
      cancelado = true;
    };
  }, [view, entityType, documentoActual]);

  const imprimir = () =>
    window.open(
      `/comparecientes/imprimir/${entityType}/${encodeURIComponent(documentoActual)}`,
      "_blank",
    );

  // ─── Lógica Persona Natural ──────────────────────────────────────────────
  const handleSearchPersona = async (documentNumber) => {
    setLoading(true);
    try {
      const response = await apiFetch(
        `${API_CONFIG.ENDPOINTS.PARTIES}/${documentNumber}`,
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentPersona(transformToCamelCase(data));
        setView("view");
      } else if (response.status === 404) {
        toast.info("Compareciente no encontrado. Puede crear uno nuevo.");
        setCurrentPersona(null);
      } else {
        const err = await response.json();
        toast.error(err.detail || "Error al buscar compareciente");
      }
    } catch {
      toast.error("Error al buscar compareciente");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaSuccess = (data) => {
    setCurrentPersona(transformToCamelCase(data));
    setView("view");
  };

  // ─── Lógica Empresa ──────────────────────────────────────────────────────
  const handleSearchEmpresa = async (ruc) => {
    setLoading(true);
    try {
      const response = await apiFetch(
        `${API_CONFIG.ENDPOINTS.COMPANIES}/${ruc}`,
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentEmpresa(transformToCamelCase(data));
        setView("view");
      } else if (response.status === 404) {
        toast.info("Empresa no encontrada. Puede registrar una nueva.");
        setCurrentEmpresa(null);
      } else {
        const err = await response.json();
        toast.error(err.detail || "Error al buscar empresa");
      }
    } catch {
      toast.error("Error al buscar empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaSuccess = (data) => {
    setCurrentEmpresa(transformToCamelCase(data));
    setView("view");
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  const isPersona = entityType === "persona";
  const currentItem = isPersona ? currentPersona : currentEmpresa;

  return (
    <div>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Comparecientes
          </h1>
          <p className="text-gray-600 mt-1">
            Buscar, crear y editar personas naturales y empresas
          </p>
        </div>

        {view === "search" && (
          <Button
            variant="primary"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setView("create")}
          >
            {isPersona ? "Nuevo Compareciente" : "Nueva Empresa"}
          </Button>
        )}

        {(view === "view" || view === "edit") && (
          <Button
            variant="secondary"
            icon={<ArrowLeft className="w-5 h-5" />}
            onClick={handleBackToSearch}
          >
            Volver a Búsqueda
          </Button>
        )}
      </div>

      {/* Toggle Persona / Empresa */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-6">
        <button
          onClick={() => handleSwitchType("persona")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            isPersona
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <User className="w-4 h-4" />
          Persona Natural
        </button>
        <button
          onClick={() => handleSwitchType("empresa")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            !isPersona
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Empresa
        </button>
      </div>

      {/* ── BÚSQUEDA ── */}
      {view === "search" && (
        <div className="max-w-2xl">
          {isPersona ? (
            <>
              <ComparecienteSearch
                onSearch={handleSearchPersona}
                loading={loading}
              />
              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ℹ️ Instrucciones
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • Busque un compareciente existente por número de cédula
                  </li>
                  <li>• Si no existe, podrá crear uno nuevo</li>
                  <li>
                    • "Actualizar" abre el formulario completo y crea una
                    declaración nueva
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <ComparecienteSearch
                onSearch={handleSearchEmpresa}
                loading={loading}
                placeholder="Ej: 1790012345001"
                label="Buscar por RUC"
                mode="ruc"
              />
              <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-2">
                  ℹ️ Instrucciones
                </h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Busque una empresa existente por RUC</li>
                  <li>• Si no existe, podrá registrar una nueva</li>
                  <li>
                    • Con "Nueva Empresa" se registra también al representante
                    legal
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── NUEVO (mismo formulario del cliente) ── */}
      {view === "create" && (
        <RegistroInterno
          key={`nuevo-${entityType}`}
          tipo={entityType}
          modo="nuevo"
          onGuardado={(data) => {
            toast.success("Datos registrados correctamente");
            if (isPersona) handlePersonaSuccess(data);
            else handleEmpresaSuccess(data);
          }}
          onCancelar={() => setView("search")}
          onActualizar={(doc) => {
            setDocumentoEditar(doc);
            setView("edit");
          }}
        />
      )}

      {/* ── ACTUALIZAR: identidad precargada, parte UAFE vacía ── */}
      {view === "edit" && (
        <RegistroInterno
          key={`actualizar-${entityType}-${documentoEditar || documentoActual}`}
          tipo={entityType}
          modo="actualizar"
          documento={documentoEditar || documentoActual}
          onGuardado={(data) => {
            toast.success("Datos actualizados correctamente");
            setDocumentoEditar("");
            if (isPersona) handlePersonaSuccess(data);
            else handleEmpresaSuccess(data);
          }}
          onCancelar={() => {
            const veniaDeNuevo = !!documentoEditar;
            setDocumentoEditar("");
            setView(veniaDeNuevo || !currentItem ? "search" : "view");
          }}
        />
      )}

      {/* ── VER ── */}
      {view === "view" && currentItem && (
        <div className="space-y-4">
          <div className="flex justify-end gap-3">
            {registroVigente && (
              <Button
                variant="secondary"
                icon={<Printer className="w-5 h-5" />}
                onClick={imprimir}
              >
                Imprimir declaración
              </Button>
            )}
            <Button
              variant="primary"
              icon={<Edit className="w-5 h-5" />}
              onClick={() => setView("edit")}
            >
              {isPersona ? "Actualizar Compareciente" : "Actualizar Empresa"}
            </Button>
          </div>

          {registroVigente ? (
            <VistaRegistro registro={registroVigente} />
          ) : isPersona ? (
            <ComparecienteCard data={currentPersona} showPartner={true} />
          ) : (
            <EmpresaCard data={currentEmpresa} />
          )}

          {isPersona ? (
            <HistorialUAFE
              declaraciones={currentPersona.declaraciones}
              pendientes={[
                {
                  titulo: "Datos personales",
                  items: currentPersona.datosReportadosPendientes,
                },
              ]}
              onActualizado={() =>
                handleSearchPersona(currentPersona.documentNumber)
              }
            />
          ) : (
            <HistorialUAFE
              declaraciones={currentEmpresa.declaraciones}
              pendientes={[
                {
                  titulo: "Datos de la empresa",
                  items: currentEmpresa.datosReportadosPendientes,
                },
                {
                  titulo: "Representante legal",
                  items: currentEmpresa.repDatosReportadosPendientes,
                },
              ]}
              onActualizado={() => handleSearchEmpresa(currentEmpresa.ruc)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ComparecientesPage;
