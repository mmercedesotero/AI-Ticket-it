class ReseniaRepository {
  constructor() {
    this.resenias = [];
  }

  findAll() {
    return this.resenias;
  }

  save(resenia) {
    if (resenia.id === undefined || resenia.id === null) {
      resenia.id =
        Math.max(0, ...this.resenias.map(({ id }) => Number(id) || 0)) + 1;
    }

    this.resenias.push(resenia);
    return resenia;
  }
}

module.exports = ReseniaRepository;
