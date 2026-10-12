const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registro: Columnas 'correo' y 'password'
app.post('/registro', async (req, res) => {
    try {
        await sql`INSERT INTO usuarios (nombre, correo, password) VALUES (${req.body.nombre}, ${req.body.correo}, ${req.body.password})`;
        res.redirect('/login.html'); 
    } catch {
        res.send('<div>Este correo ya existe</div><br><a href="javascript:history.back()">Volver</a>');
    }
});

// Login: Columnas 'correo' y 'password'
app.post('/api/auth/login', (req, res) => {
    sql`SELECT 1 FROM usuarios WHERE correo=${req.body.correo} AND password=${req.body.password}`
        .then(([u]) => res.sendStatus(u ? 200 : 401))
        .catch(() => res.sendStatus(500));
});

app.listen(process.env.PORT || 10000, '0.0.0.0');