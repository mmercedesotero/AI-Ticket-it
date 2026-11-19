import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useNotificaciones } from "../notificaciones";
import { colores, radios } from "../tema";
import { formatearFechaHora, tiempoRelativo } from "../formato";

// Ícono y color de cada tipo de aviso.
const TIPOS = {
  COMPRA: { icono: "ticket-outline", color: colores.acento, fondo: colores.acentoSuave },
  PAGO_CONFIRMADO: { icono: "checkmark-circle", color: colores.exito, fondo: "#DCFCE7" },
  PAGO_RECHAZADO: { icono: "close-circle", color: colores.error, fondo: "#FEE2E2" },
  CANCELACION: { icono: "close-circle-outline", color: colores.textoSuave, fondo: "#F1F5F9" },
  REEMBOLSO: { icono: "cash-outline", color: "#7C3AED", fondo: "#EDE9FE" },
  EVENTO_AGOTADO: { icono: "flame", color: colores.acento, fondo: colores.acentoSuave },
  EVENTO_PUBLICADO: { icono: "megaphone-outline", color: "#2563EB", fondo: "#DBEAFE" },
  RESENIA: { icono: "star", color: "#D97706", fondo: "#FEF3C7" },
};

export default function NotificacionesScreen() {
  const insets = useSafeAreaInsets();
  const { notificaciones, noLeidas, recargar, marcarLeida, marcarTodasLeidas } = useNotificaciones();

  // Al entrar se actualiza la lista enseguida, sin esperar a la próxima consulta.
  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 8 }]}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Notificaciones</Text>
        <Text style={styles.resumen}>
          {noLeidas > 0 ? `Tenés ${noLeidas} sin leer` : "Estás al día"}
        </Text>
      </View>

      {noLeidas > 0 && (
        <Pressable style={styles.marcarTodas} onPress={marcarTodasLeidas}>
          <Ionicons name="checkmark-done" size={20} color={colores.blanco} />
          <Text style={styles.marcarTodasTexto}>Marcar todas como leídas</Text>
        </Pressable>
      )}

      <FlatList
        data={notificaciones}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="notifications-outline" size={48} color={colores.textoPlaceholder} />
            <Text style={styles.vacioTitulo}>Todavía no tenés notificaciones</Text>
            <Text style={styles.vacioTexto}>Acá vas a ver los avisos de tus compras y tus eventos.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const tipo = TIPOS[item.tipo] ?? TIPOS.COMPRA;
          return (
            <Pressable
              style={[styles.fila, !item.leida && styles.filaNoLeida]}
              onPress={() => !item.leida && marcarLeida(item.id)}
            >
              <View style={[styles.icono, { backgroundColor: tipo.fondo }]}>
                <Ionicons name={tipo.icono} size={22} color={tipo.color} />
              </View>
              <View style={styles.textos}>
                <Text style={[styles.filaTitulo, !item.leida && styles.filaTituloNoLeida]}>{item.titulo}</Text>
                <Text style={styles.mensaje}>{item.mensaje}</Text>
                <Text style={styles.hora}>
                  {tiempoRelativo(item.fechaHora)} · {formatearFechaHora(item.fechaHora)}
                </Text>
              </View>
              {!item.leida && <View style={styles.punto} />}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  encabezado: { paddingHorizontal: 16, marginBottom: 12 },
  titulo: { fontSize: 26, fontWeight: "800", color: colores.indigo },
  resumen: { color: colores.textoSuave, marginTop: 2 },
  marcarTodas: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colores.acento, borderRadius: radios.boton, paddingVertical: 14,
    marginHorizontal: 16, marginBottom: 8,
  },
  marcarTodasTexto: { color: colores.blanco, fontWeight: "700", fontSize: 15 },

  lista: { padding: 16, paddingTop: 8 },
  fila: {
    flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: colores.blanco,
    borderRadius: radios.tarjeta, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  filaNoLeida: { backgroundColor: colores.acentoSuave, borderColor: "#BBF7D0" },
  icono: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  textos: { flex: 1 },
  filaTitulo: { color: colores.indigo, fontWeight: "600", fontSize: 15 },
  filaTituloNoLeida: { fontWeight: "800" },
  mensaje: { color: colores.textoSuave, marginTop: 2, lineHeight: 19 },
  hora: { color: colores.textoPlaceholder, fontSize: 12, marginTop: 6 },
  punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colores.acento, marginTop: 4 },

  vacio: { alignItems: "center", marginTop: 80, gap: 8, paddingHorizontal: 24 },
  vacioTitulo: { fontSize: 18, fontWeight: "800", color: colores.indigo },
  vacioTexto: { color: colores.textoSuave, textAlign: "center" },
});
