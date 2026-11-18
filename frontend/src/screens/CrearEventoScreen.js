import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { enviar, get } from "../api";

const entradaVacia = () => ({ nombre: "", precio: "", ubicacion: "", cupo: "" });

export default function CrearEventoScreen({ navigation }) {
  const [categorias, setCategorias] = useState([]);
  const [organizadores, setOrganizadores] = useState([]);
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [organizadorId, setOrganizadorId] = useState(null);
  const [entradas, setEntradas] = useState([entradaVacia()]);

  useEffect(() => {
    get("/categorias").then(setCategorias).catch(() => {});
    get("/organizadores").then(setOrganizadores).catch(() => {});
  }, []);

  const cambiarEntrada = (indice, campo, valor) =>
    setEntradas((actuales) =>
      actuales.map((e, i) => (i === indice ? { ...e, [campo]: valor } : e))
    );

  const quitarEntrada = (indice) =>
    setEntradas((actuales) => actuales.filter((_, i) => i !== indice));

  const crear = async () => {
    try {
      const evento = await enviar("POST", "/eventos", {
        nombre,
        fecha,
        descripcion,
        categoriaId,
        organizadorId,
        tiposEntrada: entradas.map((e) => ({
          nombre: e.nombre,
          precio: e.precio.trim() === "" ? undefined : Number(e.precio),
          ubicacion: e.ubicacion,
          cupoDisponible: e.cupo.trim() === "" ? undefined : Number(e.cupo),
        })),
      });
      Alert.alert("¡Evento creado!", evento.nombre, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("No se pudo crear", e.message);
    }
  };

  const opciones = (lista, elegido, elegir) => (
    <View style={styles.fila}>
      {lista.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => elegir(item.id)}
          style={[styles.chip, elegido === item.id && styles.chipActivo]}
        >
          <Text style={elegido === item.id && styles.chipTextoActivo}>{item.nombre}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.contenedor}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
    >
      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

      <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={fecha}
        onChangeText={setFecha}
        placeholder="2027-05-20"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.multilinea]}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />

      <Text style={styles.label}>Categoría</Text>
      {opciones(categorias, categoriaId, setCategoriaId)}

      <Text style={styles.label}>Organizador</Text>
      {opciones(organizadores, organizadorId, setOrganizadorId)}

      <Text style={styles.seccion}>Tipos de entrada</Text>
      {entradas.map((e, i) => (
        <View key={i} style={styles.entrada}>
          <TextInput
            style={styles.input}
            placeholder="Nombre (ej. General)"
            value={e.nombre}
            onChangeText={(v) => cambiarEntrada(i, "nombre", v)}
          />
          <TextInput
            style={styles.input}
            placeholder="Ubicación"
            value={e.ubicacion}
            onChangeText={(v) => cambiarEntrada(i, "ubicacion", v)}
          />
          <View style={styles.fila}>
            <TextInput
              style={[styles.input, styles.mitad]}
              placeholder="Precio"
              keyboardType="numeric"
              value={e.precio}
              onChangeText={(v) => cambiarEntrada(i, "precio", v)}
            />
            <TextInput
              style={[styles.input, styles.mitad]}
              placeholder="Cupo"
              keyboardType="numeric"
              value={e.cupo}
              onChangeText={(v) => cambiarEntrada(i, "cupo", v)}
            />
          </View>
          {entradas.length > 1 && (
            <Pressable onPress={() => quitarEntrada(i)}>
              <Text style={styles.quitar}>Quitar esta entrada</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable style={styles.agregar} onPress={() => setEntradas([...entradas, entradaVacia()])}>
        <Text style={styles.agregarTexto}>+ Agregar otro tipo de entrada</Text>
      </Pressable>

      <Pressable style={styles.crear} onPress={crear}>
        <Text style={styles.crearTexto}>Crear evento</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 16, paddingBottom: 40 },
  label: { fontWeight: "600", marginTop: 12, marginBottom: 4 },
  seccion: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 8 },
  multilinea: { minHeight: 70, textAlignVertical: "top" },
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mitad: { flex: 1 },
  chip: { borderWidth: 1, borderColor: "#999", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActivo: { backgroundColor: "#222", borderColor: "#222" },
  chipTextoActivo: { color: "#fff" },
  entrada: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, marginTop: 8 },
  quitar: { color: "#c0392b", textAlign: "center", marginTop: 4 },
  agregar: { marginTop: 12, borderWidth: 1, borderColor: "#2f6fdb", borderRadius: 8, padding: 10, alignItems: "center" },
  agregarTexto: { color: "#2f6fdb", fontWeight: "600" },
  crear: { marginTop: 20, backgroundColor: "#222", borderRadius: 10, padding: 14, alignItems: "center" },
  crearTexto: { color: "#fff", fontWeight: "bold" },
});
