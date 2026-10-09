const mongoose = require('mongoose');

const departamentoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  jefe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Departamento', departamentoSchema);