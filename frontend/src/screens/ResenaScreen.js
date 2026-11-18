import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { enviar } from "../api";
import { formatearFecha, formatearPrecio } from "../formato"

export default function ResenaScreen({ route, navigation }) {
  const { compraId, evento } = route.params;
  const [puntuacion, setPuntuacion] = useState(0);
  const [detalle, setDetalle] = useState("");

  const publicar = async () => {
    try {
      await enviar("POST", "/resenias", { compraId, puntuacion, detalle });
      Alert.alert("¡Gracias!", "Tu reseña fue publicada", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("No se pudo publicar", e.message);
    }
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>¿Cómo estuvo {evento}?</Text>

      <View style={styles.estrellas}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setPuntuacion(n)}>
            <Text style={[styles.estrella, n <= puntuacion && styles.estrellaActiva]}>★</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.comentario}
        placeholder="Contanos tu experiencia..."
        value={detalle}
        onChangeText={setDetalle}
        multiline
      />

      <Pressable
        style={[styles.publicar, puntuacion === 0 && styles.publicarInactivo]}
        disabled={puntuacion === 0}
        onPress={publicar}
      >
        <Text style={styles.publicarTexto}>Publicar reseña</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 16 },
  titulo: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  estrellas: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  estrella: { fontSize: 44, color: "#ccc" },
  estrellaActiva: { color: "#f5a623" },
  comentario: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, minHeight: 100, textAlignVertical: "top", marginBottom: 20 },
  publicar: { backgroundColor: "#222", borderRadius: 10, padding: 14, alignItems: "center" },
  publicarInactivo: { backgroundColor: "#aaa" },
  publicarTexto: { color: "#fff", fontWeight: "bold" },
});