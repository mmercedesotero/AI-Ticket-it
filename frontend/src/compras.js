import { colores } from "./tema";
import { yaSeRealizo } from "./formato";

// Cómo se muestra cada estado de una compra.
export const ESTADOS = {
  PENDIENTE_PAGO: { texto: "Pendiente de pago", color: "#D9604A" },
  CONFIRMADA: { texto: "Confirmada", color: colores.exito },
  UTILIZADA: { texto: "Utilizada", color: "#2563EB" },
  CANCELADA: { texto: "Cancelada", color: colores.textoSuave },
  REEMBOLSADA: { texto: "Reembolsada", color: "#1E3A8A" },
};

// Etiqueta de estado "transparentosa": fondo suave y borde del mismo color pero más oscuro.
export const estiloEstado = (estado) => ({
  etiqueta: { backgroundColor: `${estado.color}1F`, borderWidth: 1, borderColor: `${estado.color}99` },
  texto: { color: estado.color },
});

// Una compra está "pasada" si ya se usó, se canceló o el evento ya se realizó.
export const esPasada = (compra) =>
  compra.estado === "UTILIZADA" ||
  compra.estado === "CANCELADA" ||
  compra.estado === "REEMBOLSADA" ||
  yaSeRealizo(compra.evento.fecha);

export const textoDias = (dias) =>
  dias === 0 ? "¡Es hoy!" : dias === 1 ? "Falta 1 día" : `Faltan ${dias} días`;

// Texto que identifica a la entrada en el código QR.
export const codigoDe = (compra) => `AI-TICKET-${compra.id}-${compra.evento.id}`;

// Una compra sin pagar es una reserva: dura HORAS_RESERVA (igual que en el servidor) y después se cancela sola.
export const HORAS_RESERVA = 24;

// "Vence en 5 h", "Vence en 40 min" o "Vencida". Solo tiene sentido para compras pendientes de pago.
export const textoReserva = (compra) => {
  const creada = new Date(compra.historial?.[0]?.fechaHora ?? Date.now()).getTime();
  const minutos = Math.floor((creada + HORAS_RESERVA * 3600000 - Date.now()) / 60000);

  if (minutos <= 0) return "Reserva vencida";
  if (minutos < 60) return `Reserva vence en ${minutos} min`;
  return `Reserva vence en ${Math.ceil(minutos / 60)} h`;
};
