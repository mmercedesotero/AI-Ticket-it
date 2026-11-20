import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colores } from "../tema";

// Franja azul oscura con el título centrado, igual para todas las pantallas principales.
export default function CabeceraPantalla({ titulo, subtitulo, derecha }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
      {/* Alto fijo, con o sin subtítulo, para que la franja mida lo mismo en todas las pantallas. */}
      <View style={styles.textos}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
      {derecha ? <View style={styles.derecha}>{derecha}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    backgroundColor: colores.blanco, paddingHorizontal: 16, paddingBottom: 12, alignItems: "center",
    borderBottomWidth: 1, borderColor: colores.borde,
  },
  derecha: { position: "absolute", right: 12, bottom: 12 },
  textos: { height: 40, justifyContent: "center", alignItems: "center" },
  titulo: { fontSize: 20, fontWeight: "800", color: colores.indigo, textAlign: "center" },
  subtitulo: { color: colores.textoSuave, fontSize: 12, marginTop: 1, textAlign: "center" },
});
