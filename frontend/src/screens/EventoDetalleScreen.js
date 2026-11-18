import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { enviar, get, USUARIO_ID } from "../api";

export default function EventoDetalleScreen({ route }) {
  const { id } = route.params;
  const [evento, setEvento] = useState(null);
  const [organizador, setOrganizador] = useState(null);
  const [entradaId, setEntradaId] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const datos = await get(`/eventos/${id}`);
      setEvento(datos);
      if (datos.organizador) {
        setOrganizador(await get(`/resenias?organizadorId=${datos.organizador.id}`));
      }
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const comprar = async () => {
    try {
      const compra = await enviar("POST", "/compras", {
        usuarioId: USUARIO_ID,
        eventoId: evento.id,
        entradaId,
        cantidad,
      });
      Alert.alert("¡Compra realizada!", `Total: $${compra.total}`);
      setCantidad(1);
      cargar();
    } catch (e) {
      Alert.alert("No se pudo comprar", e.message);
    }
  };

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;
  if (!evento) return <Text style={styles.centro}>Cargando...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>{evento.nombre}</Text>
      <Text>{evento.fecha} · {evento.categoria?.nombre}</Text>
      <Text style={styles.descripcion}>{evento.descripcion}</Text>

      {organizador && (
        <Text style={styles.organizador}>
          {organizador.organizador.nombre} ·{" "}
          {organizador.puntajePromedio !== null
            ? `★ ${organizador.puntajePromedio} (${organizador.cantidad})`
            : "Sin reseñas"}
        </Text>
      )}

      <Text style={styles.seccion}>Entradas</Text>
      {evento.tiposEntrada.map((tipo) => (
        <Pressable
          key={tipo.id}
          onPress={() => setEntradaId(tipo.id)}
          style={[styles.entrada, entradaId === tipo.id && styles.entradaActiva]}
        >
          <Text style={styles.nombreEntrada}>{tipo.nombre} · ${tipo.precio}</Text>
          <Text>{tipo.ubicacion} · quedan {tipo.cupoDisponible}</Text>
        </Pressable>
      ))}

      <View style={styles.cantidad}>
        <Pressable style={styles.boton} onPress={() => setCantidad(Math.max(1, cantidad - 1))}>
          <Text style={styles.botonTexto}>−</Text>
        </Pressable>
        <Text style={styles.cantidadNumero}>{cantidad}</Text>
        <Pressable style={styles.boton} onPress={() => setCantidad(cantidad + 1)}>
          <Text style={styles.botonTexto}>+</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.comprar, entradaId === null && styles.comprarInactivo]}
        disabled={entradaId === null}
        onPress={comprar}
      >
        <Text style={styles.comprarTexto}>Comprar</Text>
      </Pressable>

      {organizador && organizador.resenias.length > 0 && (
        <View>
          <Text style={styles.seccion}>Reseñas del organizador</Text>
          {organizador.resenias.map((r) => (
            <View key={r.id} style={styles.resenia}>
              <Text style={styles.nombreEntrada}>
                {"★".repeat(r.puntuacion)} · {r.evento.nombre}
              </Text>
              <Text>{r.detalle}</Text>
              <Text style={styles.autor}>{r.comprador}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 16 },
  titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  descripcion: { marginVertical: 8 },
  organizador: { fontWeight: "600", marginBottom: 8 },
  seccion: { fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  entrada: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 8 },
  entradaActiva: { borderColor: "#222", borderWidth: 2 },
  nombreEntrada: { fontWeight: "600" },
  cantidad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginVertical: 12 },
  boton: { borderWidth: 1, borderColor: "#999", borderRadius: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  botonTexto: { fontSize: 20 },
  cantidadNumero: { fontSize: 20, fontWeight: "bold" },
  comprar: { backgroundColor: "#222", borderRadius: 10, padding: 14, alignItems: "center" },
  comprarInactivo: { backgroundColor: "#aaa" },
  comprarTexto: { color: "#fff", fontWeight: "bold" },
  resenia: { borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 10, marginBottom: 8 },
  autor: { color: "#666", marginTop: 2 },
  centro: { marginTop: 100, textAlign: "center" },
});