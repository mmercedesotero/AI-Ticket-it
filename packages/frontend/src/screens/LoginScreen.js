import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { enviar } from "../api";
import { alerta } from "../dialogo";
import { useSesion } from "../sesion";
import Logo from "../componentes/Logo";
import { colores, estilosBase } from "../tema";

export default function LoginScreen({ navigation }) {
  const { iniciarSesion } = useSesion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    if (enviando) return;

    setEnviando(true);
    try {
      iniciarSesion(await enviar("POST", "/auth/login", { email, password }));
    } catch (e) {
      alerta("No se pudo iniciar sesión", e.message);
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Logo tamano={30} />
        </View>

        <Text style={styles.bienvenida}>Entradas a un Click</Text>
        <Text style={styles.titulo}>Iniciar Sesión</Text>

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.campo}
          placeholder="ejemplo@correo.com"
          placeholderTextColor={colores.textoPlaceholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.campoConIcono}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Tu contraseña"
            placeholderTextColor={colores.textoPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!verPassword}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setVerPassword(!verPassword)} hitSlop={10}>
            <Ionicons name={verPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colores.textoSuave} />
          </Pressable>
        </View>

        <Pressable style={styles.olvide} onPress={() => navigation.navigate("Recuperar")} hitSlop={8}>
          <Text style={styles.enlace}>¿Olvidaste tu contraseña?</Text>
        </Pressable>

        <Pressable
          style={[estilosBase.botonPrimario, styles.boton, enviando && styles.enviando]}
          disabled={enviando}
          onPress={entrar}
        >
          <Text style={estilosBase.botonPrimarioTexto}>{enviando ? "Ingresando..." : "Ingresar"}</Text>
        </Pressable>

        <Text style={styles.pie}>
          ¿No tenés cuenta?{" "}
          <Text style={styles.enlace} onPress={() => navigation.navigate("Registro")}>
            Registrate
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.blanco },
  contenedor: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 },
  logo: { alignItems: "center", marginBottom: 40 },
  bienvenida: { textAlign: "center", color: colores.textoSuave, fontSize: 16, marginBottom: 15, marginTop: -20 },
  titulo: { textAlign: "center", fontSize: 28, fontWeight: "800", color: colores.indigo, marginTop: 4, marginBottom: 28 },
  label: { fontWeight: "600", color: colores.indigo, marginBottom: 6, marginTop: 4 },
  campo: { ...estilosBase.campo, marginBottom: 12 },
  campoConIcono: { ...estilosBase.campo, flexDirection: "row", alignItems: "center", marginBottom: 8 },
  inputPassword: { flex: 1, fontSize: 15, color: colores.indigo, padding: 0 },
  olvide: { alignSelf: "flex-end", marginBottom: 8, marginTop: 10 },
  boton: { marginTop: 12 },
  enviando: { opacity: 0.6 },
  pie: { textAlign: "center", color: colores.textoSuave, marginTop: 28, fontSize: 15 },
  enlace: { color: colores.acento, fontWeight: "700" },
});
