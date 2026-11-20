import { useCallback, useState } from "react";
import { SectionList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useNotificaciones } from "../notificaciones";
import { useRefrescar } from "../refrescar";
import { useSesion } from "../sesion";
import CabeceraPantalla from "../componentes/CabeceraPantalla";
import Chip from "../componentes/Chip";
import Segmentos from "../componentes/Segmentos";
import { colores, radios } from "../tema";
import { formatearFechaHora, tiempoRelativo } from "../formato";

// Ícono y color de cada tipo de aviso.
const TIPOS = {
  COMPRA: { icono: "ticket-outline", color: colores.acento, fondo: colores.acentoSuave },
  PAGO_CONFIRMADO: { icono: "checkmark-circle", color: colores.exito, fondo: "#DCFCE7" },
  PAGO_RECHAZADO: { icono: "close-circle", color: colores.error, fondo: "#FEE2E2" },
  CANCELACION: { icono: "close-circle-outline", color: colores.textoSuave, fondo: "#F1F5F9" },
  REEMBOLSO: { icono: "cash-outline", color: "#1E3A8A", fondo: "#DBEAFE" },
  EVENTO_AGOTADO: { icono: "flame", color: colores.acento, fondo: colores.acentoSuave },
  EVENTO_PUBLICADO: { icono: "megaphone-outline", color: "#2563EB", fondo: "#DBEAFE" },
  RECORDATORIO: { icono: "alarm-outline", color: "#2563EB", fondo: "#DBEAFE" },
  RESENIA: { icono: "star", color: colores.acento, fondo: colores.acentoSuave },
  RECORDATORIO_PAGO: { icono: "hourglass-outline", color: colores.acento, fondo: colores.acentoSuave },
  RESERVA_VENCIDA: { icono: "time-outline", color: colores.textoSuave, fondo: "#F1F5F9" },
  POCAS_ENTRADAS: { icono: "flame", color: colores.acento, fondo: colores.acentoSuave },
  SIN_VENTAS: { icono: "trending-down-outline", color: "#1E3A8A", fondo: "#DBEAFE" },
};

// "Actualizaciones": avisos sobre eventos (no sobre movimientos de tu compra).
const ACTUALIZACIONES = ["EVENTO_PUBLICADO", "EVENTO_AGOTADO", "RECORDATORIO", "RECORDATORIO_PAGO", "POCAS_ENTRADAS", "SIN_VENTAS", "RESENIA"];

// Atajo que se muestra al pie de cada aviso: [texto, pestaña a la que lleva].
const ATAJOS = {
  COMPRA: ["Ver mis compras", "Mis compras"],
  PAGO_CONFIRMADO: ["Ver mis compras", "Mis compras"],
  PAGO_RECHAZADO: ["Ver mis compras", "Mis compras"],
  CANCELACION: ["Ver mis compras", "Mis compras"],
  REEMBOLSO: ["Ver mis compras", "Mis compras"],
  RECORDATORIO: ["Ver mi entrada", "Mis compras"],
  RECORDATORIO_PAGO: ["Pagar ahora", "Mis compras"],
  RESERVA_VENCIDA: ["Ver mis compras", "Mis compras"],
  EVENTO_AGOTADO: ["Ver mis eventos", "Mis eventos"],
  EVENTO_PUBLICADO: ["Ver mis eventos", "Mis eventos"],
  RESENIA: ["Ver mis eventos", "Mis eventos"],
};

// Lo mismo para el organizador: todos llevan a sus eventos.
const ATAJOS_ORGANIZADOR = {
  RECORDATORIO: ["Ver mis eventos", "Mis eventos"],
  POCAS_ENTRADAS: ["Ver mis eventos", "Mis eventos"],
  SIN_VENTAS: ["Ver mis eventos", "Mis eventos"],
  EVENTO_AGOTADO: ["Ver mis eventos", "Mis eventos"],
  EVENTO_PUBLICADO: ["Ver mis eventos", "Mis eventos"],
  RESENIA: ["Ver mis eventos", "Mis eventos"],
};

// Agrupa por fecha: Hoy, Esta semana y Anteriores.
function agrupar(lista) {
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const hace7 = inicioHoy.getTime() - 6 * 24 * 60 * 60 * 1000;

  const grupos = { hoy: [], semana: [], antes: [] };
  lista.forEach((n) => {
    const t = new Date(n.fechaHora).getTime();
    if (t >= inicioHoy.getTime()) grupos.hoy.push(n);
    else if (t >= hace7) grupos.semana.push(n);
    else grupos.antes.push(n);
  });

  return [
    { titulo: "Hoy", data: grupos.hoy },
    { titulo: "Esta semana", data: grupos.semana },
    { titulo: "Anteriores", data: grupos.antes },
  ].filter((g) => g.data.length > 0);
}

export default function NotificacionesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const esOrganizador = sesion.rol === "ORGANIZADOR";
  const { notificaciones, noLeidas, recargar, marcarLeida, marcarTodasLeidas } = useNotificaciones();
  const { refreshProps, indicador } = useRefrescar(recargar);
  const [pestania, setPestania] = useState("todas");

  // Al entrar se actualiza la lista enseguida, sin esperar a la próxima consulta.
  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );

  const visibles = notificaciones.filter((n) =>
    pestania === "todas" ? true : pestania === "sin_leer" ? !n.leida : ACTUALIZACIONES.includes(n.tipo)
  );
  const cantidadActualizaciones = notificaciones.filter((n) => ACTUALIZACIONES.includes(n.tipo)).length;

  const opciones = [
    { clave: "todas", etiqueta: `Todas (${notificaciones.length})` },
    { clave: "sin_leer", etiqueta: `Sin leer (${noLeidas})` },
    { clave: "actualizaciones", etiqueta: `Novedades (${cantidadActualizaciones})` },
  ];

  const tocar = (n) => {
    if (!n.leida) marcarLeida(n.id);
  };

  return (
    <View style={styles.contenedor}>
      <CabeceraPantalla titulo="Notificaciones" />
      {indicador}

      <SectionList
        sections={agrupar(visibles)}
        keyExtractor={(n) => String(n.id)}
        {...refreshProps}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.lista, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.encabezado}>
            <View style={styles.resumenFila}>
              <Text style={styles.resumen}>{noLeidas > 0 ? `Tenés ${noLeidas} sin leer` : "Estás al día"}</Text>
              {noLeidas > 0 && <Chip etiqueta="Marcar todas como leídas" icono="checkmark-done" onPress={marcarTodasLeidas} />}
            </View>
            <Segmentos opciones={opciones} valor={pestania} onCambiar={setPestania} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="notifications-outline" size={48} color={colores.textoPlaceholder} />
            <Text style={styles.vacioTitulo}>
              {pestania === "sin_leer" ? "No tenés nada sin leer" : "Todavía no tenés notificaciones"}
            </Text>
            <Text style={styles.vacioTexto}>Acá vas a ver los avisos de tus compras y tus eventos.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={styles.grupo}>{section.titulo}</Text>}
        renderItem={({ item }) => {
          const tipo = TIPOS[item.tipo] ?? TIPOS.COMPRA;
          // Cada rol tiene sus propias pestañas, así que cada uno tiene sus propios atajos.
          const atajo = (esOrganizador ? ATAJOS_ORGANIZADOR : ATAJOS)[item.tipo];
          const atajoValido = Boolean(atajo);

          return (
            <Pressable style={[styles.fila, !item.leida && styles.filaNoLeida]} onPress={() => tocar(item)}>
              <View style={[styles.icono, { backgroundColor: tipo.fondo }]}>
                <Ionicons name={tipo.icono} size={22} color={tipo.color} />
              </View>
              <View style={styles.textos}>
                <View style={styles.tituloFila}>
                  <Text style={[styles.filaTitulo, !item.leida && styles.filaTituloNoLeida]}>{item.titulo}</Text>
                  {!item.leida && <View style={styles.punto} />}
                </View>
                <Text style={styles.mensaje}>{item.mensaje}</Text>
                <View style={styles.pie}>
                  <Text style={styles.hora}>
                    {tiempoRelativo(item.fechaHora)} · {formatearFechaHora(item.fechaHora)}
                  </Text>
                  {atajoValido && (
                    <Pressable onPress={() => navigation.navigate(atajo[1])} hitSlop={8}>
                      <Text style={styles.atajo}>{atajo[0]} →</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  lista: { padding: 16 },

  encabezado: { gap: 12, marginBottom: 4 },
  resumenFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 32 },
  resumen: { color: colores.textoSuave, fontWeight: "600" },

  grupo: {
    fontSize: 12, fontWeight: "700", letterSpacing: 0.6, color: colores.textoSuave,
    textTransform: "uppercase", marginTop: 18, marginBottom: 8,
  },

  fila: {
    flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: colores.blanco,
    borderRadius: radios.tarjeta, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  filaNoLeida: { backgroundColor: colores.acentoSuave, borderColor: "rgba(239,128,108,0.45)" },
  icono: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  textos: { flex: 1 },
  tituloFila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  filaTitulo: { flex: 1, color: colores.indigo, fontWeight: "600", fontSize: 15 },
  filaTituloNoLeida: { fontWeight: "800" },
  mensaje: { color: colores.textoSuave, marginTop: 2, lineHeight: 19 },
  pie: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 8 },
  hora: { color: colores.textoPlaceholder, fontSize: 12, flexShrink: 1 },
  atajo: { color: colores.acento, fontWeight: "700", fontSize: 12 },
  punto: { width: 9, height: 9, borderRadius: 5, backgroundColor: colores.acento },

  vacio: { alignItems: "center", marginTop: 60, gap: 8, paddingHorizontal: 24 },
  vacioTitulo: { fontSize: 18, fontWeight: "800", color: colores.indigo },
  vacioTexto: { color: colores.textoSuave, textAlign: "center" },
});
