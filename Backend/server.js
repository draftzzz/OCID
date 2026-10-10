
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Comprobar que el servidor funciona
app.get('/health', (req, res) => {
    res.json({
        success: true,
        mensaje: 'OCID API funcionando'
    });
});

// Comprobar la conexión a Neon
app.get('/db-test', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.json({
            success: true,
            mensaje: 'Conexión a Neon correcta'
        });
    } catch (error) {
        console.error('Error de PostgreSQL:', error.message);

        res.status(500).json({
            success: false,
            mensaje: 'No se pudo conectar a la base de datos'
        });
    }
});

// Registrar usuario
app.post('/registro', async (req, res) => {
    const { nombre, email, contrasena } = req.body;

    if (
        typeof nombre !== 'string' ||
        typeof email !== 'string' ||
        typeof contrasena !== 'string' ||
        !nombre.trim() ||
        !email.trim() ||
        !contrasena
    ) {
        return res.status(400).json({
            success: false,
            error: 'Completa todos los campos'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, contrasena)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [nombre.trim(), email.trim().toLowerCase(), contrasena]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('Error al registrar:', error.message);

        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'Ese correo ya está registrado'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al registrar. Comprueba la tabla usuarios.'
        });
    }
});

// Iniciar sesión
app.post('/api/auth/login', async (req, res) => {
    const { email, contrasena } = req.body;

    if (
        typeof email !== 'string' ||
        typeof contrasena !== 'string' ||
        !email.trim() ||
        !contrasena
    ) {
        return res.status(400).json({
            success: false,
            error: 'Completa el correo y la contraseña'
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, nombre, email
             FROM usuarios
             WHERE email = $1 AND contrasena = $2`,
            [email.trim().toLowerCase(), contrasena]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Correo o contraseña incorrectos'
            });
        }

        res.json({
            success: true,
            usuario: result.rows[0]
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);

        res.status(500).json({
            success: false,
            error: 'Error al iniciar sesión'
        });
    }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor OCID iniciado en el puerto ' + PORT);
});
