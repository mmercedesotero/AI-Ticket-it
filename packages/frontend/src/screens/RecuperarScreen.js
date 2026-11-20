import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enviar } from "../api";
import { alerta } from "../dialogo";
import { colores, estilosBase } from "../tema";

// Recuperar la contraseña en dos pasos: 1) pedir un código por email, 2) escribir el código y la contraseña nueva.
export default function RecuperarScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const pedirCodigo = async () => {
    if (enviando) return;

    setEnviando(true);
    try {
      const respuesta = await enviar("POST", "/auth/recuperar", { email });
      setPaso(2);

      // No hay servicio de email: el servidor devuelve el código para poder probar el flujo.
      if (respuesta.codigoSimulado) {
        alerta("Email simulado", `Tu código de recuperación es ${respuesta.codigoSimulado}.\n\nEn una app real te llegaría por correo.`);
      } else {
        alerta("Revisá tu correo", respuesta.mensaje);
      }
    } catch (e) {
      alerta("No se pudo enviar el código", e.message);
    } finally {
      setEnviando(false);
    }
  };

  const cambiarPassword = async () => {
    if (enviando) return;

    setEnviando(true);
    try {
      const respuesta = await enviar("POST", "/auth/restablecer", { email, codigo, password });
      alerta("¡Contraseña actualizada!", respuesta.mensaje, [
        { text: "Ir a iniciar sesión", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      alerta("No se pudo cambiar la contraseña", e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.contenedor, { paddingTop: insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => (paso === 2 ? setPaso(1) : navigation.goBack())} hitSlop={10} style={styles.volver}>
          <Ionicons name="arrow-back" size={24} color={colores.indigo} />
        </Pressable>

        <View style={styles.icono}>
          <Ionicons name={paso === 1 ? "mail-outline" : "key-outline"} size={36} color={colores.acento} />
        </View>

        <Text style={styles.titulo}>{paso === 1 ? "¿Olvidaste tu contraseña?" : "Elegí una contraseña nueva"}</Text>
        <Text style={styles.subtitulo}>
          {paso === 1
            ? "Escribí tu correo y te enviamos un código para recuperarla."
            : `Ingresá el código que enviamos a ${email.trim()} y tu nueva contraseña.`}
        </Text>

        {paso === 1 ? (
          <>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={estilosBase.campo}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={colores.textoPlaceholder}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Pressable
              style={[estilosBase.botonPrimario, styles.boton, enviando && styles.enviando]}
              disabled={enviando}
              onPress={pedirCodigo}
            >
              <Text style={estilosBase.botonPrimarioTexto}>{enviando ? "Enviando..." : "Enviar código"}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Código de 6 dígitos</Text>
            <TextInput
              style={[estilosBase.campo, styles.codigo]}
              placeholder="000000"
              placeholderTextColor={colores.textoPlaceholder}
              keyboardType="number-pad"
              maxLength={6}
              value={codigo}
              onChangeText={(t) => setCodigo(t.replace(/\D/g, ""))}
            />

            <Text style={styles.label}>Contraseña nueva</Text>
            <View style={styles.campoConIcono}>
              <TextInput
                style={styles.inputPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colores.textoPlaceholder}
                secureTextEntry={!verPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setVerPassword(!verPassword)} hitSlop={10}>
                <Ionicons name={verPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colores.textoSuave} />
              </Pressable>
            </View>

            <Pressable
              style={[estilosBase.botonPrimario, styles.boton, enviando && styles.enviando]}
              disabled={enviando}
              onPress={cambiarPassword}
            >
              <Text style={estilosBase.botonPrimarioTexto}>{enviando ? "Guardando..." : "Cambiar contraseña"}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.blanco },
  contenedor: { paddingHorizontal: 24, paddingBottom: 40 },
  volver: { alignSelf: "flex-start" },
  icono: {
    alignSelf: "center", width: 76, height: 76, borderRadius: 38, backgroundColor: colores.acentoSuave,
    alignItems: "center", justifyContent: "center", marginTop: 24, marginBottom: 18,
  },
  titulo: { textAlign: "center", fontSize: 24, fontWeight: "800", color: colores.indigo },
  subtitulo: { textAlign: "center", color: colores.textoSuave, marginTop: 8, marginBottom: 22, lineHeight: 20 },
  label: { fontWeight: "600", color: colores.indigo, marginBottom: 6, marginTop: 10 },
  codigo: { fontSize: 22, letterSpacing: 8, textAlign: "center", fontWeight: "700" },
  campoConIcono: { ...estilosBase.campo, flexDirection: "row", alignItems: "center" },
  inputPassword: { flex: 1, fontSize: 15, color: colores.indigo, padding: 0 },
  boton: { marginTop: 22 },
  enviando: { opacity: 0.6 },
});
