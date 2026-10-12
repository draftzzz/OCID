const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors(), express.json(), express.urlencoded({ extended: true }));

// Registro: Solo guarda silenciosamente (Sin contenido)
app.post('/registro', async (req, res) => {
    try {
        await sql`INSERT INTO usuarios (nombre, correo, contrasena) VALUES (${req.body.nombre}, ${req.body.correo}, ${req.body.contrasena})`;
        res.redirect('/login.html'); // Si se guarda, redirige al login
    } catch {
        // Si falla (correo duplicado o error), devuelve el HTML con el div visible
        res.send('<div>Este correo ya existe</div><a href="javascript:history.back()">Volver</a>');
    }
});

// Login: Simplificado
app.post('/api/auth/login', (req, res) => {
    sql`SELECT 1 FROM usuarios WHERE correo=${req.body.correo} AND contrasena=${req.body.contrasena}`
        .then(([u]) => res.sendStatus(u ? 200 : 401)).catch(() => res.sendStatus(500));
});

app.listen(process.env.PORT || 10000, '0.0.0.0');
