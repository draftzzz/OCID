const Usuario = require('../models/User');
const Departamento = require('../models/Departamento');

// Obtener todos los docentes (con filtros opcionales)
exports.getDocentes = async (req, res) => {
  try {
    const { departamento, rol, pagina = 1, limite = 10 } = req.query;

    const filtro = { rol: 'docente', activo: true };

    if (departamento) filtro.departamento = departamento;
    // Nota: Ya filtramos por rol: 'docente', así que el parámetro rol sería para subcategorías si las tuviéramos

    const skip = (pagina - 1) * limite;

    const [docentes, total] = await Promise.all([
      Usuario.find(filtro)
        .populate('departamento', 'nombre')
        .select('nombre email departamento rol activo')
        .skip(skip)
        .limit(parseInt(limite)),
      Usuario.countDocuments(filtro)
    ]);

    res.json({
      docentes,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        paginas: Math.ceil(total / limite),
        limite: parseInt(limite)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener docentes', error: error.message });
  }
};

// Obtener docente por ID
exports.getDocenteById = async (req, res) => {
  try {
    const docente = await Usuario.findById(req.params.id)
      .populate('departamento', 'nombre')
      .select('nombre email departamento rol activo');

    if (!docente) {
      return res.status(404).json({ message: 'Docente no encontrado' });
    }

    if (docente.rol !== 'docente') {
      return res.status(404).json({ message: 'Usuario no es un docente' });
    }

    if (!docente.activo) {
      return res.status(404).json({ message: 'Docente no disponible' });
    }

    res.json(docente);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener docente', error: error.message });
  }
};

// Crear nuevo docente
exports.createDocente = async (req, res) => {
  try {
    const { nombre, email, password, departamentoId } = req.body;

    if (!nombre || !email || !password || !departamentoId) {
      return res.status(400).json({ message: 'Nombre, email, password y departamento son requeridos' });
    }

    // Verificar si el email ya existe
    const emailExistente = await Usuario.findOne({ email });
    if (emailExistente) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Verificar departamento
    const departamento = await Departamento.findById(departamentoId);
    if (!departamento) {
      return res.status(400).json({ message: 'Departamento no encontrado' });
    }

    // Crear nuevo docente
    const docente = new Usuario({
      nombre,
      email,
      password,
      rol: 'docente',
      departamento: departamentoId
    });

    await docente.save();

    const docenteConPopulate = await Usuario.findById(docente._id)
      .populate('departamento', 'nombre')
      .select('nombre email departamento rol activo');

    res.status(201).json({
      message: 'Docente registrado exitosamente',
      docente: docenteConPopulate
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear docente', error: error.message });
  }
};

// Actualizar docente
exports.updateDocente = async (req, res) => {
  try {
    const docenteId = req.params.id;
    const { nombre, email, departamentoId, activo } = req.body;

    const docente = await Usuario.findById(docenteId);
    if (!docente) {
      return res.status(404).json({ message: 'Docente no encontrado' });
    }

    if (docente.rol !== 'docente') {
      return res.status(400).json({ message: 'Usuario no es un docente' });
    }

    // Verificar email duplicado (excluyendo el docente actual)
    if (email && email !== docente.email) {
      const emailExistente = await Usuario.findOne({ email, _id: { $ne: docenteId } });
      if (emailExistente) {
        return res.status(400).json({ message: 'El email ya está registrado por otro usuario' });
      }
    }

    // Verificar departamento si se proporciona
    if (departamentoId) {
      const departamento = await Departamento.findById(departamentoId);
      if (!departamento) {
        return res.status(400).json({ message: 'Departamento no encontrado' });
      }
    }

    // Actualizar campos
    if (nombre) docente.nombre = nombre;
    if (email) docente.email = email;
    if (departamentoId !== undefined) docente.departamento = departamentoId;
    if (activo !== undefined) docente.activo = activo;

    // Si se cambió el password, encriptarlo
    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      docente.password = await bcrypt.hash(req.body.password, salt);
    }

    await docente.save();

    const docenteActualizado = await Usuario.findById(docenteId)
      .populate('departamento', 'nombre')
      .select('nombre email departamento rol activo');

    res.json({
      message: 'Docente actualizado exitosamente',
      docente: docenteActualizado
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar docente', error: error.message });
  }
};

// Eliminar docente (desactivar)
exports.deleteDocente = async (req, res) => {
  try {
    const docenteId = req.params.id;

    const docente = await Usuario.findById(docenteId);
    if (!docente) {
      return res.status(404).json({ message: 'Docente no encontrado' });
    }

    if (docente.rol !== 'docente') {
      return res.status(400).json({ message: 'Usuario no es un docente' });
    }

    // Verificar si tiene archivos subidos o anuncios creados
    const Archivo = require('../models/Archivo');
    const Anuncio = require('../models/Anuncio');

    const archivosCount = await Archivo.countDocuments({ subidoPor: docenteId, activo: true });
    const anunciosCount = await Anuncio.countDocuments({ autor: docenteId, activo: true });

    if (archivosCount > 0 || anunciosCount > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el docente porque tiene archivos o anuncios activos. Considere desactivar la cuenta en su lugar.'
      });
    }

    docente.activo = false;
    await docente.save();

    res.json({ message: 'Docente desactivado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar docente', error: error.message });
  }
};

// Obtener docentes por departamento
exports.getDocentesPorDepartamento = async (req, res) => {
  try {
    const { departamentoId } = req.params;

    const docentes = await Usuario.find({
      departamento: departamentoId,
      rol: 'docente',
      activo: true
    }).select('nombre email departamento rol activo');

    res.json(docentes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener docentes por departamento', error: error.message });
  }
};