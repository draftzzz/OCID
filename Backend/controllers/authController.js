const Usuario = require('../models/User');
const Departamento = require('../models/Departamento');

// Registrar usuario
exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol, departamentoId } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Validar departamento si se proporciona
    if (departamentoId) {
      const departamento = await Departamento.findById(departamentoId);
      if (!departamento) {
        return res.status(400).json({ message: 'Departamento no encontrado' });
      }
    }

    // Crear nuevo usuario
    const usuario = new Usuario({
      nombre,
      email,
      password,
      rol,
      departamento: departamentoId || null
    });

    await usuario.save();

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        departamento: usuario.departamento
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email }).populate('departamento');
    if (!usuario) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Verificar password
    const esValido = await usuario.comparePassword(password);
    if (!esValido) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      return res.status(400).json({ message: 'Cuenta desactivada' });
    }

    // Guardar usuario en sesión
    req.session.usuarioId = usuario._id;
    req.session.usuario = {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      departamento: usuario.departamento ? {
        id: usuario.departamento._id,
        nombre: usuario.departamento.nombre
      } : null
    };

    res.json({
      message: 'Inicio de sesión exitoso',
      usuario: req.session.usuario
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesión cerrada exitosamente' });
  });
};

// Obtener usuario actual
exports.getCurrentUser = (req, res) => {
  if (!req.session.usuarioId) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  res.json({ usuario: req.session.usuario });
};

// Middleware de autenticación
exports.protect = async (req, res, next) => {
  try {
    if (!req.session.usuarioId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const usuario = await Usuario.findById(req.session.usuarioId);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ message: 'Usuario no válido' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Middleware para verificar roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.session.usuarioId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (!roles.includes(req.session.usuario.rol)) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    next();
  };
};