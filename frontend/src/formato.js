const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const formatearFecha = (fecha) => {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

// "2027-03-20" -> "Sáb, 20 Mar 2027"
export const formatearFechaLarga = (fecha) => {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const date = new Date(anio, mes - 1, dia);
  return `${DIAS[date.getDay()]}, ${dia} ${MESES[mes - 1]} ${anio}`;
};

export const formatearPrecio = (precio) =>
  `$${precio.toLocaleString("es-AR")}`;

export const yaSeRealizo = (fecha) => {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return new Date(anio, mes - 1, dia) < hoy;
};

// "2026-11-18T14:30:00.000Z" -> "18 Nov · 14:30"
export const formatearFechaHora = (iso) => {
  const f = new Date(iso);
  const hora = `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
  return `${f.getDate()} ${MESES[f.getMonth()]} · ${hora}`;
};

// Cuántos días pasaron desde una fecha: "Hoy", "Ayer" o "Hace 3 días".
export const tiempoRelativo = (iso) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(iso);
  f.setHours(0, 0, 0, 0);

  const dias = Math.round((hoy - f) / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return `Hace ${dias} días`;
};
