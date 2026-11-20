import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { alerta } from "../dialogo";
import { ACTUALIZACION_TERMINOS, INTRO_TERMINOS, POLITICA_PRIVACIDAD, TERMINOS } from "../contenidoLegal";
import { colores, radios } from "../tema";

const sinTildes = (texto) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function TerminosScreen() {
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState("");
  const [abiertos, setAbiertos] = useState(new Set());

  const buscado = sinTildes(busqueda.trim());
  const visibles = TERMINOS.filter(
    (t) => buscado === "" || sinTildes(`${t.titulo} ${t.texto}`).includes(buscado)
  );

  const alternar = (titulo) =>
    setAbiertos((actuales) => {
      const nuevos = new Set(actuales);
      if (nuevos.has(titulo)) nuevos.delete(titulo);
      else nuevos.add(titulo);
      return nuevos;
    });

  const descargarPdf = async () => {
    try {
      const secciones = TERMINOS.map((t) => `<h2>${t.titulo}</h2><p>${t.texto}</p>`).join("");
      const html = `<html><head><meta charset="utf-8" /><style>
        body { font-family: Helvetica, Arial, sans-serif; color: #0F172A; padding: 32px; }
        h1 { font-size: 26px; margin-bottom: 4px; } h1 span { color: #EF806C; }
        .fecha { color: #64748B; font-size: 12px; margin-bottom: 18px; }
        h2 { font-size: 16px; margin: 18px 0 4px; } p { color: #334155; line-height: 1.5; font-size: 13px; margin: 0; }
      </style></head><body>
        <h1>Ticket <span>It</span> — Términos y Condiciones</h1>
        <div class="fecha">Última actualización: ${ACTUALIZACION_TERMINOS}</div>
        <p>${INTRO_TERMINOS}</p>${secciones}
        <h2>Políticas de privacidad</h2><p>${POLITICA_PRIVACIDAD}</p>
      </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Términos y condiciones", UTI: "com.adobe.pdf" });
      } else {
        alerta("PDF listo", "Se generó el PDF, pero este dispositivo no permite compartirlo.");
      }
    } catch (e) {
      alerta("No se pudo generar el PDF", e.message);
    }
  };

  return (
    <View style={styles.fondo}>
      <ScrollView
        contentContainerStyle={[styles.contenedor, { paddingBottom: 90 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fecha}>
          <Text style={styles.fechaTexto}>Última actualización: {ACTUALIZACION_TERMINOS}</Text>
        </View>

        <View style={styles.buscador}>
          <Ionicons name="search-outline" size={18} color={colores.textoSuave} />
          <TextInput
            style={styles.buscadorInput}
            placeholder="Buscar en los términos..."
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

        {buscado === "" && (
          <View style={styles.intro}>
            <Text style={styles.introTexto}>{INTRO_TERMINOS}</Text>
          </View>
        )}

        {visibles.map((t) => {
          const abierto = abiertos.has(t.titulo) || buscado !== "";
          return (
            <Pressable key={t.titulo} style={styles.seccion} onPress={() => alternar(t.titulo)}>
              <View style={styles.seccionCabecera}>
                <Text style={styles.seccionTitulo}>{t.titulo}</Text>
                <Ionicons name={abierto ? "chevron-up" : "chevron-down"} size={18} color={colores.textoSuave} />
              </View>
              <Text style={styles.seccionTexto} numberOfLines={abierto ? undefined : 3}>{t.texto}</Text>
            </Pressable>
          );
        })}

        {visibles.length === 0 && (
          <View style={styles.vacio}>
            <Ionicons name="search-outline" size={36} color={colores.textoPlaceholder} />
            <Text style={styles.vacioTexto}>No encontramos resultados para "{busqueda}".</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.pieEnlace} onPress={descargarPdf} hitSlop={8}>
          <Ionicons name="download-outline" size={18} color={colores.acento} />
          <Text style={styles.pieTextoPrincipal}>Descargar en PDF</Text>
        </Pressable>
        <Pressable onPress={() => alerta("Políticas de privacidad", POLITICA_PRIVACIDAD)} hitSlop={8}>
          <Text style={styles.pieTexto}>Ver políticas de privacidad</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { padding: 16 },

  fecha: {
    alignSelf: "flex-start", backgroundColor: colores.acentoSuave, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12,
  },
  fechaTexto: { color: "#B5503C", fontSize: 12, fontWeight: "600" },

  buscador: {
    flexDirection: "row", alignItems: "center", gap: 8, height: 46, backgroundColor: colores.blanco,
    borderWidth: 1, borderColor: colores.borde, borderRadius: radios.campo, paddingHorizontal: 12, marginBottom: 12,
  },
  buscadorInput: { flex: 1, fontSize: 15, color: colores.indigo },

  intro: { backgroundColor: colores.blanco, borderRadius: radios.campo, padding: 14, marginBottom: 12 },
  introTexto: { color: colores.textoSuave, lineHeight: 20 },

  seccion: {
    backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde,
    borderRadius: radios.tarjeta, padding: 14, marginBottom: 10,
  },
  seccionCabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 },
  seccionTitulo: { flex: 1, fontWeight: "800", color: colores.indigo, fontSize: 15 },
  seccionTexto: { color: colores.textoSuave, lineHeight: 20 },

  vacio: { alignItems: "center", gap: 8, marginTop: 30 },
  vacioTexto: { color: colores.textoSuave, textAlign: "center" },

  pie: {
    position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 18, paddingTop: 14, backgroundColor: colores.blanco,
    borderTopWidth: 1, borderColor: colores.borde,
  },
  pieEnlace: { flexDirection: "row", alignItems: "center", gap: 6 },
  pieTextoPrincipal: { color: colores.acento, fontWeight: "700" },
  pieTexto: { color: colores.textoSuave, fontSize: 13 },
});
