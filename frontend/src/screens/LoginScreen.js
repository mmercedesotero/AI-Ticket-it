import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput,
} from "react-native";
import { enviar } from "../api";
import { useSesion } from "../sesion";

export default function LoginScreen() {
  const { iniciarSesion } = useSesion();
  const [registrando, setRegistrando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const enviarFormulario = async () => {
    try {
      const cuerpo = registrando
        ? { nombre, apellido, email, password }
        : { email, password };
      const respuesta = await enviar("POST", registrando ? "/auth/registro" : "/auth/login", cuerpo);
      iniciarSesion(respuesta);
    } catch (e) {
      Alert.alert(registrando ? "No se pudo registrar" : "No se pudo iniciar sesión", e.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>AI Ticket It</Text>
        <Text style={styles.subtitulo}>
          {registrando ? "Creá tu cuenta de comprador" : "Iniciá sesión"}
        </Text>

        {registrando && (
          <>
            <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Apellido" value={apellido} onChangeText={setApellido} />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable style={styles.boton} onPress={enviarFormulario}>
          <Text style={styles.botonTexto}>{registrando ? "Registrarme" : "Entrar"}</Text>
        </Pressable>

        <Pressable onPress={() => setRegistrando(!registrando)}>
          <Text style={styles.enlace}>
            {registrando ? "Ya tengo cuenta: iniciar sesión" : "No tengo cuenta: registrarme"}
          </Text>
        </Pressable>

        <Text style={styles.ayuda}>
          Cuentas de prueba (contraseña 123456):{"\n"}
          Comprador: ana@mail.com{"\n"}
          Organizador: live@mail.com
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "#fff" },
  contenedor: { flexGrow: 1, justifyContent: "center", padding: 24 },
  titulo: { fontSize: 32, fontWeight: "bold", textAlign: "center" },
  subtitulo: { textAlign: "center", color: "#666", marginBottom: 24, marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 10 },
  boton: { backgroundColor: "#222", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 6 },
  botonTexto: { color: "#fff", fontWeight: "bold" },
  enlace: { color: "#2f6fdb", textAlign: "center", marginTop: 16, fontWeight: "600" },
  ayuda: { color: "#888", textAlign: "center", marginTop: 32, fontSize: 12, lineHeight: 18 },
});
