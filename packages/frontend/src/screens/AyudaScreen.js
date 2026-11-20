import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { alerta } from "../dialogo";
import { CATEGORIAS_AYUDA, PREGUNTAS } from "../contenidoLegal";
import { useSesion } from "../sesion";
import { colores, radios } from "../tema";

const CORREO_SOPORTE = "soporte@tickettit.com";
const sinTildes = (texto) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function AyudaScreen() {
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [abierta, setAbierta] = useState(null);

  const buscado = sinTildes(busqueda.trim());
  const preguntas = PREGUNTAS.filter((p) => {
    const coincideBusqueda = buscado === "" || sinTildes(`${p.pregunta} ${p.respuesta}`).includes(buscado);
    // Al buscar se mira en todas las categorías.
    const coincideCategoria = buscado !== "" || categoria === "todas" || p.categoria === categoria;
    return coincideBusqueda && coincideCategoria;
  });

  const tituloLista =
    buscado !== ""
      ? "Resultados"
      : categoria === "todas"
        ? "Preguntas frecuentes (FAQ)"
        : CATEGORIAS_AYUDA.find((c) => c.clave === categoria).titulo;

  const enviarCorreo = () =>
    Linking.openURL(`mailto:${CORREO_SOPORTE}?subject=Consulta%20desde%20Ticket%20It`).catch(() =>
      alerta("No se pudo abrir el correo", `Escribinos a ${CORREO_SOPORTE}.`)
    );

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenedor, { paddingBottom: 24 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.saludo}>¡Hola, {sesion.usuario.nombre}!</Text>
      <Text style={styles.saludo}>¿Cómo podemos ayudarte hoy?</Text>

      <View style={styles.buscador}>
        <Ionicons name="search-outline" size={18} color={colores.textoSuave} />
        <TextInput
          style={styles.buscadorInput}
          placeholder="Buscar preguntas, problemas, reembolsos..."
          placeholderTextColor={colores.textoPlaceholder}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda !== "" && (
          <Pressable onPress={() => setBusqueda("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colores.textoPlaceholder} />
          </Pressable>
        )}
      </View>

      <View style={styles.categorias}>
        {CATEGORIAS_AYUDA.map((c) => {
          const activa = buscado === "" && categoria === c.clave;
          return (
            <Pressable
              key={c.clave}
              style={[styles.categoria, activa && styles.categoriaActiva]}
              onPress={() => {
                setBusqueda("");
                setCategoria(c.clave);
                setAbierta(null);
              }}
            >
              <Ionicons name={c.icono} size={24} color={colores.acento} />
              <Text style={styles.categoriaTitulo}>{c.titulo}</Text>
              <Text style={styles.categoriaDetalle}>{c.detalle}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.seccion}>{tituloLista}</Text>
      <View style={styles.lista}>
        {preguntas.map((p, i) => {
          const esta = abierta === p.pregunta;
          return (
            <Pressable
              key={p.pregunta}
              style={[styles.pregunta, i > 0 && styles.preguntaSeparada]}
              onPress={() => setAbierta(esta ? null : p.pregunta)}
            >
              <View style={styles.preguntaFila}>
                <Text style={styles.preguntaTexto}>{p.pregunta}</Text>
                <Ionicons name={esta ? "chevron-up" : "chevron-down"} size={18} color={colores.textoSuave} />
              </View>
              {esta && <Text style={styles.respuesta}>{p.respuesta}</Text>}
            </Pressable>
          );
        })}
        {preguntas.length === 0 && (
          <Text style={styles.sinResultados}>No encontramos resultados. Probá con otras palabras o escribinos.</Text>
        )}
      </View>

      <View style={styles.canales}>
        <Text style={styles.canalesTitulo}>Canales de soporte</Text>
        <Text style={styles.canalesDetalle}>¿No encontraste lo que buscabas?</Text>
        <View style={styles.canalesBotones}>
          <Pressable
            style={styles.botonPrincipal}
            onPress={() =>
              alerta("Chat de soporte", "El chat con soporte no está disponible en esta versión de práctica. Escribinos por correo y te respondemos.")
            }
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colores.blanco} />
            <Text style={styles.botonPrincipalTexto}>Chatear con soporte</Text>
          </Pressable>
          <Pressable style={styles.botonSecundario} onPress={enviarCorreo}>
            <Ionicons name="mail-outline" size={16} color={colores.indigo} />
            <Text style={styles.botonSecundarioTexto}>Enviar un correo</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { padding: 16 },

  saludo: { fontSize: 24, fontWeight: "800", color: colores.indigo },

  buscador: {
    flexDirection: "row", alignItems: "center", gap: 8, height: 46, backgroundColor: colores.blanco,
    borderWidth: 1, borderColor: colores.borde, borderRadius: radios.campo, paddingHorizontal: 12, marginVertical: 16,
  },
  buscadorInput: { flex: 1, fontSize: 15, color: colores.indigo },

  categorias: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoria: {
    width: "48%", flexGrow: 1, backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde,
    borderRadius: radios.tarjeta, padding: 14, gap: 4,
  },
  categoriaActiva: { borderColor: colores.acento, backgroundColor: colores.acentoSuave },
  categoriaTitulo: { fontWeight: "800", color: colores.indigo, marginTop: 4 },
  categoriaDetalle: { color: colores.textoSuave, fontSize: 12 },

  seccion: {
    fontSize: 12, fontWeight: "700", letterSpacing: 0.6, color: colores.textoSuave,
    textTransform: "uppercase", marginTop: 22, marginBottom: 10,
  },
  lista: { backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde, borderRadius: radios.tarjeta },
  pregunta: { padding: 14 },
  preguntaSeparada: { borderTopWidth: 1, borderColor: colores.borde },
  preguntaFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  preguntaTexto: { flex: 1, color: colores.indigo, fontWeight: "600", fontSize: 15 },
  respuesta: { color: colores.textoSuave, lineHeight: 20, marginTop: 8 },
  sinResultados: { color: colores.textoSuave, padding: 16, textAlign: "center" },

  canales: {
    backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde, borderRadius: radios.tarjeta,
    padding: 16, marginTop: 18,
  },
  canalesTitulo: { fontWeight: "800", color: colores.indigo, fontSize: 15 },
  canalesDetalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  canalesBotones: { flexDirection: "row", gap: 10, marginTop: 14 },
  botonPrincipal: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: colores.acento, borderRadius: 10, paddingVertical: 11,
  },
  botonPrincipalTexto: { color: colores.blanco, fontWeight: "700", fontSize: 13 },
  botonSecundario: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: colores.borde, borderRadius: 10, paddingVertical: 11,
  },
  botonSecundarioTexto: { color: colores.indigo, fontWeight: "600", fontSize: 13 },
});
