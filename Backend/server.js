const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.post('/registro', async (req, res) => {
    const { nombre, email, contrasena } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, contrasena) VALUES ($1, $2, $3) RETURNING id',
            [nombre, email, contrasena]
        );

        res.json({
            success: true,
            mensaje: 'Usuario registrado',
            id: result.rows[0].id
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, contrasena } = req.body;

    try {
        const result = await pool.query(
            'SELECT id, nombre, email FROM usuarios WHERE email = $1 AND contrasena = $2',
            [email, contrasena]
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
        console.log(error);
        res.status(500).json({
            success: false,
            error: 'Error al iniciar sesión'
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ success: true, mensaje: 'OCID API funcionando' });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor OCID iniciado en el puerto ' + PORT);
});