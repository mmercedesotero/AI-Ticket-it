import { Pressable, StyleSheet, Text, View } from "react-native";
import { colores } from "../tema";

// Selector de pestañas chicas dentro de una pastilla gris: la elegida se ve blanca y con sombra suave.
// opciones: [{ clave, etiqueta }]
export default function Segmentos({ opciones, valor, onCambiar }) {
  return (
    <View style={styles.pista}>
      {opciones.map((o) => {
        const activa = o.clave === valor;
        return (
          <Pressable key={o.clave} style={[styles.opcion, activa && styles.opcionActiva]} onPress={() => onCambiar(o.clave)}>
            <Text style={[styles.texto, activa && styles.textoActivo]} numberOfLines={1}>{o.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pista: { flexDirection: "row", backgroundColor: "rgba(15,23,42,0.07)", borderRadius: 12, padding: 3 },
  opcion: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 9 },
  opcionActiva: {
    backgroundColor: colores.blanco, elevation: 1, shadowColor: "#000", shadowOpacity: 0.08,
    shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  texto: { color: colores.textoSuave, fontWeight: "600", fontSize: 13 },
  textoActivo: { color: colores.indigo, fontWeight: "800" },
});
