import { alerta } from "../dialogo";
import { useCallback, useState } from "react";
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { get } from "../api";
import { useSesion } from "../sesion";
import { colores, radios } from "../tema";

// Opciones que todavía no tienen pantalla propia.
const OPCIONES = [
  { icono: "card-outline", texto: "Mis métodos de pago", destino: "Tarjetas", soloComprador: true },
  { icono: "notifications-outline", texto: "Notificaciones", destino: "Notificaciones" },
  { icono: "help-circle-outline", texto: "Ayuda y soporte" },
  { icono: "document-text-outline", texto: "Términos y condiciones" },
];

export default function PerfilScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sesion, cerrarSesion } = useSesion();
  const { usuario, rol } = sesion;
  const esOrganizador = rol === "ORGANIZADOR";
  const [numeros, setNumeros] = useState([null, null]);

  const nombreCompleto = usuario.apellido ? `${usuario.nombre} ${usuario.apellido}` : usuario.nombre;

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        try {
          if (esOrganizador) {
            const [eventos, resenias] = await Promise.all([
              get("/eventos"),
              get(`/resenias?organizadorId=${usuario.id}`),
            ]);
            const propios = eventos.filter((e) => e.organizador?.id === usuario.id);
            setNumeros([propios.length, resenias.cantidad]);
          } else {
            const [compras, resenias] = await Promise.all([get("/compras"), get("/resenias")]);
            const entradas = compras
              .filter((c) => c.estado !== "CANCELADA" && c.estado !== "REEMBOLSADA")
              .reduce((total, c) => total + c.cantidad, 0);
            // Las reseñas traen el nombre completo del comprador, no su id.
            const mias = resenias.filter((r) => r.comprador === nombreCompleto).length;
            setNumeros([entradas, mias]);
          }
        } catch {
          setNumeros([null, null]);
        }
      };
      cargar();
    }, [esOrganizador, usuario.id, nombreCompleto])
  );

  const proximamente = (titulo) =>
    alerta(titulo, "Esta sección todavía no está disponible.");

  // Los organizadores y los compradores son cuentas distintas: para cambiar de modo hay que entrar con la otra.
  const cambiarModo = () => {
    alerta(
      esOrganizador ? "Cambiar a Modo Comprador" : "Cambiar a Modo Organizador",
      esOrganizador
        ? "Vas a cerrar esta sesión para entrar con una cuenta de comprador."
        : "Vas a cerrar esta sesión para entrar con una cuenta de organizador.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Continuar", onPress: cerrarSesion },
      ]
    );
  };

  const salir = () => {
    alerta("Cerrar sesión", "¿Querés cerrar tu sesión?", [
      { text: "No", style: "cancel" },
      { text: "Sí, cerrar", onPress: cerrarSesion },
    ]);
  };

  const mostrar = (n) => (n === null ? "–" : String(n));

  return (
    <ScrollView
      style={styles.fondo}
      contentContainerStyle={[styles.contenedor, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.titulo}>Mi Perfil</Text>

      <View style={styles.cabecera}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{usuario.nombre.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.datos}>
          <Text style={styles.nombre}>{nombreCompleto}</Text>
          {usuario.email && <Text style={styles.email}>{usuario.email}</Text>}
          <View style={styles.rol}>
            <Ionicons name="checkmark-circle" size={14} color={colores.exito} />
            <Text style={styles.rolTexto}>{esOrganizador ? "Organizador" : "Comprador"} verificado</Text>
          </View>
        </View>
      </View>

      <View style={styles.numeros}>
        <View style={styles.numero}>
          <Text style={styles.numeroEtiqueta}>{esOrganizador ? "Eventos" : "Entradas"}</Text>
          <Text style={styles.numeroValor}>{mostrar(numeros[0])}</Text>
        </View>
        <View style={styles.numero}>
          <Text style={styles.numeroEtiqueta}>{esOrganizador ? "Reseñas recibidas" : "Reseñas"}</Text>
          <Text style={styles.numeroValor}>{mostrar(numeros[1])}</Text>
        </View>
      </View>

      <Pressable style={styles.cambiar} onPress={cambiarModo}>
        <Text style={styles.cambiarTexto}>
          {esOrganizador ? "Cambiar a Modo Comprador" : "Cambiar a Modo Organizador"}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colores.acento} />
      </Pressable>

      <View style={styles.lista}>
        {!esOrganizador && (
          <Fila icono="heart-outline" texto="Mis favoritos" onPress={() => navigation.navigate("Favoritos")} />
        )}
        {OPCIONES.map((o) => (
          <Fila
            key={o.texto}
            icono={o.icono}
            texto={o.texto}
            onPress={() =>
              o.destino && !(o.soloComprador && esOrganizador) ? navigation.navigate(o.destino) : proximamente(o.texto)
            }
          />
        ))}
        <Fila icono="log-out-outline" texto="Cerrar sesión" peligro onPress={salir} />
      </View>
    </ScrollView>
  );
}

function Fila({ icono, texto, onPress, peligro }) {
  const color = peligro ? colores.acento : colores.indigo;
  return (
    <Pressable style={styles.fila} onPress={onPress}>
      <Ionicons name={icono} size={22} color={color} />
      <Text style={[styles.filaTexto, { color }]}>{texto}</Text>
      {!peligro && <Ionicons name="chevron-forward" size={18} color={colores.textoPlaceholder} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { paddingHorizontal: 16, paddingBottom: 32 },
  titulo: { fontSize: 22, fontWeight: "800", color: colores.indigo, marginBottom: 16 },

  cabecera: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colores.indigo, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: colores.blanco, fontSize: 30, fontWeight: "800" },
  datos: { flex: 1 },
  nombre: { fontSize: 20, fontWeight: "800", color: colores.indigo },
  email: { color: colores.textoSuave, marginTop: 2 },
  rol: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 6,
    backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
  },
  rolTexto: { fontSize: 12, color: colores.indigo },

  numeros: { flexDirection: "row", gap: 12, marginBottom: 16 },
  numero: {
    flex: 1, alignItems: "center", backgroundColor: colores.blanco, borderRadius: radios.tarjeta,
    paddingVertical: 14, borderWidth: 1, borderColor: colores.borde,
  },
  numeroEtiqueta: { color: colores.textoSuave, fontSize: 13 },
  numeroValor: { fontSize: 26, fontWeight: "800", color: colores.indigo, marginTop: 2 },

  cambiar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colores.acentoSuave, borderWidth: 1, borderColor: "#BBF7D0",
    borderRadius: radios.tarjeta, padding: 16, marginBottom: 12,
  },
  cambiarTexto: { fontWeight: "700", color: colores.indigo },

  lista: { backgroundColor: colores.blanco, borderRadius: radios.tarjeta, borderWidth: 1, borderColor: colores.borde },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colores.borde },
  filaTexto: { flex: 1, fontSize: 15, fontWeight: "500" },
});
