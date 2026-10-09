const express = require('express');
const router = express.Router();
const archivoController = require('../controllers/archivoController');
const authController = require('../controllers/authController');

// Todas las rutas requieren autenticación
router.use(authController.protect);

// Subir archivo
router.post('/upload', authController.authorize('administrador', 'jefe_departamento', 'docente'), archivoController.uploadArchivo);

// Obtener todos los archivos (con filtros)
router.get('/', authController.authorize('administrador', 'jefe_departamento', 'docente'), archivoController.getArchivos);

// Obtener archivo por ID
router.get('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), archivoController.getArchivoById);

// Descargar archivo
router.get('/:id/download', authController.authorize('administrador', 'jefe_departamento', 'docente'), archivoController.descargarArchivo);

// Eliminar archivo
router.delete('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), archivoController.deleteArchivo);

// Obtener archivos por departamento
router.get('/departamento/:departamentoId', authController.authorize('administrador', 'jefe_departamento', 'docente'), archivoController.getArchivosPorDepartamento);

module.exports = router;