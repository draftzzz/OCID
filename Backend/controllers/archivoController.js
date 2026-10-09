const Archivo = require('../models/Archivo');
const Usuario = require('../models/User');
const Departamento = require('../models/Departamento');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'frontend', 'uploads');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

// Subir archivo
exports.uploadArchivo = [
  upload.single('archivo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const { departamentoId, categoria } = req.body;

      if (!departamentoId) {
        // Eliminar archivo subido si no se proporciona departamento
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'El departamento es requerido' });
      }

      // Verificar departamento
      const departamento = await Departamento.findById(departamentoId);
      if (!departamento) {
        // Eliminar archivo subido si el departamento no existe
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Departamento no encontrado' });
      }

      // Verificar que el usuario tenga permiso para subir archivos a este departamento
      // (En una implementación real, verificaríamos pertenencia al departamento o permisos)

      const archivo = new Archivo({
        nombre: req.file.filename,
        nombreOriginal: req.file.originalname,
        tipo: req.file.mimetype,
        tamaño: req.file.size,
        ruta: path.join('uploads', req.file.filename),
        departamento: departamentoId,
        subidoPor: req.session.usuarioId,
        categoria: categoria || null
      });

      await archivo.save();

      const archivoConPopulate = await Archivo.findById(archivo._id)
        .populate('subidoPor', 'nombre email')
        .populate('departamento', 'nombre');

      res.status(201).json({
        message: 'Archivo subido exitosamente',
        archivo: archivoConPopulate
      });
    } catch (error) {
      // Eliminar archivo si hubo error en la base de datos
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Error al subir archivo', error: error.message });
    }
  }
];

// Obtener todos los archivos (con filtros opcionales)
exports.getArchivos = async (req, res) => {
  try {
    const { departamento, categoria, pagina = 1, limite = 10 } = req.query;

    const filtro = { activo: true };

    if (departamento) filtro.departamento = departamento;
    if (categoria) filtro.categoria = categoria;

    const skip = (pagina - 1) * limite;

    const [archivos, total] = await Promise.all([
      Archivo.find(filtro)
        .populate('subidoPor', 'nombre email')
        .populate('departamento', 'nombre')
        .sort({ fechaSubida: -1 })
        .skip(skip)
        .limit(parseInt(limite)),
      Archivo.countDocuments(filtro)
    ]);

    res.json({
      archivos,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        paginas: Math.ceil(total / limite),
        limite: parseInt(limite)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener archivos', error: error.message });
  }
};

// Obtener archivo por ID
exports.getArchivoById = async (req, res) => {
  try {
    const archivo = await Archivo.findById(req.params.id)
      .populate('subidoPor', 'nombre email')
      .populate('departamento', 'nombre');

    if (!archivo) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    if (!archivo.activo) {
      return res.status(404).json({ message: 'Archivo no disponible' });
    }

    res.json(archivo);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener archivo', error: error.message });
  }
};

// Descargar archivo
exports.descargarArchivo = async (req, res) => {
  try {
    const archivo = await Archivo.findById(req.params.id);

    if (!archivo) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    if (!archivo.activo) {
      return res.status(404).json({ message: 'Archivo no disponible' });
    }

    const filePath = path.join(__dirname, '..', '..', 'frontend', archivo.ruta);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo físico no encontrado' });
    }

    res.download(filePath, archivo.nombreOriginal);
  } catch (error) {
    res.status(500).json({ message: 'Error al descargar archivo', error: error.message });
  }
};

// Eliminar archivo (desactivar)
exports.deleteArchivo = async (req, res) => {
  try {
    const archivoId = req.params.id;

    const archivo = await Archivo.findById(archivoId);
    if (!archivo) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    // Verificar permisos (similar a otros controladores)
    if (archivo.subidoPor.toString() !== req.session.usuarioId) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este archivo' });
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '..', '..', 'frontend', archivo.ruta);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Desactivar en base de datos
    archivo.activo = false;
    await archivo.save();

    res.json({ message: 'Archivo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar archivo', error: error.message });
  }
};

// Obtener archivos por departamento
exports.getArchivosPorDepartamento = async (req, res) => {
  try {
    const { departamentoId } = req.params;
    const { limite = 5 } = req.query;

    const archivos = await Archivo.find({
      departamento: departamentoId,
      activo: true
    })
    .populate('subidoPor', 'nombre email')
    .sort({ fechaSubida: -1 })
    .limit(parseInt(limite));

    res.json(archivos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener archivos por departamento', error: error.message });
  }
};