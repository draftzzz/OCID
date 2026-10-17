// server.js - Backend Express + PostgreSQL (psql)
// Conexión real a base de datos sin datos falsos
// ==========================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión PostgreSQL (pon tu DATABASE_URL en tu archivo .env o usa esta)
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/ocid_db',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Probar conexión a Postgres al arrancar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error crítico al conectar a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado exitosamente a PostgreSQL (Base de datos real)');
    release();
  }
});

// ==========================================
// 1. ENDPOINTS DE USUARIOS (REGISTRO Y LISTA)
// ==========================================

// Obtener todos los usuarios reales de la tabla
app.get('/api/usuarios', async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.nombre, u.correo, u.rol, u.departamento_id,
             COALESCE(d.nombre, 'Sin Asignar') as departamento_nombre
      FROM usuarios u
      LEFT JOIN departamentos d ON u.departamento_id = d.id
      ORDER BY u.id DESC
    `;
    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error al consultar usuarios en psql:', err.message);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// Registrar un usuario real en la base de datos
app.post('/api/usuarios', async (req, res) => {
  const { nombre, correo, password, rol, departamento_id } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
  }

  try {
    const insertQuery = `
      INSERT INTO usuarios (nombre, correo, password, rol, departamento_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, correo, rol, departamento_id
    `;
    const resultado = await pool.query(insertQuery, [
      nombre.trim(),
      correo.trim().toLowerCase(),
      password,
      rol || 'Docente',
      departamento_id ? parseInt(departamento_id) : null,
    ]);

    res.status(201).json({ success: true, usuario: resultado.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Este correo electrónico ya existe en la base de datos' });
    }
    console.error('Error al insertar usuario:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ENDPOINTS DE DEPARTAMENTOS
// ==========================================

app.get('/api/departamentos', async (req, res) => {
  try {
    const query = `
      SELECT d.id, d.nombre, d.descripcion, d.jefe_id,
             COALESCE(u.nombre, 'Sin jefe asignado') as nombre_jefe
      FROM departamentos d
      LEFT JOIN usuarios u ON d.jefe_id = u.id
      ORDER BY d.id ASC
    `;
    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error al consultar departamentos:', err.message);
    res.status(500).json({ error: 'Error al consultar departamentos' });
  }
});

// ==========================================
// 3. ENDPOINTS DE ANUNCIOS (PUBLICAR Y VER)
// ==========================================

// Obtener todos los anuncios emitidos
app.get('/api/anuncios', async (req, res) => {
  try {
    const query = `
      SELECT a.id, a.titulo, a.contenido, a.prioridad, a.fecha,
             u.nombre as autor_nombre,
             COALESCE(d.nombre, 'General') as departamento_nombre
      FROM anuncios a
      LEFT JOIN usuarios u ON a.autor_id = u.id
      LEFT JOIN departamentos d ON a.departamento_id = d.id
      ORDER BY a.id DESC
    `;
    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error al consultar anuncios:', err.message);
    res.status(500).json({ error: 'Error al consultar anuncios' });
  }
});

// Crear un nuevo anuncio real visible para todos
app.post('/api/anuncios', async (req, res) => {
  const { titulo, contenido, prioridad, autor_id, departamento_id } = req.body;

  if (!titulo || !contenido) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  }

  try {
    const insertQuery = `
      INSERT INTO anuncios (titulo, contenido, prioridad, autor_id, departamento_id, fecha)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const resultado = await pool.query(insertQuery, [
      titulo.trim(),
      contenido.trim(),
      prioridad || 'Informativo',
      autor_id ? parseInt(autor_id) : null,
      departamento_id ? parseInt(departamento_id) : null,
    ]);

    res.status(201).json({ success: true, anuncio: resultado.rows[0] });
  } catch (err) {
    console.error('Error al insertar anuncio:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ENDPOINTS DE ARCHIVOS Y NOTIFICACIONES
// ==========================================

app.get('/api/archivos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM archivos ORDER BY id DESC');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notificaciones', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM notificaciones ORDER BY id DESC');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. RUTAS DE AUTENTICACIÓN
// ==========================================

// Registro desde frontend público
app.post('/registro', async (req, res) => {
  const { nombre, email, contrasena } = req.body;

  if (!nombre || !email || !contrasena) {
    return res.status(400).json({ success: false, error: 'Todos los campos son obligatorios' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, rol)
       VALUES ($1, $2, $3, 'Docente')
       RETURNING id, nombre, correo, rol`,
      [nombre.trim(), email.trim().toLowerCase(), contrasena]
    );

    return res.status(201).json({ success: true, usuario: resultado.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Este correo electrónico ya se encuentra registrado' });
    }
    console.error('Error en /registro:', err.message);
    return res.status(500).json({ success: false, error: 'Error en la base de datos' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res.status(400).json({ success: false, error: 'Debe ingresar correo y contraseña' });
  }

  try {
    const resultado = await pool.query(
      `SELECT id, nombre, correo, rol, departamento_id
       FROM usuarios
       WHERE LOWER(correo) = LOWER($1) AND password = $2`,
      [email.trim(), contrasena]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    return res.json({ success: true, usuario: resultado.rows[0] });
  } catch (err) {
    console.error('Error en /login:', err.message);
    return res.status(500).json({ success: false, error: 'Error en el servidor al autenticar' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor en línea en http://localhost:${PORT}`);
});