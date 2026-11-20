import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { useEventos } from "../eventos";
import { useSesion } from "../sesion";
import { useRefrescar } from "../refrescar";
import CabeceraPantalla from "../componentes/CabeceraPantalla";
import Chip from "../componentes/Chip";
import Segmentos from "../componentes/Segmentos";
import { iconoDe } from "../componentes/TarjetaEvento";
import { colores, radios } from "../tema";
import { formatearFechaLarga } from "../formato";
import { imagenDe } from "../imagenes";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const CORAL_OSCURO = "#B5503C";
const AZUL = "#2563EB";

const clave = (anio, mes, dia) => `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

// Calendario del mes: los días con eventos se marcan con un cuadradito y un punto de color.
// El comprador ve sus entradas y sus favoritos; el organizador ve sus eventos.
export default function CalendarioScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const { eventos, favoritos, recargar } = useEventos();
  const esOrganizador = sesion.rol === "ORGANIZADOR";

  const hoy = new Date();
  const claveHoy = clave(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [diaElegido, setDiaElegido] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [compras, setCompras] = useState([]);

  const cargarCompras = useCallback(
    () => (esOrganizador ? Promise.resolve() : get("/compras").then(setCompras).catch(() => {})),
    [esOrganizador]
  );
  const { refreshProps, indicador } = useRefrescar(() => Promise.all([recargar(), cargarCompras()]));

  // Las compras se piden cada vez que se entra a la pestaña, para que estén al día.
  useFocusEffect(
    useCallback(() => {
      cargarCompras();
    }, [cargarCompras])
  );

  // fecha (AAAA-MM-DD) -> lista de { evento, tipo, compra }
  const porDia = useMemo(() => {
    const mapa = {};
    const agregar = (fecha, item) => {
      mapa[fecha] = mapa[fecha] ?? [];
      // Si el mismo evento ya está ese día con otro tipo, se prioriza "entrada" sobre "favorito".
      const existente = mapa[fecha].find((x) => x.evento.id === item.evento.id);
      if (!existente) mapa[fecha].push(item);
      else if (item.tipo === "entrada" && existente.tipo !== "entrada") Object.assign(existente, item);
    };

    if (esOrganizador) {
      eventos
        .filter((e) => e.organizador?.id === sesion.usuario.id)
        .forEach((e) => agregar(e.fecha, { evento: e, tipo: "propio" }));
    } else {
      compras
        .filter((c) => c.estado === "CONFIRMADA" || c.estado === "PENDIENTE_PAGO" || c.estado === "UTILIZADA")
        .forEach((c) => agregar(c.evento.fecha, { evento: c.evento, tipo: "entrada", compra: c }));
      favoritos.forEach((e) => agregar(e.fecha, { evento: e, tipo: "favorito" }));
    }
    return mapa;
  }, [esOrganizador, eventos, favoritos, compras, sesion.usuario.id]);

  const cambiarMes = (diferencia) => {
    const nuevo = new Date(anio, mes + diferencia, 1);
    setAnio(nuevo.getFullYear());
    setMes(nuevo.getMonth());
    setDiaElegido(null);
  };

  const irAHoy = () => {
    setAnio(hoy.getFullYear());
    setMes(hoy.getMonth());
    setDiaElegido(claveHoy);
  };

  // Celdas del mes: huecos al principio (la semana empieza el lunes) y después los días.
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const huecos = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const celdas = [...Array(huecos).fill(null), ...Array.from({ length: diasDelMes }, (_, i) => i + 1)];

  // Eventos del mes visible, o solo los del día elegido.
  const prefijoMes = `${anio}-${String(mes + 1).padStart(2, "0")}`;
  const delMes = Object.keys(porDia)
    .filter((f) => f.startsWith(prefijoMes))
    .sort()
    .flatMap((f) => porDia[f]);

  const cantidadEntradas = delMes.filter((x) => x.tipo === "entrada").length;
  const cantidadFavoritos = delMes.filter((x) => x.tipo === "favorito").length;

  const base = diaElegido && porDia[diaElegido] ? porDia[diaElegido] : delMes;
  const lista = base.filter((x) => filtro === "todos" || (filtro === "entradas" ? x.tipo === "entrada" : x.tipo === "favorito"));

  const opciones = esOrganizador
    ? null
    : [
        { clave: "todos", etiqueta: "Todos" },
        { clave: "entradas", etiqueta: `Mis entradas (${cantidadEntradas})` },
        { clave: "favoritos", etiqueta: `Favoritos (${cantidadFavoritos})` },
      ];

  const abrir = (item) => {
    if (item.compra) navigation.navigate("Entrada", { compraId: item.compra.id });
    else if (esOrganizador) navigation.navigate("ComprasEvento", { id: item.evento.id });
    else navigation.navigate("Detalle", { id: item.evento.id });
  };

  return (
    <View style={styles.fondo}>
      <CabeceraPantalla titulo="Calendario" />
      {indicador}
      <ScrollView
        contentContainerStyle={[styles.contenedor, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        {...refreshProps}
      >
        <View style={styles.tarjeta}>
          <View style={styles.mesFila}>
            <Text style={styles.mes}>
              {MESES[mes]} <Text style={styles.anio}>{anio}</Text>
            </Text>
            <View style={styles.controles}>
              <Pressable style={styles.flecha} onPress={() => cambiarMes(-1)} hitSlop={8}>
                <Ionicons name="chevron-back" size={18} color={colores.indigo} />
              </Pressable>
              <Pressable style={styles.flecha} onPress={() => cambiarMes(1)} hitSlop={8}>
                <Ionicons name="chevron-forward" size={18} color={colores.indigo} />
              </Pressable>
              <Chip etiqueta="Hoy" onPress={irAHoy} />
            </View>
          </View>

          <View style={styles.semana}>
            {DIAS.map((d, i) => (
              <Text key={i} style={styles.diaSemana}>{d}</Text>
            ))}
          </View>

          <View style={styles.grilla}>
            {celdas.map((dia, i) => {
              if (dia === null) return <View key={`h${i}`} style={styles.celda} />;

              const k = clave(anio, mes, dia);
              const eventosDia = porDia[k] ?? [];
              const esHoy = k === claveHoy;
              const elegido = k === diaElegido;
              const tieneEntrada = eventosDia.some((x) => x.tipo === "entrada" || x.tipo === "propio");
              const tieneFavorito = eventosDia.some((x) => x.tipo === "favorito");
              const conEventos = eventosDia.length > 0;

              return (
                <Pressable key={k} style={styles.celda} onPress={() => setDiaElegido(elegido ? null : k)}>
                  <View
                    style={[
                      styles.numero,
                      conEventos && styles.numeroConEventos,
                      esHoy && styles.numeroHoy,
                      elegido && !esHoy && styles.numeroElegido,
                    ]}
                  >
                    <Text style={[styles.numeroTexto, esHoy && styles.numeroTextoHoy, elegido && !esHoy && { color: colores.indigo, fontWeight: "800" }]}>
                      {dia}
                    </Text>
                    <View style={styles.puntos}>
                      {tieneEntrada && <View style={[styles.punto, { backgroundColor: esHoy ? colores.blanco : colores.acento }]} />}
                      {tieneFavorito && <View style={[styles.punto, { backgroundColor: esHoy ? colores.blanco : AZUL }]} />}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.leyenda}>
            <View style={styles.leyendaItem}>
              <View style={[styles.punto, { backgroundColor: colores.acento }]} />
              <Text style={styles.leyendaTexto}>{esOrganizador ? "Tus eventos" : "Tus entradas"}</Text>
            </View>
            {!esOrganizador && (
              <View style={styles.leyendaItem}>
                <View style={[styles.punto, { backgroundColor: AZUL }]} />
                <Text style={styles.leyendaTexto}>Favoritos</Text>
              </View>
            )}
          </View>
        </View>

        {opciones && (
          <View style={{ marginTop: 16 }}>
            <Segmentos opciones={opciones} valor={filtro} onCambiar={setFiltro} />
          </View>
        )}

        <View style={styles.seccionFila}>
          <Text style={styles.seccion}>
            {diaElegido && porDia[diaElegido] ? formatearFechaLarga(diaElegido) : `Eventos de ${MESES[mes].toLowerCase()}`}
          </Text>
          {diaElegido && (
            <Pressable onPress={() => setDiaElegido(null)} hitSlop={8}>
              <Text style={styles.verMes}>Ver todo el mes</Text>
            </Pressable>
          )}
        </View>

        {lista.map((item) => (
          <Fila key={`${item.evento.id}-${item.tipo}`} item={item} onPress={() => abrir(item)} />
        ))}

        {lista.length === 0 && (
          <View style={styles.vacio}>
            <Ionicons name="calendar-outline" size={40} color={colores.textoPlaceholder} />
            <Text style={styles.vacioTexto}>
              {esOrganizador ? "No tenés eventos este mes." : "No hay nada para mostrar este mes."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Fila({ item, onPress }) {
  const foto = imagenDe(item.evento);
  const entrada = item.tipo === "entrada" || item.tipo === "propio";
  const etiqueta = item.tipo === "entrada" ? "Tu entrada" : item.tipo === "propio" ? "Tu evento" : "Favorito";

  return (
    <Pressable style={styles.fila} onPress={onPress}>
      <View style={styles.miniatura}>
        {foto ? (
          <Image source={foto} style={styles.foto} resizeMode="cover" />
        ) : (
          <Ionicons name={iconoDe(item.evento)} size={22} color={colores.acento} />
        )}
      </View>
      <View style={styles.filaTextos}>
        <Text style={styles.filaNombre} numberOfLines={1}>{item.evento.nombre}</Text>
        <Text style={styles.filaFecha}>{formatearFechaLarga(item.evento.fecha)}</Text>
        <Text style={styles.filaLugar} numberOfLines={1}>{item.evento.organizador?.nombre}</Text>
      </View>
      <View style={[styles.etiqueta, entrada ? styles.etiquetaEntrada : styles.etiquetaFavorito]}>
        <Ionicons name={entrada ? "ticket-outline" : "heart"} size={11} color={entrada ? CORAL_OSCURO : AZUL} />
        <Text style={[styles.etiquetaTexto, { color: entrada ? CORAL_OSCURO : AZUL }]}>{etiqueta}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { padding: 16 },

  tarjeta: { backgroundColor: colores.blanco, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colores.borde },
  mesFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mes: { fontSize: 20, fontWeight: "800", color: colores.indigo },
  anio: { fontWeight: "500", color: colores.textoSuave },
  controles: { flexDirection: "row", alignItems: "center", gap: 8 },
  flecha: {
    width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.06)",
  },

  semana: { flexDirection: "row", marginBottom: 6 },
  diaSemana: { flex: 1, textAlign: "center", color: colores.textoPlaceholder, fontWeight: "700", fontSize: 12 },

  grilla: { flexDirection: "row", flexWrap: "wrap" },
  celda: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 2 },
  numero: {
    width: 40, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "transparent",
  },
  numeroConEventos: { backgroundColor: colores.acentoSuave, borderColor: "rgba(239,128,108,0.35)" },
  numeroHoy: { backgroundColor: colores.acento, borderColor: colores.acento },
  numeroElegido: { borderColor: colores.indigo, borderWidth: 2 },
  numeroTexto: { fontSize: 15, color: colores.indigo, fontWeight: "500" },
  numeroTextoHoy: { color: colores.blanco, fontWeight: "800" },
  puntos: { flexDirection: "row", gap: 3, height: 6, marginTop: 3 },
  punto: { width: 6, height: 6, borderRadius: 3 },

  leyenda: { flexDirection: "row", gap: 18, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: colores.borde },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  leyendaTexto: { color: colores.textoSuave, fontSize: 12 },

  seccionFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 10 },
  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo },
  verMes: { color: colores.acento, fontWeight: "700", fontSize: 13 },

  fila: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.blanco,
    borderRadius: radios.tarjeta, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  miniatura: { width: 64, height: 64, borderRadius: 10, overflow: "hidden", backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  foto: { width: "100%", height: "100%" },
  filaTextos: { flex: 1 },
  filaNombre: { fontWeight: "800", color: colores.indigo, fontSize: 15 },
  filaFecha: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  filaLugar: { color: colores.textoPlaceholder, fontSize: 12, marginTop: 1 },
  etiqueta: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  etiquetaEntrada: { backgroundColor: "rgba(239,128,108,0.10)", borderColor: "rgba(239,128,108,0.35)" },
  etiquetaFavorito: { backgroundColor: "rgba(37,99,235,0.08)", borderColor: "rgba(37,99,235,0.3)" },
  etiquetaTexto: { fontSize: 11, fontWeight: "700" },

  vacio: { alignItems: "center", gap: 8, marginTop: 20 },
  vacioTexto: { color: colores.textoSuave, textAlign: "center" },
});
