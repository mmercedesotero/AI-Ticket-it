import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";

export default function OrganizadorScreen({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      get("/eventos?orden=fecha")
        .then(setEventos)
        .catch((e) => setError(e.message));
    }, [])
  );

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;

  return (
    <FlatList
      data={eventos}
      keyExtractor={(evento) => String(evento.id)}
      contentContainerStyle={styles.lista}
      renderItem={({ item }) => (
        <Pressable
          style={styles.tarjeta}
          onPress={() => navigation.navigate("ComprasEvento", { id: item.id })}
        >
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text>{item.fecha} · {item.organizador?.nombre}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16 },
  tarjeta: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 10 },
  nombre: { fontSize: 18, fontWeight: "600" },
  centro: { marginTop: 100, textAlign: "center" },
});