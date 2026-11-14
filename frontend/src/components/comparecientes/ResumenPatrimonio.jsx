/** Situación patrimonial declarada (solo lectura): ficha de empresa e historial UAFE. */

const TIPOS_INMUEBLE = {
  casa: "Casa",
  terreno: "Terreno",
  solar: "Solar",
  departamento: "Departamento",
  suite: "Suite",
  oficina: "Oficina",
  otro: "Otro",
};

const formatoValor = (v) =>
  v === "" || v === null || v === undefined
    ? ""
    : `$${Number(v).toLocaleString("es-EC")}`;

/** Situación patrimonial declarada en el formulario público (solo lectura). */
export const ResumenPatrimonio = ({ patrimonio, nota = true }) => {
  if (!patrimonio || typeof patrimonio !== "object") return null;
  const p = patrimonio;
  // Formato anterior: inmuebles como lista de tipos y vehículos como texto
  const inmuebles = (p.inmuebles || []).map((i) =>
    typeof i === "string" ? { tipo: i } : i,
  );
  const vehiculos = Array.isArray(p.vehiculos)
    ? p.vehiculos
    : p.vehiculos
      ? [{ marca: p.vehiculos }]
      : [];
  const inversiones = Array.isArray(p.inversiones)
    ? p.inversiones
    : p.inversiones
      ? [{ descripcion: p.inversiones }]
      : [];

  // Total informativo (inmuebles + vehículos + acciones)
  const suma = (lista, campo) =>
    (lista || []).reduce((t, f) => t + (parseFloat(f?.[campo]) || 0), 0);
  const total =
    (p.no_posee_inmuebles ? 0 : suma(inmuebles, "valor")) +
    (p.no_posee_vehiculos ? 0 : suma(vehiculos, "valor")) +
    (p.no_posee_acciones ? 0 : suma(p.acciones, "monto"));

  const titulo = (texto) => (
    <p className="font-medium text-gray-700 mt-2">{texto}</p>
  );

  return (
    <div className="col-span-2 mt-2 p-3 bg-white border border-gray-200 rounded-lg text-sm">
      <p className="font-semibold text-gray-800">
        Situación patrimonial (declarada por el cliente)
      </p>

      {titulo("Inmuebles")}
      {p.no_posee_inmuebles || inmuebles.length === 0 ? (
        <p className="text-gray-600">No posee</p>
      ) : (
        <ul className="list-disc pl-5 text-gray-800">
          {inmuebles.map((i, idx) => (
            <li key={idx}>
              {i.tipo === "otro" && i.especificar
                ? `Otro (${i.especificar})`
                : TIPOS_INMUEBLE[i.tipo] || i.tipo}
              {i.ciudad && ` en ${i.ciudad}`}
              {i.valor !== undefined &&
                i.valor !== "" &&
                ` — ${formatoValor(i.valor)}`}
            </li>
          ))}
        </ul>
      )}
      {/* Datos del formato anterior */}
      {p.ciudades_inmuebles && (
        <p className="text-gray-600">Ciudades: {p.ciudades_inmuebles}</p>
      )}
      {p.valor_inmuebles && (
        <p className="text-gray-600">
          Valoración total: {formatoValor(p.valor_inmuebles)}
        </p>
      )}

      {titulo("Vehículos")}
      {p.no_posee_vehiculos || vehiculos.length === 0 ? (
        <p className="text-gray-600">No posee</p>
      ) : (
        <ul className="list-disc pl-5 text-gray-800">
          {vehiculos.map((v, idx) => (
            <li key={idx}>
              {[v.marca, v.modelo].filter(Boolean).join(" ")}
              {v.placa && ` — placa ${v.placa}`}
              {v.valor !== undefined &&
                v.valor !== "" &&
                ` — ${formatoValor(v.valor)}`}
            </li>
          ))}
        </ul>
      )}
      {p.valor_vehiculos && (
        <p className="text-gray-600">
          Valoración total: {formatoValor(p.valor_vehiculos)}
        </p>
      )}

      {titulo("Inversiones, pólizas, fondos o fideicomisos")}
      {p.no_posee_inversiones || inversiones.length === 0 ? (
        <p className="text-gray-600">No posee</p>
      ) : (
        <ul className="list-disc pl-5 text-gray-800">
          {inversiones.map((inv, idx) => (
            <li key={idx}>{inv.descripcion}</li>
          ))}
        </ul>
      )}

      {titulo("Acciones, participaciones o capital en empresas")}
      {p.no_posee_acciones || !(p.acciones || []).length ? (
        <p className="text-gray-600">No posee</p>
      ) : (
        <ul className="list-disc pl-5 text-gray-800">
          {p.acciones.map((a, idx) => (
            <li key={idx}>
              {a.entidad}
              {a.monto !== undefined &&
                a.monto !== "" &&
                ` — ${formatoValor(a.monto)}`}
            </li>
          ))}
        </ul>
      )}

      {total > 0 && (
        <p className="mt-3 pt-2 border-t border-gray-200 font-semibold text-gray-900">
          Total de bienes declarados: {formatoValor(total)}
        </p>
      )}

      {nota && (
        <p className="text-xs text-gray-500 pt-2">
          Se edita desde el formulario de registro del cliente.
        </p>
      )}
    </div>
  );
};
