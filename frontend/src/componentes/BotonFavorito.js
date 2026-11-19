import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colores } from "../tema";

// Circulito con un corazón: lleno si el evento es favorito, de contorno si no.
export default function BotonFavorito({ activo, onPress, tamano = 38 }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[styles.circulo, { width: tamano, height: tamano, borderRadius: tamano / 2 }]}
    >
      <Ionicons
        name={activo ? "heart" : "heart-outline"}
        size={tamano * 0.55}
        color={activo ? colores.acento : colores.indigo}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circulo: {
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
});
