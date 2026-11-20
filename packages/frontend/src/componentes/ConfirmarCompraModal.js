import { useEffect, useRef, useState } from "react";
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { get } from "../api";
import TicketCard from "./TicketCard";
import { iconoDe } from "./TarjetaEvento";
import { colores, radios } from "../tema";
import { formatearFechaLarga, formatearPrecio } from "../formato";
import { imagenDe } from "../imagenes";

// Hoja "Confirmar compra": resumen del evento, las entradas, la tarjeta y el total antes de pagar.
export default function ConfirmarCompraModal({ visible, evento, elegidas, tarjetaId, total, onConfirmar, onCancelar }) {
  const insets = useSafeAreaInsets();
  const subida = useRef(new Animated.Value(400)).current;
  const [tarjeta, setTarjeta] = useState(null);

  useEffect(() => {
    if (!visible) return;
    subida.setValue(400);
    Animated.spring(subida, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }).start();
    get("/tarjetas")
      .then((lista) => setTarjeta(lista.find((t) => t.id === tarjetaId) ?? null))
      .catch(() => setTarjeta(null));
  }, [visible, tarjetaId, subida]);

  if (!evento) return null;
  const foto = imagenDe(evento);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancelar}>
      <View style={styles.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancelar} />
        <Animated.View style={[styles.hoja, { paddingBottom: insets.bottom + 18, transform: [{ translateY: subida }] }]}>
          <View style={styles.agarre} />

          <View style={styles.icono}>
            <Ionicons name="ticket-outline" size={32} color={colores.acento} />
          </View>
          <Text style={styles.titulo}>Confirmar compra</Text>
          <Text style={styles.subtitulo}>Revisá los detalles antes de finalizar el pago</Text>

          <View style={styles.ticket}>
            <TicketCard
              fondo={colores.blanco}
              arriba={
                <View style={styles.arriba}>
                  <View style={styles.miniatura}>
                    {foto ? (
                      <Image source={foto} style={styles.foto} resizeMode="cover" />
                    ) : (
                      <Ionicons name={iconoDe(evento)} size={28} color={colores.acento} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    {evento.categoria?.nombre && (
                      <View style={styles.categoria}>
                        <Text style={styles.categoriaTexto}>{evento.categoria.nombre}</Text>
                      </View>
                    )}
                    <Text style={styles.nombre} numberOfLines={2}>{evento.nombre}</Text>
                    <View style={styles.linea}>
                      <Ionicons name="calendar-outline" size={14} color={colores.textoSuave} />
                      <Text style={styles.lineaTexto}>{formatearFechaLarga(evento.fecha)}</Text>
                    </View>
                    <View style={styles.linea}>
                      <Ionicons name="business-outline" size={14} color={colores.textoSuave} />
                      <Text style={styles.lineaTexto} numberOfLines={1}>{evento.organizador?.nombre}</Text>
                    </View>
                  </View>
                </View>
              }
              abajo={
                <View>
                  <View style={styles.fila}>
                    <Text style={styles.etiqueta}>Entradas</Text>
                    <View style={{ alignItems: "flex-end", flex: 1 }}>
                      {elegidas.map((e) => (
                        <Text key={e.tipo.id} style={styles.valor}>{e.cantidad}x {e.tipo.nombre}</Text>
                      ))}
                    </View>
                  </View>
                  <View style={[styles.fila, { marginTop: 10 }]}>
                    <Text style={styles.etiqueta}>Método de pago</Text>
                    <View style={styles.tarjeta}>
                      <Ionicons name="card-outline" size={18} color={colores.indigo} />
                      <Text style={styles.valor}>
                        {tarjeta ? `${tarjeta.marca} •••• ${tarjeta.ultimos4}` : "Tarjeta"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.totalFila}>
                    <Text style={styles.totalEtiqueta}>Total</Text>
                    <Text style={styles.total}>{formatearPrecio(total)}</Text>
                  </View>
                </View>
              }
            />
          </View>

          <Pressable style={styles.confirmar} onPress={onConfirmar}>
            <Text style={styles.confirmarTexto}>Confirmar y pagar</Text>
          </Pressable>
          <Pressable style={styles.cancelar} onPress={onCancelar}>
            <Text style={styles.cancelarTexto}>Cancelar</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end" },
  hoja: {
    backgroundColor: colores.blanco, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 18, paddingTop: 10, alignItems: "center",
  },
  agarre: { width: 40, height: 4, borderRadius: 2, backgroundColor: colores.borde, marginBottom: 16 },
  icono: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colores.acentoSuave,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  titulo: { fontSize: 22, fontWeight: "800", color: colores.indigo },
  subtitulo: { color: colores.textoSuave, marginTop: 4, marginBottom: 16, textAlign: "center" },

  ticket: { alignSelf: "stretch" },
  arriba: { flexDirection: "row", gap: 12 },
  miniatura: {
    width: 78, height: 78, borderRadius: 10, overflow: "hidden", backgroundColor: colores.indigo,
    alignItems: "center", justifyContent: "center",
  },
  foto: { width: "100%", height: "100%" },
  categoria: {
    alignSelf: "flex-start", backgroundColor: colores.acentoSuave, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4,
  },
  categoriaTexto: { color: "#B5503C", fontSize: 11, fontWeight: "700" },
  nombre: { fontSize: 17, fontWeight: "800", color: colores.indigo },
  linea: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  lineaTexto: { color: colores.textoSuave, fontSize: 13, flexShrink: 1 },

  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  etiqueta: { color: colores.textoSuave, fontSize: 14 },
  valor: { color: colores.indigo, fontWeight: "700", fontSize: 14 },
  tarjeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  totalFila: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colores.borde,
  },
  totalEtiqueta: { fontWeight: "800", color: colores.indigo, fontSize: 16 },
  total: { fontWeight: "800", color: colores.acento, fontSize: 22 },

  confirmar: {
    alignSelf: "stretch", backgroundColor: colores.acento, borderRadius: radios.boton,
    paddingVertical: 15, alignItems: "center", marginTop: 4,
  },
  confirmarTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },
  cancelar: { paddingVertical: 14 },
  cancelarTexto: { color: colores.textoSuave, fontWeight: "600", fontSize: 15 },
});
