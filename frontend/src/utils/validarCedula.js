export const validarCedula = (cedula) => {
  if (!cedula || cedula.length !== 10) return false;

  const digits = cedula.split("").map(Number);
  const provincia = parseInt(cedula.substring(0, 2));

  // 30: cédulas de extranjeros residentes en Ecuador
  if ((provincia < 1 || provincia > 24) && provincia !== 30) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = digits[i] * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const digitoVerificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);

  return digitoVerificador === digits[9];
};
