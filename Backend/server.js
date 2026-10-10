const express = require('express');
const cors = require('cors');
const sessionConfig = require('./config/session');
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // In production, replace with your frontend domain
  credentials: true
}));
app.use(express.json());
app.use(sessionConfig);

// Routes

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, contrasena } = req.body;

  // Basic validation
  if (!nombre || !email || !contrasena) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    // Insert user
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, contrasena) VALUES ($1, $2, $3) RETURNING id_usuario, nombre, email',
      [nombre, email, hashedPassword]
    );

    const user = result.rows[0];

    // Remove password from user object
    delete user.contrasena;

    // Set session
    req.session.userId = user.id_usuario;
    req.session.user = user;

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  try {
    // Find user by email
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Remove password from user object
    const { contrasena: _, ...userWithoutPassword } = user;

    // Set session
    req.session.userId = user.id_usuario;
    req.session.user = userWithoutPassword;

    res.json({
      message: 'Inicio de sesión exitoso',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Logout user
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid'); // Adjust if you changed the cookie name
    res.json({ message: 'Sesión cerrada exitosamente' });
  });
});

// Get current user (for checking auth state)
app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  res.json({ user: req.session.user });
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});