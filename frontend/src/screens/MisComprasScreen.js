import { useCallback, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import TicketCard from "../componentes/TicketCard";
import { iconoDe } from "../componentes/TarjetaEvento";
import { imagenDe } from "../imagenes";
import { ESTADOS, esPasada, textoDias } from "../compras";
import { colores } from "../tema";
import { formatearFechaLarga, formatearPrecio } from "../formato";

export default function MisComprasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [compras, setCompras] = useState([]);
  const [pestania, setPestania] = useState("activas");
  const [error, setError] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(
    () =>
      get("/compras")
        .then(setCompras)
        .catch((e) => setError(e.message)),
    []
  );

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const refrescar = async () => {
    setRefrescando(true);
    await Promise.all([cargar(), new Promise((r) => setTimeout(r, 500))]);
    setRefrescando(false);
  };

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;

  const activas = compras.filter((c) => !esPasada(c));
  const pasadas = compras.filter(esPasada);
  const visibles = pestania === "activas" ? activas : pasadas;

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.titulo}>Mis Compras</Text>

      <View style={styles.pestanias}>
        <Pestania texto={`Activas (${activas.length})`} activa={pestania === "activas"} onPress={() => setPestania("activas")} />
        <Pestania texto={`Pasadas (${pasadas.length})`} activa={pestania === "pasadas"} onPress={() => setPestania("pasadas")} />
      </View>

      <FlatList
        data={visibles}
        refreshing={refrescando}
        onRefresh={refrescar}
        keyExtractor={(compra) => String(compra.id)}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.centro}>
            {pestania === "activas" ? "No tenés entradas activas" : "Todavía no hay compras pasadas"}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate("Entrada", { compraId: item.id })}>
            <Entrada compra={item} navigation={navigation} />
          </Pressable>
        )}
      />
    </View>
  );
}

// Una entrada en la lista: tocarla abre su pantalla con todos los datos.
function Entrada({ compra, navigation }) {
  const estado = ESTADOS[compra.estado];
  const pendiente = compra.estado === "PENDIENTE_PAGO" && !esPasada(compra);

  return (
    <TicketCard
      arriba={
        <View style={styles.arribaFila}>
          <View style={styles.info}>
            <View style={[styles.estado, { backgroundColor: estado.color }]}>
              <Text style={styles.estadoTexto}>{estado.texto}</Text>
            </View>
            <Text style={styles.nombre} numberOfLines={2}>{compra.evento.nombre}</Text>
            <Linea icono="calendar-outline" texto={formatearFechaLarga(compra.evento.fecha)} />
            <Linea icono="business-outline" texto={compra.evento.organizador?.nombre ?? "Sin organizador"} />
            {compra.diasParaEvento !== null && compra.diasParaEvento !== undefined && (
              <Text style={styles.dias}>{textoDias(compra.diasParaEvento)}</Text>
            )}
          </View>

          <View style={styles.foto}>
            {imagenDe(compra.evento) ? (
              <Image source={imagenDe(compra.evento)} style={styles.fotoImagen} resizeMode="cover" />
            ) : (
              <Ionicons name={iconoDe(compra.evento)} size={30} color={colores.acento} />
            )}
          </View>
        </View>
      }
      abajo={
        <View>
          <View style={styles.abajoFila}>
            <View style={styles.entrada}>
              <Ionicons name="ticket-outline" size={16} color={colores.indigo} />
              <Text style={styles.entradaTexto}>{compra.cantidad} × {compra.tipoEntrada.nombre}</Text>
            </View>
            <Text style={styles.total}>{formatearPrecio(compra.total)}</Text>
          </View>

          {pendiente && (
            <Pressable
              style={styles.botonCoral}
              onPress={() =>
                navigation.navigate("Pagar", {
                  compraId: compra.id,
                  total: compra.total,
                  titulo: `${compra.cantidad} × ${compra.tipoEntrada.nombre} · ${compra.evento.nombre}`,
                })
              }
            >
              <Text style={styles.botonCoralTexto}>Pagar {formatearPrecio(compra.total)}</Text>
            </Pressable>
          )}

          {compra.estado === "UTILIZADA" && (
            <Pressable
              style={styles.puntuar}
              onPress={() => navigation.navigate("Resena", { compraId: compra.id, evento: compra.evento.nombre })}
            >
              <Ionicons name="star" size={16} color="#B45309" />
              <Text style={styles.puntuarTexto}>Puntuar evento</Text>
            </Pressable>
          )}
        </View>
      }
    />
  );
}

function Pestania({ texto, activa, onPress }) {
  return (
    <Pressable style={[styles.pestania, activa && styles.pestaniaActiva]} onPress={onPress}>
      <Text style={[styles.pestaniaTexto, activa && styles.pestaniaTextoActivo]}>{texto}</Text>
    </Pressable>
  );
}

function Linea({ icono, texto }) {
  return (
    <View style={styles.linea}>
      <Ionicons name={icono} size={14} color={colores.textoSuave} />
      <Text style={styles.lineaTexto} numberOfLines={1}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  titulo: { fontSize: 26, fontWeight: "800", color: colores.indigo, paddingHorizontal: 16, marginBottom: 12 },

  pestanias: { flexDirection: "row", borderBottomWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco },
  pestania: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderColor: "transparent" },
  pestaniaActiva: { borderColor: colores.acento },
  pestaniaTexto: { color: colores.textoSuave, fontWeight: "600" },
  pestaniaTextoActivo: { color: colores.indigo, fontWeight: "800" },

  lista: { padding: 16 },

  arribaFila: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  info: { flex: 1 },
  nombre: { fontSize: 17, fontWeight: "800", color: colores.indigo, marginBottom: 4 },
  linea: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  lineaTexto: { color: colores.textoSuave, fontSize: 13, flexShrink: 1 },
  dias: { color: colores.exito, fontWeight: "700", fontSize: 13, marginTop: 6 },

  foto: {
    width: 92, height: 92, borderRadius: 10, overflow: "hidden", backgroundColor: colores.indigo,
    alignItems: "center", justifyContent: "center",
  },
  fotoImagen: { width: "100%", height: "100%" },
  estado: { alignSelf: "flex-start", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 },
  estadoTexto: { color: colores.blanco, fontSize: 11, fontWeight: "700" },

  abajoFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entrada: { flexDirection: "row", alignItems: "center", gap: 8 },
  entradaTexto: { fontWeight: "600", color: colores.indigo },
  total: { fontWeight: "800", color: colores.indigo, fontSize: 16 },

  botonCoral: { backgroundColor: colores.acento, borderRadius: 10, padding: 12, alignItems: "center", marginTop: 12 },
  botonCoralTexto: { color: colores.blanco, fontWeight: "700" },
  puntuar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FCD34D", borderRadius: 10, padding: 12, marginTop: 12,
  },
  puntuarTexto: { color: "#B45309", fontWeight: "700" },

  centro: { marginTop: 60, textAlign: "center", color: colores.textoSuave },
});
