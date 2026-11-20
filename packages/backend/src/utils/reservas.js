// Una compra sin pagar es una "reserva": las entradas quedan apartadas un tiempo.
// A las HORAS_AVISO se le recuerda a la persona que tiene que abonar, y a las HORAS_RESERVA se cancela
// y las entradas vuelven a quedar disponibles.
const HORAS_RESERVA = Number(process.env.HORAS_RESERVA) || 24;
const HORAS_AVISO = Number(process.env.HORAS_AVISO) || 12;
const MS_POR_HORA = 60 * 60 * 1000;

// Cuándo se hizo la reserva (primer registro del historial).
const creadaEn = (compra) => new Date(compra.historial[0].fechaHora).getTime();

module.exports = { HORAS_RESERVA, HORAS_AVISO, MS_POR_HORA, creadaEn };
