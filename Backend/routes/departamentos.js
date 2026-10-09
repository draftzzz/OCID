const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');
const authController = require('../controllers/authController');

// Todas las rutas requieren autenticación
router.use(authController.protect);

// Obtener todos los departamentos
router.get('/', authController.authorize('administrador', 'jefe_departamento', 'docente'), departamentoController.getAllDepartamentos);

// Obtener departamento por ID
router.get('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), departamentoController.getDepartamentoById);

// Crear nuevo departamento (solo administrador)
router.post('/', authController.authorize('administrador'), departamentoController.createDepartamento);

// Actualizar departamento (solo administrador)
router.put('/:id', authController.authorize('administrador'), departamentoController.updateDepartamento);

// Eliminar departamento (solo administrador)
router.delete('/:id', authController.authorize('administrador'), departamentoController.deleteDepartamento);

// Obtener docentes de un departamento
router.get('/:id/docentes', authController.authorize('administrador', 'jefe_departamento', 'docente'), departamentoController.getDocentesPorDepartamento);

module.exports = router;