import { Linking, Platform } from "react-native";
import { alerta } from "./dialogo";

// Texto corto del lugar para tarjetas y listas: "Estadio River Plate · Buenos Aires".
export const textoLugar = (lugar) => (lugar ? `${lugar.nombre} · ${lugar.ciudad}` : "");

// Dirección completa, sin repetir lo que falte: "Estadio River Plate, Av. Pres. Figueroa Alcorta 7597, Buenos Aires, Argentina".
export const direccionCompleta = (lugar) =>
  lugar ? [lugar.nombre, lugar.direccion, lugar.ciudad, lugar.pais].filter(Boolean).join(", ") : "";

// Ciudad y país: "Buenos Aires, Argentina".
export const ciudadYPais = (lugar) => (lugar ? [lugar.ciudad, lugar.pais].filter(Boolean).join(", ") : "");

// Abre el mapa con el lugar buscado. Primero se pregunta con qué aplicación.
export function abrirEnMapas(lugar) {
  if (!lugar) return;

  const consulta = encodeURIComponent(direccionCompleta(lugar));
  const abrir = (url) =>
    Linking.openURL(url).catch(() => alerta("No se pudo abrir el mapa", "Probá abrirlo a mano desde tu aplicación de mapas."));

  const botones = [{ text: "Abrir en Google Maps", onPress: () => abrir(`https://www.google.com/maps/search/?api=1&query=${consulta}`) }];
  if (Platform.OS === "ios") botones.push({ text: "Abrir en Apple Maps", onPress: () => abrir(`https://maps.apple.com/?q=${consulta}`) });
  botones.push({ text: "Cancelar", style: "cancel" });

  alerta("Cómo llegar", `${lugar.nombre}\n${[lugar.direccion, ciudadYPais(lugar)].filter(Boolean).join(", ")}`, botones);
}
