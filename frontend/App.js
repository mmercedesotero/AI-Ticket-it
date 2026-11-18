import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import EventosScreen from "./src/screens/EventosScreen";
import EventoDetalleScreen from "./src/screens/EventoDetalleScreen";
import MisComprasScreen from "./src/screens/MisComprasScreen";
import ChatScreen from "./src/screens/ChatScreen";
import ResenaScreen from "./src/screens/ResenaScreen";
import OrganizadorScreen from "./src/screens/OrganizadorScreen";
import ComprasEventoScreen from "./src/screens/ComprasEventoScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Inicio() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Eventos" component={EventosScreen} options={{ title: "AI Ticket It" }} />
      <Tab.Screen name="Mis compras" component={MisComprasScreen} />
      <Tab.Screen name="Organizador" component={OrganizadorScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Inicio" component={Inicio} options={{ headerShown: false }} />
        <Stack.Screen name="Detalle" component={EventoDetalleScreen} options={{ title: "Evento" }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
        <Stack.Screen name="Resena" component={ResenaScreen} options={{ title: "Reseña" }} />
        <Stack.Screen name="ComprasEvento" component={ComprasEventoScreen} options={{ title: "Compras del evento" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
