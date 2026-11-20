import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { enviar, get } from "./api";

// Almacén global de las notificaciones. Se consulta cada pocos segundos para que el puntito
// de la barra de abajo aparezca cuando llega algo nuevo.
const NotificacionesContext = createContext(null);

export const useNotificaciones = () => useContext(NotificacionesContext);

const CADA_CUANTO_MS = 8000;

export function NotificacionesProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const aplicar = (datos) => {
    setNotificaciones(datos.notificaciones);
    setNoLeidas(datos.noLeidas);
  };

  const recargar = useCallback(async () => {
    try {
      aplicar(await get("/notificaciones"));
    } catch {
      // Si falla, se queda lo que ya había.
    }
  }, []);

  useEffect(() => {
    recargar();
    const intervalo = setInterval(recargar, CADA_CUANTO_MS);
    return () => clearInterval(intervalo);
  }, [recargar]);

  const marcarLeida = useCallback(async (id) => {
    try {
      aplicar(await enviar("PUT", `/notificaciones/${id}/leida`));
    } catch {
      // No es grave: se actualiza en la próxima consulta.
    }
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    try {
      aplicar(await enviar("PUT", "/notificaciones/leidas"));
    } catch {
      // No es grave: se actualiza en la próxima consulta.
    }
  }, []);

  const valor = useMemo(
    () => ({ notificaciones, noLeidas, recargar, marcarLeida, marcarTodasLeidas }),
    [notificaciones, noLeidas, recargar, marcarLeida, marcarTodasLeidas]
  );

  return <NotificacionesContext.Provider value={valor}>{children}</NotificacionesContext.Provider>;
}
