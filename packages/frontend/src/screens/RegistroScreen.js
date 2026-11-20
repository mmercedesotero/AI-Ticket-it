import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enviar } from "../api";
import { alerta } from "../dialogo";
import { useSesion } from "../sesion";
import Avatar from "../componentes/Avatar";
import Chip from "../componentes/Chip";
import Logo from "../componentes/Logo";
import { elegirFoto } from "../foto";
import { colores, estilosBase, radios } from "../tema";

const ROLES = [
  { clave: "COMPRADOR", titulo: "Comprador", detalle: "Busco eventos y entradas", icono: "ticket-outline" },
  { clave: "ORGANIZADOR", titulo: "Organizador", detalle: "Creo y vendo eventos", icono: "megaphone-outline" },
];

export default function RegistroScreen({ navigation }) {
  const { iniciarSesion } = useSesion();
  const insets = useSafeAreaInsets();
  const [rol, setRol] = useState("COMPRADOR");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [foto, setFoto] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const esOrganizador = rol === "ORGANIZADOR";

  const registrarme = async () => {
    if (enviando) return;

    if (!acepta) {
      alerta("Aceptá los términos", "Para crear tu cuenta tenés que aceptar los Términos y Condiciones.");
      return;
    }

    // El comprador escribe su nombre completo; el servidor guarda nombre y apellido por separado.
    let datos = { rol, nombre: nombre.trim(), email, password, foto };
    if (!esOrganizador) {
      const partes = nombre.trim().split(/\s+/);
      if (partes.length < 2) {
        alerta("Falta el apellido", "Escribí tu nombre y apellido.");
        return;
      }
      datos = { ...datos, nombre: partes[0], apellido: partes.slice(1).join(" ") };
    }

    setEnviando(true);
    try {
      iniciarSesion(await enviar("POST", "/auth/registro", datos));
    } catch (e) {
      alerta("No se pudo registrar", e.message);
      setEnviando(false);
    }
  };

  const verTerminos = () => navigation.navigate("Terminos");

  return (
    <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.contenedor, { paddingTop: insets.top + 12 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.volver}>
          <Ionicons name="arrow-back" size={24} color={colores.indigo} />
        </Pressable>

        <View style={styles.logo}>
          <Logo tamano={24} />
        </View>

        <Text style={styles.titulo}>Crear Cuenta</Text>
        <Text style={styles.subtitulo}>Elegí cómo querés usar la plataforma</Text>

        <View style={styles.roles}>
          {ROLES.map((r) => {
            const activo = rol === r.clave;
            return (
              <Pressable key={r.clave} style={[styles.rol, activo && styles.rolActivo]} onPress={() => setRol(r.clave)}>
                {activo && (
                  <View style={styles.rolCheck}>
                    <Ionicons name="checkmark" size={13} color={colores.blanco} />
                  </View>
                )}
                <Ionicons name={r.icono} size={30} color={activo ? colores.acento : colores.indigo} />
                <Text style={styles.rolTitulo}>{r.titulo}</Text>
                <Text style={styles.rolDetalle}>{r.detalle}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fotoBloque}>
          <Pressable
            onPress={async () => {
              const elegida = await elegirFoto();
              if (elegida) setFoto(elegida);
            }}
          >
            <Avatar foto={foto} nombre={nombre || "?"} tamano={88} organizacion={esOrganizador} color={esOrganizador ? undefined : colores.indigo} />
            <View style={styles.camara}>
              <Ionicons name="camera" size={14} color={colores.blanco} />
            </View>
          </Pressable>
          <View style={styles.fotoAcciones}>
            <Chip
              etiqueta={foto ? (esOrganizador ? "Cambiar logo" : "Cambiar foto") : (esOrganizador ? "Agregar logo (opcional)" : "Agregar foto (opcional)")}
              icono="image-outline"
              onPress={async () => {
                const elegida = await elegirFoto();
                if (elegida) setFoto(elegida);
              }}
            />
            {foto && <Chip etiqueta="Quitar" icono="trash-outline" onPress={() => setFoto(null)} />}
          </View>
        </View>

        <Text style={styles.label}>{esOrganizador ? "Nombre de la productora" : "Nombre completo"}</Text>
        <TextInput
          style={styles.campo}
          placeholder={esOrganizador ? "Ej. Producciones Norte" : "Ej. Mateo Fernández"}
          placeholderTextColor={colores.textoPlaceholder}
          autoCapitalize="words"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.campo}
          placeholder="ejemplo@correo.com"
          placeholderTextColor={colores.textoPlaceholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contraseña</Text>
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

        <View style={styles.terminos}>
          <Pressable onPress={() => setAcepta(!acepta)} hitSlop={8}>
            <Ionicons
              name={acepta ? "checkbox" : "square-outline"}
              size={24}
              color={acepta ? colores.acento : colores.textoPlaceholder}
            />
          </Pressable>
          <Text style={styles.terminosTexto}>
            Acepto los{" "}
            <Text style={styles.enlace} onPress={verTerminos}>
              Términos y Condiciones
            </Text>
          </Text>
        </View>

        <Pressable
          style={[estilosBase.botonPrimario, styles.boton, enviando && styles.enviando]}
          disabled={enviando}
          onPress={registrarme}
        >
          <Text style={estilosBase.botonPrimarioTexto}>{enviando ? "Creando cuenta..." : "Registrarme"}</Text>
        </Pressable>

        <Text style={styles.pie}>
          ¿Ya tenés cuenta?{" "}
          <Text style={styles.enlace} onPress={() => navigation.goBack()}>
            Iniciá sesión
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fotoBloque: { alignItems: "center", marginBottom: 6 },
  camara: {
    position: "absolute", right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colores.acento, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colores.fondo,
  },
  fotoAcciones: { flexDirection: "row", gap: 8, marginTop: 10 },
  fondo: { flex: 1, backgroundColor: colores.blanco },
  contenedor: { paddingHorizontal: 24, paddingBottom: 40 },
  volver: { alignSelf: "flex-start" },
  logo: { alignItems: "center", marginTop: 4, marginBottom: 22 },
  titulo: { textAlign: "center", fontSize: 28, fontWeight: "800", color: colores.indigo },
  subtitulo: { textAlign: "center", color: colores.textoSuave, marginTop: 4, marginBottom: 20 },

  roles: { flexDirection: "row", gap: 12, marginBottom: 8 },
  rol: {
    flex: 1, alignItems: "center", gap: 6, paddingVertical: 18, paddingHorizontal: 8,
    backgroundColor: colores.blanco, borderRadius: radios.tarjeta, borderWidth: 1.5, borderColor: colores.borde,
  },
  rolActivo: { borderColor: colores.acento, backgroundColor: colores.acentoSuave },
  rolCheck: {
    position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
    backgroundColor: colores.acento, alignItems: "center", justifyContent: "center",
  },
  rolTitulo: { fontWeight: "800", color: colores.indigo, fontSize: 16 },
  rolDetalle: { color: colores.textoSuave, fontSize: 12, textAlign: "center" },

  label: { fontWeight: "600", color: colores.indigo, marginBottom: 6, marginTop: 14 },
  campo: { ...estilosBase.campo },
  campoConIcono: { ...estilosBase.campo, flexDirection: "row", alignItems: "center" },
  inputPassword: { flex: 1, fontSize: 15, color: colores.indigo, padding: 0 },

  terminos: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 },
  terminosTexto: { color: colores.indigo, flexShrink: 1 },
  enlace: { color: colores.acento, fontWeight: "700" },

  boton: { marginTop: 20 },
  enviando: { opacity: 0.6 },
  pie: { textAlign: "center", color: colores.textoSuave, marginTop: 24 },
});
