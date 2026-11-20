// Países para el teléfono: código de marcado, bandera y cantidad de dígitos del número (sin el código).
export const PAISES = [
  { codigo: "+54", nombre: "Argentina", bandera: "🇦🇷", digitos: 10 },
  { codigo: "+598", nombre: "Uruguay", bandera: "🇺🇾", digitos: 8 },
  { codigo: "+56", nombre: "Chile", bandera: "🇨🇱", digitos: 9 },
  { codigo: "+55", nombre: "Brasil", bandera: "🇧🇷", digitos: 11 },
  { codigo: "+595", nombre: "Paraguay", bandera: "🇵🇾", digitos: 9 },
  { codigo: "+591", nombre: "Bolivia", bandera: "🇧🇴", digitos: 8 },
  { codigo: "+51", nombre: "Perú", bandera: "🇵🇪", digitos: 9 },
  { codigo: "+57", nombre: "Colombia", bandera: "🇨🇴", digitos: 10 },
  { codigo: "+58", nombre: "Venezuela", bandera: "🇻🇪", digitos: 10 },
  { codigo: "+593", nombre: "Ecuador", bandera: "🇪🇨", digitos: 9 },
  { codigo: "+52", nombre: "México", bandera: "🇲🇽", digitos: 10 },
  { codigo: "+1", nombre: "Estados Unidos / Canadá", bandera: "🇺🇸", digitos: 10 },
  { codigo: "+34", nombre: "España", bandera: "🇪🇸", digitos: 9 },
];

export const PAIS_POR_DEFECTO = PAISES[0];

// Separa un teléfono guardado ("+54 1155551234") en país y número.
export function separarTelefono(telefono) {
  const texto = String(telefono ?? "").trim();
  const pais = [...PAISES]
    .sort((a, b) => b.codigo.length - a.codigo.length)
    .find((p) => texto.startsWith(p.codigo));

  if (!pais) return { pais: PAIS_POR_DEFECTO, numero: texto.replace(/\D/g, "").slice(0, PAIS_POR_DEFECTO.digitos) };
  return { pais, numero: texto.slice(pais.codigo.length).replace(/\D/g, "").slice(0, pais.digitos) };
}
