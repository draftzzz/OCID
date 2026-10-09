const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registrar usuario
router.post('/register', authController.register);

// Iniciar sesión
router.post('/login', authController.login);

// Cerrar sesión
router.post('/logout', authController.logout);

// Obtener usuario actual
router.get('/me', authController.protect, authController.getCurrentUser);

module.exports = router;