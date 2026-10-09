const Evento = require('../models/Evento');
const Usuario = require('../models/User');
const Departamento = require('../models/Departamento');

// Obtener todos los eventos (con filtros opcionales)
exports.getEventos = async (req, res) => {
  try {
    const { departamento, tipo, pagina = 1, limite = 10 } = req.query;

    const filtro = { activo: true };

    if (departamento) filtro.departamento = departamento;
    if (tipo) filtro.tipo = tipo;

    const skip = (pagina - 1) * limite;

    const [eventos, total] = await Promise.all([
      Evento.find(filtro)
        .populate('creadoPor', 'nombre email')
        .populate('departamento', 'nombre')
        .sort({ fechaInicio: 1 })
        .skip(skip)
        .limit(parseInt(limite)),
      Evento.countDocuments(filtro)
    ]);

    res.json({
      eventos,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        paginas: Math.ceil(total / limite),
        limite: parseInt(limite)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener eventos', error: error.message });
  }
};

// Obtener evento por ID
exports.getEventoById = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id)
      .populate('creadoPor', 'nombre email')
      .populate('departamento', 'nombre');

    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    if (!evento.activo) {
      return res.status(404).json({ message: 'Evento no disponible' });
    }

    res.json(evento);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener evento', error: error.message });
  }
};

// Crear nuevo evento
exports.createEvento = async (req, res) => {
  try {
    const { titulo, descripcion, fechaInicio, fechaFin, tipo, departamentoId, recordatorio } = req.body;

    if (!titulo || !fechaInicio) {
      return res.status(400).json({ message: 'Título y fecha de inicio son requeridos' });
    }

    // Verificar departamento si se proporciona
    if (departamentoId) {
      const departamento = await Departamento.findById(departamentoId);
      if (!departamento) {
        return res.status(400).json({ message: 'Departamento no encontrado' });
      }
    }

    const evento = new Evento({
      titulo,
      descripcion,
      fechaInicio: new Date(fechaInicio),
      fechaFin: fechaFin ? new Date(fechaFin) : null,
      tipo: tipo || 'otro',
      departamento: departamentoId || null,
      creadoPor: req.session.usuarioId,
      recordatorio: recordatorio === true
    });

    await evento.save();

    const eventoConPopulate = await Evento.findById(evento._id)
      .populate('creadoPor', 'nombre email')
      .populate('departamento', 'nombre');

    res.status(201).json({
      message: 'Evento creado exitosamente',
      evento: eventoConPopulate
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear evento', error: error.message });
  }
};

// Actualizar evento
exports.updateEvento = async (req, res) => {
  try {
    const eventoId = req.params.id;
    const { titulo, descripcion, fechaInicio, fechaFin, tipo, departamentoId, recordatorio } = req.body;

    const evento = await Evento.findById(eventoId);
    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Verificar permisos (solo el creador puede editar, o admin)
    // En una implementación real, aquí verificaríamos los permisos basado en rol y departamento
    if (evento.creadoPor.toString() !== req.session.usuarioId) {
      // Simplificado: solo el creador puede editar
      return res.status(403).json({ message: 'No tienes permiso para editar este evento' });
    }

    // Actualizar campos
    if (titulo) evento.titulo = titulo;
    if (descripcion !== undefined) evento.descripcion = descripcion;
    if (fechaInicio) evento.fechaInicio = new Date(fechaInicio);
    if (fechaFin !== undefined) evento.fechaFin = fechaFin ? new Date(fechaFin) : null;
    if (tipo) evento.tipo = tipo;
    if (departamentoId !== undefined) evento.departamento = departamentoId || null;
    if (recordatorio !== undefined) evento.recordatorio = recordatorio;

    await evento.save();

    const eventoActualizado = await Evento.findById(eventoId)
      .populate('creadoPor', 'nombre email')
      .populate('departamento', 'nombre');

    res.json({
      message: 'Evento actualizado exitosamente',
      evento: eventoActualizado
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar evento', error: error.message });
  }
};

// Eliminar evento (desactivar)
exports.deleteEvento = async (req, res) => {
  try {
    const eventoId = req.params.id;

    const evento = await Evento.findById(eventoId);
    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Verificar permisos (similar a update)
    if (evento.creadoPor.toString() !== req.session.usuarioId) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este evento' });
    }

    evento.activo = false;
    await evento.save();

    res.json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar evento', error: error.message });
  }
};

// Obtener eventos por departamento
exports.getEventosPorDepartamento = async (req, res) => {
  try {
    const { departamentoId } = req.params;
    const { limite = 5 } = req.query;

    const eventos = await Evento.find({
      departamento: departamentoId,
      activo: true
    })
    .populate('creadoPor', 'nombre email')
    .sort({ fechaInicio: 1 })
    .limit(parseInt(limite));

    res.json(eventos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener eventos por departamento', error: error.message });
  }
};

// Obtener próximos eventos (para el dashboard)
exports.getProximosEventos = async (req, res) => {
  try {
    const { departamentoId } = req.params;
    const { limite = 5 } = req.query;

    const ahora = new Date();

    const filtro = {
      activo: true,
      fechaInicio: { $gte: ahora }
    };

    if (departamentoId) {
      filtro.departamento = departamentoId;
    }

    const eventos = await Evento.find(filtro)
      .populate('creadoPor', 'nombre email')
      .populate('departamento', 'nombre')
      .sort({ fechaInicio: 1 })
      .limit(parseInt(limite));

    res.json(eventos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener próximos eventos', error: error.message });
  }
};