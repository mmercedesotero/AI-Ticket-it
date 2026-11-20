import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colores } from "../tema";

// Foto de perfil redonda. Si la persona no tiene foto (o la foto no carga), muestra su inicial.
export default function Avatar({ foto, nombre = "", tamano = 76, color = colores.acento }) {
  const [fallo, setFallo] = useState(false);
  const estilo = { width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: color };

  return (
    <View style={[styles.base, estilo]}>
      {foto && !fallo ? (
        <Image source={{ uri: foto }} style={estilo} resizeMode="cover" onError={() => setFallo(true)} />
      ) : (
        <Text style={[styles.inicial, { fontSize: tamano * 0.4 }]}>{nombre.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  inicial: { color: colores.blanco, fontWeight: "800" },
});
