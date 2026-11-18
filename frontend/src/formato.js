export const formatearFecha = (fecha) => {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

export const formatearPrecio = (precio) =>
  `$${precio.toLocaleString("es-AR")}`;