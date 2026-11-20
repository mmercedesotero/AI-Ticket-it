export const API = "http://192.168.2.104:3000";

// El token de la sesión actual. Se guarda acá para mandarlo en cada pedido.
let token = null;

export const setToken = (nuevo) => {
  token = nuevo;
};

const cabeceras = () => ({
  "Content-Type": "application/json",
  ...(token && { Authorization: `Bearer ${token}` }),
});

export async function get(ruta) {
  const respuesta = await fetch(`${API}${ruta}`, { headers: cabeceras() });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error de red");
  return datos;
}

export async function enviar(metodo, ruta, cuerpo) {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: cabeceras(),
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error de red");
  return datos;
}
