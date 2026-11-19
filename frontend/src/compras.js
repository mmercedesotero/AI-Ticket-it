import { colores } from "./tema";
import { yaSeRealizo } from "./formato";

// Cómo se muestra cada estado de una compra.
export const ESTADOS = {
  PENDIENTE_PAGO: { texto: "Pendiente de pago", color: "#D97706" },
  CONFIRMADA: { texto: "Confirmada", color: colores.exito },
  UTILIZADA: { texto: "Utilizada", color: "#2563EB" },
  CANCELADA: { texto: "Cancelada", color: colores.textoSuave },
  REEMBOLSADA: { texto: "Reembolsada", color: "#7C3AED" },
};

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
