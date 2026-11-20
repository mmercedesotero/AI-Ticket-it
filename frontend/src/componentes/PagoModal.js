import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colores, radios } from "../tema";

const VERDE = "#148C5E";

// Pantalla completa del pago: "procesando" -> "exito" (se expande un círculo verde con el tilde) o "error".
// estado: null (oculto) | "procesando" | "exito" | "error"
export default function PagoModal({ estado, monto, mensaje, onContinuar, textoContinuar, onComprobante, onReintentar, onCerrar }) {
  const { width, height } = useWindowDimensions();
  const circulo = useRef(new Animated.Value(0)).current;
  const tilde = useRef(new Animated.Value(0)).current;

  // El círculo tiene que tapar toda la pantalla cuando termina de crecer.
  const diametro = Math.hypot(width, height) * 1.1;

  useEffect(() => {
    if (estado === "exito") {
      circulo.setValue(0);
      tilde.setValue(0);
      Animated.sequence([
        Animated.timing(circulo, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(tilde, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [estado, circulo, tilde]);

  return (
    <Modal visible={estado !== null} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.pantalla}>
        {estado === "procesando" && (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color={colores.acento} />
            <Text style={styles.titulo}>Procesando tu pago...</Text>
            <Text style={styles.subtitulo}>No cierres la aplicación</Text>
          </View>
        )}

        {estado === "exito" && (
          <>
            <Animated.View
              style={[
                styles.circuloVerde,
                {
                  width: diametro,
                  height: diametro,
                  borderRadius: diametro / 2,
                  left: (width - diametro) / 2,
                  top: (height - diametro) / 2,
                  transform: [{ scale: circulo }],
                },
              ]}
            />
            <View style={styles.centro}>
              <Animated.View style={{ opacity: tilde, transform: [{ scale: tilde }] }}>
                <View style={styles.tilde}>
                  <Ionicons name="checkmark" size={72} color={VERDE} />
                </View>
              </Animated.View>
              <Animated.View style={{ opacity: tilde, alignItems: "center" }}>
                <Text style={styles.tituloBlanco}>¡Pagaste {monto}!</Text>
                <Text style={styles.subtituloBlanco}>{mensaje}</Text>
                <Pressable style={styles.botonBlanco} onPress={onContinuar}>
                  <Text style={styles.botonBlancoTexto}>{textoContinuar}</Text>
                </Pressable>
                {onComprobante && (
                  <Pressable style={styles.botonContorno} onPress={onComprobante}>
                    <Ionicons name="document-text-outline" size={18} color={colores.blanco} />
                    <Text style={styles.botonContornoTexto}>Descargar comprobante</Text>
                  </Pressable>
                )}
              </Animated.View>
            </View>
          </>
        )}

        {estado === "error" && (
          <View style={styles.centro}>
            <Ionicons name="close-circle" size={88} color={colores.error} />
            <Text style={styles.titulo}>No se pudo completar el pago</Text>
            <Text style={styles.subtitulo}>{mensaje}</Text>
            {onReintentar && (
              <Pressable style={styles.botonCoral} onPress={onReintentar}>
                <Text style={styles.botonCoralTexto}>Reintentar</Text>
              </Pressable>
            )}
            <Pressable style={styles.botonSecundario} onPress={onCerrar}>
              <Text style={styles.botonSecundarioTexto}>Cerrar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.blanco, overflow: "hidden" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  circuloVerde: { position: "absolute", backgroundColor: VERDE },

  titulo: { fontSize: 22, fontWeight: "800", color: colores.indigo, textAlign: "center", marginTop: 8 },
  subtitulo: { color: colores.textoSuave, textAlign: "center" },

  tilde: {
    width: 130, height: 130, borderRadius: 65, backgroundColor: colores.blanco,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  tituloBlanco: { fontSize: 28, fontWeight: "800", color: colores.blanco, textAlign: "center" },
  subtituloBlanco: { color: "rgba(255,255,255,0.9)", textAlign: "center", marginTop: 6 },
  botonBlanco: {
    marginTop: 32, backgroundColor: colores.blanco, borderRadius: radios.boton,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  botonBlancoTexto: { color: VERDE, fontWeight: "800", fontSize: 16 },
  botonContorno: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.9)", borderRadius: radios.boton,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  botonContornoTexto: { color: colores.blanco, fontWeight: "700", fontSize: 15 },

  botonCoral: { marginTop: 20, backgroundColor: colores.acento, borderRadius: radios.boton, paddingHorizontal: 36, paddingVertical: 14 },
  botonCoralTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },
  botonSecundario: { paddingVertical: 12 },
  botonSecundarioTexto: { color: colores.textoSuave, fontWeight: "600" },
});
