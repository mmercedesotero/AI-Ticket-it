// ⚠ ANTES DE USAR LA APP: cambiá TU-IP-AQUI por la IP de tu computadora en la red wifi.
//
// Cuando levantás el backend (npm start en packages/backend), la terminal te muestra la línea exacta para pegar acá.
// También se puede ver con "ipconfig" (Windows) o "ifconfig" (Mac / Linux). Ejemplo:
//
//     export const API = "http://192.168.1.35:3000";
//
// El celular y la computadora tienen que estar en la misma wifi. Más detalles en el README.
export const API = "http://TU-IP-AQUI:3000";

// Si todavía no se puso la IP, en vez de un error de red confuso se avisa qué hay que hacer.
const avisarSiFalta = () => {
  if (API.includes("TU-IP-AQUI"))
    throw new Error("Falta configurar la IP del backend. Abrí packages/frontend/src/api.js y cambiá TU-IP-AQUI por la IP de tu computadora (el backend la muestra al arrancar).");
};

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
  avisarSiFalta();
  const respuesta = await fetch(`${API}${ruta}`, { headers: cabeceras() });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error de red");
  return datos;
}

export async function enviar(metodo, ruta, cuerpo) {
  avisarSiFalta();
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: cabeceras(),
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error de red");
  return datos;
}
