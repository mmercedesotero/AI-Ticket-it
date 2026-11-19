import { alerta } from "../dialogo";
import { useState } from "react";
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { enviar } from "../api";
import { colores, estilosBase, radios } from "../tema";

// Agrupa de a cuatro dígitos: 4242424242424242 -> "4242 4242 4242 4242".
const formatearNumero = (texto) =>
  texto.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

// Agrega la barra sola: 1230 -> "12/30".
const formatearVencimiento = (texto) => {
  const digitos = texto.replace(/\D/g, "").slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
};

export default function AgregarTarjetaScreen({ navigation }) {
  const [numero, setNumero] = useState("");
  const [titular, setTitular] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvv, setCvv] = useState("");

  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    // Si ya se está guardando, ignoramos los toques repetidos (así no se crean tarjetas duplicadas).
    if (guardando) return;

    setGuardando(true);
    try {
      await enviar("POST", "/tarjetas", { numero, titular, vencimiento, cvv });
      navigation.goBack();
    } catch (e) {
      alerta("No se pudo guardar la tarjeta", e.message);
      setGuardando(false);
    }
  };

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={styles.contenedor}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.vista}>
        <View style={styles.vistaFila}>
          <Ionicons name="card" size={30} color={colores.acento} />
          <Text style={styles.vistaMarca}>{numero.startsWith("4") ? "VISA" : numero.startsWith("5") ? "MASTERCARD" : "TARJETA"}</Text>
        </View>
        <Text style={styles.vistaNumero}>{numero || "•••• •••• •••• ••••"}</Text>
        <View style={styles.vistaFila}>
          <Text style={styles.vistaTexto}>{titular.toUpperCase() || "NOMBRE DEL TITULAR"}</Text>
          <Text style={styles.vistaTexto}>{vencimiento || "MM/AA"}</Text>
        </View>
      </View>

      <Text style={styles.label}>Número de tarjeta</Text>
      <TextInput
        style={estilosBase.campo}
        placeholder="1234 5678 9012 3456"
        placeholderTextColor={colores.textoPlaceholder}
        keyboardType="number-pad"
        value={numero}
        onChangeText={(t) => setNumero(formatearNumero(t))}
      />

      <Text style={styles.label}>Nombre del titular</Text>
      <TextInput
        style={estilosBase.campo}
        placeholder="Como figura en la tarjeta"
        placeholderTextColor={colores.textoPlaceholder}
        autoCapitalize="words"
        value={titular}
        onChangeText={setTitular}
      />

      <View style={styles.dos}>
        <View style={styles.columna}>
          <Text style={styles.label}>Vencimiento</Text>
          <TextInput
            style={estilosBase.campo}
            placeholder="MM/AA"
            placeholderTextColor={colores.textoPlaceholder}
            keyboardType="number-pad"
            value={vencimiento}
            onChangeText={(t) => setVencimiento(formatearVencimiento(t))}
          />
        </View>
        <View style={styles.columna}>
          <Text style={styles.label}>Código de seguridad</Text>
          <TextInput
            style={estilosBase.campo}
            placeholder="CVV"
            placeholderTextColor={colores.textoPlaceholder}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={cvv}
            onChangeText={(t) => setCvv(t.replace(/\D/g, ""))}
          />
        </View>
      </View>

      <Text style={styles.ayuda}>
        Es una simulación: no uses datos reales. Probá con 4242 4242 4242 4242. Las tarjetas que terminan en 0000
        son rechazadas.
      </Text>

      <Pressable
        style={[estilosBase.botonPrimario, styles.guardar, guardando && styles.guardando]}
        disabled={guardando}
        onPress={guardar}
      >
        <Text style={estilosBase.botonPrimarioTexto}>{guardando ? "Guardando..." : "Guardar tarjeta"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.blanco },
  contenedor: { padding: 16, paddingBottom: 40 },

  vista: { backgroundColor: colores.indigo, borderRadius: radios.tarjeta, padding: 20, gap: 22, marginBottom: 8 },
  vistaFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vistaMarca: { color: colores.blanco, fontWeight: "800", letterSpacing: 1 },
  vistaNumero: { color: colores.blanco, fontSize: 22, fontWeight: "700", letterSpacing: 2 },
  vistaTexto: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },

  label: { fontWeight: "600", color: colores.indigo, marginBottom: 6, marginTop: 14, fontSize: 13 },
  dos: { flexDirection: "row", gap: 12 },
  columna: { flex: 1 },
  ayuda: { color: colores.textoSuave, fontSize: 12, marginTop: 16, lineHeight: 18 },
  guardar: { marginTop: 20 },
  guardando: { opacity: 0.6 },
});
