import { Image } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import QRCode from "qrcode";
import { alerta } from "./dialogo";
import { codigoDe, ESTADOS } from "./compras";
import { formatearFechaHora, formatearFechaLarga, formatearPrecio } from "./formato";
import { imagenDe } from "./imagenes";

// Evita que un texto con caracteres raros rompa el HTML del PDF.
const escapar = (texto) =>
  String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// La foto del evento viaja dentro del PDF en base64, así no depende de la conexión.
async function fotoEnBase64(evento) {
  const fuente = imagenDe(evento);
  if (!fuente) return null;

  try {
    const { uri } = Image.resolveAssetSource(fuente);
    const blob = await (await fetch(uri)).blob();

    return await new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onloadend = () => resolver(lector.result);
      lector.onerror = rechazar;
      lector.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function qrEnSvg(texto) {
  try {
    return await QRCode.toString(texto, { type: "svg", margin: 0 });
  } catch {
    return "";
  }
}

async function ticketHtml(compra) {
  const [foto, qr] = await Promise.all([fotoEnBase64(compra.evento), qrEnSvg(codigoDe(compra))]);
  const estado = ESTADOS[compra.estado];
  const compradoEl = compra.historial?.[0]?.fechaHora;

  return `
    <div class="ticket">
      ${foto ? `<img class="foto" src="${foto}" />` : ""}
      <div class="cuerpo">
        <h1>${escapar(compra.evento.nombre)}</h1>
        <div class="dato">${escapar(formatearFechaLarga(compra.evento.fecha))}</div>
        <div class="dato">Organiza: ${escapar(compra.evento.organizador?.nombre ?? "-")}</div>
        <div class="fila">
          <div class="col"><div class="et">ENTRADA</div><div class="val">${escapar(compra.tipoEntrada.nombre)}</div></div>
          <div class="col"><div class="et">CANTIDAD</div><div class="val">${compra.cantidad}</div></div>
          <div class="col"><div class="et">TOTAL</div><div class="val">${escapar(formatearPrecio(compra.total))}</div></div>
        </div>
      </div>
      <div class="corte"></div>
      <div class="pie">
        <div class="qr">${qr}</div>
        <div class="detalle">
          <div class="et">COMPRA Nº</div><div class="val">${compra.id}</div>
          <div class="et" style="margin-top:8px">COMPRADOR</div><div class="val">${escapar(`${compra.comprador.nombre} ${compra.comprador.apellido}`)}</div>
          <div class="et" style="margin-top:8px">CÓDIGO</div><div class="val">${escapar(codigoDe(compra))}</div>
          ${compradoEl ? `<div class="et" style="margin-top:8px">FECHA DE COMPRA</div><div class="val">${escapar(formatearFechaHora(compradoEl))}</div>` : ""}
          <div style="margin-top:10px"><span class="estado">${escapar(estado.texto)}</span></div>
        </div>
      </div>
    </div>`;
}

const ESTILOS = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0F172A; padding: 24px; }
  .cabecera { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .logo { font-size: 24px; font-weight: 800; }
  .logo span { color: #EF806C; }
  .titulo { color: #64748B; font-size: 13px; text-align: right; }
  .ticket { border: 2px solid #E2E8F0; border-radius: 18px; overflow: hidden; margin-bottom: 24px; page-break-inside: avoid; }
  .foto { width: 100%; height: 180px; object-fit: cover; display: block; }
  .cuerpo { padding: 18px 20px; }
  h1 { margin: 0 0 6px; font-size: 24px; }
  .dato { color: #64748B; font-size: 14px; margin: 2px 0; }
  .fila { display: flex; gap: 12px; margin-top: 16px; }
  .col { flex: 1; }
  .et { font-size: 10px; letter-spacing: 0.6px; color: #94A3B8; font-weight: 700; }
  .val { font-weight: 800; margin-top: 2px; font-size: 14px; }
  .corte { border-top: 2px dashed #CBD5E1; margin: 0 18px; }
  .pie { display: flex; align-items: center; gap: 24px; padding: 18px 20px; }
  .qr svg { width: 150px; height: 150px; }
  .estado { display: inline-block; background: #148C5E; color: #fff; font-weight: 700; border-radius: 10px; padding: 3px 10px; font-size: 12px; }
  .nota { color: #94A3B8; font-size: 11px; text-align: center; margin-top: 8px; }
`;

// Genera un PDF con un ticket por cada compra y abre el menú del sistema para guardarlo, imprimirlo o compartirlo.
export async function descargarComprobante(compras) {
  try {
    const tickets = (await Promise.all(compras.map(ticketHtml))).join("");
    const html = `
      <html>
        <head><meta charset="utf-8" /><style>${ESTILOS}</style></head>
        <body>
          <div class="cabecera">
            <div class="logo">Ticket <span>It</span></div>
            <div class="titulo">Comprobante de compra<br/>${escapar(formatearFechaHora(new Date().toISOString()))}</div>
          </div>
          ${tickets}
          <div class="nota">Comprobante generado por una app de práctica: los pagos son simulados.</div>
        </body>
      </html>`;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Comprobante de compra", UTI: "com.adobe.pdf" });
    } else {
      alerta("Comprobante listo", "Se generó el PDF, pero este dispositivo no permite compartirlo.");
    }
  } catch (e) {
    alerta("No se pudo generar el comprobante", e.message);
  }
}
