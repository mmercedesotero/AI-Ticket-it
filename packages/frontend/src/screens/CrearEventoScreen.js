import { alerta } from "../dialogo";
import { useState } from "react";
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { enviar } from "../api";
import { useEventos } from "../eventos";
import { colores, estilosBase, radios } from "../tema";

const entradaVacia = () => ({ nombre: "", precio: "", ubicacion: "", cupo: "" });

export default function CrearEventoScreen({ navigation }) {
  const { categorias, recargar } = useEventos();
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [entradas, setEntradas] = useState([entradaVacia()]);

  const cambiarEntrada = (indice, campo, valor) =>
    setEntradas((actuales) =>
      actuales.map((e, i) => (i === indice ? { ...e, [campo]: valor } : e))
    );

  const quitarEntrada = (indice) =>
    setEntradas((actuales) => actuales.filter((_, i) => i !== indice));

  // El precio y el cupo se escriben como texto: hay que pasarlos a número antes de enviarlos.
  const publicar = async () => {
    try {
      const evento = await enviar("POST", "/eventos", {
        nombre,
        fecha,
        descripcion,
        categoriaId,
        tiposEntrada: entradas.map((e) => ({
          nombre: e.nombre,
          precio: e.precio.trim() === "" ? undefined : Number(e.precio),
          ubicacion: e.ubicacion,
          cupoDisponible: e.cupo.trim() === "" ? undefined : Number(e.cupo),
        })),
      });
      recargar(); // para que el evento nuevo aparezca en la lista global
      alerta("¡Evento publicado!", evento.nombre, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      alerta("No se pudo publicar", e.message);
    }
  };

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={styles.contenedor}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
    >
      <Pressable
        style={styles.portada}
        onPress={() => alerta("Imagen de portada", "La carga de imágenes todavía no está disponible.")}
      >
        <Ionicons name="cloud-upload-outline" size={34} color={colores.acento} />
        <Text style={styles.portadaTitulo}>Subir imagen de portada</Text>
        <Text style={styles.portadaAyuda}>Disponible próximamente</Text>
      </Pressable>

      <Text style={styles.label}>Nombre del evento</Text>
      <TextInput
        style={styles.campo}
        placeholder="Ej. Festival de Jazz de Buenos Aires"
        placeholderTextColor={colores.textoPlaceholder}
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Fecha</Text>
      <View style={styles.campoConIcono}>
        <Ionicons name="calendar-outline" size={18} color={colores.textoSuave} />
        <TextInput
          style={styles.inputIcono}
          placeholder="AAAA-MM-DD (ej. 2027-05-20)"
          placeholderTextColor={colores.textoPlaceholder}
          value={fecha}
          onChangeText={setFecha}
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.campo, styles.multilinea]}
        placeholder="Contá de qué se trata el evento"
        placeholderTextColor={colores.textoPlaceholder}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.chips}>
        {categorias.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategoriaId(c.id)}
            style={[styles.chip, categoriaId === c.id && styles.chipActivo]}
          >
            <Text style={[styles.chipTexto, categoriaId === c.id && styles.chipTextoActivo]}>{c.nombre}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.seccion}>Tipos de entrada</Text>
      {entradas.map((e, i) => (
        <View key={i} style={styles.entrada}>
          <Text style={styles.label}>Nombre de la entrada</Text>
          <TextInput
            style={styles.campo}
            placeholder="Ej. General"
            placeholderTextColor={colores.textoPlaceholder}
            value={e.nombre}
            onChangeText={(v) => cambiarEntrada(i, "nombre", v)}
          />

          <Text style={styles.label}>Ubicación</Text>
          <View style={styles.campoConIcono}>
            <Ionicons name="location-outline" size={18} color={colores.textoSuave} />
            <TextInput
              style={styles.inputIcono}
              placeholder="Ej. Campo, Platea, Palco"
              placeholderTextColor={colores.textoPlaceholder}
              value={e.ubicacion}
              onChangeText={(v) => cambiarEntrada(i, "ubicacion", v)}
            />
          </View>

          <View style={styles.dosColumnas}>
            <View style={styles.columna}>
              <Text style={styles.label}>Precio de entrada</Text>
              <TextInput
                style={styles.campo}
                placeholder="$ ARS"
                placeholderTextColor={colores.textoPlaceholder}
                keyboardType="numeric"
                value={e.precio}
                onChangeText={(v) => cambiarEntrada(i, "precio", v)}
              />
            </View>
            <View style={styles.columna}>
              <Text style={styles.label}>Capacidad</Text>
              <TextInput
                style={styles.campo}
                placeholder="Ej. 1.500"
                placeholderTextColor={colores.textoPlaceholder}
                keyboardType="numeric"
                value={e.cupo}
                onChangeText={(v) => cambiarEntrada(i, "cupo", v)}
              />
            </View>
          </View>

          {entradas.length > 1 && (
            <Pressable onPress={() => quitarEntrada(i)}>
              <Text style={styles.quitar}>Quitar esta entrada</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable style={styles.agregar} onPress={() => setEntradas([...entradas, entradaVacia()])}>
        <Ionicons name="add" size={18} color={colores.acento} />
        <Text style={styles.agregarTexto}>Agregar otro tipo de entrada</Text>
      </Pressable>

      <Pressable style={[estilosBase.botonPrimario, styles.publicar]} onPress={publicar}>
        <Text style={estilosBase.botonPrimarioTexto}>Publicar Evento</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.blanco },
  contenedor: { padding: 16, paddingBottom: 48 },

  portada: {
    alignItems: "center", gap: 4, paddingVertical: 28, borderRadius: radios.tarjeta,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: colores.acento, backgroundColor: colores.acentoSuave,
  },
  portadaTitulo: { fontWeight: "700", color: colores.indigo, marginTop: 4 },
  portadaAyuda: { fontSize: 12, color: colores.textoSuave },

  label: { fontWeight: "600", color: colores.indigo, marginBottom: 6, marginTop: 14, fontSize: 13 },
  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 26 },

  campo: { ...estilosBase.campo },
  campoConIcono: { ...estilosBase.campo, flexDirection: "row", alignItems: "center", gap: 8 },
  inputIcono: { flex: 1, fontSize: 15, color: colores.indigo, padding: 0 },
  multilinea: { minHeight: 80, textAlignVertical: "top" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipActivo: { backgroundColor: colores.acento, borderColor: colores.acento },
  chipTexto: { color: colores.indigo, fontWeight: "500" },
  chipTextoActivo: { color: colores.blanco, fontWeight: "700" },

  entrada: {
    backgroundColor: colores.fondo, borderRadius: radios.tarjeta, padding: 14,
    borderWidth: 1, borderColor: colores.borde, marginTop: 12,
  },
  dosColumnas: { flexDirection: "row", gap: 12 },
  columna: { flex: 1 },
  quitar: { color: colores.error, textAlign: "center", marginTop: 14, fontWeight: "600" },

  agregar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 12,
    borderWidth: 1, borderColor: colores.acento, borderRadius: radios.boton, paddingVertical: 12,
  },
  agregarTexto: { color: colores.acento, fontWeight: "700" },

  publicar: { marginTop: 24 },
});
