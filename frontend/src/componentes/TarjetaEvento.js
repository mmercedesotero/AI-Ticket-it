import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BotonFavorito from "./BotonFavorito";
import { colores, radios } from "../tema";
import { formatearFechaLarga, formatearPrecio, yaSeRealizo } from "../formato";
import { imagenDe } from "../imagenes";

// Si el evento no tiene foto, se muestra un ícono según su categoría.
const ICONOS = {
  Recital: "musical-notes",
  Teatro: "color-mask",
  Festival: "sparkles",
};
export const iconoDe = (evento) => ICONOS[evento.categoria?.nombre] ?? "calendar";

// Un evento puede tener entradas de distintos precios: mostramos el rango.
export const textoPrecio = (evento) => {
  if (evento.tiposEntrada.length === 0) return "Sin entradas";

  const precios = evento.tiposEntrada.map((t) => t.precio);
  const min = Math.min(...precios);
  const max = Math.max(...precios);

  return min === max ? formatearPrecio(min) : `${formatearPrecio(min)} – ${formatearPrecio(max)}`;
};

export default function TarjetaEvento({ evento, favorito, onPress, onFavorito }) {
  const foto = imagenDe(evento);
  const finalizado = yaSeRealizo(evento.fecha);

  return (
    <Pressable style={styles.tarjeta} onPress={onPress}>
      <View style={styles.imagen}>
        {foto ? (
          <Image source={foto} style={styles.foto} resizeMode="cover" />
        ) : (
          <Ionicons name={iconoDe(evento)} size={52} color={colores.acento} />
        )}

        <View style={styles.etiquetaCategoria}>
          <Text style={styles.etiquetaCategoriaTexto}>{evento.categoria?.nombre}</Text>
        </View>

        <View style={styles.corazon}>
          <BotonFavorito activo={favorito} onPress={onFavorito} />
        </View>

        {finalizado && (
          <View style={styles.etiquetaFinalizado}>
            <Text style={styles.etiquetaFinalizadoTexto}>Finalizado</Text>
          </View>
        )}
      </View>

      <View style={styles.cuerpo}>
        <Text style={styles.nombre} numberOfLines={1}>{evento.nombre}</Text>

        <View style={styles.linea}>
          <Ionicons name="calendar-outline" size={16} color={colores.textoSuave} />
          <Text style={styles.lineaTexto}>{formatearFechaLarga(evento.fecha)}</Text>
        </View>
        <View style={styles.linea}>
          <Ionicons name="business-outline" size={16} color={colores.textoSuave} />
          <Text style={styles.lineaTexto} numberOfLines={1}>{evento.organizador?.nombre}</Text>
        </View>

        <View style={styles.pie}>
          <View style={styles.precioBloque}>
            <Text style={styles.precioEtiqueta}>Entradas</Text>
            <Text style={styles.precio}>{textoPrecio(evento)}</Text>
          </View>
          <View style={[styles.boton, finalizado && styles.botonFinalizado]}>
            <Text style={styles.botonTexto}>{finalizado ? "Ver detalle" : "Ver entradas"}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.blanco, borderRadius: radios.tarjeta, overflow: "hidden",
    marginBottom: 16, borderWidth: 1, borderColor: colores.borde,
  },
  imagen: {
    width: "100%", aspectRatio: 16 / 9, backgroundColor: colores.indigo,
    alignItems: "center", justifyContent: "center",
  },
  foto: { width: "100%", height: "100%" },
  etiquetaCategoria: {
    position: "absolute", top: 12, left: 12, backgroundColor: colores.blanco,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  etiquetaCategoriaTexto: { fontSize: 12, fontWeight: "700", color: colores.acento },
  corazon: { position: "absolute", top: 10, right: 10 },
  etiquetaFinalizado: {
    position: "absolute", bottom: 12, left: 12, backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  etiquetaFinalizadoTexto: { fontSize: 12, fontWeight: "700", color: colores.blanco },

  cuerpo: { padding: 14 },
  nombre: { fontSize: 20, fontWeight: "800", color: colores.indigo, marginBottom: 8 },
  linea: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  lineaTexto: { color: colores.textoSuave, fontSize: 14, flexShrink: 1 },

  pie: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: colores.borde,
  },
  precioBloque: { flex: 1 },
  precioEtiqueta: { fontSize: 12, color: colores.textoSuave },
  precio: { fontSize: 16, fontWeight: "800", color: colores.indigo, marginTop: 1 },
  boton: { backgroundColor: colores.acento, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  botonFinalizado: { backgroundColor: colores.textoPlaceholder },
  botonTexto: { color: colores.blanco, fontWeight: "700", fontSize: 14 },
});
