
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

app.get('/health', (req, res) =>
    res.json({ success: true, mensaje: 'OCID API funcionando' })
);

app.get('/db-test', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ success: true, mensaje: 'Neon conectado' });
    } catch {
        res.status(500).json({ success: false, error: 'Error de base de datos' });
    }
});

app.post('/registro', async (req, res) => {
    const { nombre, email, contrasena } = req.body;

    if (![nombre, email, contrasena].every(v => typeof v === 'string' && v.trim()) ||
        contrasena.length < 8) {
        return res.status(400).json({
            success: false,
            error: 'Completa los campos; la contraseña debe tener al menos 8 caracteres'
        });
    }

    try {
        const hash = await bcrypt.hash(contrasena, 12);
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, contrasena)
             VALUES ($1, $2, $3) RETURNING id_usuario, nombre, email`,
            [nombre.trim(), email.trim().toLowerCase(), hash]
        );
        res.status(201).json({
            success: true,
            usuario: result.rows[0]
        });
    } catch (e) {
        if (e.code === '23505')
            return res.status(409).json({ success: false, error: 'Correo ya registrado' });

        console.error(e.message);
        res.status(500).json({ success: false, error: 'Error al registrar' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, contrasena } = req.body;

    if (typeof email !== 'string' || typeof contrasena !== 'string')
        return res.status(400).json({ success: false, error: 'Datos inválidos' });

    try {
        const result = await pool.query(
            'SELECT id_usuario, nombre, email, contrasena FROM usuarios WHERE email = $1',
            [email.trim().toLowerCase()]
        );
        const u = result.rows[0];

        if (!u || !(await bcrypt.compare(contrasena, u.contrasena)))
            return res.status(401).json({
                success: false,
                error: 'Correo o contraseña incorrectos'
            });

        res.json({
            success: true,
            usuario: {
                id_usuario: u.id_usuario,
                nombre: u.nombre,
                email: u.email
            }
        });
    } catch (e) {
        console.error(e.message);
        res.status(500).json({ success: false, error: 'Error al iniciar sesión' });
    }
});

app.listen(process.env.PORT || 10000, '0.0.0.0', () =>
    console.log('OCID API funcionando')
);
