import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CORAL_OSCURO = "#B5503C";

// Botoncito chico en coral transparente: sirve de filtro (activo / inactivo) y de acción suelta.
export default function Chip({ etiqueta, icono, activo = false, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, activo && styles.chipActivo, style]}>
      {icono && <Ionicons name={icono} size={14} color={CORAL_OSCURO} />}
      <Text style={[styles.texto, activo && styles.textoActivo]}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 32, flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: "rgba(239,128,108,0.30)", backgroundColor: "rgba(239,128,108,0.10)",
    borderRadius: 16, paddingHorizontal: 13,
  },
  chipActivo: { backgroundColor: "rgba(239,128,108,0.30)", borderColor: "#EF806C" },
  texto: { color: CORAL_OSCURO, fontWeight: "600", fontSize: 13 },
  textoActivo: { fontWeight: "800" },
});
