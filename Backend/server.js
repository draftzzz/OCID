
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// REGISTRO
app.post('/registro', async (req, res) => {
    const { nombre, email, contrasena } = req.body;

    if (
        typeof nombre !== 'string' ||
        typeof email !== 'string' ||
        typeof contrasena !== 'string' ||
        !nombre.trim() ||
        !email.trim() ||
        contrasena.length < 8
    ) {
        return res.status(400).json({
            success: false,
            error: 'Completa los campos. La contraseña debe tener al menos 8 caracteres.'
        });
    }

    try {
        const hash = await bcrypt.hash(contrasena, 12);

        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, contrasena)
             VALUES ($1, $2, $3)
             RETURNING id_usuario, nombre, email, creado_en`,
            [nombre.trim(), email.trim().toLowerCase(), hash]
        );

        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado correctamente',
            usuario: result.rows[0]
        });
    } catch (e) {
        console.error('Error al registrar:', e.message);

        if (e.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'Este correo ya está registrado'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al registrar usuario'
        });
    }
});

// INICIAR SESIÓN
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
            error: 'Ingresa tu correo y contraseña'
        });
    }

    try {
        const result = await pool.query(
            `SELECT id_usuario, nombre, email, contrasena, creado_en
             FROM usuarios WHERE email = $1`,
            [email.trim().toLowerCase()]
        );

        const u = result.rows[0];

        if (!u || !(await bcrypt.compare(contrasena, u.contrasena))) {
            return res.status(401).json({
                success: false,
                error: 'Correo o contraseña incorrectos'
            });
        }

        res.json({
            success: true,
            usuario: {
                id_usuario: u.id_usuario,
                nombre: u.nombre,
                email: u.email,
                creado_en: u.creado_en
            }
        });
    } catch (e) {
        console.error('Error al iniciar sesión:', e.message);

        res.status(500).json({
            success: false,
            error: 'Error al iniciar sesión'
        });
    }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`OCID API funcionando en el puerto ${PORT}`);
});
