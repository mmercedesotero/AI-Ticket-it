import * as ImagePicker from "expo-image-picker";
import { alerta } from "./dialogo";

// Abre la galería y devuelve la foto elegida como "data URI" (lista para guardar en el servidor),
// o null si la persona cancela. La calidad es baja a propósito: es una foto de perfil chica.
export async function elegirFoto({ aspecto = [1, 1], calidad = 0.25 } = {}) {
  try {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: aspecto,
      quality: calidad,
      base64: true,
    });

    if (resultado.canceled || !resultado.assets?.[0]?.base64) return null;

    const asset = resultado.assets[0];
    const tipo = asset.mimeType?.startsWith("image/") ? asset.mimeType : "image/jpeg";
    return `data:${tipo};base64,${asset.base64}`;
  } catch (e) {
    alerta("No se pudo abrir la galería", e.message);
    return null;
  }
}
