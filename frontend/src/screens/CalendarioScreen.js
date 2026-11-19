import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { useEventos } from "../eventos";
import { useSesion } from "../sesion";
import { iconoDe } from "../componentes/TarjetaEvento";
import { colores, radios } from "../tema";
import { formatearFechaLarga } from "../formato";
import { imagenDe } from "../imagenes";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

const clave = (anio, mes, dia) => `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

// Calendario del mes, al estilo del de iOS: los días con eventos llevan un puntito debajo.
// El comprador ve sus entradas y sus favoritos; el organizador ve sus eventos.
export default function CalendarioScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const { eventos, favoritos } = useEventos();
  const esOrganizador = sesion.rol === "ORGANIZADOR";

  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [seleccionado, setSeleccionado] = useState(clave(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  const [compras, setCompras] = useState([]);

  // Las compras se piden cada vez que se entra a la pestaña, para que estén al día.
  useFocusEffect(
    useCallback(() => {
      if (!esOrganizador) get("/compras").then(setCompras).catch(() => {});
    }, [esOrganizador])
  );

  // fecha (AAAA-MM-DD) -> lista de { evento, tipo, compra }
  const porDia = useMemo(() => {
    const mapa = {};
    const agregar = (fecha, item) => {
      mapa[fecha] = mapa[fecha] ?? [];
      // Si el mismo evento ya está en ese día con otro tipo, se prioriza "entrada" sobre "favorito".
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
  };

  const irAHoy = () => {
    setAnio(hoy.getFullYear());
    setMes(hoy.getMonth());
    setSeleccionado(clave(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  };

  // Celdas del mes: huecos al principio (la semana empieza el lunes) y después los días.
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const huecos = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const celdas = [...Array(huecos).fill(null), ...Array.from({ length: diasDelMes }, (_, i) => i + 1)];

  const claveHoy = clave(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const delDia = porDia[seleccionado] ?? [];

  // Próximos eventos del mes visible (para cuando el día elegido no tiene nada).
  const prefijoMes = `${anio}-${String(mes + 1).padStart(2, "0")}`;
  const delMes = Object.keys(porDia)
    .filter((f) => f.startsWith(prefijoMes))
    .sort()
    .flatMap((f) => porDia[f]);

  const abrir = (item) => {
    if (item.compra) navigation.navigate("Entrada", { compraId: item.compra.id });
    else if (esOrganizador) navigation.navigate("ComprasEvento", { id: item.evento.id });
    else navigation.navigate("Detalle", { id: item.evento.id });
  };

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenedor, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>Calendario</Text>

      <View style={styles.mesFila}>
        <Text style={styles.mes}>
          {MESES[mes]} <Text style={styles.anio}>{anio}</Text>
        </Text>
        <View style={styles.controles}>
          <Pressable onPress={irAHoy} hitSlop={8}>
            <Text style={styles.hoy}>Hoy</Text>
          </Pressable>
          <Pressable onPress={() => cambiarMes(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colores.indigo} />
          </Pressable>
          <Pressable onPress={() => cambiarMes(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={24} color={colores.indigo} />
          </Pressable>
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
          const elegido = k === seleccionado;
          const tieneEntrada = eventosDia.some((x) => x.tipo === "entrada" || x.tipo === "propio");
          const tieneFavorito = eventosDia.some((x) => x.tipo === "favorito");

          return (
            <Pressable key={k} style={styles.celda} onPress={() => setSeleccionado(k)}>
              <View style={[styles.numero, esHoy && styles.numeroHoy, elegido && !esHoy && styles.numeroElegido]}>
                <Text style={[styles.numeroTexto, esHoy && styles.numeroTextoHoy, elegido && !esHoy && styles.numeroTextoElegido]}>
                  {dia}
                </Text>
              </View>
              <View style={styles.puntos}>
                {tieneEntrada && <View style={[styles.punto, { backgroundColor: colores.acento }]} />}
                {tieneFavorito && <View style={[styles.punto, { backgroundColor: "#94A3B8" }]} />}
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
            <View style={[styles.punto, { backgroundColor: "#94A3B8" }]} />
            <Text style={styles.leyendaTexto}>Favoritos</Text>
          </View>
        )}
      </View>

      <Text style={styles.seccion}>
        {delDia.length > 0 ? formatearFechaLarga(seleccionado) : "Eventos de este mes"}
      </Text>

      {(delDia.length > 0 ? delDia : delMes).map((item) => (
        <Fila key={`${item.evento.id}-${item.tipo}`} item={item} onPress={() => abrir(item)} />
      ))}

      {delDia.length === 0 && delMes.length === 0 && (
        <View style={styles.vacio}>
          <Ionicons name="calendar-outline" size={40} color={colores.textoPlaceholder} />
          <Text style={styles.vacioTexto}>
            {esOrganizador ? "No tenés eventos este mes." : "No tenés entradas ni favoritos este mes."}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Fila({ item, onPress }) {
  const foto = imagenDe(item.evento);
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
      </View>
      <View style={[styles.etiqueta, item.tipo === "favorito" && styles.etiquetaFavorito]}>
        <Text style={[styles.etiquetaTexto, item.tipo === "favorito" && styles.etiquetaTextoFavorito]}>{etiqueta}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { paddingHorizontal: 16, paddingBottom: 32 },
  titulo: { fontSize: 26, fontWeight: "800", color: colores.indigo, marginBottom: 16 },

  mesFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  mes: { fontSize: 22, fontWeight: "800", color: colores.indigo },
  anio: { fontWeight: "500", color: colores.textoSuave },
  controles: { flexDirection: "row", alignItems: "center", gap: 14 },
  hoy: { color: colores.acento, fontWeight: "700", fontSize: 15 },

  semana: { flexDirection: "row", marginBottom: 6 },
  diaSemana: { flex: 1, textAlign: "center", color: colores.textoSuave, fontWeight: "600", fontSize: 12 },

  grilla: { flexDirection: "row", flexWrap: "wrap" },
  celda: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 3 },
  numero: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  numeroHoy: { backgroundColor: colores.acento },
  numeroElegido: { backgroundColor: colores.indigo },
  numeroTexto: { fontSize: 16, color: colores.indigo, fontWeight: "500" },
  numeroTextoHoy: { color: colores.blanco, fontWeight: "800" },
  numeroTextoElegido: { color: colores.blanco, fontWeight: "800" },
  puntos: { flexDirection: "row", gap: 3, height: 6, marginTop: 2 },
  punto: { width: 6, height: 6, borderRadius: 3 },

  leyenda: { flexDirection: "row", gap: 18, marginTop: 8 },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  leyendaTexto: { color: colores.textoSuave, fontSize: 12 },

  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 22, marginBottom: 10 },

  fila: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.blanco,
    borderRadius: radios.tarjeta, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  miniatura: { width: 64, height: 48, borderRadius: 8, overflow: "hidden", backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  foto: { width: "100%", height: "100%" },
  filaTextos: { flex: 1 },
  filaNombre: { fontWeight: "700", color: colores.indigo, fontSize: 15 },
  filaFecha: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  etiqueta: { backgroundColor: colores.acentoSuave, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  etiquetaFavorito: { backgroundColor: "#F1F5F9" },
  etiquetaTexto: { color: colores.acento, fontSize: 11, fontWeight: "700" },
  etiquetaTextoFavorito: { color: colores.textoSuave },

  vacio: { alignItems: "center", gap: 8, marginTop: 20 },
  vacioTexto: { color: colores.textoSuave, textAlign: "center" },
});
