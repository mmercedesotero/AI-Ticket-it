import { useEffect, useState } from "react";
import {
  FlatList, Image, Pressable, ScrollView, StyleSheet,
  Text, TextInput, useWindowDimensions, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { get } from "../api";
import { useSesion } from "../sesion";
import { useEventos } from "../eventos";
import Logo from "../componentes/Logo";
import BotonFavorito from "../componentes/BotonFavorito";
import TarjetaEvento, { iconoDe } from "../componentes/TarjetaEvento";
import { colores, radios } from "../tema";
import { formatearFechaLarga, yaSeRealizo } from "../formato";
import { imagenDe } from "../imagenes";

const ORDENES = [
  { clave: "fecha", etiqueta: "Fecha", icono: "calendar-outline" },
  { clave: "precio", etiqueta: "Precio", icono: "cash-outline" },
  { clave: "puntaje", etiqueta: "Puntaje", icono: "star-outline" },
];

const SEPARACION = 12;

export default function EventosScreen({ navigation }) {
  const { sesion } = useSesion();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Los eventos, categorías y favoritos vienen del almacén global (se piden una sola vez).
  const { eventos: todos, categorias, favoritos, esFavorito, alternarFavorito, recargar } = useEventos();
  const [filtrados, setFiltrados] = useState([]);
  const [texto, setTexto] = useState("");
  const [textoBuscado, setTextoBuscado] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [orden, setOrden] = useState("fecha");
  const [version, setVersion] = useState(0);
  const [paginaFavorito, setPaginaFavorito] = useState(0);
  const [error, setError] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  // La tarjeta del carrusel deja asomar un pedacito de la siguiente.
  const anchoTarjeta = width - 32 - 28;

  // Espera un instante después de la última letra antes de buscar, para no pedir al servidor en cada tecla.
  useEffect(() => {
    const espera = setTimeout(() => setTextoBuscado(texto), 350);
    return () => clearTimeout(espera);
  }, [texto]);

  // Sin filtros se usa la lista global. Con filtros, el servidor busca, filtra y ordena.
  const hayFiltros = textoBuscado !== "" || categoriaId !== null || orden !== "fecha";

  useEffect(() => {
    if (!hayFiltros) return;

    const params = new URLSearchParams({ orden });
    if (orden === "puntaje") params.set("direccion", "desc");
    if (textoBuscado) params.set("texto", textoBuscado);
    if (categoriaId) params.set("categoriaId", String(categoriaId));

    get(`/eventos?${params.toString()}`)
      .then(setFiltrados)
      .catch((e) => setError(e.message));
  }, [hayFiltros, textoBuscado, categoriaId, orden, version]);

  const refrescar = async () => {
    setRefrescando(true);
    await Promise.all([recargar(), new Promise((r) => setTimeout(r, 600))]);
    setVersion((v) => v + 1);
    setRefrescando(false);
  };

  // En el inicio solo se muestran los eventos que todavía no se realizaron.
  const eventos = (hayFiltros ? filtrados : todos).filter((e) => !yaSeRealizo(e.fecha));
  // El carrusel también oculta los favoritos que ya pasaron (siguen en "Mis favoritos" del perfil).
  const favoritosVigentes = favoritos.filter((e) => !yaSeRealizo(e.fecha));

  const abrir = (evento) => navigation.navigate("Detalle", { id: evento.id });

  if (error) return <Text style={styles.centro}>Error: {error}</Text>;

  const encabezado = (
    <View>
      <Logo tamano={28} />

      <Text style={styles.saludo}>
        <Text style={styles.hola}>Hola, </Text>
        {sesion.usuario.nombre}
      </Text>

      <View style={styles.buscador}>
        <Ionicons name="search-outline" size={20} color={colores.textoSuave} />
        <TextInput
          style={styles.buscadorInput}
          placeholder="Buscar conciertos, teatro, festivales..."
          placeholderTextColor={colores.textoPlaceholder}
          value={texto}
          onChangeText={setTexto}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip etiqueta="Todas" activo={categoriaId === null} onPress={() => setCategoriaId(null)} />
        {categorias.map((c) => (
          <Chip key={c.id} etiqueta={c.nombre} activo={categoriaId === c.id} onPress={() => setCategoriaId(c.id)} />
        ))}
      </ScrollView>

      <View style={styles.tituloSeccion}>
        <Text style={styles.seccion}>Mis favoritos</Text>
        {favoritosVigentes.length > 0 && (
          <Pressable onPress={() => navigation.navigate("Favoritos")} hitSlop={8}>
            <Text style={styles.verTodos}>Ver todos</Text>
          </Pressable>
        )}
      </View>

      {favoritosVigentes.length === 0 ? (
        <Text style={styles.sinFavoritos}>Tocá el ♡ de un evento para guardarlo acá.</Text>
      ) : (
        <View>
          <FlatList
            horizontal
            data={favoritosVigentes}
            keyExtractor={(evento) => String(evento.id)}
            showsHorizontalScrollIndicator={false}
            snapToInterval={anchoTarjeta + SEPARACION}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) =>
              setPaginaFavorito(Math.round(e.nativeEvent.contentOffset.x / (anchoTarjeta + SEPARACION)))
            }
            renderItem={({ item }) => (
              <TarjetaFavorito
                evento={item}
                ancho={anchoTarjeta}
                onPress={() => abrir(item)}
                onFavorito={() => alternarFavorito(item)}
              />
            )}
          />
          {favoritosVigentes.length > 1 && (
            <View style={styles.puntos}>
              {favoritosVigentes.map((e, i) => (
                <View key={e.id} style={[styles.punto, i === paginaFavorito && styles.puntoActivo]} />
              ))}
            </View>
          )}
        </View>
      )}

      <Text style={[styles.seccion, styles.seccionProximos]}>Próximos eventos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {ORDENES.map((o) => (
          <Chip
            key={o.clave}
            etiqueta={o.etiqueta}
            icono={o.icono}
            activo={orden === o.clave}
            onPress={() => setOrden(o.clave)}
          />
        ))}
      </ScrollView>
      <View style={{ height: 8 }} />
    </View>
  );

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 8 }]}>
      <FlatList
        data={eventos}
        refreshing={refrescando}
        onRefresh={refrescar}
        keyExtractor={(evento) => String(evento.id)}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={encabezado}
        ListEmptyComponent={<Text style={styles.centro}>No hay eventos</Text>}
        renderItem={({ item }) => (
          <TarjetaEvento
            evento={item}
            favorito={esFavorito(item.id)}
            onPress={() => abrir(item)}
            onFavorito={() => alternarFavorito(item)}
          />
        )}
      />
    </View>
  );
}

// Tarjeta del carrusel: foto con el nombre y la fecha encima.
function TarjetaFavorito({ evento, ancho, onPress, onFavorito }) {
  const foto = imagenDe(evento);

  return (
    <Pressable style={[styles.favorito, { width: ancho, marginRight: SEPARACION }]} onPress={onPress}>
      {foto ? (
        <Image source={foto} style={styles.favoritoFoto} resizeMode="cover" />
      ) : (
        <Ionicons name={iconoDe(evento)} size={48} color={colores.acento} />
      )}
      <View style={styles.favoritoCorazon}>
        <BotonFavorito activo onPress={onFavorito} />
      </View>
      <View style={styles.favoritoTextos}>
        <Text style={styles.favoritoNombre} numberOfLines={1}>{evento.nombre}</Text>
        <Text style={styles.favoritoFecha}>{formatearFechaLarga(evento.fecha)}</Text>
      </View>
    </Pressable>
  );
}

function Chip({ etiqueta, icono, activo, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, activo && styles.chipActivo]}>
      {icono && <Ionicons name={icono} size={17} color={activo ? colores.blanco : colores.textoSuave} />}
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo, paddingHorizontal: 16 },
  lista: { paddingBottom: 24 },

  saludo: { fontSize: 30, fontWeight: "800", color: colores.indigo, marginTop: 18, marginBottom: 14 },
  hola: { fontWeight: "500", color: colores.textoSuave },

  buscador: {
    flexDirection: "row", alignItems: "center", gap: 8, height: 48,
    backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde,
    borderRadius: radios.campo, paddingHorizontal: 14, marginBottom: 12,
  },
  buscadorInput: { flex: 1, fontSize: 15, color: colores.indigo },

  chips: { gap: 8, paddingBottom: 6 },
  chip: {
    height: 42, flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco,
    borderRadius: 21, paddingHorizontal: 18,
  },
  chipActivo: { backgroundColor: colores.acento, borderColor: colores.acento },
  chipTexto: { color: colores.indigo, fontWeight: "600", fontSize: 15 },
  chipTextoActivo: { color: colores.blanco, fontWeight: "700" },

  tituloSeccion: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 10 },
  seccion: { fontSize: 20, fontWeight: "800", color: colores.indigo },
  seccionProximos: { marginTop: 24, marginBottom: 10 },
  verTodos: { color: colores.acento, fontWeight: "700" },

  sinFavoritos: { color: colores.textoSuave, fontSize: 15, textAlign: "center" },

  favorito: {
    aspectRatio: 16 / 9, borderRadius: radios.tarjeta, overflow: "hidden",
    backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center",
  },
  favoritoFoto: { width: "100%", height: "100%" },
  favoritoCorazon: { position: "absolute", top: 10, right: 10 },
  favoritoTextos: {
    position: "absolute", left: 0, right: 0, bottom: 0, padding: 12,
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  favoritoNombre: { color: colores.blanco, fontSize: 18, fontWeight: "800" },
  favoritoFecha: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 1 },

  puntos: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: colores.borde },
  puntoActivo: { backgroundColor: colores.acento, width: 18 },

  centro: { marginTop: 40, textAlign: "center", color: colores.textoSuave },
});
