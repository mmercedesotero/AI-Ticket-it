import CabeceraPantalla from "../componentes/CabeceraPantalla";
import { useCallback, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { useSesion } from "../sesion";
import { colores, radios } from "../tema";
import { formatearFechaLarga, formatearPrecio, yaSeRealizo } from "../formato";
import { imagenDe } from "../imagenes";

const sumar = (lista, campo) => lista.reduce((total, x) => total + x[campo], 0);
const porcentaje = (vendidas, capacidad) =>
  capacidad > 0 ? Math.round((vendidas / capacidad) * 100) : 0;

export default function OrganizadorScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const organizador = sesion.usuario;
  const [eventos, setEventos] = useState([]);
  const [resenias, setResenias] = useState(null);
  const [error, setError] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const todos = await get("/eventos?orden=fecha");
      const propios = todos.filter((e) => e.organizador?.id === organizador.id);

      // Por cada evento: entradas vendidas, capacidad total e ingresos.
      const conVentas = await Promise.all(
        propios.map(async (evento) => {
          const datos = await get(`/compras?eventoId=${evento.id}`);
          const vigentes = datos.compras.filter(
            (c) => c.estado !== "CANCELADA" && c.estado !== "REEMBOLSADA"
          );
          const pagadas = datos.compras.filter(
            (c) => c.estado === "CONFIRMADA" || c.estado === "UTILIZADA"
          );
          const vendidas = sumar(vigentes, "cantidad");
          const restantes = sumar(datos.entradasDisponibles, "cupoDisponible");

          return {
            evento,
            vendidas,
            capacidad: vendidas + restantes,
            ingresos: sumar(pagadas, "total"),
          };
        })
      );

      setEventos(conVentas);
      setResenias(await get(`/resenias?organizadorId=${organizador.id}`));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [organizador.id]);

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

  const vendidas = sumar(eventos, "vendidas");
  const capacidad = sumar(eventos, "capacidad");
  const ingresos = sumar(eventos, "ingresos");
  const activos = eventos.filter((e) => !yaSeRealizo(e.evento.fecha));
  const finalizados = eventos.filter((e) => yaSeRealizo(e.evento.fecha));

  return (
    <View style={styles.fondo}>
    <CabeceraPantalla titulo="Panel organizador" subtitulo={organizador.nombre} />
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenedor, { paddingTop: 18 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
    >

      {error && <Text style={styles.error}>Error: {error}</Text>}

      <View style={styles.grilla}>
        <View style={styles.dato}>
          <Text style={styles.datoEtiqueta}>Entradas vendidas</Text>
          <Text style={styles.datoValor}>{vendidas} / {capacidad}</Text>
          <Barra porcentaje={porcentaje(vendidas, capacidad)} />
        </View>
        <View style={styles.dato}>
          <Text style={styles.datoEtiqueta}>Ingresos totales</Text>
          <Text style={styles.datoValor}>{formatearPrecio(ingresos)}</Text>
        </View>
        <View style={styles.dato}>
          <Text style={styles.datoEtiqueta}>Eventos activos</Text>
          <Text style={styles.datoValor}>{activos.length} en curso</Text>
        </View>
        <View style={styles.dato}>
          <Text style={styles.datoEtiqueta}>Calificación</Text>
          <Text style={styles.datoValor}>
            {resenias && resenias.puntajePromedio !== null ? (
              <>
                {resenias.puntajePromedio} <Ionicons name="star" size={15} color="#F59E0B" />{" "}
                <Text style={styles.datoChico}>({resenias.cantidad} reseñas)</Text>
              </>
            ) : (
              <Text style={styles.datoChico}>Sin reseñas</Text>
            )}
          </Text>
        </View>
      </View>

      <Pressable style={styles.crear} onPress={() => navigation.navigate("CrearEvento")}>
        <Ionicons name="add" size={20} color={colores.blanco} />
        <Text style={styles.crearTexto}>Crear Evento</Text>
      </Pressable>

      <Text style={styles.seccion}>Eventos Activos</Text>
      {activos.length === 0 && <Text style={styles.vacio}>No tenés eventos activos</Text>}
      {activos.map((datos) => (
        <TarjetaEvento key={datos.evento.id} datos={datos} navigation={navigation} />
      ))}

      {finalizados.length > 0 && (
        <>
          <Text style={styles.seccion}>Eventos Finalizados</Text>
          {finalizados.map((datos) => (
            <TarjetaEvento key={datos.evento.id} datos={datos} navigation={navigation} />
          ))}
        </>
      )}
    </ScrollView>
    </View>
  );
}

function TarjetaEvento({ datos, navigation }) {
  const { evento, vendidas, capacidad } = datos;
  const finalizado = yaSeRealizo(evento.fecha);
  const foto = imagenDe(evento);
  const pct = porcentaje(vendidas, capacidad);

  return (
    <View style={styles.tarjeta}>
      <View style={styles.tarjetaFila}>
        <View style={styles.miniatura}>
          {foto ? (
            <Image source={foto} style={styles.foto} resizeMode="cover" />
          ) : (
            <Ionicons name="calendar" size={28} color={colores.acento} />
          )}
        </View>
        <View style={styles.tarjetaCuerpo}>
          <Text style={styles.nombre} numberOfLines={1}>{evento.nombre}</Text>
          <Text style={styles.detalle}>{formatearFechaLarga(evento.fecha)}</Text>
          <Text style={styles.detalle}>{vendidas} / {capacidad} entradas</Text>
          <View style={styles.progreso}>
            <View style={styles.progresoBarra}>
              <Barra porcentaje={pct} />
            </View>
            <Text style={styles.pct}>{pct}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.tarjetaPie}>
        <Text style={[styles.estado, finalizado && styles.estadoFinalizado]}>
          {finalizado ? "Finalizado" : "En venta"}
        </Text>
        <Pressable
          style={styles.gestionar}
          onPress={() => navigation.navigate("ComprasEvento", { id: evento.id })}
        >
          <Text style={styles.gestionarTexto}>Gestionar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Barra({ porcentaje: pct }) {
  return (
    <View style={styles.barraFondo}>
      <View style={[styles.barraRelleno, { width: `${Math.min(pct, 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { paddingHorizontal: 16, paddingBottom: 32 },
  titulo: { fontSize: 24, fontWeight: "800", color: colores.indigo },
  subtitulo: { color: colores.textoSuave, marginBottom: 16, marginTop: 2 },
  error: { color: colores.error, marginBottom: 12 },

  grilla: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  dato: {
    width: "48%", flexGrow: 1, backgroundColor: colores.blanco, borderRadius: radios.tarjeta,
    padding: 14, borderWidth: 1, borderColor: colores.borde,
  },
  datoEtiqueta: { color: colores.textoSuave, fontSize: 13 },
  datoValor: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 4 },
  datoChico: { fontSize: 12, fontWeight: "400", color: colores.textoSuave },

  barraFondo: { height: 6, borderRadius: 3, backgroundColor: "#E2E8F0", overflow: "hidden", marginTop: 8 },
  barraRelleno: { height: "100%", borderRadius: 3, backgroundColor: colores.acento },

  crear: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: colores.acento, borderRadius: radios.boton, paddingVertical: 14,
  },
  crearTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },

  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 24, marginBottom: 10 },
  vacio: { color: colores.textoSuave },

  tarjeta: {
    backgroundColor: colores.blanco, borderRadius: radios.tarjeta, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  tarjetaFila: { flexDirection: "row", gap: 12 },
  miniatura: { width: 96, height: 64, borderRadius: 10, overflow: "hidden", backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  foto: { width: "100%", height: "100%" },
  tarjetaCuerpo: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: "700", color: colores.indigo },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 1 },
  progreso: { flexDirection: "row", alignItems: "center", gap: 8 },
  progresoBarra: { flex: 1 },
  pct: { fontSize: 12, fontWeight: "700", color: colores.indigo, marginTop: 8 },

  tarjetaPie: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  estado: {
    color: colores.acento, backgroundColor: colores.acentoSuave, fontSize: 12, fontWeight: "600",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: "hidden",
  },
  estadoFinalizado: { color: colores.textoSuave, backgroundColor: "#F1F5F9" },
  gestionar: { borderWidth: 1, borderColor: colores.borde, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  gestionarTexto: { fontWeight: "600", color: colores.indigo },
});
