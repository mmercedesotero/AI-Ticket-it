import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { get } from "../api";

const ORDENES = [
  { clave: "fecha", etiqueta: "Fecha" },
  { clave: "precio", etiqueta: "Precio" },
  { clave: "puntaje", etiqueta: "Puntaje" },
];

export default function EventosScreen({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [texto, setTexto] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [orden, setOrden] = useState("fecha");
  const [error, setError] = useState(null);

  useEffect(() => {
    get("/categorias").then(setCategorias).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ orden });
    if (orden === "puntaje") params.set("direccion", "desc");
    if (texto) params.set("texto", texto);
    if (categoriaId) params.set("categoriaId", String(categoriaId));

    get(`/eventos?${params.toString()}`)
      .then(setEventos)
      .catch((e) => setError(e.message));
  }, [texto, categoriaId, orden]);

  const precioDesde = (evento) =>
    evento.tiposEntrada.length
      ? Math.min(...evento.tiposEntrada.map((t) => t.precio))
      : null;

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;

  return (
    <View style={styles.contenedor}>

      <TextInput
        style={styles.buscador}
        placeholder="Buscar eventos..."
        value={texto}
        onChangeText={setTexto}
      />

      <View style={styles.fila}>
        <Chip etiqueta="Todas" activo={categoriaId === null} onPress={() => setCategoriaId(null)} />
        {categorias.map((c) => (
          <Chip key={c.id} etiqueta={c.nombre} activo={categoriaId === c.id} onPress={() => setCategoriaId(c.id)} />
        ))}
      </View>

      <View style={styles.fila}>
        <Text style={styles.etiqueta}>Ordenar:</Text>
        {ORDENES.map((o) => (
          <Chip key={o.clave} etiqueta={o.etiqueta} activo={orden === o.clave} onPress={() => setOrden(o.clave)} />
        ))}
      </View>

      <FlatList
        data={eventos}
        keyExtractor={(evento) => String(evento.id)}
        ListEmptyComponent={<Text style={styles.centro}>No hay eventos</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.tarjeta}
            onPress={() => navigation.navigate("Detalle", { id: item.id })}
          >
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text>{item.fecha} · {item.categoria?.nombre}</Text>
            {precioDesde(item) !== null && <Text>Desde ${precioDesde(item)}</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

function Chip({ etiqueta, activo, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, activo && styles.chipActivo]}>
      <Text style={activo ? styles.chipTextoActivo : null}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },
  titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  buscador: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  fila: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 },
  etiqueta: { fontWeight: "600" },
  chip: { borderWidth: 1, borderColor: "#999", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActivo: { backgroundColor: "#222", borderColor: "#222" },
  chipTextoActivo: { color: "#fff" },
  tarjeta: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 10 },
  nombre: { fontSize: 18, fontWeight: "600" },
  centro: { marginTop: 40, textAlign: "center" },
});
