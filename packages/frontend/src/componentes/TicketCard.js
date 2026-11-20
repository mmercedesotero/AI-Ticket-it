import { StyleSheet, View } from "react-native";
import { colores, radios } from "../tema";

const CANTIDAD_RAYITAS = 26;

// Tarjeta con forma de entrada: una parte de arriba, un corte punteado con muescas a los costados y una parte de abajo.
// "fondo" tiene que ser el color de la pantalla, para que las muescas parezcan recortes.
export default function TicketCard({ arriba, abajo, fondo = colores.fondo }) {
  return (
    <View style={styles.ticket}>
      <View style={styles.arriba}>{arriba}</View>

      <View style={styles.separador}>
        <View style={[styles.muesca, styles.muescaIzquierda, { backgroundColor: fondo }]} />
        <View style={styles.rayitas}>
          {Array.from({ length: CANTIDAD_RAYITAS }).map((_, i) => (
            <View key={i} style={styles.rayita} />
          ))}
        </View>
        <View style={[styles.muesca, styles.muescaDerecha, { backgroundColor: fondo }]} />
      </View>

      <View style={styles.abajo}>{abajo}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    backgroundColor: colores.blanco, borderRadius: radios.tarjeta, marginBottom: 16,
    borderWidth: 1, borderColor: colores.borde,
  },
  arriba: { padding: 16, paddingBottom: 12 },
  abajo: { padding: 16, paddingTop: 12 },

  separador: { height: 26, justifyContent: "center" },
  muesca: { position: "absolute", top: 0, width: 26, height: 26, borderRadius: 13 },
  muescaIzquierda: { left: -14 },
  muescaDerecha: { right: -14 },
  rayitas: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20 },
  rayita: { width: 6, height: 2, borderRadius: 1, backgroundColor: colores.borde },
});
