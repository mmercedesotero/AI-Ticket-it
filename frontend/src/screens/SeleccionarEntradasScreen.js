import { alerta } from "../dialogo";
import { useEffect, useRef, useState } from "react";
import {
  Image, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enviar, get } from "../api";
import { useEventos } from "../eventos";
import { pagarCompras } from "../pago";
import PagoModal from "../componentes/PagoModal";
import SelectorTarjeta from "../componentes/SelectorTarjeta";
import { iconoDe } from "../componentes/TarjetaEvento";
import { colores, radios } from "../tema";
import { formatearFechaLarga, formatearPrecio, yaSeRealizo } from "../formato";
import { imagenDe } from "../imagenes";

export default function SeleccionarEntradasScreen({ route, navigation }) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const { eventos } = useEventos();
  // Arranca con el evento del almacén global y después se actualiza con los cupos reales.
  const [evento, setEvento] = useState(() => eventos.find((e) => e.id === id) ?? null);
  const [cantidades, setCantidades] = useState({});
  const [tarjetaId, setTarjetaId] = useState(null);
  const [estadoPago, setEstadoPago] = useState(null);
  const [mensajePago, setMensajePago] = useState("");
  const [error, setError] = useState(null);

  // Para poder reintentar sin duplicar compras: qué compras ya se crearon y cuáles ya se pagaron.
  const creadas = useRef(new Map());
  const pagadas = useRef(new Set());

  useEffect(() => {
    get(`/eventos/${id}`)
      .then(setEvento)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;
  if (!evento) return <Text style={styles.centro}>Cargando...</Text>;

  const foto = imagenDe(evento);
  const finalizado = yaSeRealizo(evento.fecha);

  // Entradas elegidas: [{ tipo, cantidad }] y total a pagar.
  const elegidas = evento.tiposEntrada
    .filter((t) => (cantidades[t.id] ?? 0) > 0)
    .map((t) => ({ tipo: t, cantidad: cantidades[t.id] }));
  const total = elegidas.reduce((suma, e) => suma + e.tipo.precio * e.cantidad, 0);

  const cambiar = (tipo, diferencia) =>
    setCantidades((actuales) => {
      const nueva = Math.min(tipo.cupoDisponible, Math.max(0, (actuales[tipo.id] ?? 0) + diferencia));
      return { ...actuales, [tipo.id]: nueva };
    });

  // Crea una compra por cada tipo elegido (el backend compra un tipo por vez) y después las paga con la tarjeta.
  const ejecutarPago = async () => {
    setEstadoPago("procesando");
    try {
      for (const e of elegidas) {
        const clave = `${e.tipo.id}x${e.cantidad}`;
        if (creadas.current.has(clave)) continue;

        const compra = await enviar("POST", "/compras", {
          eventoId: evento.id,
          entradaId: e.tipo.id,
          cantidad: e.cantidad,
        });
        creadas.current.set(clave, compra.id);
      }

      const porPagar = elegidas
        .map((e) => creadas.current.get(`${e.tipo.id}x${e.cantidad}`))
        .filter((idCompra) => !pagadas.current.has(idCompra));

      await pagarCompras(porPagar, tarjetaId, (idCompra) => pagadas.current.add(idCompra));

      setMensajePago("Tus entradas ya están confirmadas.");
      setEstadoPago("exito");
    } catch (e) {
      const reservadas = creadas.current.size > 0;
      setMensajePago(
        reservadas
          ? `${e.message}\nTus entradas quedaron reservadas: podés reintentar o pagarlas después desde Mis compras.`
          : e.message
      );
      setEstadoPago("error");
    }
  };

  const confirmarPago = () => {
    if (tarjetaId === null) {
      alerta("Elegí una tarjeta", "Agregá o elegí una tarjeta para poder pagar.");
      return;
    }

    const resumen = elegidas.map((e) => `${e.cantidad} × ${e.tipo.nombre}`).join("\n");
    alerta("Confirmar pago", `${resumen}\n\nTotal: ${formatearPrecio(total)}`, [
      { text: "No", style: "cancel" },
      { text: "Sí, pagar", onPress: ejecutarPago },
    ]);
  };

  const sinElegir = total === 0 || finalizado;

  return (
    <View style={styles.fondo}>
      <ScrollView contentContainerStyle={[styles.contenedor, { paddingBottom: 120 + insets.bottom }]}>
        <View style={styles.resumen}>
          <View style={styles.miniatura}>
            {foto ? (
              <Image source={foto} style={styles.foto} resizeMode="cover" />
            ) : (
              <Ionicons name={iconoDe(evento)} size={26} color={colores.acento} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nombre} numberOfLines={1}>{evento.nombre}</Text>
            <Text style={styles.detalle}>{formatearFechaLarga(evento.fecha)}</Text>
            <Text style={styles.detalle} numberOfLines={1}>{evento.organizador?.nombre}</Text>
          </View>
        </View>

        <Text style={styles.seccion}>Tipos de entradas</Text>
        {evento.tiposEntrada.map((tipo) => {
          const cantidad = cantidades[tipo.id] ?? 0;
          const agotada = tipo.cupoDisponible === 0;
          const sinMas = agotada || cantidad >= tipo.cupoDisponible;

          return (
            <View key={tipo.id} style={[styles.tipo, cantidad > 0 && styles.tipoElegido]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipoNombre}>{tipo.nombre}</Text>
                <Text style={styles.tipoPrecio}>{formatearPrecio(tipo.precio)}</Text>
                <Text style={styles.detalle}>
                  {tipo.ubicacion} · {agotada ? "Agotada" : `quedan ${tipo.cupoDisponible}`}
                </Text>
              </View>

              <View style={styles.selector}>
                <Pressable
                  style={[styles.paso, cantidad === 0 && styles.pasoInactivo]}
                  disabled={cantidad === 0}
                  onPress={() => cambiar(tipo, -1)}
                >
                  <Ionicons name="remove" size={20} color={cantidad === 0 ? colores.textoPlaceholder : colores.blanco} />
                </Pressable>
                <Text style={styles.cantidad}>{cantidad}</Text>
                <Pressable
                  style={[styles.paso, sinMas && styles.pasoInactivo]}
                  disabled={sinMas}
                  onPress={() => cambiar(tipo, 1)}
                >
                  <Ionicons name="add" size={20} color={sinMas ? colores.textoPlaceholder : colores.blanco} />
                </Pressable>
              </View>
            </View>
          );
        })}

        <Text style={styles.seccion}>Método de pago</Text>
        <SelectorTarjeta
          seleccionada={tarjetaId}
          onSeleccionar={setTarjetaId}
          onAgregar={() => navigation.navigate("AgregarTarjeta")}
        />

        <Text style={styles.seccion}>Resumen</Text>
        <View style={styles.subtotal}>
          {elegidas.length === 0 ? (
            <Text style={styles.detalle}>Elegí al menos una entrada.</Text>
          ) : (
            elegidas.map((e) => (
              <View key={e.tipo.id} style={styles.subtotalFila}>
                <Text style={styles.subtotalTexto}>{e.cantidad} × {e.tipo.nombre}</Text>
                <Text style={styles.subtotalTexto}>{formatearPrecio(e.tipo.precio * e.cantidad)}</Text>
              </View>
            ))
          )}
          <View style={[styles.subtotalFila, styles.totalFila]}>
            <Text style={styles.totalTexto}>Total</Text>
            <Text style={styles.totalTexto}>{formatearPrecio(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.pagar, sinElegir && styles.pagarInactivo]}
          disabled={sinElegir}
          onPress={confirmarPago}
        >
          <Text style={styles.pagarTexto}>
            {finalizado ? "No disponible a la venta" : `Pagar ${formatearPrecio(total)}`}
          </Text>
        </Pressable>
      </View>

      <PagoModal
        estado={estadoPago}
        monto={formatearPrecio(total)}
        mensaje={mensajePago}
        textoContinuar="Ver mis entradas"
        onContinuar={() => {
          setEstadoPago(null);
          navigation.navigate("Inicio", { screen: "Mis compras" });
        }}
        onReintentar={ejecutarPago}
        onCerrar={() => setEstadoPago(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  centro: { marginTop: 100, textAlign: "center" },
  contenedor: { padding: 16 },

  resumen: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.blanco,
    borderRadius: radios.tarjeta, padding: 10, borderWidth: 1, borderColor: colores.borde,
  },
  miniatura: { width: 84, height: 56, borderRadius: 8, overflow: "hidden", backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  foto: { width: "100%", height: "100%" },
  nombre: { fontWeight: "800", color: colores.indigo, fontSize: 16 },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 1 },

  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 22, marginBottom: 10 },

  tipo: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colores.blanco,
    borderRadius: radios.tarjeta, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colores.borde,
  },
  tipoElegido: { borderColor: colores.acento, backgroundColor: colores.acentoSuave },
  tipoNombre: { fontWeight: "700", color: colores.indigo, fontSize: 16 },
  tipoPrecio: { fontWeight: "800", color: colores.indigo, marginTop: 2 },

  selector: { flexDirection: "row", alignItems: "center", gap: 12 },
  paso: { width: 36, height: 36, borderRadius: 18, backgroundColor: colores.acento, alignItems: "center", justifyContent: "center" },
  pasoInactivo: { backgroundColor: colores.borde },
  cantidad: { fontSize: 18, fontWeight: "800", color: colores.indigo, minWidth: 20, textAlign: "center" },

  subtotal: { backgroundColor: colores.blanco, borderRadius: radios.tarjeta, padding: 14, borderWidth: 1, borderColor: colores.borde, gap: 8 },
  subtotalFila: { flexDirection: "row", justifyContent: "space-between" },
  subtotalTexto: { color: colores.indigo },
  totalFila: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderColor: colores.borde },
  totalTexto: { fontWeight: "800", color: colores.indigo, fontSize: 16 },

  barra: {
    position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: colores.blanco, borderTopWidth: 1, borderColor: colores.borde,
  },
  pagar: { backgroundColor: colores.acento, borderRadius: radios.boton, paddingVertical: 15, alignItems: "center" },
  pagarInactivo: { backgroundColor: colores.textoPlaceholder },
  pagarTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },
});
