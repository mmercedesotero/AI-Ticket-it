import { useRefrescar } from "../refrescar";
import CabeceraPantalla from "../componentes/CabeceraPantalla";
import BotonMensajes from "../componentes/BotonMensajes";
import Chip from "../componentes/Chip";
import Segmentos from "../componentes/Segmentos";
import { POCAS_ENTRADAS } from "../componentes/TarjetaEvento";
import { useCallback, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import { get } from "../api";
import { useSesion } from "../sesion";
import { colores, radios } from "../tema";
import { formatearFechaLarga, formatearPrecio, yaSeRealizo } from "../formato";
import { imagenDe } from "../imagenes";

const CORAL_OSCURO = "#B5503C";

const sumar = (lista, campo) => lista.reduce((total, x) => total + x[campo], 0);
const porcentaje = (vendidas, capacidad) =>
  capacidad > 0 ? Math.round((vendidas / capacidad) * 100) : 0;

// Días que faltan para el evento (0 = hoy, 1 = mañana, negativo = ya pasó).
const diasPara = (fecha) =>
  Math.round((new Date(`${fecha}T00:00:00`) - new Date().setHours(0, 0, 0, 0)) / 86400000);

// Filtros rápidos de la lista (se aplican sobre los eventos que todavía no se realizaron).
const FILTROS = [
  { clave: "todos", etiqueta: "Todos", icono: "apps-outline" },
  { clave: "pronto", etiqueta: "Hoy y mañana", icono: "alarm-outline", cumple: (d) => !d.finalizado && d.dias <= 1 },
  { clave: "semana", etiqueta: "Esta semana", icono: "calendar-outline", cumple: (d) => !d.finalizado && d.dias <= 7 },
  { clave: "agotandose", etiqueta: "Agotándose", icono: "flame-outline", cumple: (d) => !d.finalizado && d.restantes > 0 && d.restantes <= POCAS_ENTRADAS },
  { clave: "sinventas", etiqueta: "Sin ventas", icono: "trending-down-outline", cumple: (d) => !d.finalizado && d.vendidas === 0 },
];

export default function OrganizadorScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const lista = useRef(null);
  useScrollToTop(lista);
  const { sesion } = useSesion();
  const organizador = sesion.usuario;
  const [eventos, setEventos] = useState([]);
  const [resenias, setResenias] = useState(null);
  const [error, setError] = useState(null);
  const [estado, setEstado] = useState("proximos");
  const [filtro, setFiltro] = useState("todos");

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
            restantes,
            capacidad: vendidas + restantes,
            ingresos: sumar(pagadas, "total"),
            dias: diasPara(evento.fecha),
            finalizado: yaSeRealizo(evento.fecha),
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

  const { refreshProps, indicador } = useRefrescar(cargar);

  const vendidas = sumar(eventos, "vendidas");
  const capacidad = sumar(eventos, "capacidad");
  const ingresos = sumar(eventos, "ingresos");
  const activos = eventos.filter((e) => !e.finalizado);
  const finalizados = eventos.filter((e) => e.finalizado);

  // Eventos de hoy y de mañana: se destacan arriba de todo.
  const proximos = activos.filter((e) => e.dias <= 1);

  const base = estado === "proximos" ? activos : estado === "finalizados" ? finalizados : eventos;
  const filtroActual = FILTROS.find((f) => f.clave === filtro);
  const visibles = base
    .filter((d) => (filtroActual.cumple ? filtroActual.cumple(d) : true))
    .sort((a, b) => (estado === "finalizados" ? b.dias - a.dias : a.dias - b.dias));

  return (
    <View style={styles.fondo}>
      <CabeceraPantalla titulo="Panel organizador" subtitulo={organizador.nombre} derecha={<BotonMensajes />} />
      {indicador}
      <ScrollView
        ref={lista}
        style={styles.fondo}
        contentContainerStyle={[styles.contenedor, { paddingTop: 18, paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        {...refreshProps}
      >
        {error && <Text style={styles.error}>Error: {error}</Text>}

        {proximos.map((d) => (
          <Pressable
            key={d.evento.id}
            style={styles.aviso}
            onPress={() => navigation.navigate("ComprasEvento", { id: d.evento.id })}
          >
            <View style={styles.avisoIcono}>
              <Ionicons name="alarm" size={22} color={colores.acento} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.avisoTitulo}>{d.dias === 0 ? "¡Hoy es tu evento!" : "Mañana es tu evento"}</Text>
              <Text style={styles.avisoTexto} numberOfLines={2}>
                {d.evento.nombre} · {d.vendidas} de {d.capacidad} entradas vendidas
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={CORAL_OSCURO} />
          </Pressable>
        ))}

        <View style={styles.grilla}>
          <Dato icono="ticket-outline" etiqueta="Entradas vendidas">
            <Text style={styles.datoValor}>{vendidas} / {capacidad}</Text>
            <Barra porcentaje={porcentaje(vendidas, capacidad)} />
          </Dato>
          <Dato icono="cash-outline" etiqueta="Ingresos totales">
            <Text style={styles.datoValor}>{formatearPrecio(ingresos)}</Text>
          </Dato>
          <Dato icono="calendar-outline" etiqueta="Eventos activos">
            <Text style={styles.datoValor}>{activos.length} <Text style={styles.datoChico}>en venta</Text></Text>
          </Dato>
          <Dato icono="star-outline" etiqueta="Calificación">
            {resenias && resenias.puntajePromedio !== null ? (
              <Text style={styles.datoValor}>
                {resenias.puntajePromedio} <Ionicons name="star" size={15} color="#F59E0B" />{" "}
                <Text style={styles.datoChico}>({resenias.cantidad})</Text>
              </Text>
            ) : (
              <Text style={styles.datoChico}>Sin reseñas</Text>
            )}
          </Dato>
        </View>

        <Text style={styles.seccion}>Mis eventos</Text>
        <Segmentos
          valor={estado}
          onCambiar={setEstado}
          opciones={[
            { clave: "proximos", etiqueta: `Próximos (${activos.length})` },
            { clave: "finalizados", etiqueta: `Finalizados (${finalizados.length})` },
            { clave: "todos", etiqueta: `Todos (${eventos.length})` },
          ]}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {FILTROS.map((f) => (
            <Chip key={f.clave} etiqueta={f.etiqueta} icono={f.icono} activo={filtro === f.clave} onPress={() => setFiltro(f.clave)} />
          ))}
        </ScrollView>

        {visibles.map((datos) => (
          <TarjetaEvento key={datos.evento.id} datos={datos} navigation={navigation} />
        ))}

        {visibles.length === 0 && (
          <View style={styles.vacio}>
            <Ionicons name="calendar-outline" size={40} color={colores.textoPlaceholder} />
            <Text style={styles.vacioTexto}>
              {eventos.length === 0 ? "Todavía no creaste eventos." : "No hay eventos con ese filtro."}
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable style={[styles.crear, { bottom: 16 }]} onPress={() => navigation.navigate("CrearEvento")}>
        <Ionicons name="add-circle" size={22} color={colores.blanco} />
        <Text style={styles.crearTexto}>Crear evento</Text>
      </Pressable>
    </View>
  );
}

function Dato({ icono, etiqueta, children }) {
  return (
    <View style={styles.dato}>
      <View style={styles.datoCabecera}>
        <View style={styles.datoIcono}>
          <Ionicons name={icono} size={16} color={colores.acento} />
        </View>
        <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      </View>
      {children}
    </View>
  );
}

function TarjetaEvento({ datos, navigation }) {
  const { evento, vendidas, capacidad, restantes, dias, finalizado } = datos;
  const foto = imagenDe(evento);
  const pct = porcentaje(vendidas, capacidad);
  const agotado = !finalizado && capacidad > 0 && restantes === 0;
  const agotandose = !finalizado && restantes > 0 && restantes <= POCAS_ENTRADAS;

  return (
    <Pressable style={styles.tarjeta} onPress={() => navigation.navigate("ComprasEvento", { id: evento.id })}>
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
        <View style={styles.etiquetas}>
          <Text style={[styles.estado, finalizado && styles.estadoFinalizado]}>
            {finalizado ? "Finalizado" : "En venta"}
          </Text>
          {!finalizado && dias <= 1 && (
            <Text style={[styles.estado, styles.estadoFuerte]}>{dias === 0 ? "Hoy" : "Mañana"}</Text>
          )}
          {agotado && <Text style={[styles.estado, styles.estadoOscuro]}>Agotado</Text>}
          {agotandose && <Text style={[styles.estado, styles.estadoFuerte]}>Agotándose</Text>}
        </View>
        <View style={styles.acciones}>
          {!finalizado && (
            <Chip etiqueta="Editar" icono="create-outline" onPress={() => navigation.navigate("CrearEvento", { eventoId: evento.id })} />
          )}
          <Chip etiqueta="Gestionar" icono="options-outline" onPress={() => navigation.navigate("ComprasEvento", { id: evento.id })} />
        </View>
      </View>
    </Pressable>
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
  contenedor: { paddingHorizontal: 16 },
  error: { color: colores.error, marginBottom: 12 },

  aviso: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.acentoSuave,
    borderWidth: 1, borderColor: "rgba(239,128,108,0.45)", borderRadius: radios.tarjeta, padding: 12, marginBottom: 10,
  },
  avisoIcono: { width: 40, height: 40, borderRadius: 20, backgroundColor: colores.blanco, alignItems: "center", justifyContent: "center" },
  avisoTitulo: { fontWeight: "800", color: colores.indigo, fontSize: 15 },
  avisoTexto: { color: CORAL_OSCURO, marginTop: 2, fontSize: 13 },

  grilla: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  dato: {
    width: "48%", flexGrow: 1, backgroundColor: colores.blanco, borderRadius: radios.tarjeta,
    padding: 14, borderWidth: 1, borderColor: colores.borde,
  },
  datoCabecera: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  datoIcono: { width: 26, height: 26, borderRadius: 13, backgroundColor: colores.acentoSuave, alignItems: "center", justifyContent: "center" },
  datoEtiqueta: { color: colores.textoSuave, fontSize: 12, flexShrink: 1 },
  datoValor: { fontSize: 18, fontWeight: "800", color: colores.indigo },
  datoChico: { fontSize: 12, fontWeight: "400", color: colores.textoSuave },

  barraFondo: { height: 6, borderRadius: 3, backgroundColor: "#E2E8F0", overflow: "hidden", marginTop: 8 },
  barraRelleno: { height: "100%", borderRadius: 3, backgroundColor: colores.acento },

  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 24, marginBottom: 10 },
  filtros: { gap: 8, paddingVertical: 12 },
  vacio: { alignItems: "center", gap: 8, marginTop: 24 },
  vacioTexto: { color: colores.textoSuave, textAlign: "center" },

  tarjeta: {
    backgroundColor: colores.blanco, borderRadius: radios.tarjeta, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  tarjetaFila: { flexDirection: "row", gap: 12 },
  miniatura: { width: 96, height: 72, borderRadius: 10, overflow: "hidden", backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  foto: { width: "100%", height: "100%" },
  tarjetaCuerpo: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: "800", color: colores.indigo },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 1 },
  progreso: { flexDirection: "row", alignItems: "center", gap: 8 },
  progresoBarra: { flex: 1 },
  pct: { fontSize: 12, fontWeight: "700", color: colores.indigo, marginTop: 8 },

  tarjetaPie: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, gap: 8 },
  acciones: { flexDirection: "row", gap: 6 },
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 },
  estado: {
    color: CORAL_OSCURO, backgroundColor: "rgba(239,128,108,0.12)", fontSize: 11, fontWeight: "700",
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, overflow: "hidden",
  },
  estadoFinalizado: { color: colores.textoSuave, backgroundColor: "#F1F5F9" },
  estadoFuerte: { color: colores.blanco, backgroundColor: colores.acento },
  estadoOscuro: { color: colores.blanco, backgroundColor: colores.indigo },

  crear: {
    position: "absolute", right: 16, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colores.acento, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 20,
    elevation: 6, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  crearTexto: { color: colores.blanco, fontWeight: "800", fontSize: 15 },
});
