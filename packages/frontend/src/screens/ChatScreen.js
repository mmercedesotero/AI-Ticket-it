import { alerta } from "../dialogo";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enviar, get } from "../api";
import { useSesion } from "../sesion";
import { colores } from "../tema";
import { formatearFechaLarga } from "../formato";

const hora = (iso) => {
  const f = new Date(iso);
  return `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
};

export default function ChatScreen({ route, navigation }) {
  const { compraId } = route.params;
  const { sesion } = useSesion();
  const rol = sesion.rol;
  const insets = useSafeAreaInsets();
  const [compra, setCompra] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const lista = useRef(null);

  const cargarMensajes = useCallback(() => {
    get(`/compras/${compraId}/mensajes`).then(setMensajes).catch(() => {});
  }, [compraId]);

  useEffect(() => {
    get(`/compras/${compraId}`).then(setCompra).catch(() => {});
    cargarMensajes();
    const intervalo = setInterval(cargarMensajes, 3000);
    return () => clearInterval(intervalo);
  }, [compraId, cargarMensajes]);

  // El servidor sabe quién sos por el token: solo mandamos el texto.
  const enviarMensaje = async () => {
    if (texto.trim() === "") return;

    try {
      await enviar("POST", `/compras/${compraId}/mensajes`, { texto });
      setTexto("");
      cargarMensajes();
    } catch (e) {
      alerta("No se pudo enviar", e.message);
    }
  };

  // Con quién hablo: el organizador si soy comprador, y el comprador si soy organizador.
  const interlocutor = compra
    ? rol === "COMPRADOR"
      ? compra.evento.organizador?.nombre ?? "Organizador"
      : `${compra.comprador.nombre} ${compra.comprador.apellido}`
    : "";
  const subtitulo = rol === "COMPRADOR" ? "Organizador" : "Comprador";

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.encabezado, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colores.indigo} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{interlocutor.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.nombre}>{interlocutor}</Text>
          <Text style={styles.subtitulo}>{subtitulo}</Text>
        </View>
      </View>

      {compra && (
        <View style={styles.consulta}>
          <Ionicons name="ticket-outline" size={22} color={colores.acento} />
          <View style={styles.consultaTextos}>
            <Text style={styles.consultaEtiqueta}>Consulta sobre:</Text>
            <Text style={styles.consultaEvento} numberOfLines={1}>{compra.evento.nombre}</Text>
          </View>
          <View style={styles.fecha}>
            <Ionicons name="calendar-outline" size={13} color={colores.textoSuave} />
            <Text style={styles.fechaTexto}>{formatearFechaLarga(compra.evento.fecha)}</Text>
          </View>
        </View>
      )}

      <FlatList
        ref={lista}
        data={mensajes}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.mensajes}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={styles.vacio}>Todavía no hay mensajes. ¡Escribí el primero!</Text>}
        renderItem={({ item }) => {
          const mio = item.autor.rol === rol;
          return (
            <View style={[styles.burbuja, mio ? styles.mia : styles.otra]}>
              <Text style={mio ? styles.textoMio : styles.textoOtro}>{item.texto}</Text>
              <Text style={[styles.hora, mio ? styles.horaMia : styles.horaOtra]}>{hora(item.fechaHora)}</Text>
            </View>
          );
        }}
      />

      <View style={[styles.barra, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colores.textoPlaceholder}
          value={texto}
          onChangeText={setTexto}
        />
        <Pressable style={styles.enviar} onPress={enviarMensaje}>
          <Ionicons name="paper-plane" size={18} color={colores.blanco} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.blanco },

  encabezado: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: colores.blanco, fontWeight: "800", fontSize: 16 },
  nombre: { fontWeight: "800", color: colores.indigo, fontSize: 16 },
  subtitulo: { color: colores.textoSuave, fontSize: 12 },

  consulta: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colores.fondo, borderBottomWidth: 1, borderColor: colores.borde,
  },
  consultaTextos: { flex: 1 },
  consultaEtiqueta: { color: colores.textoSuave, fontSize: 12 },
  consultaEvento: { fontWeight: "700", color: colores.indigo },
  fecha: {
    flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: colores.borde,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colores.blanco,
  },
  fechaTexto: { fontSize: 11, color: colores.textoSuave },

  mensajes: { padding: 16, flexGrow: 1 },
  vacio: { textAlign: "center", marginTop: 40, color: colores.textoPlaceholder },
  burbuja: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  mia: { alignSelf: "flex-end", backgroundColor: colores.acento, borderBottomRightRadius: 4 },
  otra: { alignSelf: "flex-start", backgroundColor: "#F1F5F9", borderBottomLeftRadius: 4 },
  textoMio: { color: colores.blanco, fontSize: 15 },
  textoOtro: { color: colores.indigo, fontSize: 15 },
  hora: { fontSize: 11, marginTop: 4, alignSelf: "flex-end" },
  horaMia: { color: "rgba(255,255,255,0.85)" },
  horaOtra: { color: colores.textoPlaceholder },

  barra: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: colores.borde, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colores.indigo,
  },
  enviar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colores.acento, alignItems: "center", justifyContent: "center" },
});
