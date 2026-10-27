
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin(origin, callback) {
    const origenPermitido = !origin ||
      [
        'https://ocid-iota.vercel.app',
        'https://ocid.vercel.app',
        'https://ocid.onrender.com'
      ].includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    callback(null, origenPermitido);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));

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
    console.error('Error de base de datos:', {
      name: error.name,
      code: error.code,
      message: error.message || 'Sin detalle del controlador PostgreSQL'
    });

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
app.get('/login', async (req, res) => {
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

// ACTUALIZAR PERFIL DE USUARIO
app.put('/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, correo, departamento_id } = req.body;

  if (!Number.isInteger(id) || id <= 0 ||
      typeof nombre !== 'string' || !nombre.trim() ||
      typeof correo !== 'string' || !correo.trim() ||
      (departamento_id !== null && departamento_id !== undefined &&
       (!Number.isInteger(Number(departamento_id)) || Number(departamento_id) <= 0))) {
    return res.status(400).json({
      success: false,
      error: 'Los datos del perfil no son válidos'
    });
  }

  try {
    const departamentoId = departamento_id ? Number(departamento_id) : null;
    if (departamentoId) {
      const departamento = await pool.query('SELECT id FROM departamentos WHERE id = $1', [departamentoId]);
      if (departamento.rowCount === 0) {
        return res.status(400).json({ success: false, error: 'El departamento no existe' });
      }
    }
    const resultado = await pool.query(
      `UPDATE usuarios
       SET nombre = $1, correo = $2, departamento_id = $3
       WHERE id = $4
       RETURNING id, nombre, correo, rol, departamento_id`,
      [nombre.trim(), correo.trim(), departamentoId, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'El usuario no existe' });
    }

    res.json({ success: true, usuario: resultado.rows[0] });
  } catch (error) {
    console.error('Error al actualizar perfil:', error.message);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Ese correo ya está registrado' });
    }
    res.status(500).json({ success: false, error: 'No se pudo actualizar el perfil' });
  }
});

// CAMBIAR CONTRASEÑA
app.patch('/usuarios/:id/password', async (req, res) => {
  const id = Number(req.params.id);
  const { password_actual, password_nueva } = req.body;

  if (!Number.isInteger(id) || id <= 0 || !password_actual ||
      typeof password_nueva !== 'string' || password_nueva.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Ingresa la contraseña actual y una nueva contraseña de al menos 6 caracteres'
    });
  }

  try {
    const resultado = await pool.query(
      `UPDATE usuarios
       SET password = $1
       WHERE id = $2 AND password = $3
       RETURNING id`,
      [password_nueva, id, password_actual]
    );
    if (resultado.rowCount === 0) {
      const usuario = await pool.query('SELECT id FROM usuarios WHERE id = $1', [id]);
      return res.status(usuario.rowCount ? 401 : 404).json({
        success: false,
        error: usuario.rowCount ? 'La contraseña actual es incorrecta' : 'El usuario no existe'
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error.message);
    res.status(500).json({ success: false, error: 'No se pudo cambiar la contraseña' });
  }
});

// REGISTRAR USUARIO
app.post('/registro', async (req, res) => {
  const { nombre, correo, password, rol, departamento, departamento_id } = req.body;

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

    let departamentoId = null;
    if (departamento_id !== undefined && departamento_id !== null && departamento_id !== '') {
      departamentoId = Number(departamento_id);
      if (!Number.isInteger(departamentoId) || departamentoId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'El departamento no es válido'
        });
      }
      const departamentoExiste = await pool.query(
        'SELECT id FROM departamentos WHERE id = $1',
        [departamentoId]
      );
      if (departamentoExiste.rowCount === 0) {
        return res.status(400).json({
          success: false,
          error: 'El departamento seleccionado no existe'
        });
      }
    } else if (departamento) {
      const resultadoDepartamento = await pool.query(
        'SELECT id FROM departamentos WHERE nombre = $1 LIMIT 1',
        [String(departamento).trim()]
      );

      if (resultadoDepartamento.rowCount === 0) {
        return res.status(400).json({
          success: false,
          error: 'El departamento seleccionado no existe'
        });
      }

      departamentoId = resultadoDepartamento.rows[0].id;
    }

    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, rol, departamento_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, correo, rol, departamento_id`,
      [
        nombre.trim(),
        correo.trim(),
        password,
        rol || 'Docente',
        departamentoId
      ]
    );

    res.status(201).json({
      success: true,
      usuario: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error.message);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Ese correo ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      error: 'No se pudo registrar el usuario. Revisa las columnas de la tabla.'
    });
  }
});

// ELIMINAR USUARIO
app.delete('/login/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: 'ID de usuario inválido'
    });
  }

  let client;
  let transaccionIniciada = false;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    transaccionIniciada = true;

    const usuarioExiste = await client.query(
      'SELECT id FROM usuarios WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (usuarioExiste.rowCount === 0) {
      await client.query('ROLLBACK');
      transaccionIniciada = false;

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
      transaccionIniciada = false;

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
      transaccionIniciada = false;

      return res.status(409).json({
        success: false,
        error: 'Este usuario es jefe de un departamento. Cambia primero el jefe asignado.'
      });
    }

    const archivos = await client.query(
      'SELECT id FROM archivos WHERE autor_id = $1 LIMIT 1',
      [id]
    );

    if (archivos.rowCount > 0) {
      await client.query('ROLLBACK');
      transaccionIniciada = false;

      return res.status(409).json({
        success: false,
        error: 'Este usuario tiene archivos publicados. Elimínalos o reasígnalos antes de eliminarlo.'
      });
    }

    await client.query('DELETE FROM notificaciones WHERE usuario_id = $1', [id]);
    await client.query(
      'DELETE FROM usuarios WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');
    transaccionIniciada = false;

    res.json({ success: true });

  } catch (error) {
    if (client && transaccionIniciada) {
      try {
        await client.query('ROLLBACK');
      } catch (errorRollback) {
        console.error('Error al revertir la eliminación de usuario:', errorRollback.message);
      }
    }

    console.error('Error al eliminar usuario:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudo eliminar el usuario'
    });
  } finally {
    if (client) client.release();
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
         u.nombre AS autor_nombre,
         d.nombre AS departamento_nombre
       FROM anuncios a
       LEFT JOIN usuarios u
         ON u.id = a.autor_id
       LEFT JOIN departamentos d
         ON d.id = a.departamento_id
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

    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const resultado = await cliente.query(
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

      await cliente.query(
        `INSERT INTO notificaciones (usuario_id, anuncio_id, leida, fecha)
         SELECT id, $1, FALSE, NOW()
         FROM usuarios
         WHERE id <> $2`,
        [resultado.rows[0].id, autorId]
      );
      await cliente.query('COMMIT');

      res.status(201).json({
        success: true,
        anuncio: resultado.rows[0]
      });
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }

  } catch (error) {
    console.error('Error al publicar anuncio:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudo publicar el anuncio'
    });
  }
});

    // OBTENER ARCHIVOS
    app.get('/archivos', async (req, res) => {
      try {
        const resultado = await pool.query(
          `SELECT a.id, a.nombre, a.tipo, a."tamaño" AS tamano,
                  a.autor_id, a.departamento_id, a.anuncio_id, a.fecha,
                  u.nombre AS autor_nombre, d.nombre AS departamento_nombre
           FROM archivos a
           LEFT JOIN usuarios u ON u.id = a.autor_id
           LEFT JOIN departamentos d ON d.id = a.departamento_id
           ORDER BY a.fecha DESC, a.id DESC`
        );
        res.json(resultado.rows);
      } catch (error) {
        console.error('Error al consultar archivos:', error.message);
        res.status(500).json({ success: false, error: 'No se pudieron cargar los archivos' });
      }
    });

    // SUBIR ARCHIVO EN LA COLUMNA ruta (CONTENIDO DATA URL)
    app.post('/archivos', async (req, res) => {
      const { nombre, contenido, tipo, tamano, autor_id, departamento_id } = req.body;
      const autorId = Number(autor_id);
      const departamentoId = Number(departamento_id);

      if (typeof nombre !== 'string' || !nombre.trim() ||
          typeof contenido !== 'string' || !tipo ||
          !Number.isInteger(autorId) || autorId <= 0 ||
          !Number.isInteger(departamentoId) || departamentoId <= 0 ||
          !Number.isInteger(Number(tamano)) || Number(tamano) <= 0) {
        return res.status(400).json({ success: false, error: 'Completa los datos del archivo' });
      }
      if (Number(tamano) > 10 * 1024 * 1024) {
        return res.status(413).json({ success: false, error: 'El archivo supera el límite de 10 MB' });
      }
      const contenidoCoincide = typeof contenido === 'string' &&
        /^data:([\w.+/-]+);base64,([A-Za-z0-9+/]+=*)$/.exec(contenido);
      if (!contenidoCoincide) {
        return res.status(400).json({ success: false, error: 'El contenido del archivo no es válido' });
      }
      const contenidoBinario = Buffer.from(contenidoCoincide[2], 'base64');
      if (contenidoCoincide[1] !== tipo || contenidoBinario.length !== Number(tamano)) {
        return res.status(400).json({ success: false, error: 'El tipo o tamaño del archivo no coincide' });
      }

      try {
        const [usuarioExiste, departamentoExiste] = await Promise.all([
          pool.query('SELECT id FROM usuarios WHERE id = $1', [autorId]),
          pool.query('SELECT id FROM departamentos WHERE id = $1', [departamentoId])
        ]);
        if (!usuarioExiste.rowCount || !departamentoExiste.rowCount) {
          return res.status(400).json({ success: false, error: 'El usuario o departamento no existe' });
        }
        const resultado = await pool.query(
          `INSERT INTO archivos
             (nombre, ruta, tipo, "tamaño", autor_id, departamento_id, anuncio_id, fecha)
           VALUES ($1, $2, $3, $4, $5, $6, NULL, NOW())
           RETURNING id, nombre, tipo, "tamaño" AS tamano, autor_id, departamento_id, fecha`,
          [nombre.trim(), contenido, tipo, Number(tamano), autorId, departamentoId]
        );
        res.status(201).json({ success: true, archivo: resultado.rows[0] });
      } catch (error) {
        console.error('Error al guardar archivo:', error.message);
        res.status(500).json({ success: false, error: 'No se pudo guardar el archivo' });
      }
    });

    // DESCARGAR ARCHIVO
    app.get('/archivos/:id', async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, error: 'ID de archivo inválido' });
      }
      try {
        const resultado = await pool.query(
          'SELECT nombre, ruta, tipo FROM archivos WHERE id = $1',
          [id]
        );
        if (resultado.rowCount === 0) {
          return res.status(404).json({ success: false, error: 'El archivo no existe' });
        }
        res.json({ success: true, archivo: resultado.rows[0] });
      } catch (error) {
        console.error('Error al descargar archivo:', error.message);
        res.status(500).json({ success: false, error: 'No se pudo descargar el archivo' });
      }
    });

    // ELIMINAR ARCHIVO
    app.delete('/archivos/:id', async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, error: 'ID de archivo inválido' });
      }
      try {
        const resultado = await pool.query('DELETE FROM archivos WHERE id = $1 RETURNING id', [id]);
        if (resultado.rowCount === 0) {
          return res.status(404).json({ success: false, error: 'El archivo no existe' });
        }
        res.json({ success: true });
      } catch (error) {
        console.error('Error al eliminar archivo:', error.message);
        res.status(500).json({ success: false, error: 'No se pudo eliminar el archivo' });
      }
    });

    // OBTENER NOTIFICACIONES DE UN USUARIO
    app.get('/notificaciones', async (req, res) => {
      const usuarioId = Number(req.query.usuario_id);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
      }
      try {
        const resultado = await pool.query(
          `SELECT n.id, n.usuario_id, n.anuncio_id, n.tarea_id, n.leida, n.fecha,
                  a.titulo AS anuncio_titulo
           FROM notificaciones n
           LEFT JOIN anuncios a ON a.id = n.anuncio_id
           WHERE n.usuario_id = $1
           ORDER BY n.fecha DESC, n.id DESC`,
          [usuarioId]
        );
        res.json(resultado.rows);
      } catch (error) {
        console.error('Error al consultar notificaciones:', error.message);
        res.status(500).json({ success: false, error: 'No se pudieron cargar las notificaciones' });
      }
    });

    // MARCAR NOTIFICACIÓN COMO LEÍDA
    app.patch('/notificaciones/:id/leida', async (req, res) => {
      const id = Number(req.params.id);
      const usuarioId = Number(req.body.usuario_id);
      if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({ success: false, error: 'Datos de notificación inválidos' });
      }
      try {
        const resultado = await pool.query(
          `UPDATE notificaciones SET leida = TRUE
           WHERE id = $1 AND usuario_id = $2 RETURNING id`,
          [id, usuarioId]
        );
        if (resultado.rowCount === 0) {
          return res.status(404).json({ success: false, error: 'La notificación no existe' });
        }
        res.json({ success: true });
      } catch (error) {
        console.error('Error al marcar notificación:', error.message);
        res.status(500).json({ success: false, error: 'No se pudo actualizar la notificación' });
      }
    });

    // MARCAR TODAS LAS NOTIFICACIONES COMO LEÍDAS
    app.patch('/notificaciones/leidas', async (req, res) => {
      const usuarioId = Number(req.body.usuario_id);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
      }
      try {
        await pool.query(
          'UPDATE notificaciones SET leida = TRUE WHERE usuario_id = $1 AND leida = FALSE',
          [usuarioId]
        );
        res.json({ success: true });
      } catch (error) {
        console.error('Error al marcar notificaciones:', error.message);
        res.status(500).json({ success: false, error: 'No se pudieron actualizar las notificaciones' });
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

  let cliente;
  let transaccionIniciada = false;
  try {
    cliente = await pool.connect();
    await cliente.query('BEGIN');
    transaccionIniciada = true;
    const anuncioExiste = await cliente.query('SELECT id FROM anuncios WHERE id = $1 FOR UPDATE', [id]);

    if (anuncioExiste.rowCount === 0) {
      await cliente.query('ROLLBACK');
      transaccionIniciada = false;
      return res.status(404).json({
        success: false,
        error: 'El anuncio no existe'
      });
    }

    const archivosAsociados = await cliente.query(
      'SELECT id FROM archivos WHERE anuncio_id = $1 LIMIT 1',
      [id]
    );
    if (archivosAsociados.rowCount > 0) {
      await cliente.query('ROLLBACK');
      transaccionIniciada = false;
      return res.status(409).json({
        success: false,
        error: 'Este anuncio tiene archivos vinculados. Elimina primero esos archivos.'
      });
    }

    await cliente.query('DELETE FROM notificaciones WHERE anuncio_id = $1', [id]);
    await cliente.query('DELETE FROM anuncios WHERE id = $1', [id]);
    await cliente.query('COMMIT');
    transaccionIniciada = false;
    res.json({ success: true });

  } catch (error) {
    if (cliente && transaccionIniciada) {
      try {
        await cliente.query('ROLLBACK');
      } catch (errorRollback) {
        console.error('Error al revertir la eliminación del anuncio:', errorRollback.message);
      }
    }
    console.error('Error al eliminar anuncio:', error.message);

    res.status(500).json({
      success: false,
      error: 'No se pudo eliminar el anuncio'
    });
  } finally {
    if (cliente) cliente.release();
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
