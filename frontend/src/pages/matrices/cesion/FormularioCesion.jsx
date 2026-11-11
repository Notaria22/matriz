import FormularioMatrizBase from "../FormularioMatrizBase";

const FormularioCesion = () => (
  <FormularioMatrizBase
    titulo="Generar Matriz de Cesión"
    tipoContrato="cesion"
    labelParte1="Cedente"
    labelParte1Plural="Cedentes"
    labelParte2="Cesionario"
    labelParte2Plural="Cesionarios"
    keyParte1="cedentes"
    keyParte2="cesionarios"
  />
);

export default FormularioCesion;
