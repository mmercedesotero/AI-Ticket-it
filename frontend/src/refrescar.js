import { useState } from "react";
import { RefreshControl } from "react-native";
import { colores } from "./tema";

// "Tirar para refrescar": muestra la ruedita al menos un ratito aunque la respuesta llegue enseguida.
// Devuelve { refrescando, onRefresh } para las FlatList y "control" para meter en una ScrollView.
export function useRefrescar(recargar) {
  const [refrescando, setRefrescando] = useState(false);

  const onRefresh = async () => {
    setRefrescando(true);
    try {
      await Promise.all([recargar(), new Promise((r) => setTimeout(r, 600))]);
    } finally {
      setRefrescando(false);
    }
  };

  const control = (
    <RefreshControl
      refreshing={refrescando}
      onRefresh={onRefresh}
      tintColor={colores.acento}
      colors={[colores.acento]}
    />
  );

  return { refrescando, onRefresh, control };
}
