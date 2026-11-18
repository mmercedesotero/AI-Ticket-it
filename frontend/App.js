import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { setToken } from "./src/api";
import { SesionContext, useSesion } from "./src/sesion";
import LoginScreen from "./src/screens/LoginScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import EventosScreen from "./src/screens/EventosScreen";
import EventoDetalleScreen from "./src/screens/EventoDetalleScreen";
import MisComprasScreen from "./src/screens/MisComprasScreen";
import ChatScreen from "./src/screens/ChatScreen";
import ResenaScreen from "./src/screens/ResenaScreen";
import OrganizadorScreen from "./src/screens/OrganizadorScreen";
import ComprasEventoScreen from "./src/screens/ComprasEventoScreen";
import CrearEventoScreen from "./src/screens/CrearEventoScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Cada rol ve una app distinta: el comprador explora y compra, el organizador gestiona sus eventos.
function Inicio() {
  const { sesion } = useSesion();

  if (sesion.rol === "ORGANIZADOR") {
    return (
      <Tab.Navigator>
        <Tab.Screen name="Mis eventos" component={OrganizadorScreen} />
        <Tab.Screen name="Perfil" component={PerfilScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator>
      <Tab.Screen name="Eventos" component={EventosScreen} options={{ title: "AI Ticket It" }} />
      <Tab.Screen name="Mis compras" component={MisComprasScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [sesion, setSesion] = useState(null);

  const iniciarSesion = ({ token, rol, usuario }) => {
    setToken(token);
    setSesion({ rol, usuario });
  };

  const cerrarSesion = () => {
    setToken(null);
    setSesion(null);
  };

  return (
    <SesionContext.Provider value={{ sesion, iniciarSesion, cerrarSesion }}>
      <NavigationContainer>
        {sesion === null ? (
          <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="Inicio" component={Inicio} options={{ headerShown: false }} />
            <Stack.Screen name="Detalle" component={EventoDetalleScreen} options={{ title: "Evento" }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
            <Stack.Screen name="Resena" component={ResenaScreen} options={{ title: "Reseña" }} />
            <Stack.Screen name="ComprasEvento" component={ComprasEventoScreen} options={{ title: "Compras del evento" }} />
            <Stack.Screen name="CrearEvento" component={CrearEventoScreen} options={{ title: "Crear evento" }} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SesionContext.Provider>
  );
}
