import { enviar } from "./api";

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// Paga una o varias compras con la tarjeta elegida.
// Es una simulación: aunque el servidor responda enseguida, se espera un rato para que parezca
// que se está procesando la transacción (también cuando el pago falla).
// alPagar(id) se llama por cada compra pagada, así se sabe cuáles faltan si algo falla a mitad de camino.
export async function pagarCompras(ids, tarjetaId, alPagar = () => {}) {
  const espera = esperar(2200);

  try {
    for (const id of ids) {
      await enviar("PUT", `/compras/${id}/pagar`, { tarjetaId });
      alPagar(id);
    }
  } catch (error) {
    await espera;
    throw error;
  }

  await espera;
}
