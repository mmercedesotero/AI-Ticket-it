import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { registrarDialogo } from "../dialogo";
import { colores, radios } from "../tema";

// Elige el ícono según de qué trata el aviso.
function iconoDe({ titulo, botones }) {
  if (/^no se pudo|error|rechaz/i.test(titulo)) return { nombre: "alert-circle-outline", color: colores.error, fondo: "#FEE2E2" };
  if (/^¡|gracias|^listo|actualizad|guardad|eliminad/i.test(titulo)) return { nombre: "checkmark-circle-outline", color: colores.exito, fondo: "#DCFCE7" };
  if (botones.some((b) => b.style === "destructive")) return { nombre: "warning-outline", color: colores.error, fondo: "#FEE2E2" };
  if (botones.length > 1) return { nombre: "help-circle-outline", color: colores.acento, fondo: colores.acentoSuave };
  return { nombre: "information-circle-outline", color: colores.indigo, fondo: "#E2E8F0" };
}

// Se coloca una sola vez en App.js: muestra los avisos que se pidan con alerta(), como una hoja desde abajo.
export default function DialogoRaiz() {
  const insets = useSafeAreaInsets();
  const [dialogo, setDialogo] = useState(null);
  const subida = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    registrarDialogo((nuevo) => {
      subida.setValue(320);
      setDialogo(nuevo);
      Animated.spring(subida, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }).start();
    });
    return () => registrarDialogo(null);
  }, [subida]);

  const cerrar = (boton) => {
    setDialogo(null);
    if (boton?.onPress) boton.onPress();
  };

  if (!dialogo) return null;

  const icono = iconoDe(dialogo);
  const cancelar = dialogo.botones.find((b) => b.style === "cancel");
  const acciones = dialogo.botones.filter((b) => b !== cancelar);

  return (
    <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={() => cerrar(cancelar ?? null)}>
      <View style={styles.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => cerrar(cancelar ?? null)} />
        <Animated.View style={[styles.hoja, { paddingBottom: insets.bottom + 18, transform: [{ translateY: subida }] }]}>
          <View style={styles.agarre} />

          <View style={[styles.icono, { backgroundColor: icono.fondo }]}>
            <Ionicons name={icono.nombre} size={34} color={icono.color} />
          </View>

          <Text style={styles.titulo}>{dialogo.titulo}</Text>
          {!!dialogo.mensaje && <Text style={styles.mensaje}>{dialogo.mensaje}</Text>}

          <View style={styles.botones}>
            {acciones.map((boton, i) => (
              <Pressable
                key={i}
                style={[styles.boton, boton.style === "destructive" ? styles.botonPeligro : styles.botonPrincipal]}
                onPress={() => cerrar(boton)}
              >
                <Text style={styles.botonTexto}>{boton.text}</Text>
              </Pressable>
            ))}
            {cancelar && (
              <Pressable style={styles.cancelar} onPress={() => cerrar(cancelar)}>
                <Text style={styles.cancelarTexto}>{cancelar.text}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end" },
  hoja: {
    backgroundColor: colores.blanco, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 10, alignItems: "center",
  },
  agarre: { width: 40, height: 4, borderRadius: 2, backgroundColor: colores.borde, marginBottom: 18 },
  icono: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  titulo: { fontSize: 20, fontWeight: "800", color: colores.indigo, textAlign: "center" },
  mensaje: { color: colores.textoSuave, textAlign: "center", marginTop: 8, lineHeight: 20 },

  botones: { alignSelf: "stretch", marginTop: 22, gap: 4 },
  boton: { borderRadius: radios.boton, paddingVertical: 15, alignItems: "center", marginBottom: 6 },
  botonPrincipal: { backgroundColor: colores.acento },
  botonPeligro: { backgroundColor: colores.error },
  botonTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },
  cancelar: { paddingVertical: 12, alignItems: "center" },
  cancelarTexto: { color: colores.textoSuave, fontWeight: "600", fontSize: 15 },
});
