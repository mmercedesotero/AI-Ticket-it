import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { formatearFecha, formatearPrecio } from "../formato"

export default function OrganizadorScreen({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(
    () =>
      get("/eventos?orden=fecha")
        .then(setEventos)
        .catch((e) => setError(e.message)),
    []
  );

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const refrescar = async () => {
    setRefrescando(true);
    await Promise.all([cargar(), new Promise((r) => setTimeout(r, 600))]);
    setRefrescando(false);
  };

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;

  return (
    <FlatList
        data={eventos}
        refreshing={refrescando}
        onRefresh={refrescar}
        keyExtractor={(evento) => String(evento.id)}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
            <Pressable style={styles.crear} onPress={() => navigation.navigate("CrearEvento")}>
            <Text style={styles.crearTexto}>+ Crear evento</Text>
            </Pressable>
        }
        renderItem={({ item }) => (
            <Pressable
            style={styles.tarjeta}
            onPress={() => navigation.navigate("ComprasEvento", { id: item.id })}
            >
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text>{formatearFecha(item.fecha)} · {item.organizador?.nombre}</Text>
            </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16 },
  tarjeta: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 10 },
  nombre: { fontSize: 18, fontWeight: "600" },
  crear: { backgroundColor: "#222", borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 12 },
  crearTexto: { color: "#fff", fontWeight: "bold" },
  centro: { marginTop: 100, textAlign: "center" },
});