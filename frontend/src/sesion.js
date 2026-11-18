import { createContext, useContext } from "react";

// Guarda quién inició sesión: { rol: "COMPRADOR" | "ORGANIZADOR", usuario: {...} }
// y las funciones iniciarSesion / cerrarSesion.
export const SesionContext = createContext(null);

export const useSesion = () => useContext(SesionContext);
