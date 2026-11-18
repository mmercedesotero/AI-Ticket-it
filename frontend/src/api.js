export const API = "http://192.168.2.104:3000";

export async function get(ruta) {
  const respuesta = await fetch(`${API}${ruta}`);
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error de red");
  return datos;
}

export const USUARIO_ID = 1;

export async function enviar(metodo, ruta, cuerpo) {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error de red");
  return datos;
}