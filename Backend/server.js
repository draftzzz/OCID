const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 día
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 día
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Importar rutas
const authRoutes = require('./routes/auth');
const departamentoRoutes = require('./routes/departamentos');
const anuncioRoutes = require('./routes/anuncios');
const archivoRoutes = require('./routes/archivos');
const docenteRoutes = require('./routes/docentes');
const calendarioRoutes = require('./routes/calendario');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/departamentos', departamentoRoutes);
app.use('/api/anuncios', anuncioRoutes);
app.use('/api/archivos', archivoRoutes);
app.use('/api/docentes', docenteRoutes);
app.use('/api/calendario', calendarioRoutes);

// Ruta raíz - servir el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});