export const formatearFecha = (fecha) => {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

export const formatearPrecio = (precio) =>
  `$${precio.toLocaleString("es-AR")}`;

export const yaSeRealizo = (fecha) => {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return new Date(anio, mes - 1, dia) < hoy;
};