const Evento = require("../models/evento");

class EventoRepository {
  constructor() {
    this.eventos = [
      new Evento(
        1,
        "Coldplay",
        "2027-01-10",
        "Concierto",
      ),
      new Evento(
        2,
        "Taylor Swift",
        "2027-02-15",
        "Show"
      )
    ];
}

  findAll() {
    return this.eventos;
  }

  findById(id) {
    return this.eventos.find(evento => String(evento.id) === String(id));
  }

  save(evento) {
    if (evento.id === undefined || evento.id === null) {
      evento.id =
        Math.max(0, ...this.eventos.map(({ id }) => Number(id) || 0)) + 1;
    }

    this.eventos.push(evento);
    return evento;
  }

  update(id, datosActualizados) {
    const evento = this.findById(id);

    if (!evento) {
        return null;
    }

    Object.assign(evento, datosActualizados);

    return evento;
    }
    delete(id) {
        const indice = this.eventos.findIndex(
            evento => String(evento.id) === String(id)
        );

        if (indice === -1) {
            return false;
        }

        this.eventos.splice(indice, 1);

        return true;
    }
}

module.exports = EventoRepository;