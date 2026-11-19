import { alerta } from "../dialogo";
import { useState } from "react";
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PagoModal from "../componentes/PagoModal";
import SelectorTarjeta from "../componentes/SelectorTarjeta";
import { get } from "../api";
import { descargarComprobante } from "../comprobante";
import { pagarCompras } from "../pago";
import { colores, radios } from "../tema";
import { formatearPrecio } from "../formato";

// Pago de una compra que quedó pendiente (se abre desde "Mis compras").
export default function PagarScreen({ route, navigation }) {
  const { compraId, total, titulo } = route.params;
  const insets = useSafeAreaInsets();
  const [tarjetaId, setTarjetaId] = useState(null);
  const [estado, setEstado] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const pagar = async () => {
    if (tarjetaId === null) {
      alerta("Elegí una tarjeta", "Agregá o elegí una tarjeta para poder pagar.");
      return;
    }

    setEstado("procesando");
    try {
      await pagarCompras([compraId], tarjetaId);
      setMensaje("Tus entradas ya están confirmadas.");
      setEstado("exito");
    } catch (e) {
      setMensaje(e.message);
      setEstado("error");
    }
  };

  return (
    <View style={styles.fondo}>
      <ScrollView contentContainerStyle={[styles.contenedor, { paddingBottom: 110 + insets.bottom }]}>
        <View style={styles.resumen}>
          <Text style={styles.etiqueta}>Vas a pagar</Text>
          <Text style={styles.monto}>{formatearPrecio(total)}</Text>
          <Text style={styles.titulo}>{titulo}</Text>
        </View>

        <Text style={styles.seccion}>Método de pago</Text>
        <SelectorTarjeta
          seleccionada={tarjetaId}
          onSeleccionar={setTarjetaId}
          onAgregar={() => navigation.navigate("AgregarTarjeta")}
        />
      </ScrollView>

      <View style={[styles.barra, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.pagar} onPress={pagar}>
          <Text style={styles.pagarTexto}>Pagar {formatearPrecio(total)}</Text>
        </Pressable>
      </View>

      <PagoModal
        estado={estado}
        monto={formatearPrecio(total)}
        mensaje={mensaje}
        textoContinuar="Ver mis entradas"
        onComprobante={async () => descargarComprobante([await get(`/compras/${compraId}`)])}
        onContinuar={() => {
          setEstado(null);
          navigation.navigate("Inicio", { screen: "Mis compras" });
        }}
        onReintentar={pagar}
        onCerrar={() => setEstado(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { padding: 16 },

  resumen: { backgroundColor: colores.blanco, borderRadius: radios.tarjeta, padding: 18, borderWidth: 1, borderColor: colores.borde, alignItems: "center" },
  etiqueta: { color: colores.textoSuave },
  monto: { fontSize: 34, fontWeight: "800", color: colores.indigo, marginVertical: 4 },
  titulo: { color: colores.textoSuave, textAlign: "center" },

  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 24, marginBottom: 10 },

  barra: {
    position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: colores.blanco, borderTopWidth: 1, borderColor: colores.borde,
  },
  pagar: { backgroundColor: colores.acento, borderRadius: radios.boton, paddingVertical: 15, alignItems: "center" },
  pagarTexto: { color: colores.blanco, fontWeight: "700", fontSize: 16 },
});
