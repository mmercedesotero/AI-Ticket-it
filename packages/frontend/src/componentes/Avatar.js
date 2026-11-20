import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { API } from "../api";
import { colores } from "../tema";

// Colores de los "logos" de las organizaciones: cada una toma uno según su nombre.
const COLORES_LOGO = [colores.indigo, colores.acento, "#1E3A8A", "#148C5E", "#B5503C", "#0E7490"];

const colorDe = (texto) => COLORES_LOGO[[...texto].reduce((suma, c) => suma + c.charCodeAt(0), 0) % COLORES_LOGO.length];

// "Live Nation" -> "LN", "Teatro BA" -> "TB", "Comedia Club" -> "CC"
const inicialesDe = (nombre) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

// Foto de perfil. Las personas se ven en un círculo (con su inicial si no hay foto) y las organizaciones
// en un cuadrado de esquinas redondeadas, como un logo, con sus iniciales sobre un color propio.
export default function Avatar({ foto, nombre = "", tamano = 76, color, organizacion = false }) {
  const [fallo, setFallo] = useState(false);
  const radio = organizacion ? tamano * 0.24 : tamano / 2;
  const estilo = {
    width: tamano,
    height: tamano,
    borderRadius: radio,
    backgroundColor: color ?? (organizacion ? colorDe(nombre) : colores.acento),
  };

  return (
    <View style={[styles.base, estilo]}>
      {foto && !fallo ? (
        <Image source={{ uri: foto.startsWith("/") ? `${API}${foto}` : foto }} style={estilo} resizeMode="cover" onError={() => setFallo(true)} />
      ) : (
        <Text style={[styles.inicial, { fontSize: tamano * (organizacion ? 0.34 : 0.4) }]}>
          {organizacion ? inicialesDe(nombre) : nombre.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  inicial: { color: colores.blanco, fontWeight: "800" },
});
