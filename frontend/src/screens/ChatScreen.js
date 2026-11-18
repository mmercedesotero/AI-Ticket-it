import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, FlatList, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { enviar, get } from "../api";

export default function ChatScreen({ route }) {
  const { compraId } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [compra, setCompra] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [rol, setRol] = useState("COMPRADOR");
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

  const enviarMensaje = async () => {
    if (!compra || texto.trim() === "") return;

    const autorId =
      rol === "COMPRADOR" ? compra.comprador.id : compra.evento.organizador.id;

    try {
      await enviar("POST", `/compras/${compraId}/mensajes`, { autorId, rol, texto });
      setTexto("");
      cargarMensajes();
    } catch (e) {
      Alert.alert("No se pudo enviar", e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={styles.selector}>
        <Text style={styles.etiqueta}>Escribir como:</Text>
        {["COMPRADOR", "ORGANIZADOR"].map((r) => (
          <Pressable
            key={r}
            onPress={() => setRol(r)}
            style={[styles.chip, rol === r && styles.chipActivo]}
          >
            <Text style={rol === r ? styles.chipTextoActivo : null}>
              {r === "COMPRADOR" ? "Comprador" : "Organizador"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        ref={lista}
        data={mensajes}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.mensajes}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={styles.vacio}>Todavía no hay mensajes</Text>}
        renderItem={({ item }) => {
          const mio = item.autor.rol === rol;
          return (
            <View style={[styles.burbuja, mio ? styles.mia : styles.otra]}>
              <Text style={styles.autor}>{item.autor.nombre}</Text>
              <Text>{item.texto}</Text>
            </View>
          );
        }}
      />

      <View style={[styles.barra, { paddingBottom: insets.bottom + 15 }]}>
        <TextInput
          style={styles.input}
          placeholder="Escribí un mensaje..."
          value={texto}
          onChangeText={setTexto}
        />
        <Pressable style={styles.enviar} onPress={enviarMensaje}>
          <Text style={styles.enviarTexto}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  selector: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderBottomWidth: 1, borderColor: "#eee" },
  etiqueta: { fontWeight: "600" },
  chip: { borderWidth: 1, borderColor: "#999", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActivo: { backgroundColor: "#222", borderColor: "#222" },
  chipTextoActivo: { color: "#fff" },
  mensajes: { padding: 12 },
  vacio: { textAlign: "center", marginTop: 40, color: "#888" },
  burbuja: { maxWidth: "80%", borderRadius: 12, padding: 10, marginBottom: 8 },
  mia: { alignSelf: "flex-end", backgroundColor: "#d6f0d9" },
  otra: { alignSelf: "flex-start", backgroundColor: "#eee" },
  autor: { fontSize: 11, color: "#555", marginBottom: 2 },
  barra: { flexDirection: "row", gap: 8, padding: 10, borderTopWidth: 1, borderColor: "#eee" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10 },
  enviar: { backgroundColor: "#222", borderRadius: 8, paddingHorizontal: 16, padding: 10, justifyContent: "center" },
  enviarTexto: { color: "#fff", fontWeight: "bold" },
});