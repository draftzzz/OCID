const mongoose = require('mongoose');

const eventoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date
  },
  tipo: {
    type: String,
    enum: ['reunion', 'entrega', 'actividad', 'aviso', 'otro'],
    default: 'otro'
  },
  departamento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Departamento'
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  recordatorio: {
    type: Boolean,
    default: false
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Evento', eventoSchema);