import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Platform, RefreshControl, StyleSheet } from "react-native";
import { colores } from "./tema";

const ALTO = 48; // lugar que ocupa la ruedita mientras refresca

// "Tirar para refrescar" igual en todas las pantallas.
// La ruedita es siempre coral y nunca se mezcla con la información:
//   - iPhone: se usa la ruedita nativa, que ya empuja la lista hacia abajo con su propia animación.
//   - Android: la ruedita nativa flota encima de la lista, así que se esconde y se dibuja una propia que
//     ocupa su lugar y se abre con una animación suave.
//
// Uso: const { refreshProps, indicador } = useRefrescar(recargar);
//   - refreshProps: se esparce en la lista o ScrollView ({...refreshProps}).
//   - indicador: se pone justo arriba de la lista o ScrollView (en iPhone no muestra nada).
export function useRefrescar(recargar) {
  const [refrescando, setRefrescando] = useState(false);
  const altura = useRef(new Animated.Value(0)).current;

  // La ruedita se abre y se cierra con una animación en vez de aparecer de golpe.
  useEffect(() => {
    Animated.timing(altura, {
      toValue: refrescando ? ALTO : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [refrescando, altura]);

  const onRefresh = async () => {
    if (refrescando) return;
    setRefrescando(true);
    try {
      await Promise.all([recargar(), new Promise((r) => setTimeout(r, 700))]);
    } finally {
      setRefrescando(false);
    }
  };

  const esIos = Platform.OS === "ios";

  const refreshProps = {
    refreshControl: esIos ? (
      <RefreshControl refreshing={refrescando} onRefresh={onRefresh} tintColor={colores.acento} />
    ) : (
      <RefreshControl
        refreshing={false}
        onRefresh={onRefresh}
        tintColor="transparent"
        colors={["transparent"]}
        progressBackgroundColor="transparent"
        progressViewOffset={-120}
      />
    ),
  };

  const indicador = esIos ? null : (
    <Animated.View
      pointerEvents="none"
      style={[styles.indicador, { height: altura, opacity: altura.interpolate({ inputRange: [0, ALTO], outputRange: [0, 1] }) }]}
    >
      <ActivityIndicator size="small" color={colores.acento} style={{ transform: [{ scale: 0.75 }] }} />
    </Animated.View>
  );

  return { refrescando, onRefresh, refreshProps, indicador };
}

const styles = StyleSheet.create({
  indicador: { overflow: "hidden", alignItems: "center", justifyContent: "center" },
});
