const Departamento = require('../models/Departamento');
const Usuario = require('../models/User');

// Obtener todos los departamentos
exports.getAllDepartamentos = async (req, res) => {
  try {
    const departamentos = await Departamento.find({ activo: true }).populate('jefe', 'nombre email');
    res.json(departamentos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener departamentos', error: error.message });
  }
};

// Obtener departamento por ID
exports.getDepartamentoById = async (req, res) => {
  try {
    const departamento = await Departamento.findById(req.params.id)
      .populate('jefe', 'nombre email')
      .populate({
        path: 'docentes',
        select: 'nombre email rol'
      });

    if (!departamento) {
      return res.status(404).json({ message: 'Departamento no encontrado' });
    }

    res.json(departamento);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener departamento', error: error.message });
  }
};

// Crear nuevo departamento
exports.createDepartamento = async (req, res) => {
  try {
    const { nombre, descripcion, jefeId } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del departamento es requerido' });
    }

    // Verificar si ya existe un departamento con ese nombre
    const departamentoExistente = await Departamento.findOne({ nombre });
    if (departamentoExistente) {
      return res.status(400).json({ message: 'Ya existe un departamento con ese nombre' });
    }

    // Validar jefe si se proporciona
    if (jefeId) {
      const jefe = await Usuario.findById(jefeId);
      if (!jefe) {
        return res.status(400).json({ message: 'Jefe no encontrado' });
      }
      if (jefe.rol !== 'jefe_departamento' && jefe.rol !== 'administrador') {
        return res.status(400).json({ message: 'El usuario seleccionado no puede ser jefe de departamento' });
      }
    }

    const departamento = new Departamento({
      nombre,
      descripcion,
      jefe: jefeId || null
    });

    await departamento.save();

    // Actualizar el rol del jefe si se asignó uno
    if (jefeId) {
      await Usuario.findByIdAndUpdate(jefeId, {
        rol: 'jefe_departamento',
        departamento: departamento._id
      });
    }

    const departamentoConPopulate = await Departamento.findById(departamento._id)
      .populate('jefe', 'nombre email');

    res.status(201).json({
      message: 'Departamento creado exitosamente',
      departamento: departamentoConPopulate
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear departamento', error: error.message });
  }
};

// Actualizar departamento
exports.updateDepartamento = async (req, res) => {
  try {
    const { nombre, descripcion, jefeId } = req.body;
    const departamentoId = req.params.id;

    const departamento = await Departamento.findById(departamentoId);
    if (!departamento) {
      return res.status(404).json({ message: 'Departamento no encontrado' });
    }

    // Verificar nombre duplicado (excluyendo el departamento actual)
    if (nombre && nombre !== departamento.nombre) {
      const departamentoExistente = await Departamento.findOne({ nombre, _id: { $ne: departamentoId } });
      if (departamentoExistente) {
        return res.status(400).json({ message: 'Ya existe un departamento con ese nombre' });
      }
    }

    // Validar jefe si se proporciona
    if (jefeId) {
      const jefe = await Usuario.findById(jefeId);
      if (!jefe) {
        return res.status(400).json({ message: 'Jefe no encontrado' });
      }
      if (jefe.rol !== 'jefe_departamento' && jefe.rol !== 'administrador') {
        return res.status(400).json({ message: 'El usuario seleccionado no puede ser jefe de departamento' });
      }
    }

    // Actualizar campos
    if (nombre) departamento.nombre = nombre;
    if (descripcion !== undefined) departamento.descripcion = descripcion;
    if (jefeId !== undefined) departamento.jefe = jefeId;

    await departamento.save();

    // Manejar cambios en el jefe
    if (jefeId !== undefined) {
      // Quitar rol de jefe al departamento anterior si había uno
      if (departamento.jefe && departamento.jefe.toString() !== jefeId) {
        await Usuario.findByIdAndUpdate(departamento.jefe, {
          $unset: { rol: '' },
          departamento: null
        });
      }

      // Asignar rol de jefe al nuevo jefe
      if (jefeId) {
        await Usuario.findByIdAndUpdate(jefeId, {
          rol: 'jefe_departamento',
          departamento: departamentoId
        });
      }
    }

    const departamentoActualizado = await Departamento.findById(departamentoId)
      .populate('jefe', 'nombre email');

    res.json({
      message: 'Departamento actualizado exitosamente',
      departamento: departamentoActualizado
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar departamento', error: error.message });
  }
};

// Eliminar departamento (desactivar)
exports.deleteDepartamento = async (req, res) => {
  try {
    const departamentoId = req.params.id;

    const departamento = await Departamento.findById(departamentoId);
    if (!departamento) {
      return res.status(404).json({ message: 'Departamento no encontrado' });
    }

    // Verificar si tiene docentes asignados
    const docentesCount = await Usuario.countDocuments({ departamento: departamentoId });
    if (docentesCount > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el departamento porque tiene docentes asignados'
      });
    }

    // Desactivar en lugar de eliminar completamente
    departamento.activo = false;
    await departamento.save();

    // Desactivar jefe si existe
    if (departamento.jefe) {
      await Usuario.findByIdAndUpdate(departamento.jefe, {
        activo: false
      });
    }

    res.json({ message: 'Departamento desactivado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar departamento', error: error.message });
  }
};

// Obtener docentes de un departamento
exports.getDocentesPorDepartamento = async (req, res) => {
  try {
    const { departamentoId } = req.params;

    const docentes = await Usuario.find({
      departamento: departamentoId,
      rol: 'docente',
      activo: true
    }).select('nombre email rol activo');

    res.json(docentes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener docentes', error: error.message });
  }
};