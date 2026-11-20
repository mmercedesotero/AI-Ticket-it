import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PAISES, separarTelefono } from "../paises";
import { colores } from "../tema";

// Teléfono con selector de país: la banderita y el código (+54) se eligen aparte
// y el número se limita a la cantidad de dígitos que tiene ese país.
// "valor" y "onChange" usan el formato guardado: "+54 1155551234" (o "" si está vacío).
export default function TelefonoInput({ valor, onChange }) {
  const insets = useSafeAreaInsets();
  const inicial = separarTelefono(valor);
  const [pais, setPais] = useState(inicial.pais);
  const [numero, setNumero] = useState(inicial.numero);
  const [eligiendo, setEligiendo] = useState(false);

  const avisar = (nuevoPais, nuevoNumero) => onChange(nuevoNumero ? `${nuevoPais.codigo} ${nuevoNumero}` : "");

  const cambiarNumero = (texto) => {
    const limpio = texto.replace(/\D/g, "").slice(0, pais.digitos);
    setNumero(limpio);
    avisar(pais, limpio);
  };

  const elegirPais = (nuevo) => {
    const recortado = numero.slice(0, nuevo.digitos);
    setPais(nuevo);
    setNumero(recortado);
    setEligiendo(false);
    avisar(nuevo, recortado);
  };

  return (
    <View style={styles.fila}>
      <Pressable style={styles.pais} onPress={() => setEligiendo(true)} hitSlop={6}>
        <Text style={styles.bandera}>{pais.bandera}</Text>
        <Text style={styles.codigo}>{pais.codigo}</Text>
        <Ionicons name="chevron-down" size={14} color={colores.textoSuave} />
      </Pressable>

      <TextInput
        style={styles.numero}
        value={numero}
        onChangeText={cambiarNumero}
        keyboardType="number-pad"
        maxLength={pais.digitos}
        placeholder={"0".repeat(pais.digitos)}
        placeholderTextColor={colores.textoPlaceholder}
      />
      <Text style={styles.contador}>{numero.length}/{pais.digitos}</Text>

      <Modal transparent visible={eligiendo} animationType="fade" statusBarTranslucent onRequestClose={() => setEligiendo(false)}>
        <View style={styles.fondo}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEligiendo(false)} />
          <View style={[styles.hoja, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.agarre} />
            <Text style={styles.titulo}>Elegí tu país</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PAISES.map((p) => {
                const activo = p.nombre === pais.nombre;
                return (
                  <Pressable key={p.nombre} style={[styles.opcion, activo && styles.opcionActiva]} onPress={() => elegirPais(p)}>
                    <Text style={styles.opcionBandera}>{p.bandera}</Text>
                    <Text style={styles.opcionNombre}>{p.nombre}</Text>
                    <Text style={styles.opcionCodigo}>{p.codigo}</Text>
                    {activo && <Ionicons name="checkmark" size={18} color={colores.acento} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 10 },
  pais: {
    flexDirection: "row", alignItems: "center", gap: 5, paddingRight: 10,
    borderRightWidth: 1, borderColor: colores.borde,
  },
  bandera: { fontSize: 20 },
  codigo: { fontSize: 16, color: colores.indigo, fontWeight: "600" },
  numero: { flex: 1, fontSize: 16, color: colores.indigo, paddingVertical: 2, minHeight: 24 },
  contador: { fontSize: 12, color: colores.textoPlaceholder },

  fondo: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "flex-end" },
  hoja: {
    backgroundColor: colores.blanco, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 18, paddingTop: 10, maxHeight: "70%",
  },
  agarre: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colores.borde, marginBottom: 14 },
  titulo: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginBottom: 8, textAlign: "center" },
  opcion: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12 },
  opcionActiva: { backgroundColor: colores.acentoSuave },
  opcionBandera: { fontSize: 24 },
  opcionNombre: { flex: 1, fontSize: 15, color: colores.indigo, fontWeight: "600" },
  opcionCodigo: { color: colores.textoSuave, fontWeight: "600" },
});
