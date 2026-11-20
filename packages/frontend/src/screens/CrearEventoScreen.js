import { alerta } from "../dialogo";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API, enviar, get } from "../api";
import { elegirFoto } from "../foto";
import { useEventos } from "../eventos";
import Chip from "../componentes/Chip";
import { colores, estilosBase, radios } from "../tema";

const entradaVacia = () => ({ nombre: "", precio: "", ubicacion: "", cupo: "" });

// Sirve para crear un evento nuevo y, si llega "eventoId", para editar uno existente (y eliminarlo).
export default function CrearEventoScreen({ route, navigation }) {
  const eventoId = route.params?.eventoId;
  const editando = eventoId !== undefined;

  const { categorias, recargar } = useEventos();
  const [cargando, setCargando] = useState(editando);
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [entradas, setEntradas] = useState([entradaVacia()]);
  const [portada, setPortada] = useState(null);
  const [portadaOriginal, setPortadaOriginal] = useState(null);
  const [guardando, setGuardando] = useState(false);
  // Si el tipo de evento que se necesita no existe, el organizador lo puede agregar.
  const [agregandoCategoria, setAgregandoCategoria] = useState(false);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editando ? "Editar evento" : "Crear Evento" });
  }, [navigation, editando]);

  // Al editar se cargan los datos actuales del evento.
  useEffect(() => {
    if (!editando) return;

    get(`/eventos/${eventoId}`)
      .then((evento) => {
        setNombre(evento.nombre);
        setFecha(evento.fecha);
        setDescripcion(evento.descripcion ?? "");
        setCategoriaId(evento.categoria?.id ?? null);
        setEntradas(
          evento.tiposEntrada.map((t) => ({
            id: t.id,
            nombre: t.nombre,
            precio: String(t.precio),
            ubicacion: t.ubicacion ?? "",
            cupo: String(t.cupoDisponible),
          }))
        );
        const actual = evento.portada ? `${API}${evento.portada}` : null;
        setPortada(actual);
        setPortadaOriginal(actual);
      })
      .catch((e) => alerta("No se pudo cargar el evento", e.message, [{ text: "Volver", onPress: () => navigation.goBack() }]))
      .finally(() => setCargando(false));
  }, [editando, eventoId, navigation]);

  const crearCategoria = async () => {
    if (creandoCategoria) return;
    setCreandoCategoria(true);
    try {
      const categoria = await enviar("POST", "/categorias", { nombre: nombreCategoria });
      await recargar(); // para que la categoría nueva aparezca en la lista
      setCategoriaId(categoria.id);
      setNombreCategoria("");
      setAgregandoCategoria(false);
    } catch (e) {
      alerta("No se pudo agregar", e.message);
    } finally {
      setCreandoCategoria(false);
    }
  };

  const elegirPortada = async () => {
    const imagen = await elegirFoto({ aspecto: [16, 9], calidad: 0.35 });
    if (imagen) setPortada(imagen);
  };

  const cambiarEntrada = (indice, campo, valor) =>
    setEntradas((actuales) =>
      actuales.map((e, i) => (i === indice ? { ...e, [campo]: valor } : e))
    );

  const quitarEntrada = (indice) =>
    setEntradas((actuales) => actuales.filter((_, i) => i !== indice));

  // El precio y el cupo se escriben como texto: hay que pasarlos a número antes de enviarlos.
  const tiposEntrada = () =>
    entradas.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      precio: e.precio.trim() === "" ? undefined : Number(e.precio),
      ubicacion: e.ubicacion,
      cupoDisponible: e.cupo.trim() === "" ? undefined : Number(e.cupo),
    }));

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);

    try {
      if (editando) {
        // La portada solo se manda si cambió: una nueva (data URI) o quitada (null).
        const cambioPortada =
          portada && portada.startsWith("data:") ? { portada } : portada === null && portadaOriginal ? { portada: null } : {};

        const evento = await enviar("PUT", `/eventos/${eventoId}`, {
          nombre, fecha, descripcion, categoriaId, ...cambioPortada, tiposEntrada: tiposEntrada(),
        });
        recargar();
        alerta("¡Cambios guardados!", evento.nombre, [{ text: "Perfecto", onPress: () => navigation.goBack() }]);
      } else {
        const evento = await enviar("POST", "/eventos", {
          nombre, fecha, descripcion, categoriaId, portada, tiposEntrada: tiposEntrada(),
        });
        recargar(); // para que el evento nuevo aparezca en la lista global
        alerta("¡Evento publicado!", evento.nombre, [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    } catch (e) {
      alerta(editando ? "No se pudo guardar" : "No se pudo publicar", e.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = () =>
    alerta(
      "Eliminar evento",
      "Se van a cancelar las compras activas y se reembolsará a quienes ya pagaron. Esta acción no se puede deshacer.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, eliminar",
          style: "destructive",
          onPress: async () => {
            setEliminando(true);
            try {
              const respuesta = await enviar("DELETE", `/eventos/${eventoId}`);
              recargar();
              const n = respuesta.comprasCanceladas;
              alerta(
                "Evento eliminado",
                n > 0 ? `Se cancelaron ${n} ${n === 1 ? "compra" : "compras"} y se avisó a los compradores.` : "El evento ya no está a la venta.",
                [{ text: "Listo", onPress: () => navigation.popToTop() }]
              );
            } catch (e) {
              setEliminando(false);
              alerta("No se pudo eliminar", e.message);
            }
          },
        },
      ]
    );

  if (cargando) return <ActivityIndicator style={{ marginTop: 80 }} size="large" color={colores.acento} />;

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={styles.contenedor}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
    >
      <Pressable style={[styles.portada, portada && styles.portadaConImagen]} onPress={elegirPortada}>
        {portada ? (
          <>
            <Image source={{ uri: portada }} style={styles.portadaImagen} resizeMode="cover" />
            <View style={styles.portadaAcciones}>
              <View style={styles.portadaBoton}>
                <Ionicons name="image-outline" size={14} color={colores.blanco} />
                <Text style={styles.portadaBotonTexto}>Cambiar</Text>
              </View>
              <Pressable style={styles.portadaBoton} onPress={() => setPortada(null)} hitSlop={6}>
                <Ionicons name="trash-outline" size={14} color={colores.blanco} />
                <Text style={styles.portadaBotonTexto}>Quitar</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={34} color={colores.acento} />
            <Text style={styles.portadaTitulo}>Subir imagen de portada</Text>
            <Text style={styles.portadaAyuda}>Elegila de tu galería (formato horizontal)</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.label}>Nombre del evento</Text>
      <TextInput
        style={styles.campo}
        placeholder="Ej. Festival de Jazz de Buenos Aires"
        placeholderTextColor={colores.textoPlaceholder}
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Fecha</Text>
      <View style={styles.campoConIcono}>
        <Ionicons name="calendar-outline" size={18} color={colores.textoSuave} />
        <TextInput
          style={styles.inputIcono}
          placeholder="AAAA-MM-DD (ej. 2027-05-20)"
          placeholderTextColor={colores.textoPlaceholder}
          value={fecha}
          onChangeText={setFecha}
          autoCapitalize="none"
        />
      </View>
      {editando && <Text style={styles.ayuda}>Si cambiás la fecha, les avisamos a quienes ya compraron.</Text>}

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.campo, styles.multilinea]}
        placeholder="Contá de qué se trata el evento"
        placeholderTextColor={colores.textoPlaceholder}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.chips}>
        {categorias.map((c) => (
          <Chip key={c.id} etiqueta={c.nombre} activo={categoriaId === c.id} onPress={() => setCategoriaId(c.id)} />
        ))}
        <Chip etiqueta={agregandoCategoria ? "Cancelar" : "Otra categoría"} icono={agregandoCategoria ? "close" : "add"} onPress={() => setAgregandoCategoria((v) => !v)} />
      </View>

      {agregandoCategoria && (
        <View style={styles.nuevaCategoria}>
          <TextInput
            style={styles.nuevaCategoriaInput}
            placeholder="Ej. Conferencias, Gastronomía, Cine"
            placeholderTextColor={colores.textoPlaceholder}
            value={nombreCategoria}
            onChangeText={setNombreCategoria}
            maxLength={30}
            autoFocus
          />
          <Pressable
            style={[styles.nuevaCategoriaBoton, (creandoCategoria || nombreCategoria.trim().length < 2) && { opacity: 0.5 }]}
            onPress={crearCategoria}
            disabled={creandoCategoria || nombreCategoria.trim().length < 2}
          >
            <Text style={styles.nuevaCategoriaBotonTexto}>{creandoCategoria ? "..." : "Agregar"}</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.seccion}>Tipos de entrada</Text>
      {entradas.map((e, i) => (
        <View key={e.id ?? `nueva-${i}`} style={styles.entrada}>
          <Text style={styles.label}>Nombre de la entrada</Text>
          <TextInput
            style={styles.campo}
            placeholder="Ej. General"
            placeholderTextColor={colores.textoPlaceholder}
            value={e.nombre}
            onChangeText={(v) => cambiarEntrada(i, "nombre", v)}
          />

          <Text style={styles.label}>Ubicación</Text>
          <View style={styles.campoConIcono}>
            <Ionicons name="location-outline" size={18} color={colores.textoSuave} />
            <TextInput
              style={styles.inputIcono}
              placeholder="Ej. Campo, Platea, Palco"
              placeholderTextColor={colores.textoPlaceholder}
              value={e.ubicacion}
              onChangeText={(v) => cambiarEntrada(i, "ubicacion", v)}
            />
          </View>

          <View style={styles.dosColumnas}>
            <View style={styles.columna}>
              <Text style={styles.label}>Precio de entrada</Text>
              <TextInput
                style={styles.campo}
                placeholder="$ ARS"
                placeholderTextColor={colores.textoPlaceholder}
                keyboardType="numeric"
                value={e.precio}
                onChangeText={(v) => cambiarEntrada(i, "precio", v)}
              />
            </View>
            <View style={styles.columna}>
              <Text style={styles.label}>{e.id ? "Cupo disponible" : "Capacidad"}</Text>
              <TextInput
                style={styles.campo}
                placeholder="Ej. 1.500"
                placeholderTextColor={colores.textoPlaceholder}
                keyboardType="numeric"
                value={e.cupo}
                onChangeText={(v) => cambiarEntrada(i, "cupo", v)}
              />
            </View>
          </View>

          {/* Las entradas que ya existían no se pueden quitar: pueden tener ventas. */}
          {!e.id && entradas.length > 1 && (
            <Pressable onPress={() => quitarEntrada(i)}>
              <Text style={styles.quitar}>Quitar esta entrada</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable style={styles.agregar} onPress={() => setEntradas([...entradas, entradaVacia()])}>
        <Ionicons name="add" size={18} color={colores.acento} />
        <Text style={styles.agregarTexto}>Agregar otro tipo de entrada</Text>
      </Pressable>

      <Pressable style={[estilosBase.botonPrimario, styles.publicar, guardando && { opacity: 0.6 }]} onPress={guardar} disabled={guardando}>
        <Text style={estilosBase.botonPrimarioTexto}>
          {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Publicar Evento"}
        </Text>
      </Pressable>

      {editando && (
        <Pressable style={styles.eliminar} onPress={eliminar} disabled={eliminando}>
          <Ionicons name="trash-outline" size={16} color={colores.error} />
          <Text style={styles.eliminarTexto}>{eliminando ? "Eliminando..." : "Eliminar evento"}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  nuevaCategoria: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "center" },
  nuevaCategoriaInput: {
    flex: 1, backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde,
    borderRadius: radios.campo, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colores.indigo,
  },
  nuevaCategoriaBoton: { backgroundColor: colores.acento, borderRadius: radios.boton, paddingHorizontal: 16, paddingVertical: 12 },
  nuevaCategoriaBotonTexto: { color: colores.blanco, fontWeight: "700" },
  ayuda: { color: colores.textoSuave, fontSize: 12, marginTop: 6 },
  eliminar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 22 },
  eliminarTexto: { color: colores.error, fontWeight: "700" },
  portadaConImagen: { padding: 0, overflow: "hidden", borderStyle: "solid" },
  portadaImagen: { width: "100%", aspectRatio: 16 / 9 },
  portadaAcciones: { position: "absolute", right: 10, bottom: 10, flexDirection: "row", gap: 8 },
  portadaBoton: {
    flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(15,23,42,0.7)",
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6,
  },
  portadaBotonTexto: { color: colores.blanco, fontSize: 12, fontWeight: "700" },
  fondo: { flex: 1, backgroundColor: colores.blanco },
  contenedor: { padding: 16, paddingBottom: 48 },

  portada: {
    alignItems: "center", gap: 4, paddingVertical: 28, borderRadius: radios.tarjeta,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: colores.acento, backgroundColor: colores.acentoSuave,
  },
  portadaTitulo: { fontWeight: "700", color: colores.indigo, marginTop: 4 },
  portadaAyuda: { fontSize: 12, color: colores.textoSuave },

  label: { fontWeight: "600", color: colores.indigo, marginBottom: 6, marginTop: 14, fontSize: 13 },
  seccion: { fontSize: 18, fontWeight: "800", color: colores.indigo, marginTop: 26 },

  campo: { ...estilosBase.campo },
  campoConIcono: { ...estilosBase.campo, flexDirection: "row", alignItems: "center", gap: 8 },
  inputIcono: { flex: 1, fontSize: 15, color: colores.indigo, padding: 0 },
  multilinea: { minHeight: 80, textAlignVertical: "top" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colores.borde, backgroundColor: colores.blanco, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  chipActivo: { backgroundColor: colores.acento, borderColor: colores.acento },
  chipTexto: { color: colores.indigo, fontWeight: "500" },
  chipTextoActivo: { color: colores.blanco, fontWeight: "700" },

  entrada: {
    backgroundColor: colores.fondo, borderRadius: radios.tarjeta, padding: 14,
    borderWidth: 1, borderColor: colores.borde, marginTop: 12,
  },
  dosColumnas: { flexDirection: "row", gap: 12 },
  columna: { flex: 1 },
  quitar: { color: colores.error, textAlign: "center", marginTop: 14, fontWeight: "600" },

  agregar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 12,
    borderWidth: 1, borderColor: colores.acento, borderRadius: radios.boton, paddingVertical: 12,
  },
  agregarTexto: { color: colores.acento, fontWeight: "700" },

  publicar: { marginTop: 24 },
});
