const Anuncio = require('../models/Anuncio');
const Usuario = require('../models/User');
const Departamento = require('../models/Departamento');

// Obtener todos los anuncios (con filtros opcionales)
exports.getAnuncios = async (req, res) => {
  try {
    const { departamento, importante, pagina = 1, limite = 10 } = req.query;

    const filtro = { activo: true };

    if (departamento) filtro.departamento = departamento;
    if (importante !== undefined) filtro.importante = importante === 'true';

    const skip = (pagina - 1) * limite;

    const [anuncios, total] = await Promise.all([
      Anuncio.find(filtro)
        .populate('autor', 'nombre email')
        .populate('departamento', 'nombre')
        .sort({ fechaPublicacion: -1 })
        .skip(skip)
        .limit(parseInt(limite)),
      Anuncio.countDocuments(filtro)
    ]);

    res.json({
      anuncios,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        paginas: Math.ceil(total / limite),
        limite: parseInt(limite)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener anuncios', error: error.message });
  }
};

// Obtener anuncio por ID
exports.getAnuncioById = async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id)
      .populate('autor', 'nombre email')
      .populate('departamento', 'nombre');

    if (!anuncio) {
      return res.status(404).json({ message: 'Anuncio no encontrado' });
    }

    if (!anuncio.activo) {
      return res.status(404).json({ message: 'Anuncio no disponible' });
    }

    res.json(anuncio);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener anuncio', error: error.message });
  }
};

// Crear nuevo anuncio
exports.createAnuncio = async (req, res) => {
  try {
    const { titulo, descripcion, departamentoId, fechaExpiracion, importante, prioridad } = req.body;

    if (!titulo || !descripcion || !departamentoId) {
      return res.status(400).json({ message: 'Título, descripción y departamento son requeridos' });
    }

    // Verificar departamento
    const departamento = await Departamento.findById(departamentoId);
    if (!departamento) {
      return res.status(400).json({ message: 'Departamento no encontrado' });
    }

    // Verificar que el usuario tenga permiso para crear anuncios en este departamento
    // (En una implementación real, verificaríamos que el usuario pertenezca al departamento o sea admin)

    const anuncio = new Anuncio({
      titulo,
      descripcion,
      departamento: departamentoId,
      autor: req.session.usuarioId,
      fechaExpiracion: fechaExpiracion ? new Date(fechaExpiracion) : undefined,
      importante: importante === true,
      prioridad: prioridad || 'media'
    });

    await anuncio.save();

    const anuncioConPopulate = await Anuncio.findById(anuncio._id)
      .populate('autor', 'nombre email')
      .populate('departamento', 'nombre');

    res.status(201).json({
      message: 'Anuncio creado exitosamente',
      anuncio: anuncioConPopulate
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear anuncio', error: error.message });
  }
};

// Actualizar anuncio
exports.updateAnuncio = async (req, res) => {
  try {
    const anuncioId = req.params.id;
    const { titulo, descripcion, fechaExpiracion, importante, prioridad } = req.body;

    const anuncio = await Anuncio.findById(anuncioId);
    if (!anuncio) {
      return res.status(404).json({ message: 'Anuncio no encontrado' });
    }

    // Verificar permisos (solo el autor puede editar, o admin/jefe de departamento)
    // En una implementación real, aquí verificaríamos los permisos
    if (anuncio.autor.toString() !== req.session.usuarioId) {
      // Para simplificar, en este ejemplo solo el autor puede editar
      // En producción, agregaríamos verificación de roles y departamentos
      return res.status(403).json({ message: 'No tienes permiso para editar este anuncio' });
    }

    // Actualizar campos
    if (titulo) anuncio.titulo = titulo;
    if (descripcion) anuncio.descripcion = descripcion;
    if (fechaExpiracion !== undefined) {
      anuncio.fechaExpiracion = fechaExpiracion ? new Date(fechaExpiracion) : null;
    }
    if (importante !== undefined) anuncio.importante = importante;
    if (prioridad) anuncio.prioridad = prioridad;

    await anuncio.save();

    const anuncioActualizado = await Anuncio.findById(anuncioId)
      .populate('autor', 'nombre email')
      .populate('departamento', 'nombre');

    res.json({
      message: 'Anuncio actualizado exitosamente',
      anuncio: anuncioActualizado
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar anuncio', error: error.message });
  }
};

// Eliminar anuncio (desactivar)
exports.deleteAnuncio = async (req, res) => {
  try {
    const anuncioId = req.params.id;

    const anuncio = await Anuncio.findById(anuncioId);
    if (!anuncio) {
      return res.status(404).json({ message: 'Anuncio no encontrado' });
    }

    // Verificar permisos (similar a update)
    if (anuncio.autor.toString() !== req.session.usuarioId) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este anuncio' });
    }

    anuncio.activo = false;
    await anuncio.save();

    res.json({ message: 'Anuncio eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar anuncio', error: error.message });
  }
};

// Obtener anuncios por departamento
exports.getAnunciosPorDepartamento = async (req, res) => {
  try {
    const { departamentoId } = req.params;
    const { limite = 5 } = req.query;

    const anuncios = await Anuncio.find({
      departamento: departamentoId,
      activo: true
    })
    .populate('autor', 'nombre email')
    .sort({ fechaPublicacion: -1 })
    .limit(parseInt(limite));

    res.json(anuncios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener anuncios por departamento', error: error.message });
  }
};