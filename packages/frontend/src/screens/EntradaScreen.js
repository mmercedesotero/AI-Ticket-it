import { useCallback, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useFocusEffect } from "@react-navigation/native";
import { enviar, get } from "../api";
import { alerta } from "../dialogo";
import { descargarComprobante } from "../comprobante";
import TicketCard from "../componentes/TicketCard";
import { iconoDe } from "../componentes/TarjetaEvento";
import { ESTADOS, estiloEstado, codigoDe, esPasada, textoDias, textoReserva } from "../compras";
import { colores, radios } from "../tema";
import { formatearFechaHora, formatearFechaLarga, formatearPrecio, tiempoRelativo } from "../formato";
import { imagenDe } from "../imagenes";
import { abrirEnMapas, direccionCompleta } from "../lugar";

// Qué se muestra en el seguimiento por cada estado por el que pasó la compra.
const PASOS = {
  PENDIENTE_PAGO: { titulo: "Compraste las entradas", icono: "bag-check" },
  CONFIRMADA: { titulo: "Pagaste: entradas confirmadas", icono: "card" },
  UTILIZADA: { titulo: "Usaste tus entradas", icono: "checkmark-done" },
  CANCELADA: { titulo: "Cancelaste la compra", icono: "close" },
  REEMBOLSADA: { titulo: "Te reembolsamos el pago", icono: "cash" },
};

export default function EntradaScreen({ route, navigation }) {
  const { compraId } = route.params;
  const [compra, setCompra] = useState(null);
  const [qrGrande, setQrGrande] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(
    () =>
      get(`/compras/${compraId}`)
        .then(setCompra)
        .catch((e) => setError(e.message)),
    [compraId]
  );

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const cancelar = () => {
    const pagada = compra.estado === "CONFIRMADA";
    alerta(
      "Cancelar compra",
      pagada
        ? `¿Cancelar tu compra de ${compra.evento.nombre}? Te vamos a reembolsar el pago.`
        : `¿Cancelar tu compra de ${compra.evento.nombre}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await enviar("PUT", `/compras/${compra.id}/cancelar`);
              cargar();
            } catch (e) {
              alerta("No se pudo cancelar", e.message);
            }
          },
        },
      ]
    );
  };

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;
  if (!compra) return <Text style={styles.centro}>Cargando...</Text>;

  const estado = ESTADOS[compra.estado];
  const pasada = esPasada(compra);
  const pendiente = compra.estado === "PENDIENTE_PAGO" && !pasada;
  const confirmada = compra.estado === "CONFIRMADA" && !pasada;
  const foto = imagenDe(compra.evento);

  const historial = compra.historial ?? [];
  const ultimo = historial[historial.length - 1]?.estado;

  // Paso que viene después, para que se vea qué falta.
  let siguiente = null;
  if (pendiente) siguiente = "Pagá para confirmar tus entradas";
  else if (confirmada) siguiente = `Usá tus entradas el ${formatearFechaLarga(compra.evento.fecha)}`;

  const dias = confirmada ? Math.round((new Date(`${compra.evento.fecha}T00:00:00`) - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;

  return (
    <ScrollView style={styles.fondo} contentContainerStyle={styles.contenedor} showsVerticalScrollIndicator={false}>
      <TicketCard
        arriba={
          <View>
            <View style={styles.foto}>
              {foto ? (
                <Image source={foto} style={styles.fotoImagen} resizeMode="cover" />
              ) : (
                <Ionicons name={iconoDe(compra.evento)} size={44} color={colores.acento} />
              )}
            </View>

            <Text style={styles.nombre}>{compra.evento.nombre}</Text>
            <Linea icono="calendar-outline" texto={formatearFechaLarga(compra.evento.fecha)} />
            {compra.evento.lugar && (
              <Pressable onPress={() => abrirEnMapas(compra.evento.lugar)} hitSlop={6}>
                <Linea icono="location-outline" texto={`${direccionCompleta(compra.evento.lugar)} · Cómo llegar`} />
              </Pressable>
            )}
            <Linea icono="business-outline" texto={compra.evento.organizador?.nombre ?? "Sin organizador"} />

            <View style={styles.datos}>
              <Dato etiqueta="ENTRADA" valor={compra.tipoEntrada.nombre} />
              <Dato etiqueta="CANTIDAD" valor={String(compra.cantidad)} />
              <Dato etiqueta="TOTAL" valor={formatearPrecio(compra.total)} />
            </View>
          </View>
        }
        abajo={
          <View style={styles.qrBloque}>
            {confirmada ? (
              <>
                <Pressable onPress={() => setQrGrande(true)} style={styles.qr}>
                  <QRCode value={codigoDe(compra)} size={150} />
                </Pressable>
                <Text style={styles.qrAyuda}>Tocá el código para agrandarlo</Text>
                <Text style={styles.codigo}>{codigoDe(compra)}</Text>
              </>
            ) : (
              <View style={styles.sinQr}>
                <Ionicons name={pendiente ? "lock-closed-outline" : "qr-code-outline"} size={36} color={colores.textoPlaceholder} />
                <Text style={styles.sinQrTexto}>
                  {pendiente ? "Pagá la compra para activar tu código QR" : "Este código ya no está disponible"}
                </Text>
              </View>
            )}
            <View style={[styles.estado, estiloEstado(estado).etiqueta]}>
              <Text style={[styles.estadoTexto, estiloEstado(estado).texto]}>{estado.texto}</Text>
            </View>
          </View>
        }
      />

      {compra.estado === "PENDIENTE_PAGO" && !esPasada(compra) && (
        <View style={styles.dias}>
          <Ionicons name="hourglass-outline" size={16} color={colores.acento} />
          <Text style={[styles.diasTexto, { color: colores.acento }]}>{textoReserva(compra)}</Text>
        </View>
      )}

      {dias !== null && dias >= 0 && (
        <View style={styles.dias}>
          <Ionicons name="time-outline" size={18} color={colores.exito} />
          <Text style={styles.diasTexto}>{textoDias(dias)} para el evento</Text>
        </View>
      )}

      <View style={styles.acciones}>
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

        <Pressable style={styles.botonBorde} onPress={() => navigation.navigate("Chat", { compraId: compra.id })}>
          <Ionicons name="chatbubble-outline" size={18} color={colores.indigo} />
          <Text style={styles.botonBordeTexto}>Chatear con el organizador</Text>
        </Pressable>

        {(compra.estado === "CONFIRMADA" || compra.estado === "UTILIZADA") && (
          <Pressable style={styles.botonBorde} onPress={() => descargarComprobante([compra])}>
            <Ionicons name="document-text-outline" size={18} color={colores.indigo} />
            <Text style={styles.botonBordeTexto}>Descargar comprobante</Text>
          </Pressable>
        )}

        {!pasada && (
          <Pressable style={styles.cancelar} onPress={cancelar}>
            <Text style={styles.cancelarTexto}>Cancelar compra</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.seccion}>Historial</Text>
      <View style={styles.linea_tiempo}>
        {historial.map((cambio, i) => {
          const paso = PASOS[cambio.estado];
          const esUltimo = i === historial.length - 1 && !siguiente;
          return (
            <Paso
              key={i}
              icono={paso.icono}
              titulo={paso.titulo}
              detalle={`${formatearFechaHora(cambio.fechaHora)} · ${tiempoRelativo(cambio.fechaHora)}`}
              actual={i === historial.length - 1}
              ultimo={esUltimo}
              color={cambio.estado === "CANCELADA" || cambio.estado === "REEMBOLSADA" ? colores.textoSuave : colores.acento}
            />
          );
        })}
        {siguiente && <Paso titulo={siguiente} pendiente ultimo />}
      </View>
      {ultimo === undefined && <Text style={styles.sinHistorial}>Todavía no hay movimientos.</Text>}

      <Modal visible={qrGrande} transparent animationType="fade" onRequestClose={() => setQrGrande(false)}>
        <Pressable style={styles.fondoModal} onPress={() => setQrGrande(false)}>
          <View style={styles.modalTarjeta}>
            <Text style={styles.modalTitulo}>{compra.evento.nombre}</Text>
            <Text style={styles.modalDetalle}>{compra.cantidad} × {compra.tipoEntrada.nombre}</Text>
            <View style={styles.modalQr}>
              <QRCode value={codigoDe(compra)} size={250} />
            </View>
            <Text style={styles.modalDetalle}>Mostrá este código en el ingreso</Text>
            <Text style={styles.cerrar}>Tocá para cerrar</Text>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Linea({ icono, texto }) {
  return (
    <View style={styles.linea}>
      <Ionicons name={icono} size={15} color={colores.textoSuave} />
      <Text style={styles.lineaTexto}>{texto}</Text>
    </View>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor} numberOfLines={1}>{valor}</Text>
    </View>
  );
}

// Un paso del seguimiento: punto, línea hacia el siguiente, título y fecha.
function Paso({ icono, titulo, detalle, actual, ultimo, pendiente, color = colores.acento }) {
  return (
    <View style={styles.paso}>
      <View style={styles.pasoColumna}>
        <View style={[styles.punto, pendiente ? styles.puntoPendiente : { backgroundColor: color }]}>
          {!pendiente && <Ionicons name={icono} size={14} color={colores.blanco} />}
        </View>
        {!ultimo && <View style={styles.pasoLinea} />}
      </View>
      <View style={styles.pasoTextos}>
        <Text style={[styles.pasoTitulo, pendiente && styles.pasoTituloPendiente, actual && styles.pasoTituloActual]}>
          {titulo}
        </Text>
        {detalle && <Text style={styles.pasoDetalle}>{detalle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { padding: 16, paddingBottom: 40 },
  centro: { marginTop: 100, textAlign: "center" },

  foto: {
    height: 130, borderRadius: 10, overflow: "hidden", backgroundColor: colores.indigo,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  fotoImagen: { width: "100%", height: "100%" },
  nombre: { fontSize: 22, fontWeight: "800", color: colores.indigo, marginBottom: 6 },
  linea: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  lineaTexto: { color: colores.textoSuave, fontSize: 14 },

  datos: { flexDirection: "row", gap: 8, marginTop: 14 },
  dato: { flex: 1 },
  datoEtiqueta: { fontSize: 11, color: colores.textoPlaceholder, fontWeight: "700", letterSpacing: 0.5 },
  datoValor: { fontWeight: "800", color: colores.indigo, marginTop: 2 },

  qrBloque: { alignItems: "center", gap: 8 },
  qr: { padding: 8 },
  qrAyuda: { fontSize: 12, color: colores.textoSuave },
  codigo: { fontSize: 12, letterSpacing: 1, color: colores.textoSuave, fontWeight: "600" },
  sinQr: { alignItems: "center", gap: 8, paddingVertical: 12 },
  sinQrTexto: { color: colores.textoSuave, textAlign: "center" },
  estado: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  estadoTexto: { color: colores.blanco, fontSize: 12, fontWeight: "700" },

  dias: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 },
  diasTexto: { color: colores.exito, fontWeight: "700" },

  acciones: { gap: 10 },
  botonCoral: { backgroundColor: colores.acento, borderRadius: radios.boton, paddingVertical: 14, alignItems: "center" },
  botonCoralTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },
  puntuar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FCD34D", borderRadius: radios.boton, paddingVertical: 14,
  },
  puntuarTexto: { color: "#B45309", fontWeight: "700" },
  botonBorde: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde, borderRadius: radios.boton, paddingVertical: 14,
  },
  botonBordeTexto: { color: colores.indigo, fontWeight: "700" },
  cancelar: { alignItems: "center", paddingVertical: 10 },
  cancelarTexto: { color: colores.error, fontWeight: "600" },

  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 22, marginBottom: 14 },
  linea_tiempo: {
    backgroundColor: colores.blanco, borderRadius: radios.tarjeta, padding: 16,
    borderWidth: 1, borderColor: colores.borde,
  },
  sinHistorial: { color: colores.textoSuave },
  paso: { flexDirection: "row", gap: 14 },
  pasoColumna: { alignItems: "center", width: 28 },
  punto: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  puntoPendiente: { borderWidth: 2, borderColor: colores.borde, borderStyle: "dashed", backgroundColor: colores.blanco },
  pasoLinea: { flex: 1, width: 2, backgroundColor: colores.borde, marginVertical: 2, minHeight: 18 },
  pasoTextos: { flex: 1, paddingBottom: 18 },
  pasoTitulo: { fontWeight: "600", color: colores.indigo },
  pasoTituloActual: { fontWeight: "800" },
  pasoTituloPendiente: { color: colores.textoPlaceholder, fontWeight: "500" },
  pasoDetalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },

  fondoModal: { flex: 1, backgroundColor: "rgba(15,23,42,0.75)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalTarjeta: { backgroundColor: colores.blanco, borderRadius: 20, padding: 24, alignItems: "center", alignSelf: "stretch" },
  modalTitulo: { fontSize: 20, fontWeight: "800", color: colores.indigo, textAlign: "center" },
  modalDetalle: { color: colores.textoSuave, marginTop: 4, textAlign: "center" },
  modalQr: { marginVertical: 20 },
  cerrar: { color: colores.textoPlaceholder, fontSize: 12, marginTop: 14 },
});
