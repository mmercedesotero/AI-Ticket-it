import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSesion } from "../sesion";

export default function PerfilScreen() {
  const { sesion, cerrarSesion } = useSesion();
  const { usuario, rol } = sesion;

  const nombreCompleto = usuario.apellido ? `${usuario.nombre} ${usuario.apellido}` : usuario.nombre;

  const salir = () => {
    Alert.alert("Cerrar sesión", "¿Querés cerrar tu sesión?", [
      { text: "No", style: "cancel" },
      { text: "Sí, cerrar", onPress: cerrarSesion },
    ]);
  };

  return (
    <View style={styles.contenedor}>
      <Text style={styles.nombre}>{nombreCompleto}</Text>
      <View style={styles.rol}>
        <Text style={styles.rolTexto}>{rol === "ORGANIZADOR" ? "Organizador" : "Comprador"}</Text>
      </View>
      {usuario.email && <Text style={styles.email}>{usuario.email}</Text>}

      <Pressable style={styles.salir} onPress={salir}>
        <Text style={styles.salirTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 24, alignItems: "center", paddingTop: 60 },
  nombre: { fontSize: 24, fontWeight: "bold" },
  rol: { backgroundColor: "#222", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  rolTexto: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  email: { color: "#666", marginTop: 10 },
  salir: { marginTop: 40, borderWidth: 1, borderColor: "#c0392b", borderRadius: 8, padding: 12, alignSelf: "stretch", alignItems: "center" },
  salirTexto: { color: "#c0392b", fontWeight: "600" },
});
