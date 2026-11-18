import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { formatearFecha, formatearPrecio } from "../formato"

const COLORES = {
  PENDIENTE_PAGO: "#e0a800",
  CONFIRMADA: "#2e9e4f",
  UTILIZADA: "#2f6fdb",
  CANCELADA: "#888888",
  REEMBOLSADA: "#8a4fc7",
};

export default function ComprasEventoScreen({ route, navigation }) {
  const { id } = route.params;
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      get(`/compras?eventoId=${id}`)
        .then(setDatos)
        .catch((e) => setError(e.message));
    }, [id])
  );

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;
  if (!datos) return <Text style={styles.centro}>Cargando...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>{datos.evento.nombre}</Text>

      <Text style={styles.seccion}>Entradas disponibles</Text>
      {datos.entradasDisponibles.map((tipo) => (
        <View key={tipo.id} style={styles.fila}>
          <Text style={styles.negrita}>{tipo.nombre}</Text>
          <Text>quedan {tipo.cupoDisponible}</Text>
        </View>
      ))}

      <Text style={styles.seccion}>Compras ({datos.compras.length})</Text>
      {datos.compras.length === 0 && <Text>Todavía no hay compras</Text>}
      {datos.compras.map((compra) => (
        <View key={compra.id} style={styles.tarjeta}>
          <View style={styles.fila}>
            <Text style={styles.negrita}>{compra.comprador}</Text>
            <View style={[styles.estado, { backgroundColor: COLORES[compra.estado] }]}>
              <Text style={styles.estadoTexto}>{compra.estado.replace("_", " ")}</Text>
            </View>
          </View>
          <Text>
            {compra.cantidad} × {compra.tipoEntrada} · {formatearPrecio(compra.total)}
          </Text>
          <Pressable
            style={styles.chat}
            onPress={() => navigation.navigate("Chat", { compraId: compra.id })}
          >
            <Text style={styles.chatTexto}>Chat con el comprador</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 16 },
  titulo: { fontSize: 22, fontWeight: "bold" },
  seccion: { fontSize: 18, fontWeight: "bold", marginTop: 18, marginBottom: 8 },
  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  negrita: { fontWeight: "600" },
  tarjeta: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 8 },
  estado: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  estadoTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  chat: { marginTop: 8, borderWidth: 1, borderColor: "#2f6fdb", borderRadius: 8, padding: 8, alignItems: "center" },
  chatTexto: { color: "#2f6fdb", fontWeight: "600" },
  centro: { marginTop: 100, textAlign: "center" },
});
