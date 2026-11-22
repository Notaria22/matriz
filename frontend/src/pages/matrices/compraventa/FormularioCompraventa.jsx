import FormularioMatrizBase from "../FormularioMatrizBase";

const FormularioCompraventa = () => (
  <FormularioMatrizBase
    titulo="Generar Matriz de Compraventa"
    tipoContrato="compraventa"
    labelParte1="Vendedor"
    labelParte1Plural="Vendedores"
    labelParte2="Comprador"
    labelParte2Plural="Compradores"
    keyParte1="vendedores"
    keyParte2="compradores"
  />
);

export default FormularioCompraventa;
