import { useState } from "react";
import {
  BuscadorPlantillas,
  ModalGuardarPlantilla,
  useBorradorDeUrl,
} from "../../../components/plantillas";
import { Button, Card, RichTextEditor } from "../../../components/shared";
import { ComparecienteInline } from "../../../components/comparecientes";
import { SeccionFormularioRedactar } from "../../../components/minutas";
import { useToast } from "../../../hooks/useToast";
import { apiFetch } from "../../../config/api";
import API_CONFIG from "../../../config/api";
import { descargarRespuesta } from "../../../utils/descargas";

const FormularioPromesa = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [modalPlantillaAbierto, setModalPlantillaAbierto] = useState(false);
  const [plantillaKey, setPlantillaKey] = useState(0);
  const [borrador, setBorrador] = useState(null); // { id, codigo, nombre }
  const [vendedores, setVendedores] = useState([]);
  const [compradores, setCompradores] = useState([]);

  // ANTECEDENTES
  const [tipoPropiedad, setTipoPropiedad] = useState("");
  const [nombreConjunto, setNombreConjunto] = useState("");
  const [predios, setPredios] = useState([]);

  // UBICACIÓN (CONSTRUIDO EN)
  const [ubicacion, setUbicacion] = useState({
    lote: "",
    numero: "",
    parroquia: "",
    canton: "",
    provincia: "",
    tipoBienComun: "",
    tipoBienComunOtro: "",
    superficieBienComun: "",
    numeroPredio: "",
    descripcionBienComun: "",
  });

  // HISTORIA DE DOMINIO
  const [historiaManual, setHistoriaManual] = useState("");
  const [historiaFormulario, setHistoriaFormulario] = useState({
    titulo: "",
    tituloOtro: "",
    tipoSucesion: "",
    adquiridoDe: "",
    fechaOtorgamiento: "",
    numeroNotaria: "",
    cantonNotaria: "",
    notario: "",
    fechaInscripcion: "",
    cantonInscripcion: "",
    nombreCausante: "",
    causanteAdquiridoDe: "",
    causanteTitulo: "",
    causanteTituloOtro: "",
    causanteFechaOtorgamiento: "",
    causanteNumeroNotaria: "",
    causanteCantonNotaria: "",
    causanteNotario: "",
    causanteFechaInscripcion: "",
    causanteCantonInscripcion: "",
    aclaratorias: [],
  });

  // DECLARATORIA
  const [hayDeclaratoria, setHayDeclaratoria] = useState(null);
  const [declaratoriaManual, setDeclaratoriaManual] = useState("");
  const [declaratoriaFormulario, setDeclaratoriaFormulario] = useState({
    fechaOtorgamiento: "",
    numeroNotaria: "",
    cantonNotaria: "",
    notario: "",
    fechaInscripcion: "",
    cantonInscripcion: "",
    aclaratorias: [],
  });

  // LINDEROS
  const [linderosGenerales, setLinderosGenerales] = useState({
    norte: [{ metros: "", colindancia: "" }],
    sur: [{ metros: "", colindancia: "" }],
    este: [{ metros: "", colindancia: "" }],
    oeste: [{ metros: "", colindancia: "" }],
    superficie: "",
  });
  const [tieneLInderosEspecificos, setTieneLInderosEspecificos] =
    useState(false);
  const [linderosEspecificos, setLinderosEspecificos] = useState({
    norte: [{ metros: "", colindancia: "" }],
    sur: [{ metros: "", colindancia: "" }],
    este: [{ metros: "", colindancia: "" }],
    oeste: [{ metros: "", colindancia: "" }],
    arriba: [{ metros: "", colindancia: "" }],
    abajo: [{ metros: "", colindancia: "" }],
    superficie: "",
  });

  // PRECIO
  const [precioTotal, setPrecioTotal] = useState("");
  const [modoPrecio, setModoPrecio] = useState("formulario");
  const [precioManual, setPrecioManual] = useState("");
  const [partesPago, setPartesPago] = useState([
    {
      id: Date.now(),
      letra: "A",
      monto: "",
      tipoPago: "unico",
      medioPago: "",
      tipoCheque: "",
      momentoPago: "",
      momentoOtro: "",
      esCreditoBancario: false,
      nombreBanco: "",
      cuentaDestino: "",
      numeroCuotas: "",
      valorCuota: 0,
      periodicidad: "",
      periodicidadOtra: "",
      tieneDetalle: false,
      detalle: {
        bancoOrigen: "",
        cuentaOrigen: "",
        tipoCuentaOrigen: "",
        bancoDestino: "",
        cuentaDestino: "",
        tipoCuentaDestino: "",
      },
    },
  ]);

  // PLAZO
  const [plazo, setPlazo] = useState({
    esFechaFija: true,
    fechaFija: "",
    anios: "",
    meses: "",
    dias: "",
    conProrroga: false,
    fechaProrroga: "",
  });

  // CLÁUSULA PENAL
  const [clausulaPenal, setClausulaPenal] = useState({
    tipoPenal: "monto_fijo",
    montoFijo: "",
    porcentaje: "",
  });

  // CONDICIÓN RESOLUTORIA
  const [hayCondicionResolutoria, setHayCondicionResolutoria] = useState(null);

  // PROPIEDAD INTELECTUAL
  const [propiedadIntelectual, setPropiedadIntelectual] = useState({
    nombreAbogado: "",
    generoAbogado: "femenino",
  });

  // ABOGADO
  const [abogado, setAbogado] = useState({
    nombre: "",
    tipoMatricula: "cj",
    provincia: "",
    numeroMatricula: "",
  });

  // ============================================
  // OPCIONES
  // ============================================
  const tiposPredios = [
    "Departamento",
    "Suite",
    "Casa",
    "Loft",
    "Estacionamiento",
    "Oficina",
    "Bodega",
    "Almacén",
    "Porche",
    "Terraza",
    "Jardín Delantero",
    "Jardín Trasero",
    "Secadero",
    "Otro",
  ];
  const tiposInmuebles = [
    "Planta",
    "Planta Baja",
    "Planta Alta",
    ...tiposPredios,
  ];

  // ============================================
  // CARGAR PLANTILLA
  // ============================================
  const handleCargarPlantilla = (contenido, guardado = null) => {
    if (guardado)
      setBorrador({
        id: guardado.id,
        codigo: guardado.codigo,
        nombre: guardado.nombre,
      });
    if (contenido.vendedores !== undefined) setVendedores(contenido.vendedores);
    if (contenido.compradores !== undefined)
      setCompradores(contenido.compradores);
    if (contenido.tipoPropiedad !== undefined)
      setTipoPropiedad(contenido.tipoPropiedad);
    if (contenido.nombreConjunto !== undefined)
      setNombreConjunto(contenido.nombreConjunto);
    if (contenido.predios !== undefined) setPredios(contenido.predios);
    if (contenido.ubicacion !== undefined) setUbicacion(contenido.ubicacion);
    if (contenido.historiaManual !== undefined)
      setHistoriaManual(contenido.historiaManual);
    if (contenido.historiaFormulario !== undefined)
      setHistoriaFormulario(contenido.historiaFormulario);
    if (contenido.hayDeclaratoria !== undefined)
      setHayDeclaratoria(contenido.hayDeclaratoria);
    if (contenido.declaratoriaManual !== undefined)
      setDeclaratoriaManual(contenido.declaratoriaManual);
    if (contenido.declaratoriaFormulario !== undefined)
      setDeclaratoriaFormulario(contenido.declaratoriaFormulario);
    if (contenido.linderosGenerales !== undefined)
      setLinderosGenerales(contenido.linderosGenerales);
    if (contenido.tieneLInderosEspecificos !== undefined)
      setTieneLInderosEspecificos(contenido.tieneLInderosEspecificos);
    if (contenido.linderosEspecificos !== undefined)
      setLinderosEspecificos(contenido.linderosEspecificos);
    if (contenido.precioTotal !== undefined)
      setPrecioTotal(contenido.precioTotal);
    if (contenido.modoPrecio !== undefined) setModoPrecio(contenido.modoPrecio);
    if (contenido.precioManual !== undefined)
      setPrecioManual(contenido.precioManual);
    if (contenido.partesPago !== undefined) setPartesPago(contenido.partesPago);
    if (contenido.plazo !== undefined) setPlazo(contenido.plazo);
    if (contenido.clausulaPenal !== undefined)
      setClausulaPenal(contenido.clausulaPenal);
    if (contenido.hayCondicionResolutoria !== undefined)
      setHayCondicionResolutoria(contenido.hayCondicionResolutoria);
    if (contenido.propiedadIntelectual !== undefined)
      setPropiedadIntelectual(contenido.propiedadIntelectual);
    if (contenido.abogado !== undefined) setAbogado(contenido.abogado);
    setPlantillaKey((k) => k + 1);
  };

  useBorradorDeUrl(handleCargarPlantilla);

  // ============================================
  // COMPARECIENTES
  // ============================================
  const handleAgregarVendedor = () => setVendedores([...vendedores, null]);
  const handleVendedorReady = (index, data) => {
    const n = [...vendedores];
    n[index] = data;
    setVendedores(n);
  };
  const handleEliminarVendedor = (index) =>
    setVendedores(vendedores.filter((_, i) => i !== index));
  const handleAgregarComprador = () => setCompradores([...compradores, null]);
  const handleCompradorReady = (index, data) => {
    const n = [...compradores];
    n[index] = data;
    setCompradores(n);
  };
  const handleEliminarComprador = (index) =>
    setCompradores(compradores.filter((_, i) => i !== index));

  // ============================================
  // PREDIOS — idéntico a compraventa + campo estaContruido
  // ============================================
  const handleAgregarPredio = (esCompuesto) => {
    setPredios([
      ...predios,
      {
        id: Date.now(),
        esCompuesto,
        tipo: "",
        tipoOtro: "",
        numero: "",
        inmuebles: [
          {
            id: Date.now() + Math.random(),
            tipo: "",
            tipoOtro: "",
            numero: "",
            nivel: "",
            areaCubierta: "",
            areaDescubierta: "",
            alicuotaParcial: "",
            estaContruido: null,
          },
        ],
        alicuotaTotal: 0,
        alicuotaTotalManual: "",
        usarAlicuotaManual: false,
      },
    ]);
  };
  const handleEliminarPredio = (predioId) =>
    setPredios(predios.filter((p) => p.id !== predioId));
  const handlePredioChange = (predioId, field, value) => {
    setPredios(
      predios.map((predio) => {
        if (predio.id !== predioId) return predio;
        const updated = { ...predio, [field]: value };
        if (field === "usarAlicuotaManual" && !value) {
          const suma = updated.inmuebles.reduce(
            (acc, inm) => acc + (parseFloat(inm.alicuotaParcial) || 0),
            0,
          );
          updated.alicuotaTotal = parseFloat(suma.toFixed(10));
        }
        return updated;
      }),
    );
  };
  const handleAgregarInmueble = (predioId) => {
    setPredios(
      predios.map((predio) =>
        predio.id === predioId && predio.esCompuesto
          ? {
              ...predio,
              inmuebles: [
                ...predio.inmuebles,
                {
                  id: Date.now() + Math.random(),
                  tipo: "",
                  tipoOtro: "",
                  numero: "",
                  nivel: "",
                  areaCubierta: "",
                  areaDescubierta: "",
                  alicuotaParcial: "",
                  estaContruido: null,
                },
              ],
            }
          : predio,
      ),
    );
  };
  const handleEliminarInmueble = (predioId, inmuebleId) => {
    setPredios(
      predios.map((predio) => {
        if (predio.id !== predioId) return predio;
        const nuevosInmuebles = predio.inmuebles.filter(
          (i) => i.id !== inmuebleId,
        );
        let nuevaAlicuotaTotal = predio.alicuotaTotal;
        if (!predio.usarAlicuotaManual) {
          const suma = nuevosInmuebles.reduce(
            (acc, inm) => acc + (parseFloat(inm.alicuotaParcial) || 0),
            0,
          );
          nuevaAlicuotaTotal = parseFloat(suma.toFixed(10));
        }
        return {
          ...predio,
          inmuebles: nuevosInmuebles,
          alicuotaTotal: nuevaAlicuotaTotal,
        };
      }),
    );
  };
  const handleInmuebleChange = (predioId, inmuebleId, field, value) => {
    setPredios(
      predios.map((predio) => {
        if (predio.id !== predioId) return predio;
        const nuevosInmuebles = predio.inmuebles.map((inmueble) => {
          if (inmueble.id !== inmuebleId) return inmueble;
          return { ...inmueble, [field]: value };
        });
        let nuevaAlicuotaTotal = predio.alicuotaTotal;
        if (!predio.usarAlicuotaManual) {
          const suma = nuevosInmuebles.reduce(
            (acc, inm) => acc + (parseFloat(inm.alicuotaParcial) || 0),
            0,
          );
          nuevaAlicuotaTotal = parseFloat(suma.toFixed(10));
        }
        return {
          ...predio,
          inmuebles: nuevosInmuebles,
          alicuotaTotal: nuevaAlicuotaTotal,
        };
      }),
    );
  };

  // ============================================
  // LINDEROS
  // ============================================
  const handleAgregarLindero = (dir, esEspecifico = false) => {
    if (esEspecifico)
      setLinderosEspecificos({
        ...linderosEspecificos,
        [dir]: [...linderosEspecificos[dir], { metros: "", colindancia: "" }],
      });
    else
      setLinderosGenerales({
        ...linderosGenerales,
        [dir]: [...linderosGenerales[dir], { metros: "", colindancia: "" }],
      });
  };
  const handleEliminarLindero = (dir, index, esEspecifico = false) => {
    if (esEspecifico) {
      const nuevos = linderosEspecificos[dir].filter((_, i) => i !== index);
      setLinderosEspecificos({
        ...linderosEspecificos,
        [dir]: nuevos.length > 0 ? nuevos : [{ metros: "", colindancia: "" }],
      });
    } else {
      const nuevos = linderosGenerales[dir].filter((_, i) => i !== index);
      setLinderosGenerales({
        ...linderosGenerales,
        [dir]: nuevos.length > 0 ? nuevos : [{ metros: "", colindancia: "" }],
      });
    }
  };
  const handleLinderoChange = (
    dir,
    index,
    field,
    value,
    esEspecifico = false,
  ) => {
    if (esEspecifico) {
      const nuevos = [...linderosEspecificos[dir]];
      nuevos[index][field] = value;
      setLinderosEspecificos({ ...linderosEspecificos, [dir]: nuevos });
    } else {
      const nuevos = [...linderosGenerales[dir]];
      nuevos[index][field] = value;
      setLinderosGenerales({ ...linderosGenerales, [dir]: nuevos });
    }
  };

  // ============================================
  // ACLARATORIAS HISTORIA
  // ============================================
  const handleAgregarAclaratoriaHistoria = (path = []) => {
    const nueva = {
      id: Date.now(),
      titulo: "",
      tituloOtro: "",
      adquiridoDe: "",
      fechaOtorgamiento: "",
      numeroNotaria: "",
      cantonNotaria: "",
      notario: "",
      fechaInscripcion: "",
      cantonInscripcion: "",
      aclaratorias: [],
    };
    const newH = { ...historiaFormulario };
    if (path.length === 0) {
      newH.aclaratorias = [...newH.aclaratorias, nueva];
    } else {
      let cur = newH;
      for (let i = 0; i < path.length - 1; i++) cur = cur.aclaratorias[path[i]];
      cur.aclaratorias[path[path.length - 1]].aclaratorias.push(nueva);
    }
    setHistoriaFormulario(newH);
  };
  const handleEliminarAclaratoriaHistoria = (path) => {
    const newH = { ...historiaFormulario };
    if (path.length === 1) {
      newH.aclaratorias = newH.aclaratorias.filter((_, i) => i !== path[0]);
    } else {
      let cur = newH;
      for (let i = 0; i < path.length - 2; i++) cur = cur.aclaratorias[path[i]];
      cur.aclaratorias[path[path.length - 2]].aclaratorias = cur.aclaratorias[
        path[path.length - 2]
      ].aclaratorias.filter((_, i) => i !== path[path.length - 1]);
    }
    setHistoriaFormulario(newH);
  };
  const handleAclaratoriaHistoriaChange = (path, field, value) => {
    const newH = { ...historiaFormulario };
    let cur = newH;
    for (let i = 0; i < path.length - 1; i++) cur = cur.aclaratorias[path[i]];
    cur.aclaratorias[path[path.length - 1]][field] = value;
    setHistoriaFormulario(newH);
  };

  // ============================================
  // ACLARATORIAS DECLARATORIA
  // ============================================
  const handleAgregarAclaratoriaDeclaratoria = (path = []) => {
    const nueva = {
      id: Date.now(),
      fechaOtorgamiento: "",
      numeroNotaria: "",
      cantonNotaria: "",
      notario: "",
      fechaInscripcion: "",
      cantonInscripcion: "",
      aclaratorias: [],
    };
    const newD = { ...declaratoriaFormulario };
    if (path.length === 0) {
      newD.aclaratorias = [...newD.aclaratorias, nueva];
    } else {
      let cur = newD;
      for (let i = 0; i < path.length - 1; i++) cur = cur.aclaratorias[path[i]];
      cur.aclaratorias[path[path.length - 1]].aclaratorias.push(nueva);
    }
    setDeclaratoriaFormulario(newD);
  };
  const handleEliminarAclaratoriaDeclaratoria = (path) => {
    const newD = { ...declaratoriaFormulario };
    if (path.length === 1) {
      newD.aclaratorias = newD.aclaratorias.filter((_, i) => i !== path[0]);
    } else {
      let cur = newD;
      for (let i = 0; i < path.length - 2; i++) cur = cur.aclaratorias[path[i]];
      cur.aclaratorias[path[path.length - 2]].aclaratorias = cur.aclaratorias[
        path[path.length - 2]
      ].aclaratorias.filter((_, i) => i !== path[path.length - 1]);
    }
    setDeclaratoriaFormulario(newD);
  };
  const handleAclaratoriaDeclaratoriaChange = (path, field, value) => {
    const newD = { ...declaratoriaFormulario };
    let cur = newD;
    for (let i = 0; i < path.length - 1; i++) cur = cur.aclaratorias[path[i]];
    cur.aclaratorias[path[path.length - 1]][field] = value;
    setDeclaratoriaFormulario(newD);
  };

  // ============================================
  // PRECIO Y FORMA DE PAGO — idéntico a compraventa
  // ============================================
  const calcularSaldoRestante = () => {
    const total = parseFloat(precioTotal) || 0;
    const sumaPagos = partesPago.reduce(
      (sum, parte) => sum + (parseFloat(parte.monto) || 0),
      0,
    );
    return total - sumaPagos;
  };
  const handleAgregarPartePago = () => {
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    setPartesPago([
      ...partesPago,
      {
        id: Date.now(),
        letra: letras[partesPago.length] || `${partesPago.length + 1}`,
        monto: "",
        tipoPago: "unico",
        medioPago: "",
        tipoCheque: "",
        momentoPago: "",
        momentoOtro: "",
        esCreditoBancario: false,
        nombreBanco: "",
        cuentaDestino: "",
        numeroCuotas: "",
        valorCuota: 0,
        periodicidad: "",
        periodicidadOtra: "",
        tieneDetalle: false,
        detalle: {
          bancoOrigen: "",
          cuentaOrigen: "",
          tipoCuentaOrigen: "",
          bancoDestino: "",
          cuentaDestino: "",
          tipoCuentaDestino: "",
        },
      },
    ]);
  };
  const handleEliminarPartePago = (id) => {
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const nuevas = partesPago.filter((p) => p.id !== id);
    nuevas.forEach((parte, index) => {
      parte.letra = letras[index] || `${index + 1}`;
    });
    setPartesPago(nuevas);
  };
  const handlePartePagoChange = (id, field, value) => {
    setPartesPago(
      partesPago.map((parte) => {
        if (parte.id !== id) return parte;
        const updated = { ...parte, [field]: value };
        if (
          (field === "monto" || field === "numeroCuotas") &&
          updated.tipoPago === "cuotas" &&
          updated.monto &&
          updated.numeroCuotas
        )
          updated.valorCuota =
            parseFloat(updated.monto) / parseInt(updated.numeroCuotas);
        if (field === "tipoPago" && value === "unico") {
          updated.numeroCuotas = "";
          updated.valorCuota = 0;
          updated.periodicidad = "";
          updated.periodicidadOtra = "";
        }
        if (field === "medioPago" && value !== "cheque")
          updated.tipoCheque = "";
        if (field === "momentoPago" && value !== "otro")
          updated.momentoOtro = "";
        if (field === "esCreditoBancario" && !value) {
          updated.nombreBanco = "";
          updated.cuentaDestino = "";
        }
        return updated;
      }),
    );
  };
  const handleDetallePartePagoChange = (id, field, value) => {
    setPartesPago(
      partesPago.map((p) =>
        p.id === id ? { ...p, detalle: { ...p.detalle, [field]: value } } : p,
      ),
    );
  };

  // ============================================
  // ACLARATORIA HISTORIA — componente recursivo
  // ============================================
  const AclaratoriaHistoriaItem = ({ aclaratoria, path, nivel = 0 }) => (
    <div
      className={`border-l-2 border-primary-300 pl-4 ${nivel > 0 ? "mt-4" : ""}`}
    >
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="font-medium text-gray-900">
            Aclaratoria {path.map((i) => i + 1).join(".")}
          </h5>
          <button
            onClick={() => handleEliminarAclaratoriaHistoria(path)}
            className="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            Eliminar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de Adquisición
            </label>
            <select
              value={aclaratoria.titulo}
              onChange={(e) =>
                handleAclaratoriaHistoriaChange(path, "titulo", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccione el título</option>
              <option value="compraventa">Compraventa</option>
              <option value="donacion">Donación</option>
              <option value="sucesion">Sucesión a Causa de Muerte</option>
              <option value="permuta">Permuta</option>
              <option value="particion">Partición y Adjudicación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          {aclaratoria.titulo === "otro" && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especifique el título
              </label>
              <input
                type="text"
                value={aclaratoria.tituloOtro}
                onChange={(e) =>
                  handleAclaratoriaHistoriaChange(
                    path,
                    "tituloOtro",
                    e.target.value,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Ej: Adjudicación judicial"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adquirido de
            </label>
            <input
              type="text"
              value={aclaratoria.adquiridoDe}
              onChange={(e) =>
                handleAclaratoriaHistoriaChange(
                  path,
                  "adquiridoDe",
                  e.target.value.toUpperCase(),
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Otorgamiento
            </label>
            <input
              type="date"
              value={aclaratoria.fechaOtorgamiento}
              onChange={(e) =>
                handleAclaratoriaHistoriaChange(
                  path,
                  "fechaOtorgamiento",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Notaría
            </label>
            <input
              type="text"
              value={aclaratoria.numeroNotaria}
              onChange={(e) =>
                handleAclaratoriaHistoriaChange(
                  path,
                  "numeroNotaria",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: primera, 14, 22"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantón de la Notaría
            </label>
            <input
              type="text"
              value={aclaratoria.cantonNotaria}
              onChange={(e) =>
                handleAclaratoriaHistoriaChange(
                  path,
                  "cantonNotaria",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Quito"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notario/Notaria
            </label>
            <input
              type="text"
              value={aclaratoria.notario}
              onChange={(e) =>
                handleAclaratoriaHistoriaChange(
                  path,
                  "notario",
                  e.target.value.toUpperCase(),
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Inscripción
            </label>
            <input
              type="date"
              value={aclaratoria.fechaInscripcion}
              onChange={(e) =>
                handleAclaratoriaHistoriaChange(
                  path,
                  "fechaInscripcion",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantón de Inscripción
            </label>
            <input
              type="text"
              value={aclaratoria.cantonInscripcion}
              onChange={(e) =>
                handleAclaratoriaHistoriaChange(
                  path,
                  "cantonInscripcion",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Quito"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si es igual al cantón de la notaría, se mostrará "del mismo
              cantón"
            </p>
          </div>
        </div>
        {aclaratoria.aclaratorias?.length > 0 && (
          <div className="space-y-2">
            {aclaratoria.aclaratorias.map((sub, index) => (
              <AclaratoriaHistoriaItem
                key={sub.id}
                aclaratoria={sub}
                path={[...path, index]}
                nivel={nivel + 1}
              />
            ))}
          </div>
        )}
        <button
          onClick={() =>
            handleAgregarAclaratoriaHistoria([...path, path[path.length - 1]])
          }
          className="text-sm px-3 py-2 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
        >
          + Agregar aclaratoria a esta entrada
        </button>
      </div>
    </div>
  );

  // ============================================
  // ACLARATORIA DECLARATORIA — componente recursivo
  // ============================================
  const AclaratoriaDeclaratoriaItem = ({ aclaratoria, path, nivel = 0 }) => (
    <div
      className={`border-l-2 border-primary-300 pl-4 ${nivel > 0 ? "mt-4" : ""}`}
    >
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="font-medium text-gray-900">
            Aclaratoria {path.map((i) => i + 1).join(".")}
          </h5>
          <button
            onClick={() => handleEliminarAclaratoriaDeclaratoria(path)}
            className="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            Eliminar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Otorgamiento
            </label>
            <input
              type="date"
              value={aclaratoria.fechaOtorgamiento}
              onChange={(e) =>
                handleAclaratoriaDeclaratoriaChange(
                  path,
                  "fechaOtorgamiento",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Notaría
            </label>
            <input
              type="text"
              value={aclaratoria.numeroNotaria}
              onChange={(e) =>
                handleAclaratoriaDeclaratoriaChange(
                  path,
                  "numeroNotaria",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: primera, 14, 22"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantón de la Notaría
            </label>
            <input
              type="text"
              value={aclaratoria.cantonNotaria}
              onChange={(e) =>
                handleAclaratoriaDeclaratoriaChange(
                  path,
                  "cantonNotaria",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Quito"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notario/Notaria
            </label>
            <input
              type="text"
              value={aclaratoria.notario}
              onChange={(e) =>
                handleAclaratoriaDeclaratoriaChange(
                  path,
                  "notario",
                  e.target.value.toUpperCase(),
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Inscripción
            </label>
            <input
              type="date"
              value={aclaratoria.fechaInscripcion}
              onChange={(e) =>
                handleAclaratoriaDeclaratoriaChange(
                  path,
                  "fechaInscripcion",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantón de Inscripción
            </label>
            <input
              type="text"
              value={aclaratoria.cantonInscripcion}
              onChange={(e) =>
                handleAclaratoriaDeclaratoriaChange(
                  path,
                  "cantonInscripcion",
                  e.target.value,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Ej: Quito"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si es igual al cantón de la notaría, se mostrará "del mismo
              cantón"
            </p>
          </div>
        </div>
        {aclaratoria.aclaratorias?.length > 0 && (
          <div className="space-y-2">
            {aclaratoria.aclaratorias.map((sub, index) => (
              <AclaratoriaDeclaratoriaItem
                key={sub.id}
                aclaratoria={sub}
                path={[...path, index]}
                nivel={nivel + 1}
              />
            ))}
          </div>
        )}
        <button
          onClick={() =>
            handleAgregarAclaratoriaDeclaratoria([
              ...path,
              path[path.length - 1],
            ])
          }
          className="text-sm px-3 py-2 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
        >
          + Agregar aclaratoria a esta entrada
        </button>
      </div>
    </div>
  );

  // ============================================
  // GENERAR
  // ============================================
  const handleGenerarPromesa = async () => {
    if (vendedores.length === 0 || compradores.length === 0) {
      toast.error("Debe agregar al menos un vendedor y un comprador");
      return;
    }
    if (!tipoPropiedad) {
      toast.error("Debe seleccionar un tipo de propiedad");
      return;
    }
    if (tipoPropiedad === "horizontal" && predios.length === 0) {
      toast.error("Debe agregar al menos un predio");
      return;
    }
    if (!abogado.nombre || !abogado.numeroMatricula) {
      toast.error("Debe completar los datos del abogado");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        tipoContrato: "promesa_compraventa",
        vendedores: vendedores.filter(Boolean),
        compradores: compradores.filter(Boolean),
        tipoPropiedad,
        nombreConjunto: tipoPropiedad === "horizontal" ? nombreConjunto : null,
        predios: tipoPropiedad === "horizontal" ? predios : null,
        bienComun:
          tipoPropiedad === "comun"
            ? {
                tipoBienComun: ubicacion.tipoBienComun,
                tipoBienComunOtro: ubicacion.tipoBienComunOtro,
                superficieBienComun: ubicacion.superficieBienComun,
                numeroPredio: ubicacion.numeroPredio,
                descripcionBienComun: ubicacion.descripcionBienComun,
              }
            : null,
        ubicacion: {
          lote: ubicacion.lote,
          numero: ubicacion.numero,
          parroquia: ubicacion.parroquia,
          canton: ubicacion.canton,
          provincia: ubicacion.provincia,
        },
        historiaManual,
        historiaFormulario,
        hayDeclaratoria:
          tipoPropiedad === "horizontal" ? hayDeclaratoria : null,
        declaratoriaManual:
          tipoPropiedad === "horizontal" && hayDeclaratoria
            ? declaratoriaManual
            : null,
        declaratoriaFormulario:
          tipoPropiedad === "horizontal" && hayDeclaratoria
            ? declaratoriaFormulario
            : null,
        linderosGenerales,
        tieneLInderosEspecificos:
          tipoPropiedad === "horizontal" ? tieneLInderosEspecificos : false,
        linderosEspecificos:
          tipoPropiedad === "horizontal" && tieneLInderosEspecificos
            ? linderosEspecificos
            : null,
        modoPrecio,
        precioTotal,
        partesPago: modoPrecio === "formulario" ? partesPago : null,
        precioManual: modoPrecio === "manual" ? precioManual : null,
        plazo,
        clausulaPenal,
        hayCondicionResolutoria,
        propiedadIntelectual:
          hayCondicionResolutoria === true ? propiedadIntelectual : null,
        abogado,
      };
      const response = await apiFetch(API_CONFIG.ENDPOINTS.GENERATE_PROMESA, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await descargarRespuesta(response, "promesa_compraventa.docx");
        toast.success("Promesa generada exitosamente");
      } else {
        const data = await response.json();
        toast.error(data.detail || "Error al generar promesa");
      }
    } catch (error) {
      toast.error("Error al generar promesa: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Generar Promesa de Compraventa
            </h1>
            <p className="text-gray-600 mt-1">
              Complete los datos para generar la promesa
            </p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Cargar borrador
          </p>
          <BuscadorPlantillas
            tipoDocumento="minuta"
            tipoContrato="promesa_compraventa"
            onCargar={handleCargarPlantilla}
          />
          {borrador && (
            <p className="text-sm text-amber-900 mt-3">
              Editando el borrador{" "}
              <span className="font-mono font-semibold">{borrador.codigo}</span>{" "}
              · {borrador.nombre}
            </p>
          )}
          <p className="text-xs text-amber-600 mt-2">
            Busca por código, nombre del borrador, vendedor o cédula.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* VENDEDORES */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Promitentes Vendedores
            </h2>
            <Button variant="outline" size="sm" onClick={handleAgregarVendedor}>
              + Agregar Vendedor
            </Button>
          </div>
          {vendedores.length === 0 && (
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600">
                No hay vendedores. Click en "Agregar Vendedor".
              </p>
            </div>
          )}
          {vendedores.map((v, index) => (
            <div key={index} className="relative">
              <ComparecienteInline
                key={`v-${plantillaKey}-${index}`}
                title={`Promitente Vendedor ${index + 1}`}
                initialData={v || null}
                onComparecienteReady={(data) =>
                  handleVendedorReady(index, data)
                }
              />
              {vendedores.length > 1 && (
                <button
                  onClick={() => handleEliminarVendedor(index)}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>

        {/* COMPRADORES */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Promitentes Compradores
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAgregarComprador}
            >
              + Agregar Comprador
            </Button>
          </div>
          {compradores.length === 0 && (
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600">
                No hay compradores. Click en "Agregar Comprador".
              </p>
            </div>
          )}
          {compradores.map((c, index) => (
            <div key={index} className="relative">
              <ComparecienteInline
                key={`c-${plantillaKey}-${index}`}
                title={`Promitente Comprador ${index + 1}`}
                initialData={c || null}
                onComparecienteReady={(data) =>
                  handleCompradorReady(index, data)
                }
              />
              {compradores.length > 1 && (
                <button
                  onClick={() => handleEliminarComprador(index)}
                  className="absolute top-4 right-4 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ANTECEDENTES */}
        <div className="border-t-4 border-primary-500 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ANTECEDENTES
          </h2>
        </div>

        <Card title="Tipo de Propiedad">
          <select
            value={tipoPropiedad}
            onChange={(e) => {
              setTipoPropiedad(e.target.value);
              setNombreConjunto("");
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Seleccione tipo de propiedad</option>
            <option value="horizontal">Propiedad Horizontal</option>
            <option value="comun">Propiedad Común</option>
          </select>
        </Card>

        {tipoPropiedad === "horizontal" && (
          <Card title="Nombre del Conjunto/Edificio">
            <input
              type="text"
              value={nombreConjunto}
              onChange={(e) => setNombreConjunto(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
              placeholder="EJ: EDIFICIO MONTICELLO"
            />
          </Card>
        )}

        {/* BIENES A INCLUIR (PREDIOS) — igual que compraventa + estaContruido */}
        {tipoPropiedad === "horizontal" && (
          <Card title="Bienes a Incluir (Predios)">
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-700">
                  ¿Qué tipo de predio desea agregar?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAgregarPredio(false)}
                    className="flex-1 p-4 border-2 border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                  >
                    <div className="font-semibold text-blue-900 mb-1">
                      Predio Simple
                    </div>
                    <div className="text-xs text-blue-700">
                      Un solo inmueble independiente (ej: Parqueadero, Bodega)
                    </div>
                  </button>
                  <button
                    onClick={() => handleAgregarPredio(true)}
                    className="flex-1 p-4 border-2 border-purple-300 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    <div className="font-semibold text-purple-900 mb-1">
                      Predio Compuesto
                    </div>
                    <div className="text-xs text-purple-700">
                      Múltiples inmuebles relacionados (ej: Departamento con
                      porche, terraza, jardines)
                    </div>
                  </button>
                </div>
              </div>

              {predios.length === 0 && (
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-gray-600">
                    No hay predios agregados. Seleccione el tipo de predio
                    arriba.
                  </p>
                </div>
              )}

              {predios.map((predio, predioIndex) => (
                <div
                  key={predio.id}
                  className={`border-2 rounded-lg p-6 ${predio.esCompuesto ? "border-purple-300 bg-purple-50" : "border-blue-300 bg-blue-50"}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <h3
                        className={`text-lg font-bold ${predio.esCompuesto ? "text-purple-900" : "text-blue-900"}`}
                      >
                        PREDIO {predioIndex + 1}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${predio.esCompuesto ? "bg-purple-200 text-purple-800" : "bg-blue-200 text-blue-800"}`}
                      >
                        {predio.esCompuesto ? "Compuesto" : "Simple"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEliminarPredio(predio.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Eliminar Predio
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Predio
                      </label>
                      <select
                        value={predio.tipo}
                        onChange={(e) =>
                          handlePredioChange(predio.id, "tipo", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                      >
                        <option value="">Seleccione tipo</option>
                        {tiposPredios.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </div>
                    {predio.tipo === "Otro" && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Especifique el tipo
                        </label>
                        <input
                          type="text"
                          value={predio.tipoOtro}
                          onChange={(e) =>
                            handlePredioChange(
                              predio.id,
                              "tipoOtro",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Local comercial"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={predio.numero}
                        onChange={(e) =>
                          handlePredioChange(
                            predio.id,
                            "numero",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: 2"
                      />
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-300 pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {predio.esCompuesto
                        ? "Inmuebles del Predio"
                        : "Datos del Inmueble"}
                    </h4>
                    <div className="space-y-3">
                      {predio.inmuebles.map((inmueble, inmuebleIndex) => (
                        <div
                          key={inmueble.id}
                          className="border border-gray-300 rounded-lg p-4 bg-white"
                        >
                          {predio.esCompuesto && (
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-semibold text-gray-700">
                                Inmueble {inmuebleIndex + 1}
                              </span>
                              {predio.inmuebles.length > 1 && (
                                <button
                                  onClick={() =>
                                    handleEliminarInmueble(
                                      predio.id,
                                      inmueble.id,
                                    )
                                  }
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          )}

                          {/* ¿Ya está construido? — exclusivo de promesa */}
                          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ¿El inmueble ya está construido?
                            </label>
                            <div className="flex gap-3">
                              <button
                                onClick={() =>
                                  handleInmuebleChange(
                                    predio.id,
                                    inmueble.id,
                                    "estaContruido",
                                    true,
                                  )
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${inmueble.estaContruido === true ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                              >
                                Sí, ya construido
                              </button>
                              <button
                                onClick={() =>
                                  handleInmuebleChange(
                                    predio.id,
                                    inmueble.id,
                                    "estaContruido",
                                    false,
                                  )
                                }
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${inmueble.estaContruido === false ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                              >
                                No, en construcción
                              </button>
                            </div>
                          </div>

                          {inmueble.estaContruido !== null && (
                            <div className="grid grid-cols-2 gap-3">
                              {predio.esCompuesto && (
                                <>
                                  <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Tipo de Inmueble
                                    </label>
                                    <select
                                      value={inmueble.tipo}
                                      onChange={(e) =>
                                        handleInmuebleChange(
                                          predio.id,
                                          inmueble.id,
                                          "tipo",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                    >
                                      <option value="">Seleccione tipo</option>
                                      {tiposInmuebles.map((tipo) => (
                                        <option key={tipo} value={tipo}>
                                          {tipo}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  {inmueble.tipo === "Otro" && (
                                    <div className="col-span-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Especifique el tipo
                                      </label>
                                      <input
                                        type="text"
                                        value={inmueble.tipoOtro}
                                        onChange={(e) =>
                                          handleInmuebleChange(
                                            predio.id,
                                            inmueble.id,
                                            "tipoOtro",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        placeholder="Ej: Balcón"
                                      />
                                    </div>
                                  )}

                                  {/* Número propio del inmueble */}
                                  <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Número del Inmueble
                                      <span className="text-gray-400 font-normal ml-1">
                                        (si es diferente al número del predio)
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      value={inmueble.numero}
                                      onChange={(e) =>
                                        handleInmuebleChange(
                                          predio.id,
                                          inmueble.id,
                                          "numero",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                      placeholder={`Ej: ${predio.numero || "2b"} (dejar vacío para usar el número del predio)`}
                                    />
                                  </div>
                                </>
                              )}

                              {/* Si ya construido: nivel + áreas + alícuota */}
                              {inmueble.estaContruido === true && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Nivel{" "}
                                      <span className="text-gray-400 font-normal">
                                        (opcional)
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      value={inmueble.nivel}
                                      onChange={(e) =>
                                        handleInmuebleChange(
                                          predio.id,
                                          inmueble.id,
                                          "nivel",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      placeholder="Ej: N+3.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Área Cubierta (m²){" "}
                                      <span className="text-gray-400 font-normal">
                                        (opcional)
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={inmueble.areaCubierta}
                                      onChange={(e) =>
                                        handleInmuebleChange(
                                          predio.id,
                                          inmueble.id,
                                          "areaCubierta",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        const num = parseFloat(e.target.value);
                                        if (!isNaN(num))
                                          handleInmuebleChange(
                                            predio.id,
                                            inmueble.id,
                                            "areaCubierta",
                                            num.toFixed(2),
                                          );
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      placeholder="Ej: 217.49"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Se guardará con 2 decimales (.00)
                                    </p>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Área Descubierta (m²){" "}
                                      <span className="text-gray-400 font-normal">
                                        (opcional)
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={inmueble.areaDescubierta}
                                      onChange={(e) =>
                                        handleInmuebleChange(
                                          predio.id,
                                          inmueble.id,
                                          "areaDescubierta",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        const num = parseFloat(e.target.value);
                                        if (!isNaN(num))
                                          handleInmuebleChange(
                                            predio.id,
                                            inmueble.id,
                                            "areaDescubierta",
                                            num.toFixed(2),
                                          );
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      placeholder="Ej: 166.04"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Se guardará con 2 decimales (.00)
                                    </p>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Alícuota Parcial (%)
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={inmueble.alicuotaParcial}
                                      onChange={(e) =>
                                        handleInmuebleChange(
                                          predio.id,
                                          inmueble.id,
                                          "alicuotaParcial",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        const num = parseFloat(e.target.value);
                                        if (!isNaN(num))
                                          handleInmuebleChange(
                                            predio.id,
                                            inmueble.id,
                                            "alicuotaParcial",
                                            parseFloat(
                                              num.toPrecision(12),
                                            ).toString(),
                                          );
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      placeholder="Ej: 11.4013256789"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Los decimales necesarios
                                    </p>
                                  </div>
                                </>
                              )}

                              {/* Si en construcción: solo áreas */}
                              {inmueble.estaContruido === false && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Área Cubierta (m²){" "}
                                      <span className="text-gray-400 font-normal">
                                        (opcional)
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={inmueble.areaCubierta}
                                      onChange={(e) =>
                                        handleInmuebleChange(
                                          predio.id,
                                          inmueble.id,
                                          "areaCubierta",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        const num = parseFloat(e.target.value);
                                        if (!isNaN(num))
                                          handleInmuebleChange(
                                            predio.id,
                                            inmueble.id,
                                            "areaCubierta",
                                            num.toFixed(2),
                                          );
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      placeholder="Ej: 217.49"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Se guardará con 2 decimales (.00)
                                    </p>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Área Descubierta (m²){" "}
                                      <span className="text-gray-400 font-normal">
                                        (opcional)
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={inmueble.areaDescubierta}
                                      onChange={(e) =>
                                        handleInmuebleChange(
                                          predio.id,
                                          inmueble.id,
                                          "areaDescubierta",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={(e) => {
                                        const num = parseFloat(e.target.value);
                                        if (!isNaN(num))
                                          handleInmuebleChange(
                                            predio.id,
                                            inmueble.id,
                                            "areaDescubierta",
                                            num.toFixed(2),
                                          );
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      placeholder="Ej: 166.04"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Se guardará con 2 decimales (.00)
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {predio.esCompuesto && (
                      <button
                        onClick={() => handleAgregarInmueble(predio.id)}
                        className="mt-3 w-full text-sm px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        + Agregar Inmueble
                      </button>
                    )}

                    {/* Alícuota total — solo si hay inmuebles construidos */}
                    {predio.inmuebles.some((i) => i.estaContruido === true) && (
                      <div className="mt-4 space-y-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-green-900">
                              Alícuota Total Calculada:
                            </span>
                            <span className="text-lg font-bold text-green-700">
                              {predio.alicuotaTotal.toFixed(10)}%
                            </span>
                          </div>
                        </div>
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <label className="flex items-center gap-2 mb-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={predio.usarAlicuotaManual}
                              onChange={(e) =>
                                handlePredioChange(
                                  predio.id,
                                  "usarAlicuotaManual",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                            />
                            <span className="text-sm font-medium text-yellow-900">
                              Usar alícuota total diferente (según Registro de
                              la Propiedad)
                            </span>
                          </label>
                          {predio.usarAlicuotaManual && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alícuota Total Manual (%)
                              </label>
                              <input
                                type="number"
                                step="0.0000000001"
                                value={predio.alicuotaTotalManual}
                                onChange={(e) =>
                                  handlePredioChange(
                                    predio.id,
                                    "alicuotaTotalManual",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="Ej: 31.2217256789"
                              />
                              <p className="text-xs text-yellow-700 mt-1">
                                Los decimales necesarios. Use este valor si
                                difiere del calculado automáticamente
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* BIENES PROPIEDAD COMÚN */}
        {tipoPropiedad === "comun" && (
          <Card title="Descripción del Bien (Propiedad Común)">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Bien
                </label>
                <select
                  value={ubicacion.tipoBienComun || ""}
                  onChange={(e) =>
                    setUbicacion({
                      ...ubicacion,
                      tipoBienComun: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccione el tipo de bien</option>
                  <option value="casa">Casa</option>
                  <option value="terreno">Terreno</option>
                  <option value="solares">Solares</option>
                  <option value="fincas">Fincas</option>
                  <option value="haciendas">Haciendas</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              {ubicacion.tipoBienComun === "otro" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especifique el tipo de bien
                  </label>
                  <input
                    type="text"
                    value={ubicacion.tipoBienComunOtro || ""}
                    onChange={(e) =>
                      setUbicacion({
                        ...ubicacion,
                        tipoBienComunOtro: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: Quinta"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Superficie Total (m²)
                  </label>
                  <input
                    type="text"
                    value={ubicacion.superficieBienComun || ""}
                    onChange={(e) =>
                      setUbicacion({
                        ...ubicacion,
                        superficieBienComun: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: 1000.44"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Predio (opcional)
                  </label>
                  <input
                    type="text"
                    value={ubicacion.numeroPredio || ""}
                    onChange={(e) =>
                      setUbicacion({
                        ...ubicacion,
                        numeroPredio: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: 123"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción Adicional (opcional)
                </label>
                <textarea
                  value={ubicacion.descripcionBienComun || ""}
                  onChange={(e) =>
                    setUbicacion({
                      ...ubicacion,
                      descripcionBienComun: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                  rows="3"
                  placeholder="Ej: Casa de dos plantas con jardín frontal y posterior..."
                />
              </div>
            </div>
          </Card>
        )}

        {/* CONSTRUIDO EN — igual que compraventa */}
        {tipoPropiedad && (
          <>
            <div className="border-t-2 border-gray-300 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                CONSTRUIDO EN
              </h3>
            </div>
            <Card>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inmueble
                  </label>
                  <input
                    type="text"
                    value={ubicacion.lote}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, lote: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Lote de terreno"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={ubicacion.numero}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, numero: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parroquia
                  </label>
                  <input
                    type="text"
                    value={ubicacion.parroquia}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, parroquia: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Nayón"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantón
                  </label>
                  <input
                    type="text"
                    value={ubicacion.canton}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, canton: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Quito"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={ubicacion.provincia}
                    onChange={(e) =>
                      setUbicacion({ ...ubicacion, provincia: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ej: Pichincha"
                  />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* HISTORIA DE DOMINIO — copia exacta de compraventa */}
        {tipoPropiedad && (
          <SeccionFormularioRedactar
            titulo="HISTORIA DE DOMINIO"
            onTextoManualChange={setHistoriaManual}
            placeholderTexto="Escriba aquí la historia de dominio del inmueble..."
            renderFormulario={() => (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título de Adquisición
                    </label>
                    <select
                      value={historiaFormulario.titulo}
                      onChange={(e) =>
                        setHistoriaFormulario({
                          ...historiaFormulario,
                          titulo: e.target.value,
                          tituloOtro:
                            e.target.value === "otro"
                              ? historiaFormulario.tituloOtro
                              : "",
                          nombreCausante:
                            e.target.value === "sucesion"
                              ? historiaFormulario.nombreCausante
                              : "",
                          causanteAdquiridoDe:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteAdquiridoDe
                              : "",
                          causanteTitulo:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteTitulo
                              : "",
                          causanteTituloOtro:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteTituloOtro
                              : "",
                          causanteFechaOtorgamiento:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteFechaOtorgamiento
                              : "",
                          causanteNumeroNotaria:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteNumeroNotaria
                              : "",
                          causanteCantonNotaria:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteCantonNotaria
                              : "",
                          causanteNotario:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteNotario
                              : "",
                          causanteFechaInscripcion:
                            e.target.value === "sucesion"
                              ? historiaFormulario.causanteFechaInscripcion
                              : "",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccione el título</option>
                      <option value="compraventa">Compraventa</option>
                      <option value="donacion">Donación</option>
                      <option value="sucesion">
                        Sucesión a Causa de Muerte
                      </option>
                      <option value="permuta">Permuta</option>
                      <option value="particion">
                        Partición y Adjudicación
                      </option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  {historiaFormulario.titulo === "otro" && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Especifique el título
                      </label>
                      <input
                        type="text"
                        value={historiaFormulario.tituloOtro}
                        onChange={(e) =>
                          setHistoriaFormulario({
                            ...historiaFormulario,
                            tituloOtro: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: Adjudicación judicial"
                      />
                    </div>
                  )}
                  {historiaFormulario.titulo === "sucesion" && (
                    <div className="col-span-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Sucesión
                          </label>
                          <select
                            value={historiaFormulario.tipoSucesion}
                            onChange={(e) =>
                              setHistoriaFormulario({
                                ...historiaFormulario,
                                tipoSucesion: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">
                              Seleccione tipo de sucesión
                            </option>
                            <option value="testamento">Testamento</option>
                            <option value="posesion_efectiva">
                              Posesión Efectiva
                            </option>
                          </select>
                        </div>
                        <h4 className="font-semibold text-blue-900 pt-3 border-t border-blue-300">
                          Datos del Causante
                        </h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre completo del Causante (de quien heredaron)
                          </label>
                          <input
                            type="text"
                            value={historiaFormulario.nombreCausante}
                            onChange={(e) =>
                              setHistoriaFormulario({
                                ...historiaFormulario,
                                nombreCausante: e.target.value.toUpperCase(),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                            placeholder="Ej: JUAN CARLOS PÉREZ LÓPEZ"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {historiaFormulario.titulo &&
                    historiaFormulario.titulo !== "sucesion" && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adquirido de
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.adquiridoDe}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              adquiridoDe: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                          placeholder="Ej: los cónyuges CECILIA IZURIETA y HUGO HURTADO"
                        />
                      </div>
                    )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Otorgamiento
                    </label>
                    <input
                      type="date"
                      value={historiaFormulario.fechaOtorgamiento}
                      onChange={(e) =>
                        setHistoriaFormulario({
                          ...historiaFormulario,
                          fechaOtorgamiento: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Notaría
                    </label>
                    <input
                      type="text"
                      value={historiaFormulario.numeroNotaria}
                      onChange={(e) =>
                        setHistoriaFormulario({
                          ...historiaFormulario,
                          numeroNotaria: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: primera, 14, 22"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se convertirá automáticamente (14 → Décimo Cuarta)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantón de la Notaría
                    </label>
                    <input
                      type="text"
                      value={historiaFormulario.cantonNotaria}
                      onChange={(e) =>
                        setHistoriaFormulario({
                          ...historiaFormulario,
                          cantonNotaria: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Quito"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notario/Notaria
                    </label>
                    <input
                      type="text"
                      value={historiaFormulario.notario}
                      onChange={(e) =>
                        setHistoriaFormulario({
                          ...historiaFormulario,
                          notario: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                      placeholder="Ej: ALEX DAVID MEJÍA VITERI"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Inscripción
                    </label>
                    <input
                      type="date"
                      value={historiaFormulario.fechaInscripcion}
                      onChange={(e) =>
                        setHistoriaFormulario({
                          ...historiaFormulario,
                          fechaInscripcion: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantón de Inscripción
                    </label>
                    <input
                      type="text"
                      value={historiaFormulario.cantonInscripcion}
                      onChange={(e) =>
                        setHistoriaFormulario({
                          ...historiaFormulario,
                          cantonInscripcion: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Quito"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si es igual al cantón de la notaría, se mostrará "del
                      mismo cantón"
                    </p>
                  </div>
                </div>

                {historiaFormulario.titulo === "sucesion" && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <h4 className="font-semibold text-amber-900 mb-3">
                      Adquisición del Causante
                    </h4>
                    <p className="text-sm text-amber-700 mb-4">
                      Datos de cómo el causante adquirió originalmente el
                      inmueble
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          El causante lo adquirió de
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteAdquiridoDe}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteAdquiridoDe: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                          placeholder="Ej: los señores MARÍA LÓPEZ y PEDRO SÁNCHEZ"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Título de Adquisición del Causante
                        </label>
                        <select
                          value={historiaFormulario.causanteTitulo}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteTitulo: e.target.value,
                              causanteTituloOtro:
                                e.target.value === "otro"
                                  ? historiaFormulario.causanteTituloOtro
                                  : "",
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Seleccione el título</option>
                          <option value="compraventa">Compraventa</option>
                          <option value="donacion">Donación</option>
                          <option value="permuta">Permuta</option>
                          <option value="particion">
                            Partición y Adjudicación
                          </option>
                          <option value="otro">Otro</option>
                        </select>
                      </div>
                      {historiaFormulario.causanteTitulo === "otro" && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Especifique el título
                          </label>
                          <input
                            type="text"
                            value={historiaFormulario.causanteTituloOtro}
                            onChange={(e) =>
                              setHistoriaFormulario({
                                ...historiaFormulario,
                                causanteTituloOtro: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="Ej: Adjudicación judicial"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Otorgamiento
                        </label>
                        <input
                          type="date"
                          value={historiaFormulario.causanteFechaOtorgamiento}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteFechaOtorgamiento: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Notaría
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteNumeroNotaria}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteNumeroNotaria: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: primera, 14, 22"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Se convertirá automáticamente
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantón de la Notaría
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteCantonNotaria}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteCantonNotaria: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Quito"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notario/Notaria
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteNotario}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteNotario: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                          placeholder="Ej: ROBERTO DUEÑAS"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Inscripción
                        </label>
                        <input
                          type="date"
                          value={historiaFormulario.causanteFechaInscripcion}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteFechaInscripcion: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantón de Inscripción
                        </label>
                        <input
                          type="text"
                          value={historiaFormulario.causanteCantonInscripcion}
                          onChange={(e) =>
                            setHistoriaFormulario({
                              ...historiaFormulario,
                              causanteCantonInscripcion: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Quito"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Si es igual, se mostrará "del mismo cantón"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {historiaFormulario.aclaratorias.length > 0 && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <h4 className="font-medium text-gray-900">Aclaratorias</h4>
                    {historiaFormulario.aclaratorias.map(
                      (aclaratoria, index) => (
                        <AclaratoriaHistoriaItem
                          key={aclaratoria.id}
                          aclaratoria={aclaratoria}
                          path={[index]}
                        />
                      ),
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleAgregarAclaratoriaHistoria()}
                  className="w-full px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium"
                >
                  + Agregar Aclaratoria
                </button>
              </div>
            )}
          />
        )}

        {/* DECLARATORIA — pregunta primero, luego copia exacta de compraventa */}
        {tipoPropiedad === "horizontal" && (
          <>
            <div className="border-t-2 border-gray-300 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                DECLARATORIA DE PROPIEDAD HORIZONTAL
              </h3>
            </div>
            <Card>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿El inmueble tiene declaratoria de propiedad horizontal?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setHayDeclaratoria(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${hayDeclaratoria === true ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => setHayDeclaratoria(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${hayDeclaratoria === false ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      No
                    </button>
                  </div>
                </div>
                {hayDeclaratoria === false && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ℹ️ Se incluirá en la promesa el texto correspondiente a
                      inmueble sin declaratoria de propiedad horizontal.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {hayDeclaratoria === true && (
              <SeccionFormularioRedactar
                titulo="DECLARATORIA DE PROPIEDAD HORIZONTAL"
                onTextoManualChange={setDeclaratoriaManual}
                placeholderTexto="Escriba aquí la declaratoria de propiedad horizontal..."
                renderFormulario={() => (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Otorgamiento
                        </label>
                        <input
                          type="date"
                          value={declaratoriaFormulario.fechaOtorgamiento}
                          onChange={(e) =>
                            setDeclaratoriaFormulario({
                              ...declaratoriaFormulario,
                              fechaOtorgamiento: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Notaría
                        </label>
                        <input
                          type="text"
                          value={declaratoriaFormulario.numeroNotaria}
                          onChange={(e) =>
                            setDeclaratoriaFormulario({
                              ...declaratoriaFormulario,
                              numeroNotaria: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: primera, 14, 22"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Se convertirá automáticamente (22 → Vigésimo Segunda)
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantón de la Notaría
                        </label>
                        <input
                          type="text"
                          value={declaratoriaFormulario.cantonNotaria}
                          onChange={(e) =>
                            setDeclaratoriaFormulario({
                              ...declaratoriaFormulario,
                              cantonNotaria: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Quito"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notario/Notaria
                        </label>
                        <input
                          type="text"
                          value={declaratoriaFormulario.notario}
                          onChange={(e) =>
                            setDeclaratoriaFormulario({
                              ...declaratoriaFormulario,
                              notario: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                          placeholder="Ej: PAOLA ANDRADE TORRES"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Inscripción
                        </label>
                        <input
                          type="date"
                          value={declaratoriaFormulario.fechaInscripcion}
                          onChange={(e) =>
                            setDeclaratoriaFormulario({
                              ...declaratoriaFormulario,
                              fechaInscripcion: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantón de Inscripción
                        </label>
                        <input
                          type="text"
                          value={declaratoriaFormulario.cantonInscripcion}
                          onChange={(e) =>
                            setDeclaratoriaFormulario({
                              ...declaratoriaFormulario,
                              cantonInscripcion: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Ej: Quito"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Si es igual al cantón de la notaría, se mostrará "del
                          mismo cantón"
                        </p>
                      </div>
                    </div>
                    {declaratoriaFormulario.aclaratorias.length > 0 && (
                      <div className="border-t pt-4 mt-4 space-y-4">
                        <h4 className="font-medium text-gray-900">
                          Aclaratorias
                        </h4>
                        {declaratoriaFormulario.aclaratorias.map(
                          (aclaratoria, index) => (
                            <AclaratoriaDeclaratoriaItem
                              key={aclaratoria.id}
                              aclaratoria={aclaratoria}
                              path={[index]}
                            />
                          ),
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleAgregarAclaratoriaDeclaratoria()}
                      className="w-full px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium"
                    >
                      + Agregar Aclaratoria
                    </button>
                  </div>
                )}
              />
            )}
          </>
        )}

        {/* LINDEROS GENERALES */}
        {tipoPropiedad && (
          <>
            <div className="border-t-2 border-gray-300 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                LINDEROS GENERALES
              </h3>
            </div>
            <Card>
              <div className="space-y-6">
                {["norte", "sur", "este", "oeste"].map((dir) => {
                  const labels = {
                    norte: "Norte",
                    sur: "Sur",
                    este: "Este",
                    oeste: "Oeste",
                  };
                  return (
                    <div key={dir}>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {labels[dir]}
                        </label>
                        <button
                          onClick={() => handleAgregarLindero(dir)}
                          className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                        >
                          + Agregar lindero {labels[dir].toLowerCase()}
                        </button>
                      </div>
                      {linderosGenerales[dir].map((lindero, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-2 gap-4 mb-2"
                        >
                          <input
                            type="text"
                            value={lindero.metros}
                            onChange={(e) =>
                              handleLinderoChange(
                                dir,
                                index,
                                "metros",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="Metros (ej: 37.84)"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={lindero.colindancia}
                              onChange={(e) =>
                                handleLinderoChange(
                                  dir,
                                  index,
                                  "colindancia",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Colindancia"
                            />
                            {linderosGenerales[dir].length > 1 && (
                              <button
                                onClick={() =>
                                  handleEliminarLindero(dir, index)
                                }
                                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Superficie Total
                  </label>
                  <input
                    type="text"
                    value={linderosGenerales.superficie}
                    onChange={(e) =>
                      setLinderosGenerales({
                        ...linderosGenerales,
                        superficie: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: 1000.44"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    En metros cuadrados y decímetros cuadrados
                  </p>
                </div>
              </div>
            </Card>

            {tipoPropiedad === "horizontal" && (
              <Card title="Linderos Específicos (Opcional)">
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={tieneLInderosEspecificos}
                    onChange={(e) =>
                      setTieneLInderosEspecificos(e.target.checked)
                    }
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    ¿Los inmuebles tienen linderos específicos diferentes a los
                    generales?
                  </span>
                </label>
                {tieneLInderosEspecificos && (
                  <div className="space-y-6 border-t pt-4">
                    {["norte", "sur", "este", "oeste", "arriba", "abajo"].map(
                      (dir) => {
                        const labels = {
                          norte: "Norte",
                          sur: "Sur",
                          este: "Este",
                          oeste: "Oeste",
                          arriba: "Arriba",
                          abajo: "Abajo",
                        };
                        return (
                          <div key={dir}>
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                {labels[dir]}
                              </label>
                              <button
                                onClick={() => handleAgregarLindero(dir, true)}
                                className="text-sm px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                              >
                                + Agregar lindero {labels[dir].toLowerCase()}
                              </button>
                            </div>
                            {linderosEspecificos[dir].map((lindero, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-2 gap-4 mb-2"
                              >
                                <input
                                  type="text"
                                  value={lindero.metros}
                                  onChange={(e) =>
                                    handleLinderoChange(
                                      dir,
                                      index,
                                      "metros",
                                      e.target.value,
                                      true,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                  placeholder="Metros"
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={lindero.colindancia}
                                    onChange={(e) =>
                                      handleLinderoChange(
                                        dir,
                                        index,
                                        "colindancia",
                                        e.target.value,
                                        true,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Colindancia"
                                  />
                                  {linderosEspecificos[dir].length > 1 && (
                                    <button
                                      onClick={() =>
                                        handleEliminarLindero(dir, index, true)
                                      }
                                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-bold"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      },
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Superficie Total
                      </label>
                      <input
                        type="text"
                        value={linderosEspecificos.superficie}
                        onChange={(e) =>
                          setLinderosEspecificos({
                            ...linderosEspecificos,
                            superficie: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: 1000.44"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        En metros cuadrados y decímetros cuadrados
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {/* PRECIO Y FORMA DE PAGO — copia exacta de compraventa */}
        {tipoPropiedad && (
          <>
            <div className="border-t-4 border-primary-500 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  PRECIO Y FORMA DE PAGO
                </h2>
                <Button
                  variant={modoPrecio === "manual" ? "primary" : "outline"}
                  size="sm"
                  onClick={() =>
                    setModoPrecio(
                      modoPrecio === "formulario" ? "manual" : "formulario",
                    )
                  }
                >
                  {modoPrecio === "formulario"
                    ? "✏️ Redactar Manualmente"
                    : "📋 Usar Formulario"}
                </Button>
              </div>
            </div>

            {modoPrecio === "manual" ? (
              <Card>
                <p className="text-sm text-gray-600 mb-3">
                  Redacte manualmente la cláusula de precio y forma de pago:
                </p>
                <RichTextEditor
                  onChange={setPrecioManual}
                  placeholder="Escriba aquí la cláusula de precio y forma de pago..."
                  minHeight="16rem"
                />
              </Card>
            ) : (
              <>
                <Card title="Precio Total">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-700">$</span>
                    <input
                      type="number"
                      value={precioTotal}
                      onChange={(e) => setPrecioTotal(e.target.value)}
                      className="flex-1 text-2xl font-bold px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="340000"
                      step="0.01"
                    />
                    <span className="text-lg text-gray-600">USD</span>
                  </div>
                </Card>

                <Card title="Forma de Pago">
                  <div className="space-y-6">
                    {partesPago.map((parte) => (
                      <div
                        key={parte.id}
                        className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-gray-900">
                            Parte {parte.letra})
                          </h3>
                          {partesPago.length > 1 && (
                            <button
                              onClick={() => handleEliminarPartePago(parte.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Monto de esta parte
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-gray-700">
                                $
                              </span>
                              <input
                                type="number"
                                value={parte.monto}
                                onChange={(e) =>
                                  handlePartePagoChange(
                                    parte.id,
                                    "monto",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="70000"
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tipo de Pago
                            </label>
                            <select
                              value={parte.tipoPago}
                              onChange={(e) =>
                                handlePartePagoChange(
                                  parte.id,
                                  "tipoPago",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="unico">Pago Único</option>
                              <option value="cuotas">
                                Pago en Cuotas Iguales
                              </option>
                            </select>
                          </div>

                          {parte.tipoPago === "unico" && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Medio de Pago
                                </label>
                                <select
                                  value={parte.medioPago}
                                  onChange={(e) =>
                                    handlePartePagoChange(
                                      parte.id,
                                      "medioPago",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">
                                    Seleccione medio de pago
                                  </option>
                                  <option value="transferencia">
                                    Transferencia Bancaria
                                  </option>
                                  <option value="deposito">
                                    Depósito Bancario
                                  </option>
                                  <option value="cheque">Cheque</option>
                                  <option value="efectivo">Efectivo</option>
                                </select>
                              </div>
                              {parte.medioPago === "transferencia" && (
                                <div className="border-t pt-4 mt-4">
                                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input
                                      type="checkbox"
                                      checked={parte.tieneDetalle}
                                      onChange={(e) =>
                                        handlePartePagoChange(
                                          parte.id,
                                          "tieneDetalle",
                                          e.target.checked,
                                        )
                                      }
                                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      ¿Agregar detalle de transferencia?
                                    </span>
                                  </label>
                                  {parte.tieneDetalle && (
                                    <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Banco de origen
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.bancoOrigen}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "bancoOrigen",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: Banco Pichincha"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Cuenta de origen
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.cuentaOrigen}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "cuentaOrigen",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: 2100123456"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tipo de cuenta de origen
                                        </label>
                                        <select
                                          value={parte.detalle.tipoCuentaOrigen}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "tipoCuentaOrigen",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                          <option value="">Seleccionar</option>
                                          <option value="ahorros">
                                            Ahorros
                                          </option>
                                          <option value="corriente">
                                            Corriente
                                          </option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Banco de destino
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.bancoDestino}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "bancoDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: Banco Guayaquil"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Cuenta de destino
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.cuentaDestino}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "cuentaDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: 3200654321"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tipo de cuenta de destino
                                        </label>
                                        <select
                                          value={
                                            parte.detalle.tipoCuentaDestino
                                          }
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "tipoCuentaDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                          <option value="">Seleccionar</option>
                                          <option value="ahorros">
                                            Ahorros
                                          </option>
                                          <option value="corriente">
                                            Corriente
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {parte.medioPago === "deposito" && (
                                <div className="border-t pt-4 mt-4">
                                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input
                                      type="checkbox"
                                      checked={parte.tieneDetalle}
                                      onChange={(e) =>
                                        handlePartePagoChange(
                                          parte.id,
                                          "tieneDetalle",
                                          e.target.checked,
                                        )
                                      }
                                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      ¿Agregar detalle de depósito?
                                    </span>
                                  </label>
                                  {parte.tieneDetalle && (
                                    <div className="grid grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg border border-green-200">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Banco de destino
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.bancoDestino}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "bancoDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: Banco Pacífico"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Número de cuenta de destino
                                        </label>
                                        <input
                                          type="text"
                                          value={parte.detalle.cuentaDestino}
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "cuentaDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                          placeholder="Ej: 4500987654"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Tipo de cuenta de destino
                                        </label>
                                        <select
                                          value={
                                            parte.detalle.tipoCuentaDestino
                                          }
                                          onChange={(e) =>
                                            handleDetallePartePagoChange(
                                              parte.id,
                                              "tipoCuentaDestino",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                          <option value="">Seleccionar</option>
                                          <option value="ahorros">
                                            Ahorros
                                          </option>
                                          <option value="corriente">
                                            Corriente
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {parte.medioPago === "cheque" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Cheque
                                  </label>
                                  <select
                                    value={parte.tipoCheque}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "tipoCheque",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                  >
                                    <option value="">Seleccione tipo</option>
                                    <option value="certificado">
                                      Cheque Certificado
                                    </option>
                                    <option value="gerencia">
                                      Cheque de Gerencia
                                    </option>
                                    <option value="vista">
                                      Cheque a la Vista
                                    </option>
                                  </select>
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Momento de Pago
                                </label>
                                <select
                                  value={parte.momentoPago}
                                  onChange={(e) =>
                                    handlePartePagoChange(
                                      parte.id,
                                      "momentoPago",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">Seleccione momento</option>
                                  <option value="ya_pagado">
                                    Ya pagado (en forma previa)
                                  </option>
                                  <option value="al_firmar">
                                    Al momento de la firma
                                  </option>
                                  <option value="despues_inscribir">
                                    Después de inscribir en Registro
                                  </option>
                                  <option value="otro">
                                    Otro (especificar)
                                  </option>
                                </select>
                              </div>
                              {parte.momentoPago === "otro" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Especifique el momento de pago
                                  </label>
                                  <input
                                    type="text"
                                    value={parte.momentoOtro}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "momentoOtro",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ej: dentro de 30 días hábiles"
                                  />
                                </div>
                              )}
                            </>
                          )}

                          {parte.tipoPago === "cuotas" && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número de Cuotas
                                  </label>
                                  <input
                                    type="number"
                                    value={parte.numeroCuotas}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "numeroCuotas",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="6"
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor por Cuota (auto-calculado)
                                  </label>
                                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                                    <span className="font-bold text-gray-700">
                                      $
                                    </span>
                                    <span className="font-bold text-gray-900">
                                      {parte.valorCuota
                                        ? parte.valorCuota.toFixed(2)
                                        : "0.00"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Periodicidad
                                </label>
                                <select
                                  value={parte.periodicidad}
                                  onChange={(e) =>
                                    handlePartePagoChange(
                                      parte.id,
                                      "periodicidad",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">
                                    Seleccione periodicidad
                                  </option>
                                  <option value="mensual">Mensual</option>
                                  <option value="trimestral">Trimestral</option>
                                  <option value="semestral">Semestral</option>
                                  <option value="anual">Anual</option>
                                  <option value="otro">
                                    Otro (especificar)
                                  </option>
                                </select>
                              </div>
                              {parte.periodicidad === "otro" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Especifique la periodicidad
                                  </label>
                                  <input
                                    type="text"
                                    value={parte.periodicidadOtra}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "periodicidadOtra",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ej: cada 45 días"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Medio de Pago
                                </label>
                                <select
                                  value={parte.medioPago}
                                  onChange={(e) =>
                                    handlePartePagoChange(
                                      parte.id,
                                      "medioPago",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">
                                    Seleccione medio de pago
                                  </option>
                                  <option value="transferencia">
                                    Transferencia Bancaria
                                  </option>
                                  <option value="deposito">
                                    Depósito Bancario
                                  </option>
                                  <option value="cheque">Cheque</option>
                                  <option value="efectivo">Efectivo</option>
                                </select>
                              </div>
                              {parte.medioPago === "cheque" && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Cheque
                                  </label>
                                  <select
                                    value={parte.tipoCheque}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "tipoCheque",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                  >
                                    <option value="">Seleccione tipo</option>
                                    <option value="certificado">
                                      Cheque Certificado
                                    </option>
                                    <option value="gerencia">
                                      Cheque de Gerencia
                                    </option>
                                    <option value="vista">
                                      Cheque a la Vista
                                    </option>
                                  </select>
                                </div>
                              )}
                            </>
                          )}

                          <div className="border-t pt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={parte.esCreditoBancario}
                                onChange={(e) =>
                                  handlePartePagoChange(
                                    parte.id,
                                    "esCreditoBancario",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Proviene de crédito bancario
                              </span>
                            </label>
                            {parte.esCreditoBancario && (
                              <div className="mt-3 space-y-3 pl-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Banco
                                  </label>
                                  <input
                                    type="text"
                                    value={parte.nombreBanco}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "nombreBanco",
                                        e.target.value.toUpperCase(),
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                                    placeholder="Ej: BANCO DEL PACÍFICO"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cuenta Destino
                                  </label>
                                  <input
                                    type="text"
                                    value={parte.cuentaDestino}
                                    onChange={(e) =>
                                      handlePartePagoChange(
                                        parte.id,
                                        "cuentaDestino",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    placeholder="Ej: a la cuenta que determinen los VENDEDORES"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="border-t-2 border-gray-300 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            Precio Total: ${precioTotal || "0"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total asignado: $
                            {partesPago
                              .reduce(
                                (sum, p) => sum + (parseFloat(p.monto) || 0),
                                0,
                              )
                              .toFixed(2)}
                          </p>
                          <p
                            className={`text-lg font-bold ${calcularSaldoRestante() === 0 ? "text-green-600" : "text-orange-600"}`}
                          >
                            Saldo restante: $
                            {calcularSaldoRestante().toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAgregarPartePago}
                        >
                          + Agregar Parte de Pago
                        </Button>
                      </div>
                      {calcularSaldoRestante() !== 0 && precioTotal && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ La suma de las partes debe ser igual al precio
                            total
                          </p>
                        </div>
                      )}
                      {calcularSaldoRestante() === 0 && precioTotal && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✅ La suma de las partes coincide con el precio
                            total
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </>
            )}
          </>
        )}

        {/* CLÁUSULAS EXCLUSIVAS DE PROMESA */}
        {tipoPropiedad && (
          <>
            <div className="border-t-4 border-primary-500 pt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                CLÁUSULAS DE LA PROMESA
              </h2>
            </div>

            {/* PLAZO */}
            <Card title="Plazo para Celebrar la Escritura (Quinta Cláusula)">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿El plazo es una fecha fija?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setPlazo({
                          ...plazo,
                          esFechaFija: true,
                          anios: "",
                          meses: "",
                          dias: "",
                        })
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${plazo.esFechaFija ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Sí, fecha fija
                    </button>
                    <button
                      onClick={() =>
                        setPlazo({
                          ...plazo,
                          esFechaFija: false,
                          fechaFija: "",
                        })
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${!plazo.esFechaFija ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      No, plazo en días/meses/años
                    </button>
                  </div>
                </div>

                {plazo.esFechaFija ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha límite para escriturar
                    </label>
                    <input
                      type="date"
                      value={plazo.fechaFija}
                      onChange={(e) =>
                        setPlazo({ ...plazo, fechaFija: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración del plazo
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Años
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={plazo.anios}
                          onChange={(e) =>
                            setPlazo({ ...plazo, anios: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Meses
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="11"
                          value={plazo.meses}
                          onChange={(e) =>
                            setPlazo({ ...plazo, meses: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Días
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={plazo.dias}
                          onChange={(e) =>
                            setPlazo({ ...plazo, dias: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {(plazo.anios || plazo.meses || plazo.dias) && (
                      <p className="text-xs text-primary-700 mt-2 font-medium">
                        Plazo:{" "}
                        {[
                          plazo.anios && `${plazo.anios} año(s)`,
                          plazo.meses && `${plazo.meses} mes(es)`,
                          plazo.dias && `${plazo.dias} día(s)`,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plazo.conProrroga}
                      onChange={(e) =>
                        setPlazo({
                          ...plazo,
                          conProrroga: e.target.checked,
                          fechaProrroga: "",
                        })
                      }
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Incluir prórroga
                    </span>
                  </label>
                  {plazo.conProrroga && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha límite de la prórroga
                      </label>
                      <input
                        type="date"
                        value={plazo.fechaProrroga}
                        onChange={(e) =>
                          setPlazo({ ...plazo, fechaProrroga: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* CLÁUSULA PENAL */}
            <Card title="Cláusula Penal (Séptima Cláusula)">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de penalidad
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setClausulaPenal({
                          ...clausulaPenal,
                          tipoPenal: "monto_fijo",
                        })
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${clausulaPenal.tipoPenal === "monto_fijo" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Monto fijo
                    </button>
                    <button
                      onClick={() =>
                        setClausulaPenal({
                          ...clausulaPenal,
                          tipoPenal: "porcentaje",
                        })
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${clausulaPenal.tipoPenal === "porcentaje" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Porcentaje del precio
                    </button>
                  </div>
                </div>
                {clausulaPenal.tipoPenal === "monto_fijo" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto de la pena (USD)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-700">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={clausulaPenal.montoFijo}
                        onChange={(e) =>
                          setClausulaPenal({
                            ...clausulaPenal,
                            montoFijo: e.target.value,
                          })
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Porcentaje (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={clausulaPenal.porcentaje}
                        onChange={(e) =>
                          setClausulaPenal({
                            ...clausulaPenal,
                            porcentaje: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Ej: 10"
                      />
                    </div>
                    {clausulaPenal.porcentaje && precioTotal && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          Monto calculado:{" "}
                          <strong>
                            $
                            {(
                              (parseFloat(precioTotal) *
                                parseFloat(clausulaPenal.porcentaje)) /
                              100
                            ).toFixed(2)}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* CONDICIÓN RESOLUTORIA */}
            <Card title="Condición Resolutoria (Octava Cláusula)">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Incluir condición resolutoria?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setHayCondicionResolutoria(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${hayCondicionResolutoria === true ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => setHayCondicionResolutoria(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${hayCondicionResolutoria === false ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      No
                    </button>
                  </div>
                </div>
                {hayCondicionResolutoria === true && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ℹ️ Se incluirá en la promesa la cláusula de condición
                      resolutoria.
                    </p>
                  </div>
                )}
                {hayCondicionResolutoria === false && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      ℹ️ No se incluirá condición resolutoria en la promesa.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* DATOS ABOGADO ADICIONAL — solo si hay CR */}
            {hayCondicionResolutoria === true && (
              <Card title="Datos para Décima Segunda Cláusula">
                <p className="text-sm text-gray-600 mb-4">
                  Al incluir condición resolutoria, se requieren los datos del
                  abogado patrocinador adicional.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del abogado
                    </label>
                    <input
                      type="text"
                      value={propiedadIntelectual.nombreAbogado}
                      onChange={(e) =>
                        setPropiedadIntelectual({
                          ...propiedadIntelectual,
                          nombreAbogado: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                      placeholder="NOMBRES COMPLETOS"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Género
                    </label>
                    <select
                      value={propiedadIntelectual.generoAbogado}
                      onChange={(e) =>
                        setPropiedadIntelectual({
                          ...propiedadIntelectual,
                          generoAbogado: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="femenino">Femenino (la abogada)</option>
                      <option value="masculino">Masculino (el abogado)</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ABOGADO — igual que compraventa */}
        <div className="border-t-4 border-primary-500 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            DATOS DEL ABOGADO
          </h2>
        </div>
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo del Abogado
              </label>
              <input
                type="text"
                value={abogado.nombre}
                onChange={(e) =>
                  setAbogado({
                    ...abogado,
                    nombre: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                placeholder="Ej: MARIELA VERA SOSA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Matrícula
                </label>
                <select
                  value={abogado.tipoMatricula}
                  onChange={(e) =>
                    setAbogado({ ...abogado, tipoMatricula: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="cj">Consejo de la Judicatura</option>
                  <option value="colegio">Colegio de Abogados</option>
                </select>
              </div>
              {abogado.tipoMatricula === "colegio" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia del Colegio
                  </label>
                  <input
                    type="text"
                    value={abogado.provincia}
                    onChange={(e) =>
                      setAbogado({ ...abogado, provincia: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Ej: Pichincha"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Matrícula
              </label>
              <input
                type="text"
                value={abogado.numeroMatricula}
                onChange={(e) =>
                  setAbogado({ ...abogado, numeroMatricula: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Ej: 17-2023-1717"
              />
            </div>
          </div>
        </Card>

        {/* BOTONES FINALES */}
        <div className="flex justify-between items-center pt-6 pb-12">
          <button
            onClick={() => setModalPlantillaAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {borrador ? "Guardar borrador" : "Guardar como borrador"}
          </button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerarPromesa}
            disabled={loading}
          >
            {loading ? "Generando..." : "Generar Promesa"}
          </Button>
        </div>
      </div>

      <ModalGuardarPlantilla
        abierto={modalPlantillaAbierto}
        onCerrar={() => setModalPlantillaAbierto(false)}
        onGuardado={(data) => {
          setModalPlantillaAbierto(false);
          setBorrador({
            id: data.id,
            codigo: data.codigo,
            nombre: data.nombre,
          });
          toast.success(`Borrador ${data.codigo} guardado`);
        }}
        borrador={borrador}
        tipoDocumento="minuta"
        tipoContrato="promesa_compraventa"
        nombreVendedor={(() => {
          const v = vendedores[0];
          if (!v) return "";
          if (v.esEmpresa) return v.razonSocial || "";
          return (
            [v.nombres, v.apellidos].filter(Boolean).join(" ") ||
            v.nombreCompleto ||
            ""
          );
        })()}
        contenido={{
          vendedores,
          compradores,
          tipoPropiedad,
          nombreConjunto,
          predios,
          ubicacion,
          historiaManual,
          historiaFormulario,
          hayDeclaratoria,
          declaratoriaManual,
          declaratoriaFormulario,
          linderosGenerales,
          tieneLInderosEspecificos,
          linderosEspecificos,
          modoPrecio,
          precioTotal,
          partesPago,
          precioManual,
          plazo,
          clausulaPenal,
          hayCondicionResolutoria,
          propiedadIntelectual,
          abogado,
        }}
      />
    </div>
  );
};

export default FormularioPromesa;
