import { useState } from "react";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { setToken } from "./src/api";
import { SesionContext, useSesion } from "./src/sesion";
import { EventosProvider } from "./src/eventos";
import { NotificacionesProvider, useNotificaciones } from "./src/notificaciones";
import NotificacionesScreen from "./src/screens/NotificacionesScreen";
import CalendarioScreen from "./src/screens/CalendarioScreen";
import EditarPerfilScreen from "./src/screens/EditarPerfilScreen";
import DialogoRaiz from "./src/componentes/DialogoRaiz";
import { colores } from "./src/tema";
import LoginScreen from "./src/screens/LoginScreen";
import RegistroScreen from "./src/screens/RegistroScreen";
import RecuperarScreen from "./src/screens/RecuperarScreen";
import TerminosScreen from "./src/screens/TerminosScreen";
import AyudaScreen from "./src/screens/AyudaScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import EventosScreen from "./src/screens/EventosScreen";
import EventoDetalleScreen from "./src/screens/EventoDetalleScreen";
import MisComprasScreen from "./src/screens/MisComprasScreen";
import ChatScreen from "./src/screens/ChatScreen";
import ResenaScreen from "./src/screens/ResenaScreen";
import OrganizadorScreen from "./src/screens/OrganizadorScreen";
import ComprasEventoScreen from "./src/screens/ComprasEventoScreen";
import CrearEventoScreen from "./src/screens/CrearEventoScreen";
import FavoritosScreen from "./src/screens/FavoritosScreen";
import SeleccionarEntradasScreen from "./src/screens/SeleccionarEntradasScreen";
import TarjetasScreen from "./src/screens/TarjetasScreen";
import EntradaScreen from "./src/screens/EntradaScreen";
import AgregarTarjetaScreen from "./src/screens/AgregarTarjetaScreen";
import PagarScreen from "./src/screens/PagarScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Ícono de cada pestaña (lleno si está activa, de contorno si no).
const ICONOS_TAB = {
  Eventos: ["compass", "compass-outline"],
  "Mis compras": ["ticket", "ticket-outline"],
  "Mis eventos": ["albums", "albums-outline"],
  Calendario: ["calendar-number", "calendar-number-outline"],
  Notificaciones: ["notifications", "notifications-outline"],
  Perfil: ["person", "person-outline"],
};

const opcionesTab = ({ route }, insets) => ({
  headerShown: false,
  tabBarActiveTintColor: colores.acento,
  tabBarInactiveTintColor: colores.textoSuave,
  tabBarStyle: { backgroundColor: colores.blanco, borderTopWidth: 1, borderTopColor: colores.borde, height: 54 + insets.bottom, paddingTop: 8, paddingBottom: insets.bottom + 4 },
  tabBarShowLabel: false,
  tabBarIcon: ({ focused, color, size }) => (
    <Ionicons name={ICONOS_TAB[route.name][focused ? 0 : 1]} size={26} color={color} />
  ),
});

// Cada rol ve una app distinta: el comprador explora y compra, el organizador gestiona sus eventos.
function Inicio() {
  const insets = useSafeAreaInsets();
  const { sesion } = useSesion();
  const { noLeidas } = useNotificaciones();

  // Un puntito verde en la campana avisa que hay notificaciones sin leer (sin mostrar la cantidad).
  const opcionesNotificaciones = {
    tabBarBadge: noLeidas > 0 ? " " : undefined,
    tabBarBadgeStyle: { backgroundColor: colores.acento, minWidth: 10, maxHeight: 10, borderRadius: 5, top: 2 },
  };

  if (sesion.rol === "ORGANIZADOR") {
    return (
      <Tab.Navigator screenOptions={(p) => opcionesTab(p, insets)}>
        <Tab.Screen name="Mis eventos" component={OrganizadorScreen} />
        <Tab.Screen name="Calendario" component={CalendarioScreen} />
        <Tab.Screen name="Notificaciones" component={NotificacionesScreen} options={opcionesNotificaciones} />
        <Tab.Screen name="Perfil" component={PerfilScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={(p) => opcionesTab(p, insets)}>
      <Tab.Screen name="Eventos" component={EventosScreen} />
      <Tab.Screen name="Mis compras" component={MisComprasScreen} />
      <Tab.Screen name="Calendario" component={CalendarioScreen} />
      <Tab.Screen name="Notificaciones" component={NotificacionesScreen} options={opcionesNotificaciones} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// Encabezado común de las pantallas que no son pestañas.
const opcionesStack = {
  headerTintColor: colores.indigo,
  headerTitleStyle: { fontWeight: "800", color: colores.indigo },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colores.blanco },
};

export default function App() {
  const [sesion, setSesion] = useState(null);

  const iniciarSesion = ({ token, rol, usuario }) => {
    setToken(token);
    setSesion({ rol, usuario });
  };

  // Después de editar el perfil, la sesión guarda los datos nuevos (nombre, foto, etc.).
  const actualizarUsuario = (usuario) => setSesion((actual) => ({ ...actual, usuario }));

  const cerrarSesion = () => {
    setToken(null);
    setSesion(null);
  };

  return (
    <SafeAreaProvider>
    <SesionContext.Provider value={{ sesion, iniciarSesion, actualizarUsuario, cerrarSesion }}>
      <NavigationContainer>
        {sesion === null ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
            <Stack.Screen name="Recuperar" component={RecuperarScreen} />
            <Stack.Screen name="Terminos" component={TerminosScreen} options={{ ...opcionesStack, headerShown: true, title: "Términos y Condiciones" }} />
          </Stack.Navigator>
        ) : (
          <EventosProvider esComprador={sesion.rol === "COMPRADOR"}>
          <NotificacionesProvider>
          <Stack.Navigator screenOptions={opcionesStack}>
            <Stack.Screen name="Inicio" component={Inicio} options={{ headerShown: false }} />
            <Stack.Screen name="Detalle" component={EventoDetalleScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Entradas" component={SeleccionarEntradasScreen} options={{ title: "Seleccionar Entradas" }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Resena" component={ResenaScreen} options={{ title: "Reseña" }} />
            <Stack.Screen name="ComprasEvento" component={ComprasEventoScreen} options={{ title: "Compras del evento" }} />
            <Stack.Screen name="CrearEvento" component={CrearEventoScreen} options={{ title: "Crear Evento" }} />
            <Stack.Screen name="Favoritos" component={FavoritosScreen} options={{ title: "Mis favoritos" }} />
            <Stack.Screen name="Entrada" component={EntradaScreen} options={{ title: "Mi entrada" }} />
            <Stack.Screen name="Terminos" component={TerminosScreen} options={{ title: "Términos y Condiciones" }} />
            <Stack.Screen name="Ayuda" component={AyudaScreen} options={{ title: "Ayuda y Soporte" }} />
            <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} options={{ title: "Editar perfil" }} />
            <Stack.Screen name="Tarjetas" component={TarjetasScreen} options={{ title: "Métodos de pago" }} />
            <Stack.Screen name="AgregarTarjeta" component={AgregarTarjetaScreen} options={{ title: "Agregar tarjeta" }} />
            <Stack.Screen name="Pagar" component={PagarScreen} options={{ title: "Pagar" }} />
          </Stack.Navigator>
          </NotificacionesProvider>
          </EventosProvider>
        )}
      </NavigationContainer>
      <DialogoRaiz />
    </SesionContext.Provider>
    </SafeAreaProvider>
  );
}
