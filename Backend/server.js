
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'https://ocid-iota.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// COMPROBAR SERVIDOR
app.get('/health', (req, res) => {
  res.json({
    success: true,
    mensaje: 'OCID API funcionando'
  });
});

// COMPROBAR BASE DE DATOS
app.get('/db-test', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      success: true,
      mensaje: 'Conexión a Neon correcta'
    });
  } catch (error) {
    console.error('Error de base de datos:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudo conectar con la base de datos'
    });
  }
});

// INICIAR SESIÓN
app.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      success: false,
      error: 'Correo y contraseña son obligatorios'
    });
  }

  try {
    const resultado = await pool.query(
      `SELECT id, nombre, correo, rol, departamento_id
       FROM usuarios
       WHERE correo = $1 AND password = $2
       LIMIT 1`,
      [correo.trim(), password]
    );

    if (resultado.rowCount === 0) {
      return res.status(401).json({
        success: false,
        error: 'Correo o contraseña incorrectos'
      });
    }

    res.json({
      success: true,
      usuario: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error en login:', error.message);

    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión'
    });
  }
});

// OBTENER USUARIOS
app.get('/usuarios', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         u.id,
         u.nombre,
         u.correo,
         u.rol,
         u.departamento_id,
         d.nombre AS departamento_nombre
       FROM usuarios u
       LEFT JOIN departamentos d
         ON d.id = u.departamento_id
       ORDER BY u.id DESC`
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error('Error al consultar usuarios:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudieron cargar los usuarios'
    });
  }
});

// REGISTRAR USUARIO
app.post('/registro', async (req, res) => {
  const { nombre, correo, password, rol } = req.body;

  if (!nombre || !correo || !password) {
    return res.status(400).json({
      success: false,
      error: 'Nombre, correo y contraseña son obligatorios'
    });
  }

  try {
    const existente = await pool.query(
      'SELECT id FROM usuarios WHERE correo = $1 LIMIT 1',
      [correo.trim()]
    );

    if (existente.rowCount > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ese correo ya está registrado'
      });
    }

    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, correo, rol, departamento_id`,
      [
        nombre.trim(),
        correo.trim(),
        password,
        rol || 'Docente'
      ]
    );

    res.status(201).json({
      success: true,
      usuario: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudo registrar el usuario. Revisa las columnas de la tabla.'
    });
  }
});

// ELIMINAR USUARIO
app.delete('/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: 'ID de usuario inválido'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const usuarioExiste = await client.query(
      'SELECT id FROM usuarios WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (usuarioExiste.rowCount === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        error: 'El usuario no existe'
      });
    }

    const anuncios = await client.query(
      'SELECT id FROM anuncios WHERE autor_id = $1 LIMIT 1',
      [id]
    );

    if (anuncios.rowCount > 0) {
      await client.query('ROLLBACK');

      return res.status(409).json({
        success: false,
        error: 'Este usuario tiene anuncios publicados. Elimina primero sus anuncios.'
      });
    }

    const departamentos = await client.query(
      'SELECT id FROM departamentos WHERE jefe_id = $1 LIMIT 1',
      [id]
    );

    if (departamentos.rowCount > 0) {
      await client.query('ROLLBACK');

      return res.status(409).json({
        success: false,
        error: 'Este usuario es jefe de un departamento. Cambia primero el jefe asignado.'
      });
    }

    await client.query(
      'DELETE FROM usuarios WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');

    res.json({ success: true });

  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Error al eliminar usuario:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudo eliminar el usuario'
    });
  } finally {
    client.release();
  }
});

// OBTENER ANUNCIOS
app.get('/anuncios', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         a.id,
         a.titulo,
         a.contenido,
         a.prioridad,
         a.fecha,
         a.autor_id,
         a.departamento_id,
         u.nombre AS autor_nombre
       FROM anuncios a
       LEFT JOIN usuarios u
         ON u.id = a.autor_id
       ORDER BY a.fecha DESC, a.id DESC`
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error('Error al consultar anuncios:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudieron cargar los anuncios'
    });
  }
});

// PUBLICAR ANUNCIO
app.post('/anuncios', async (req, res) => {
  const {
    titulo,
    contenido,
    prioridad,
    autor_id,
    departamento_id
  } = req.body;

  if (!titulo || !contenido) {
    return res.status(400).json({
      success: false,
      error: 'El título y el contenido son obligatorios'
    });
  }

  const autorId = Number(autor_id);

  if (!Number.isInteger(autorId) || autorId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'El autor del anuncio no es válido. Inicia sesión nuevamente.'
    });
  }

  try {
    const usuarioExiste = await pool.query(
      'SELECT id FROM usuarios WHERE id = $1',
      [autorId]
    );

    if (usuarioExiste.rowCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'El usuario autor ya no existe. Inicia sesión nuevamente.'
      });
    }

    let departamentoId = null;

    if (departamento_id !== null &&
        departamento_id !== undefined &&
        departamento_id !== '') {
      departamentoId = Number(departamento_id);

      if (!Number.isInteger(departamentoId) || departamentoId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El departamento no es válido'
        });
      }
    }

    const resultado = await pool.query(
      `INSERT INTO anuncios
         (titulo, contenido, prioridad, autor_id, departamento_id, fecha)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        titulo.trim(),
        contenido.trim(),
        prioridad || 'Informativo',
        autorId,
        departamentoId
      ]
    );

    res.status(201).json({
      success: true,
      anuncio: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error al publicar anuncio:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudo publicar el anuncio'
    });
  }
});

// ELIMINAR ANUNCIO
app.delete('/anuncios/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: 'ID de anuncio inválido'
    });
  }

  try {
    const resultado = await pool.query(
      'DELETE FROM anuncios WHERE id = $1 RETURNING id',
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'El anuncio no existe'
      });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error al eliminar anuncio:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudo eliminar el anuncio'
    });
  }
});

// OBTENER DEPARTAMENTOS
app.get('/departamentos', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
         d.id,
         d.nombre,
         d.descripcion,
         d.jefe_id,
         u.nombre AS nombre_jefe
       FROM departamentos d
       LEFT JOIN usuarios u
         ON u.id = d.jefe_id
       ORDER BY d.id`
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error('Error al consultar departamentos:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudieron cargar los departamentos'
    });
  }
});

// ERRORES DE RUTAS NO EXISTENTES
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor OCID funcionando en el puerto ${PORT}`);
});
