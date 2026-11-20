import { StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path, Polyline, Text as SvgText } from "react-native-svg";
import { colores } from "../tema";

// Ícono del ticket con "AI": un cartel con muescas a los costados, línea punteada y un tilde.
export function LogoIcono({ ancho = 40, color = colores.acento }) {
  const alto = (ancho * 60) / 100;

  return (
    <Svg width={ancho} height={alto} viewBox="0 0 100 60">
      <Path
        d="M8 0 H92 a8 8 0 0 1 8 8 V22 a8 8 0 0 0 0 16 V52 a8 8 0 0 1 -8 8 H8 a8 8 0 0 1 -8 -8 V38 a8 8 0 0 0 0 -16 V8 a8 8 0 0 1 8 -8 Z"
        fill={color}
      />
      <SvgText x="32" y="39" fill="#FFFFFF" fontSize="26" fontWeight="bold" textAnchor="middle">
        AI
      </SvgText>
      <Line x1="62" y1="8" x2="62" y2="52" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="4 5" />
      <Polyline points="72,31 78,37 88,25" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Logo completo: ícono + "Ticket It" (con "It" en el color de acento).
export default function Logo({ tamano = 22, claro = false }) {
  return (
    <View style={styles.fila}>
      <LogoIcono ancho={tamano * 1.6} />
      <Text style={[styles.texto, { fontSize: tamano }, claro && { color: colores.blanco }]}>
        Ticket-<Text style={styles.it}>It</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  texto: { fontWeight: "800", color: colores.indigo },
  it: { color: colores.acento },
});
