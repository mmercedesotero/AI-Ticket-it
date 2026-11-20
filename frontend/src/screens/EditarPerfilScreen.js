import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enviar } from "../api";
import { alerta } from "../dialogo";
import { elegirFoto } from "../foto";
import { useSesion } from "../sesion";
import Avatar from "../componentes/Avatar";
import Chip from "../componentes/Chip";
import TelefonoInput from "../componentes/TelefonoInput";
import { colores, radios } from "../tema";

// Campo con la etiqueta chiquita arriba, como en el diseño.
function Campo({ etiqueta, children, derecha }) {
  return (
    <View style={styles.campo}>
      <View style={{ flex: 1 }}>
        <Text style={styles.campoEtiqueta}>{etiqueta}</Text>
        {children}
      </View>
      {derecha}
    </View>
  );
}

export default function EditarPerfilScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sesion, actualizarUsuario, cerrarSesion } = useSesion();
  const { usuario, rol } = sesion;
  const esOrganizador = rol === "ORGANIZADOR";

  const nombreInicial = esOrganizador ? usuario.nombre : `${usuario.nombre} ${usuario.apellido ?? ""}`.trim();
  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState(usuario.telefono ?? "");
  const [ciudad, setCiudad] = useState(usuario.ciudad ?? "");
  const [foto, setFoto] = useState(usuario.foto ?? null);
  const [pagoRapido, setPagoRapido] = useState(usuario.pagoRapido !== false);
  const [guardando, setGuardando] = useState(false);

  // Cambio de contraseña (se despliega al tocar "Cambiar").
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  // Eliminar cuenta (pide la contraseña para confirmar).
  const [eliminando, setEliminando] = useState(false);
  const [passwordEliminar, setPasswordEliminar] = useState("");

  const cambiarFoto = async () => {
    const nueva = await elegirFoto();
    if (nueva) setFoto(nueva);
  };

  const guardar = async () => {
    if (guardando) return;

    const datos = { telefono, ciudad, foto };
    if (esOrganizador) {
      datos.nombre = nombre;
    } else {
      const partes = nombre.trim().split(/\s+/);
      if (partes.length < 2) {
        alerta("Falta el apellido", "Escribí tu nombre y apellido.");
        return;
      }
      datos.nombre = partes[0];
      datos.apellido = partes.slice(1).join(" ");
      datos.pagoRapido = pagoRapido;
    }

    setGuardando(true);
    try {
      const respuesta = await enviar("PUT", "/auth/perfil", datos);
      actualizarUsuario(respuesta.usuario);
      alerta("¡Perfil actualizado!", "Tus cambios se guardaron correctamente.", [{ text: "Perfecto", onPress: () => navigation.goBack() }]);
    } catch (e) {
      alerta("No se pudo guardar", e.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardarPassword = async () => {
    if (guardandoPassword) return;
    setGuardandoPassword(true);
    try {
      await enviar("PUT", "/auth/password", { actual, nueva });
      setCambiandoPassword(false);
      setActual("");
      setNueva("");
      alerta("¡Contraseña actualizada!", "Ya podés usar tu contraseña nueva.", [{ text: "Perfecto" }]);
    } catch (e) {
      alerta("No se pudo cambiar", e.message);
    } finally {
      setGuardandoPassword(false);
    }
  };

  const eliminarCuenta = async () => {
    try {
      await enviar("DELETE", "/auth/cuenta", { password: passwordEliminar });
      cerrarSesion();
    } catch (e) {
      alerta("No se pudo eliminar", e.message);
    }
  };

  const pedirEliminar = () =>
    alerta("Eliminar cuenta", "Esta acción no se puede deshacer. ¿Querés continuar?", [
      { text: "No", style: "cancel" },
      { text: "Sí, continuar", style: "destructive", onPress: () => setEliminando(true) },
    ]);

  return (
    <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.contenedor, { paddingBottom: 130 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fotoBloque}>
          <Pressable onPress={cambiarFoto}>
            <Avatar foto={foto} nombre={nombre || "?"} tamano={104} />
            <View style={styles.camara}>
              <Ionicons name="camera" size={16} color={colores.blanco} />
            </View>
          </Pressable>
          <View style={styles.fotoAcciones}>
            <Chip etiqueta="Cambiar foto" icono="image-outline" onPress={cambiarFoto} />
            {foto && <Chip etiqueta="Quitar" icono="trash-outline" onPress={() => setFoto(null)} />}
          </View>
        </View>

        <Text style={styles.seccion}>Información personal</Text>
        <Campo etiqueta={esOrganizador ? "Nombre de la productora" : "Nombre completo"} derecha={<Ionicons name="pencil" size={16} color={colores.textoSuave} />}>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} autoCapitalize="words" />
        </Campo>
        <Campo etiqueta="Correo electrónico">
          <Text style={[styles.input, styles.inputBloqueado]}>{usuario.email ?? "-"}</Text>
        </Campo>
        <Campo etiqueta="Teléfono">
          <TelefonoInput valor={telefono} onChange={setTelefono} />
        </Campo>
        <Campo etiqueta="Ciudad / Ubicación" derecha={<Ionicons name="location-outline" size={18} color={colores.textoSuave} />}>
          <TextInput
            style={styles.input}
            value={ciudad}
            onChangeText={setCiudad}
            placeholder="Buenos Aires, Argentina"
            placeholderTextColor={colores.textoPlaceholder}
          />
        </Campo>

        <Text style={styles.seccion}>Seguridad</Text>
        <Campo
          etiqueta="Contraseña"
          derecha={
            <Pressable onPress={() => setCambiandoPassword((v) => !v)} hitSlop={8}>
              <Text style={styles.enlace}>{cambiandoPassword ? "Cancelar" : "Cambiar"}</Text>
            </Pressable>
          }
        >
          <Text style={styles.input}>••••••••••</Text>
        </Campo>

        {cambiandoPassword && (
          <View style={styles.desplegable}>
            <TextInput
              style={styles.inputSuelto}
              placeholder="Contraseña actual"
              placeholderTextColor={colores.textoPlaceholder}
              secureTextEntry
              autoCapitalize="none"
              value={actual}
              onChangeText={setActual}
            />
            <TextInput
              style={styles.inputSuelto}
              placeholder="Contraseña nueva (mínimo 6 caracteres)"
              placeholderTextColor={colores.textoPlaceholder}
              secureTextEntry
              autoCapitalize="none"
              value={nueva}
              onChangeText={setNueva}
            />
            <Chip
              etiqueta={guardandoPassword ? "Guardando..." : "Actualizar contraseña"}
              icono="lock-closed-outline"
              onPress={guardarPassword}
              style={{ alignSelf: "flex-end" }}
            />
          </View>
        )}

        {!esOrganizador && (
          <>
            <Text style={styles.seccion}>Preferencias</Text>
            <View style={styles.preferencia}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenciaTexto}>Guardar datos de pago rápido</Text>
                <Text style={styles.preferenciaAyuda}>Elige tu primera tarjeta al pagar.</Text>
              </View>
              <Switch
                value={pagoRapido}
                onValueChange={setPagoRapido}
                trackColor={{ false: colores.borde, true: "rgba(239,128,108,0.45)" }}
                thumbColor={pagoRapido ? colores.acento : "#F8FAFC"}
              />
            </View>
          </>
        )}

        {eliminando ? (
          <View style={styles.desplegable}>
            <Text style={styles.eliminarAviso}>Escribí tu contraseña para eliminar tu cuenta.</Text>
            <TextInput
              style={styles.inputSuelto}
              placeholder="Contraseña"
              placeholderTextColor={colores.textoPlaceholder}
              secureTextEntry
              autoCapitalize="none"
              value={passwordEliminar}
              onChangeText={setPasswordEliminar}
            />
            <View style={styles.eliminarFila}>
              <Chip etiqueta="Cancelar" onPress={() => { setEliminando(false); setPasswordEliminar(""); }} />
              <Pressable style={styles.eliminarConfirmar} onPress={eliminarCuenta}>
                <Text style={styles.eliminarConfirmarTexto}>Eliminar definitivamente</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.eliminar} onPress={pedirEliminar}>
            <Text style={styles.eliminarTexto}>Eliminar cuenta</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={[styles.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={[styles.guardar, guardando && { opacity: 0.6 }]} onPress={guardar} disabled={guardando}>
          <Text style={styles.guardarTexto}>{guardando ? "Guardando..." : "Guardar cambios"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { padding: 16 },

  fotoBloque: { alignItems: "center", marginTop: 4, marginBottom: 8 },
  camara: {
    position: "absolute", right: 0, bottom: 2, width: 34, height: 34, borderRadius: 17,
    backgroundColor: colores.acento, alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: colores.fondo,
  },
  fotoAcciones: { flexDirection: "row", gap: 8, marginTop: 14 },

  seccion: {
    fontSize: 12, fontWeight: "700", letterSpacing: 0.6, color: colores.textoSuave,
    textTransform: "uppercase", marginTop: 22, marginBottom: 10,
  },

  campo: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colores.blanco,
    borderWidth: 1, borderColor: colores.borde, borderRadius: radios.campo,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10,
  },
  campoEtiqueta: { fontSize: 12, color: colores.textoSuave },
  input: { fontSize: 16, color: colores.indigo, paddingVertical: 2, minHeight: 24 },
  inputBloqueado: { color: colores.textoSuave },
  enlace: { color: colores.acento, fontWeight: "700" },

  desplegable: {
    backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde, borderRadius: radios.campo,
    padding: 12, gap: 10, marginBottom: 10,
  },
  inputSuelto: {
    borderWidth: 1, borderColor: colores.borde, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: colores.indigo,
  },

  preferencia: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.blanco,
    borderWidth: 1, borderColor: colores.borde, borderRadius: radios.campo, paddingHorizontal: 14, paddingVertical: 10,
  },
  preferenciaTexto: { fontSize: 15, color: colores.indigo, fontWeight: "600" },
  preferenciaAyuda: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },

  eliminar: { alignItems: "center", paddingVertical: 24 },
  eliminarTexto: { color: colores.error, fontWeight: "700" },
  eliminarAviso: { color: colores.textoSuave },
  eliminarFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eliminarConfirmar: { backgroundColor: colores.error, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  eliminarConfirmarTexto: { color: colores.blanco, fontWeight: "700", fontSize: 13 },

  barra: {
    position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: colores.blanco, borderTopWidth: 1, borderColor: colores.borde,
  },
  guardar: { backgroundColor: colores.acento, borderRadius: radios.boton, paddingVertical: 15, alignItems: "center" },
  guardarTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },
});
