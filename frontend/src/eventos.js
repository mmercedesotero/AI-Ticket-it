import { alerta } from "./dialogo";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { enviar, get } from "./api";

// Almacén global: los eventos, las categorías y los favoritos se piden una sola vez al iniciar sesión
// y todas las pantallas los leen de acá, así abren al instante sin volver a pedirlos al servidor.
const EventosContext = createContext(null);

export const useEventos = () => useContext(EventosContext);

export function EventosProvider({ esComprador, children }) {
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [cargado, setCargado] = useState(false);

  // Vuelve a pedir todo. Se usa al deslizar para refrescar o después de crear un evento.
  const recargar = useCallback(async () => {
    try {
      const [listaEventos, listaCategorias, listaFavoritos] = await Promise.all([
        get("/eventos?orden=fecha"),
        get("/categorias"),
        esComprador ? get("/favoritos") : Promise.resolve([]),
      ]);
      setEventos(listaEventos);
      setCategorias(listaCategorias);
      setFavoritos(listaFavoritos);
    } catch {
      // Si falla, se conserva lo que ya estaba cargado.
    } finally {
      setCargado(true);
    }
  }, [esComprador]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const esFavorito = useCallback((id) => favoritos.some((e) => e.id === id), [favoritos]);

  // Si ya era favorito lo saca, y si no, lo agrega. La respuesta del servidor trae la lista actualizada.
  const alternarFavorito = useCallback(
    async (evento) => {
      try {
        const lista = favoritos.some((e) => e.id === evento.id)
          ? await enviar("DELETE", `/favoritos/${evento.id}`)
          : await enviar("POST", `/favoritos/${evento.id}`);
        setFavoritos(lista);
      } catch (e) {
        alerta("No se pudo actualizar", e.message);
      }
    },
    [favoritos]
  );

  const valor = useMemo(
    () => ({ eventos, categorias, favoritos, cargado, recargar, esFavorito, alternarFavorito }),
    [eventos, categorias, favoritos, cargado, recargar, esFavorito, alternarFavorito]
  );

  return <EventosContext.Provider value={valor}>{children}</EventosContext.Provider>;
}
