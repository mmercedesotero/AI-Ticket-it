import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { enviar, get, USUARIO_ID } from "../api";

const COLORES = {
  PENDIENTE_PAGO: "#e0a800",
  CONFIRMADA: "#2e9e4f",
  UTILIZADA: "#2f6fdb",
  CANCELADA: "#888888",
  REEMBOLSADA: "#8a4fc7",
};

export default function MisComprasScreen() {
  const [compras, setCompras] = useState([]);
  const [error, setError] = useState(null);

  const cargar = useCallback(() => {
    get(`/compras?usuarioId=${USUARIO_ID}`)
      .then(setCompras)
      .catch((e) => setError(e.message));
  }, []);

  useFocusEffect(cargar);

  const cancelar = (compra) => {
    Alert.alert("Cancelar compra", `¿Cancelar tu compra de ${compra.evento.nombre}?`, [
      { text: "No", style: "cancel" },
      {
        text: "Sí, cancelar",
        onPress: async () => {
          try {
            await enviar("PUT", `/compras/${compra.id}/cancelar`);
            cargar();
          } catch (e) {
            Alert.alert("No se pudo cancelar", e.message);
          }
        },
      },
    ]);
  };

  const puedeCancelar = (compra) =>
    compra.estado === "PENDIENTE_PAGO" || compra.estado === "CONFIRMADA";

  const textoDias = (dias) =>
    dias === 0 ? "¡Es hoy!" : dias === 1 ? "Falta 1 día" : `Faltan ${dias} días`;

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;

  return (
    <FlatList
      data={compras}
      keyExtractor={(compra) => String(compra.id)}
      contentContainerStyle={styles.lista}
      ListEmptyComponent={<Text style={styles.centro}>Todavía no compraste entradas</Text>}
      renderItem={({ item }) => (
        <View style={styles.tarjeta}>
          <View style={styles.encabezado}>
            <Text style={styles.nombre}>{item.evento.nombre}</Text>
            <View style={[styles.estado, { backgroundColor: COLORES[item.estado] }]}>
              <Text style={styles.estadoTexto}>{item.estado.replace("_", " ")}</Text>
            </View>
          </View>

          <Text>{item.evento.fecha}</Text>
          <Text>
            {item.cantidad} × {item.tipoEntrada.nombre} · ${item.total}
          </Text>

          {item.diasParaEvento !== null && (
            <Text style={styles.dias}>{textoDias(item.diasParaEvento)}</Text>
          )}

          {puedeCancelar(item) && (
            <Pressable style={styles.cancelar} onPress={() => cancelar(item)}>
              <Text style={styles.cancelarTexto}>Cancelar compra</Text>
            </Pressable>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16 },
  tarjeta: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12 },
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  nombre: { fontSize: 18, fontWeight: "600", flexShrink: 1 },
  estado: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  estadoTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  dias: { marginTop: 6, fontWeight: "bold", color: "#2e9e4f" },
  cancelar: { marginTop: 10, borderWidth: 1, borderColor: "#c0392b", borderRadius: 8, padding: 10, alignItems: "center" },
  cancelarTexto: { color: "#c0392b", fontWeight: "600" },
  centro: { marginTop: 100, textAlign: "center" },
});