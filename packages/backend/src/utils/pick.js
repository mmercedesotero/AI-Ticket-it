function pick(objeto = {}, campos) {
  return Object.fromEntries(
    campos
      .filter((campo) => objeto[campo] !== undefined)
      .map((campo) => [campo, objeto[campo]])
  );
}

module.exports = pick;