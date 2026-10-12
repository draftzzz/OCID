const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors(), express.json(), express.urlencoded({ extended: true }));

// Registro: Solo guarda silenciosamente (Sin contenido)
app.post('/registro', async (req, res) => {
    const { nombre, correo, password } = req.body;
    try {
        await sql`INSERT INTO usuarios (nombre, correo, contrasena) VALUES (${nombre}, ${correo}, ${password})`;
        res.sendStatus(204);
    } catch { res.sendStatus(500); }
});

// Login: Simplificado
app.post('/api/auth/login', (req, res) => {
    sql`SELECT 1 FROM usuarios WHERE correo=${req.body.correo} AND contrasena=${req.body.contrasena}`
        .then(([u]) => res.sendStatus(u ? 200 : 401)).catch(() => res.sendStatus(500));
});

app.listen(process.env.PORT || 10000, '0.0.0.0');
