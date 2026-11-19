import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { colores, radios } from "../tema";

// Lista de tarjetas guardadas para elegir con qué pagar. La primera queda elegida por defecto.
export default function SelectorTarjeta({ seleccionada, onSeleccionar, onAgregar }) {
  const [tarjetas, setTarjetas] = useState([]);
  const [cargada, setCargada] = useState(false);

  useFocusEffect(
    useCallback(() => {
      get("/tarjetas")
        .then((lista) => {
          setTarjetas(lista);
          setCargada(true);
          const sigueExistiendo = lista.some((t) => t.id === seleccionada);
          if (!sigueExistiendo) onSeleccionar(lista.length > 0 ? lista[0].id : null);
        })
        .catch(() => setCargada(true));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <View>
      {tarjetas.map((t) => {
        const activa = t.id === seleccionada;
        return (
          <Pressable key={t.id} style={[styles.tarjeta, activa && styles.tarjetaActiva]} onPress={() => onSeleccionar(t.id)}>
            <Ionicons name="card-outline" size={24} color={colores.indigo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{t.marca} •••• {t.ultimos4}</Text>
              <Text style={styles.detalle}>Vence {t.vencimiento}</Text>
            </View>
            <View style={[styles.radio, activa && styles.radioActivo]}>
              {activa && <View style={styles.radioPunto} />}
            </View>
          </Pressable>
        );
      })}

      {cargada && tarjetas.length === 0 && (
        <Text style={styles.vacio}>Todavía no tenés tarjetas guardadas.</Text>
      )}

      <Pressable style={styles.agregar} onPress={onAgregar}>
        <Ionicons name="add-circle-outline" size={20} color={colores.acento} />
        <Text style={styles.agregarTexto}>Agregar tarjeta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.blanco,
    borderRadius: radios.tarjeta, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  tarjetaActiva: { borderColor: colores.acento, backgroundColor: colores.acentoSuave },
  nombre: { fontWeight: "700", color: colores.indigo },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colores.borde, alignItems: "center", justifyContent: "center" },
  radioActivo: { borderColor: colores.acento },
  radioPunto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colores.acento },
  vacio: { color: colores.textoSuave, marginBottom: 10 },
  agregar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1, borderColor: colores.acento, borderStyle: "dashed", borderRadius: radios.tarjeta, paddingVertical: 14,
  },
  agregarTexto: { color: colores.acento, fontWeight: "700" },
});
