const express = require('express');
const router = express.Router();
const anuncioController = require('../controllers/anuncioController');
const authController = require('../controllers/authController');

// Todas las rutas requieren autenticación
router.use(authController.protect);

// Obtener todos los anuncios (con filtros)
router.get('/', authController.authorize('administrador', 'jefe_departamento', 'docente'), anuncioController.getAnuncios);

// Obtener anuncio por ID
router.get('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), anuncioController.getAnuncioById);

// Crear nuevo anuncio
router.post('/', authController.authorize('administrador', 'jefe_departamento', 'docente'), anuncioController.createAnuncio);

// Actualizar anuncio
router.put('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), anuncioController.updateAnuncio);

// Eliminar anuncio
router.delete('/:id', authController.authorize('administrador', 'jefe_departamento', 'docente'), anuncioController.deleteAnuncio);

// Obtener anuncios por departamento
router.get('/departamento/:departamentoId', authController.authorize('administrador', 'jefe_departamento', 'docente'), anuncioController.getAnunciosPorDepartamento);

module.exports = router;