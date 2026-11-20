import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enviar } from "../api";
import { alerta } from "../dialogo";
import { colores, radios } from "../tema";

const FRASES = ["", "Muy malo", "Podría ser mejor", "Estuvo bien", "Muy bueno", "¡Excelente!"];

export default function ResenaScreen({ route, navigation }) {
  const { compraId, evento } = route.params;
  const insets = useSafeAreaInsets();
  const [puntuacion, setPuntuacion] = useState(0);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);

  const publicar = async () => {
    if (enviando) return;

    setEnviando(true);
    try {
      await enviar("POST", "/resenias", { compraId, puntuacion, detalle });
      alerta("¡Gracias por tu reseña!", "Ayudás a otros compradores a elegir mejor.", [
        { text: "Listo", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      alerta("No se pudo publicar", e.message);
      setEnviando(false);
    }
  };

  const inactivo = puntuacion === 0 || enviando;

  return (
    <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <View style={styles.icono}>
          <Ionicons name="star" size={34} color="#F59E0B" />
        </View>
        <Text style={styles.titulo}>¿Cómo estuvo {evento}?</Text>
        <Text style={styles.subtitulo}>Tu opinión ayuda a otros compradores</Text>

        <View style={styles.estrellas}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setPuntuacion(n)} hitSlop={4}>
              <Ionicons
                name={n <= puntuacion ? "star" : "star-outline"}
                size={46}
                color={n <= puntuacion ? "#F59E0B" : colores.textoPlaceholder}
              />
            </Pressable>
          ))}
        </View>
        <Text style={styles.frase}>{FRASES[puntuacion] || "Tocá una estrella para puntuar"}</Text>

        <Text style={styles.label}>Contanos tu experiencia</Text>
        <TextInput
          style={styles.comentario}
          placeholder="¿Qué te gustó? ¿Qué mejorarías?"
          placeholderTextColor={colores.textoPlaceholder}
          value={detalle}
          onChangeText={setDetalle}
          multiline
        />
      </ScrollView>

      <View style={[styles.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={[styles.publicar, inactivo && styles.inactivo]} disabled={inactivo} onPress={publicar}>
          <Text style={styles.publicarTexto}>{enviando ? "Publicando..." : "Publicar reseña"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { padding: 20, alignItems: "stretch" },

  icono: {
    alignSelf: "center", width: 72, height: 72, borderRadius: 36, backgroundColor: "#FEF3C7",
    alignItems: "center", justifyContent: "center", marginTop: 8, marginBottom: 14,
  },
  titulo: { fontSize: 22, fontWeight: "800", color: colores.indigo, textAlign: "center" },
  subtitulo: { color: colores.textoSuave, textAlign: "center", marginTop: 4 },

  estrellas: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 24 },
  frase: { textAlign: "center", color: colores.indigo, fontWeight: "700", marginTop: 10, minHeight: 22 },

  label: { fontWeight: "700", color: colores.indigo, marginTop: 26, marginBottom: 8 },
  comentario: {
    backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde, borderRadius: radios.tarjeta,
    padding: 14, minHeight: 130, textAlignVertical: "top", fontSize: 15, color: colores.indigo,
  },

  barra: {
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: colores.blanco,
    borderTopWidth: 1, borderColor: colores.borde,
  },
  publicar: { backgroundColor: colores.acento, borderRadius: radios.boton, paddingVertical: 15, alignItems: "center" },
  inactivo: { backgroundColor: colores.textoPlaceholder },
  publicarTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },
});
