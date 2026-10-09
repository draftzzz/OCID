const express = require('express');
const router = express.Router();
const calendarioController = require('../controllers/calendarioController');
const authController = require('../controllers/authController');

// Todas las rutas requieren autenticación
router.use(authController.protect);

// Obtener todos los eventos (con filtros)
router.get('/', authController.authorize('administrador', 'jefe_departamento', 'docente'), calendarioController.getEventos);

// Obtener evento por ID
router.get('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), calendarioController.getEventoById);

// Crear nuevo evento
router.post('/', authController.authorize('administrador', 'jefe_departamento', 'docente'), calendarioController.createEvento);

// Actualizar evento
router.put('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), calendarioController.updateEvento);

// Eliminar evento
router.delete('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), calendarioController.deleteEvento);

// Obtener eventos por departamento
router.get('/departamento/:departamentoId', authController.authorize('administrador', 'jefe_departamento', 'docente'), calendarioController.getEventosPorDepartamento);

// Obtener próximos eventos (para dashboard)
router.get('/proximos/departamento/:departamentoId', authController.authorize('administrador', 'jefe_departamento', 'docente'), calendarioController.getProximosEventos);

module.exports = router;