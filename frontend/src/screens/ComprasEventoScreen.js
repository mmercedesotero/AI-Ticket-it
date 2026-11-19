import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { ESTADOS } from "../compras";
import { colores, radios } from "../tema";
import { formatearPrecio } from "../formato";

const sumar = (lista, campo) => lista.reduce((total, x) => total + x[campo], 0);

// Pantalla de "Gestionar" del organizador: cuánto se vendió, qué cupo queda y quién compró.
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

  const vigentes = datos.compras.filter((c) => c.estado !== "CANCELADA" && c.estado !== "REEMBOLSADA");
  const pagadas = datos.compras.filter((c) => c.estado === "CONFIRMADA" || c.estado === "UTILIZADA");
  const vendidas = sumar(vigentes, "cantidad");
  const restantes = sumar(datos.entradasDisponibles, "cupoDisponible");
  const capacidad = vendidas + restantes;
  const porcentaje = capacidad > 0 ? Math.round((vendidas / capacidad) * 100) : 0;
  const ingresos = sumar(pagadas, "total");

  return (
    <ScrollView style={styles.fondo} contentContainerStyle={styles.contenedor} showsVerticalScrollIndicator={false}>
      <Text style={styles.titulo}>{datos.evento.nombre}</Text>

      <View style={styles.resumen}>
        <View style={styles.resumenFila}>
          <View>
            <Text style={styles.etiqueta}>Entradas vendidas</Text>
            <Text style={styles.grande}>{vendidas} / {capacidad}</Text>
          </View>
          <View style={styles.derecha}>
            <Text style={styles.etiqueta}>Ingresos</Text>
            <Text style={styles.grande}>{formatearPrecio(ingresos)}</Text>
          </View>
        </View>
        <View style={styles.barraFondo}>
          <View style={[styles.barraRelleno, { width: `${Math.min(porcentaje, 100)}%` }]} />
        </View>
        <Text style={styles.porcentaje}>{porcentaje}% vendido</Text>
      </View>

      <Text style={styles.seccion}>Entradas disponibles</Text>
      <View style={styles.tarjeta}>
        {datos.entradasDisponibles.map((tipo, i) => (
          <View key={tipo.id} style={[styles.fila, i > 0 && styles.filaBorde]}>
            <Text style={styles.nombre}>{tipo.nombre}</Text>
            <Text style={[styles.cupo, tipo.cupoDisponible === 0 && styles.agotada]}>
              {tipo.cupoDisponible === 0 ? "Agotada" : `quedan ${tipo.cupoDisponible}`}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.seccion}>Compras ({datos.compras.length})</Text>
      {datos.compras.length === 0 && <Text style={styles.vacio}>Todavía no hay compras.</Text>}
      {datos.compras.map((compra) => {
        const estado = ESTADOS[compra.estado];
        return (
          <View key={compra.id} style={styles.compra}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{compra.comprador.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.compraInfo}>
              <Text style={styles.nombre}>{compra.comprador}</Text>
              <Text style={styles.detalle}>
                {compra.cantidad} × {compra.tipoEntrada} · {formatearPrecio(compra.total)}
              </Text>
              <View style={[styles.estado, { backgroundColor: estado.color }]}>
                <Text style={styles.estadoTexto}>{estado.texto}</Text>
              </View>
            </View>
            <Pressable
              style={styles.chat}
              onPress={() => navigation.navigate("Chat", { compraId: compra.id })}
              hitSlop={6}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={colores.acento} />
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { padding: 16, paddingBottom: 40 },
  centro: { marginTop: 100, textAlign: "center" },
  titulo: { fontSize: 24, fontWeight: "800", color: colores.indigo, marginBottom: 14 },

  resumen: {
    backgroundColor: colores.blanco, borderRadius: radios.tarjeta, padding: 16,
    borderWidth: 1, borderColor: colores.borde,
  },
  resumenFila: { flexDirection: "row", justifyContent: "space-between" },
  derecha: { alignItems: "flex-end" },
  etiqueta: { color: colores.textoSuave, fontSize: 13 },
  grande: { fontSize: 22, fontWeight: "800", color: colores.indigo, marginTop: 2 },
  barraFondo: { height: 8, borderRadius: 4, backgroundColor: colores.borde, overflow: "hidden", marginTop: 14 },
  barraRelleno: { height: "100%", borderRadius: 4, backgroundColor: colores.acento },
  porcentaje: { color: colores.textoSuave, fontSize: 12, marginTop: 6 },

  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 24, marginBottom: 10 },
  tarjeta: {
    backgroundColor: colores.blanco, borderRadius: radios.tarjeta, paddingHorizontal: 16,
    borderWidth: 1, borderColor: colores.borde,
  },
  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  filaBorde: { borderTopWidth: 1, borderColor: colores.borde },
  nombre: { fontWeight: "700", color: colores.indigo },
  cupo: { color: colores.textoSuave, fontWeight: "600" },
  agotada: { color: colores.error, fontWeight: "800" },
  vacio: { color: colores.textoSuave },

  compra: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.blanco,
    borderRadius: radios.tarjeta, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: colores.blanco, fontWeight: "800", fontSize: 17 },
  compraInfo: { flex: 1 },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  estado: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  estadoTexto: { color: colores.blanco, fontSize: 11, fontWeight: "700" },
  chat: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colores.acentoSuave,
    alignItems: "center", justifyContent: "center",
  },
});
