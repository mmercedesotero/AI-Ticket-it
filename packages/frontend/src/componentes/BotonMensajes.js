import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useNotificaciones } from "../notificaciones";
import { colores } from "../tema";

// Ícono de mensajes con la cantidad de chats sin leer. Abre la pantalla Mensajes.
export default function BotonMensajes({ color = colores.indigo, fondo }) {
  const navigation = useNavigation();
  const { mensajesSinLeer } = useNotificaciones();

  return (
    <Pressable
      style={[styles.boton, fondo && { backgroundColor: fondo }]}
      onPress={() => navigation.navigate("Mensajes")}
      hitSlop={8}
    >
      <Ionicons name="chatbubble-ellipses-outline" size={22} color={color} />
      {mensajesSinLeer > 0 && (
        <View style={styles.insignia}>
          <Text style={styles.insigniaTexto}>{mensajesSinLeer > 9 ? "9+" : mensajesSinLeer}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  insignia: {
    position: "absolute", top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colores.acento,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4, borderWidth: 2, borderColor: colores.blanco,
  },
  insigniaTexto: { color: colores.blanco, fontSize: 10, fontWeight: "800" },
});
