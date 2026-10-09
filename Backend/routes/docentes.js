const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const authController = require('../controllers/authController');

// Todas las rutas requieren autenticación
router.use(authController.protect);

// Obtener todos los docentes (con filtros)
router.get('/', authController.authorize('administrador', 'jefe_departamento', 'docente'), docenteController.getDocentes);

// Obtener docente por ID
router.get('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), docenteController.getDocenteById);

// Crear nuevo docente (solo administrador)
router.post('/', authController.authorize('administrador'), docenteController.createDocente);

// Actualizar docente
router.put('/:id', authController.authorize('administrador', 'jefe_departamento'), docenteController.updateDocente);

// Eliminar docente (solo administrador)
router.delete('/:id', authController.authorize('administrador'), docenteController.deleteDocente);

// Obtener docentes por departamento
router.get('/departamento/:departamentoId', authController.authorize('administrador', 'jefe_departamento', 'docente'), docenteController.getDocentesPorDepartamento);

module.exports = router;