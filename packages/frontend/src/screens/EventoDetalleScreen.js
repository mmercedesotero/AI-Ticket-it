import { alerta } from "../dialogo";
import { useCallback, useState } from "react";
import {
  Image, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { useEventos } from "../eventos";
import BotonFavorito from "../componentes/BotonFavorito";
import { iconoDe, textoPrecio } from "../componentes/TarjetaEvento";
import { colores, radios } from "../tema";
import { formatearFechaLarga, formatearPrecio, yaSeRealizo } from "../formato";
import { imagenDe } from "../imagenes";
import Chip from "../componentes/Chip";
import { abrirEnMapas, ciudadYPais } from "../lugar";

export default function EventoDetalleScreen({ route, navigation }) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const { eventos, esFavorito, alternarFavorito } = useEventos();
  // Arranca con el evento del almacén global, así la pantalla abre al instante.
  const [evento, setEvento] = useState(() => eventos.find((e) => e.id === id) ?? null);
  const [organizador, setOrganizador] = useState(null);
  const [misCompras, setMisCompras] = useState([]);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        try {
          const datos = await get(`/eventos/${id}`);
          setEvento(datos);

          if (datos.organizador) {
            setOrganizador(await get(`/resenias?organizadorId=${datos.organizador.id}`));
          }

          const compras = await get("/compras");
          setMisCompras(compras.filter((c) => c.evento.id === datos.id));
        } catch (e) {
          setError(e.message);
        }
      };
      cargar();
    }, [id])
  );

  // El chat está ligado a una compra: solo se puede chatear si ya compraste una entrada de este evento.
  const chatear = () => {
    const compra =
      misCompras.find((c) => c.estado !== "CANCELADA" && c.estado !== "REEMBOLSADA") ?? misCompras[0];

    if (!compra) {
      alerta("Chat con el organizador", "Comprá una entrada de este evento para poder chatear con el organizador.");
      return;
    }
    navigation.navigate("Chat", { compraId: compra.id });
  };

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;
  if (!evento) return <Text style={styles.centro}>Cargando...</Text>;

  const foto = imagenDe(evento);
  const finalizado = yaSeRealizo(evento.fecha);
  const sectores = [...new Set(evento.tiposEntrada.map((t) => t.ubicacion).filter(Boolean))];
  const hayPuntaje = organizador && organizador.puntajePromedio !== null;

  return (
    <View style={styles.fondo}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}>
        <View style={styles.portada}>
          {foto ? (
            <Image source={foto} style={styles.foto} resizeMode="cover" />
          ) : (
            <Ionicons name={iconoDe(evento)} size={72} color={colores.acento} />
          )}
          <Pressable style={[styles.botonRedondo, { top: insets.top + 8, left: 16 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colores.indigo} />
          </Pressable>
          <View style={[styles.corazon, { top: insets.top + 8 }]}>
            <BotonFavorito activo={esFavorito(evento.id)} onPress={() => alternarFavorito(evento)} tamano={42} />
          </View>
        </View>

        <View style={styles.cuerpo}>
          <View style={styles.etiqueta}>
            <Text style={styles.etiquetaTexto}>{evento.categoria?.nombre}</Text>
          </View>
          <Text style={styles.titulo}>{evento.nombre}</Text>

          <View style={styles.puntaje}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            {hayPuntaje ? (
              <Text style={styles.puntajeTexto}>
                {organizador.puntajePromedio} ({organizador.cantidad} {organizador.cantidad === 1 ? "reseña" : "reseñas"})
              </Text>
            ) : (
              <Text style={styles.puntajeTexto}>Sin reseñas todavía</Text>
            )}
          </View>

          {evento.organizador && (
            <View style={styles.organizador}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>{evento.organizador.nombre.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.organizadorTextos}>
                <Text style={styles.organizadorEtiqueta}>Organizado por</Text>
                <Text style={styles.organizadorNombre} numberOfLines={1}>{evento.organizador.nombre}</Text>
                <View style={styles.verificado}>
                  <Ionicons name="checkmark-circle" size={14} color={colores.exito} />
                  <Text style={styles.verificadoTexto}>Verificado</Text>
                </View>
              </View>
              <Pressable style={styles.chatear} onPress={chatear}>
                <Ionicons name="chatbubble-outline" size={16} color={colores.acento} />
                <Text style={styles.chatearTexto}>Chatear</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.info}>
            <FilaInfo icono="calendar-outline" titulo={formatearFechaLarga(evento.fecha)} />
            {evento.lugar && (
              <FilaInfo
                icono="location-outline"
                titulo={evento.lugar.nombre}
                detalle={[evento.lugar.direccion, ciudadYPais(evento.lugar)].filter(Boolean).join("\n")}
                accion={<Chip etiqueta="Cómo llegar" icono="navigate-outline" onPress={() => abrirEnMapas(evento.lugar)} />}
              />
            )}
            {sectores.length > 0 && (
              <FilaInfo icono="grid-outline" titulo="Sectores" detalle={sectores.join(" · ")} />
            )}
            <FilaInfo icono="ticket-outline" titulo="Entradas digitales" detalle="Código QR en la app" />
          </View>

          <Text style={styles.seccion}>Sobre el evento</Text>
          <Text style={styles.descripcion}>{evento.descripcion || "El organizador no agregó una descripción."}</Text>

          {organizador && organizador.resenias.length > 0 && (
            <View>
              <Text style={styles.seccion}>Reseñas del organizador</Text>
              {organizador.resenias.map((r) => (
                <View key={r.id} style={styles.resenia}>
                  <View style={styles.reseniaEncabezado}>
                    <Text style={styles.estrellas}>{"★".repeat(r.puntuacion)}{"☆".repeat(5 - r.puntuacion)}</Text>
                    <Text style={styles.reseniaEvento} numberOfLines={1}>{r.evento.nombre}</Text>
                  </View>
                  <Text style={styles.reseniaDetalle}>{r.detalle}</Text>
                  <Text style={styles.reseniaAutor}>{r.comprador}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.barra, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.barraEtiqueta}>{finalizado ? "Evento finalizado" : "Entradas"}</Text>
          <Text style={styles.barraPrecio}>{textoPrecio(evento)}</Text>
        </View>
        <Pressable
          style={[styles.elegir, finalizado && styles.elegirInactivo]}
          disabled={finalizado}
          onPress={() => navigation.navigate("Entradas", { id: evento.id })}
        >
          <Text style={styles.elegirTexto}>{finalizado ? "No disponible" : "Elegir entradas"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FilaInfo({ icono, titulo, detalle, accion }) {
  return (
    <View style={styles.filaInfo}>
      <Ionicons name={icono} size={22} color={colores.indigo} />
      <View style={{ flex: 1 }}>
        <Text style={styles.filaInfoTitulo}>{titulo}</Text>
        {detalle && <Text style={styles.filaInfoDetalle}>{detalle}</Text>}
      </View>
      {accion}
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.blanco },
  centro: { marginTop: 100, textAlign: "center" },

  portada: { height: 280, backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  foto: { width: "100%", height: "100%" },
  botonRedondo: {
    position: "absolute", width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center",
  },
  corazon: { position: "absolute", right: 16 },

  cuerpo: {
    marginTop: -24, backgroundColor: colores.blanco, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20,
  },
  etiqueta: { alignSelf: "flex-start", backgroundColor: colores.acentoSuave, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  etiquetaTexto: { color: colores.acento, fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  titulo: { fontSize: 26, fontWeight: "800", color: colores.indigo, marginTop: 8 },
  puntaje: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  puntajeTexto: { color: colores.textoSuave },

  organizador: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, paddingVertical: 14,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colores.borde,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: colores.blanco, fontWeight: "800", fontSize: 18 },
  organizadorTextos: { flex: 1 },
  organizadorEtiqueta: { fontSize: 12, color: colores.textoSuave },
  organizadorNombre: { fontWeight: "800", color: colores.indigo, fontSize: 16 },
  verificado: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  verificadoTexto: { fontSize: 12, color: colores.textoSuave },
  chatear: {
    flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colores.acento,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  chatearTexto: { color: colores.acento, fontWeight: "700" },

  info: {
    backgroundColor: colores.fondo, borderRadius: radios.tarjeta, padding: 14, marginTop: 18,
    borderWidth: 1, borderColor: colores.borde, gap: 14,
  },
  filaInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  filaInfoTitulo: { fontWeight: "700", color: colores.indigo },
  filaInfoDetalle: { fontSize: 13, color: colores.textoSuave, marginTop: 1 },

  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 24, marginBottom: 8 },
  descripcion: { color: colores.indigo, lineHeight: 22 },

  resenia: {
    backgroundColor: colores.fondo, borderRadius: radios.tarjeta, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colores.borde,
  },
  reseniaEncabezado: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  estrellas: { color: "#F59E0B", fontSize: 16 },
  reseniaEvento: { color: colores.textoSuave, fontSize: 12, flexShrink: 1 },
  reseniaDetalle: { color: colores.indigo, marginTop: 6 },
  reseniaAutor: { color: colores.textoSuave, fontSize: 12, marginTop: 6 },

  barra: {
    position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: colores.blanco, borderTopWidth: 1, borderColor: colores.borde,
  },
  barraEtiqueta: { fontSize: 12, color: colores.textoSuave },
  barraPrecio: { fontSize: 17, fontWeight: "800", color: colores.indigo },
  elegir: { backgroundColor: colores.acento, borderRadius: radios.boton, paddingHorizontal: 22, paddingVertical: 14 },
  elegirInactivo: { backgroundColor: colores.textoPlaceholder },
  elegirTexto: { color: colores.blanco, fontWeight: "700", fontSize: 15 },
});
