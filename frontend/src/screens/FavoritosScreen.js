import { FlatList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEventos } from "../eventos";
import TarjetaEvento from "../componentes/TarjetaEvento";
import { colores } from "../tema";

export default function FavoritosScreen({ navigation }) {
  // Los favoritos vienen del almacén global: tocar el corazón acá lo saca de la lista al instante.
  const { favoritos, alternarFavorito } = useEventos();

  return (
    <FlatList
      style={styles.fondo}
      data={favoritos}
      keyExtractor={(evento) => String(evento.id)}
      contentContainerStyle={styles.lista}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.vacio}>
          <Ionicons name="heart-outline" size={48} color={colores.textoPlaceholder} />
          <Text style={styles.vacioTitulo}>Todavía no tenés favoritos</Text>
          <Text style={styles.vacioTexto}>Tocá el corazón de un evento para guardarlo acá.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TarjetaEvento
          evento={item}
          favorito
          onPress={() => navigation.navigate("Detalle", { id: item.id })}
          onFavorito={() => alternarFavorito(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  lista: { padding: 16 },
  vacio: { alignItems: "center", marginTop: 80, gap: 8 },
  vacioTitulo: { fontSize: 18, fontWeight: "800", color: colores.indigo },
  vacioTexto: { color: colores.textoSuave, textAlign: "center" },
});
