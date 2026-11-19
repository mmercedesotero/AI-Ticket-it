import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { registrarDialogo } from "../dialogo";
import { colores, radios } from "../tema";

// Elige el ícono según de qué trata el aviso.
function iconoDe({ titulo, botones }) {
  if (/^no se pudo|error|rechaz/i.test(titulo)) return { nombre: "alert-circle", color: colores.error, fondo: "#FEE2E2" };
  if (/^¡|gracias/i.test(titulo)) return { nombre: "checkmark-circle", color: colores.exito, fondo: "#DCFCE7" };
  if (botones.some((b) => b.style === "destructive")) return { nombre: "warning", color: colores.error, fondo: "#FEE2E2" };
  if (botones.length > 1) return { nombre: "help-circle", color: colores.acento, fondo: colores.acentoSuave };
  return { nombre: "information-circle", color: colores.indigo, fondo: "#E2E8F0" };
}

// Se coloca una sola vez en App.js: muestra los avisos que se pidan con alerta().
export default function DialogoRaiz() {
  const [dialogo, setDialogo] = useState(null);
  const escala = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    registrarDialogo((nuevo) => {
      escala.setValue(0.85);
      setDialogo(nuevo);
      Animated.spring(escala, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
    });
    return () => registrarDialogo(null);
  }, [escala]);

  const cerrar = (boton) => {
    setDialogo(null);
    if (boton?.onPress) boton.onPress();
  };

  if (!dialogo) return null;

  const icono = iconoDe(dialogo);
  const dosBotones = dialogo.botones.length === 2;

  return (
    <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={() => cerrar(null)}>
      <View style={styles.fondo}>
        <Animated.View style={[styles.tarjeta, { transform: [{ scale: escala }] }]}>
          <View style={[styles.icono, { backgroundColor: icono.fondo }]}>
            <Ionicons name={icono.nombre} size={34} color={icono.color} />
          </View>

          <Text style={styles.titulo}>{dialogo.titulo}</Text>
          {!!dialogo.mensaje && <Text style={styles.mensaje}>{dialogo.mensaje}</Text>}

          <View style={[styles.botones, dosBotones && styles.botonesFila]}>
            {dialogo.botones.map((boton, i) => {
              const cancelar = boton.style === "cancel";
              const peligro = boton.style === "destructive";
              return (
                <Pressable
                  key={i}
                  style={[
                    styles.boton,
                    dosBotones && styles.botonMitad,
                    cancelar ? styles.botonCancelar : peligro ? styles.botonPeligro : styles.botonPrincipal,
                  ]}
                  onPress={() => cerrar(boton)}
                >
                  <Text style={[styles.botonTexto, cancelar && styles.botonCancelarTexto]}>{boton.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", alignItems: "center", justifyContent: "center", padding: 28 },
  tarjeta: {
    alignSelf: "stretch", backgroundColor: colores.blanco, borderRadius: 24, padding: 24, alignItems: "center",
  },
  icono: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  titulo: { fontSize: 19, fontWeight: "800", color: colores.indigo, textAlign: "center" },
  mensaje: { color: colores.textoSuave, textAlign: "center", marginTop: 8, lineHeight: 20 },

  botones: { alignSelf: "stretch", gap: 10, marginTop: 22 },
  botonesFila: { flexDirection: "row" },
  boton: { borderRadius: radios.boton, paddingVertical: 14, alignItems: "center" },
  botonMitad: { flex: 1 },
  botonPrincipal: { backgroundColor: colores.acento },
  botonPeligro: { backgroundColor: colores.error },
  botonCancelar: { backgroundColor: "#F1F5F9" },
  botonTexto: { color: colores.blanco, fontWeight: "700", fontSize: 15 },
  botonCancelarTexto: { color: colores.indigo },
});
