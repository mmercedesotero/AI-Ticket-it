import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EventosScreen from "./src/screens/EventosScreen";
import EventoDetalleScreen from "./src/screens/EventoDetalleScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Eventos" component={EventosScreen} options={{ title: "AI Ticket It" }} />
        <Stack.Screen name="Detalle" component={EventoDetalleScreen} options={{ title: "Evento" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
