// Colores y medidas compartidas por todas las pantallas.
// Para cambiar el look de toda la app alcanza con tocar los valores de acá.
export const colores = {
  indigo: "#0F172A", // encabezados, navegación, textos fuertes
  acento: "#EF806C", // botones principales y detalles (coral)
  acentoSuave: "#FDEEEA", // fondo de elementos destacados
  fondo: "#E9EEF5", // fondo de las pantallas (un poco más oscuro que las tarjetas blancas, para que se note su forma)
  blanco: "#FFFFFF", // tarjetas y campos
  borde: "#E2E8F0",
  textoSuave: "#64748B",
  textoPlaceholder: "#94A3B8",
  exito: "#148C5E", // verde para confirmaciones
  error: "#DC2626",
};

export const radios = { campo: 12, tarjeta: 16, boton: 12 };

// Estilos de botones y campos que se repiten en varias pantallas.
export const estilosBase = {
  campo: {
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radios.campo,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colores.indigo,
  },
  botonPrimario: {
    backgroundColor: colores.acento,
    borderRadius: radios.boton,
    paddingVertical: 14,
    alignItems: "center",
  },
  botonPrimarioTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },
};
