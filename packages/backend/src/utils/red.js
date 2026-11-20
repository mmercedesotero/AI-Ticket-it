const os = require("os");

// Direcciones IPv4 de esta computadora en la red, para decirle a la persona qué IP poner en la app.
// "interfaces" se puede pasar para probarlo con datos inventados.
function direccionesLocales(interfaces = os.networkInterfaces()) {
  return Object.entries(interfaces)
    .flatMap(([nombre, direcciones]) =>
      (direcciones ?? [])
        .filter((d) => d.family === "IPv4" && !d.internal)
        .map((d) => ({ nombre, ip: d.address, esWifi: /wi-?fi|wlan|wireless|^en0$/i.test(nombre) }))
    )
    // La wifi primero: es la que el celular puede alcanzar.
    .sort((a, b) => Number(b.esWifi) - Number(a.esWifi));
}

// Mensaje que se muestra en la terminal al arrancar el backend.
function mensajeDeArranque(puerto, direcciones = direccionesLocales()) {
  const lineas = ["", `Servidor funcionando en http://localhost:${puerto}`, ""];

  if (direcciones.length === 0) {
    lineas.push("No se encontró ninguna red: sin conexión, el celular no va a poder llegar al servidor.");
    return lineas.join("\n");
  }

  const [principal, ...otras] = direcciones;
  lineas.push(
    "Para usar la app en el celular, abrí packages/frontend/src/api.js y poné esta dirección:",
    "",
    `    export const API = "http://${principal.ip}:${puerto}";`,
    "",
    `(IP de "${principal.nombre}". El celular y esta computadora tienen que estar en la misma wifi.)`
  );

  if (otras.length > 0) {
    lineas.push("", "Otras direcciones de esta computadora, por si la de arriba no funciona:");
    otras.forEach((d) => lineas.push(`    http://${d.ip}:${puerto}   (${d.nombre})`));
  }

  return lineas.join("\n");
}

module.exports = { direccionesLocales, mensajeDeArranque };
