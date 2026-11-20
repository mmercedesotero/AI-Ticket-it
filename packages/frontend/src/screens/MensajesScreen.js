import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { useSesion } from "../sesion";
import { useNotificaciones } from "../notificaciones";
import { useRefrescar } from "../refrescar";
import Avatar from "../componentes/Avatar";
import { colores, radios } from "../tema";
import { horaOFecha } from "../formato";

const CORAL_OSCURO = "#B5503C";

// Todos los chats de la persona (comprador u organizador), el más reciente primero.
export default function MensajesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const { recargarMensajes } = useNotificaciones();
  const [chats, setChats] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setChats(await get("/compras/chats"));
      recargarMensajes();
    } catch {
      setChats((actuales) => actuales ?? []);
    }
  }, [recargarMensajes]);

  const { refreshProps, indicador } = useRefrescar(cargar);

  // Al entrar se actualiza, y mientras la pantalla está abierta se revisa cada pocos segundos.
  useFocusEffect(
    useCallback(() => {
      cargar();
      const intervalo = setInterval(cargar, 5000);
      return () => clearInterval(intervalo);
    }, [cargar])
  );

  useEffect(() => {
    navigation.setOptions({ title: "Mensajes" });
  }, [navigation]);

  const sinLeer = (chats ?? []).filter((c) => c.noLeidos > 0).length;

  return (
    <View style={styles.fondo}>
      {indicador}
      <FlatList
        data={chats ?? []}
        keyExtractor={(chat) => String(chat.compraId)}
        contentContainerStyle={[styles.lista, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        {...refreshProps}
        ListHeaderComponent={
          chats && chats.length > 0 ? (
            <Text style={styles.resumen}>{sinLeer > 0 ? `Tenés ${sinLeer} ${sinLeer === 1 ? "chat" : "chats"} sin leer` : "Estás al día"}</Text>
          ) : null
        }
        ListEmptyComponent={
          chats === null ? null : (
            <View style={styles.vacio}>
              <Ionicons name="chatbubbles-outline" size={48} color={colores.textoPlaceholder} />
              <Text style={styles.vacioTitulo}>Todavía no tenés mensajes</Text>
              <Text style={styles.vacioTexto}>
                {sesion.rol === "COMPRADOR"
                  ? "Cuando compres una entrada, podés escribirle al organizador desde el detalle del evento o desde tu entrada."
                  : "Cuando un comprador te escriba por uno de tus eventos, vas a ver la conversación acá."}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const mio = item.ultimoMensaje.autorRol === sesion.rol;
          const conNovedad = item.noLeidos > 0;

          return (
            <Pressable
              style={[styles.tarjeta, conNovedad && styles.tarjetaNueva]}
              onPress={() => navigation.navigate("Chat", { compraId: item.compraId })}
            >
              <Avatar foto={item.contraparte.foto} nombre={item.contraparte.nombre} tamano={52} organizacion={item.contraparte.esOrganizacion} />

              <View style={styles.cuerpo}>
                <View style={styles.fila}>
                  <Text style={[styles.nombre, conNovedad && styles.nombreFuerte]} numberOfLines={1}>{item.contraparte.nombre}</Text>
                  <Text style={styles.hora}>{horaOFecha(item.ultimoMensaje.fechaHora)}</Text>
                </View>

                <View style={styles.evento}>
                  <Ionicons name="calendar-outline" size={11} color={CORAL_OSCURO} />
                  <Text style={styles.eventoTexto} numberOfLines={1}>{item.evento.nombre}</Text>
                </View>

                <View style={styles.fila}>
                  <Text style={[styles.mensaje, conNovedad && styles.mensajeFuerte]} numberOfLines={2}>
                    {mio ? "Vos: " : ""}{item.ultimoMensaje.texto}
                  </Text>
                  {conNovedad && (
                    <View style={styles.insignia}>
                      <Text style={styles.insigniaTexto}>{item.noLeidos}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  lista: { padding: 16 },
  resumen: { color: colores.textoSuave, fontWeight: "600", marginBottom: 12 },

  tarjeta: {
    flexDirection: "row", gap: 12, backgroundColor: colores.blanco, borderRadius: radios.tarjeta,
    padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  tarjetaNueva: { backgroundColor: colores.acentoSuave, borderColor: "rgba(239,128,108,0.45)" },
  cuerpo: { flex: 1 },
  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  nombre: { flex: 1, color: colores.indigo, fontWeight: "600", fontSize: 15 },
  nombreFuerte: { fontWeight: "800" },
  hora: { color: colores.textoPlaceholder, fontSize: 12 },

  evento: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 3, marginBottom: 4,
    backgroundColor: "rgba(239,128,108,0.12)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, maxWidth: "100%",
  },
  eventoTexto: { color: CORAL_OSCURO, fontSize: 11, fontWeight: "600", flexShrink: 1 },

  mensaje: { flex: 1, color: colores.textoSuave, lineHeight: 19 },
  mensajeFuerte: { color: colores.indigo, fontWeight: "700" },
  insignia: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colores.acento, alignItems: "center",
    justifyContent: "center", paddingHorizontal: 6,
  },
  insigniaTexto: { color: colores.blanco, fontSize: 12, fontWeight: "800" },

  vacio: { alignItems: "center", marginTop: 80, gap: 8, paddingHorizontal: 24 },
  vacioTitulo: { fontSize: 18, fontWeight: "800", color: colores.indigo },
  vacioTexto: { color: colores.textoSuave, textAlign: "center", lineHeight: 20 },
});
