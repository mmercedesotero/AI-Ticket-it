import { Alert } from "react-native";

// Reemplazo de Alert.alert con avisos propios que respetan el diseño de la app.
// Se usa igual que Alert.alert: alerta(titulo, mensaje, [{ text, style, onPress }]).
// <DialogoRaiz /> (en App.js) es quien los dibuja.
let mostrar = null;

export const registrarDialogo = (funcion) => {
  mostrar = funcion;
};

export function alerta(titulo, mensaje, botones) {
  if (!mostrar) {
    Alert.alert(titulo, mensaje, botones);
    return;
  }

  mostrar({
    titulo,
    mensaje,
    botones: botones && botones.length > 0 ? botones : [{ text: "OK" }],
  });
}
