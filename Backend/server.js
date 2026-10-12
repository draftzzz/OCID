const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Pon tu string de Neon en Render
    ssl: true
});

app.post('/usuarios', (req, res) => {
    const { nombre, correo, password } = req.body;
    pool.query('INSERT INTO usuarios(nombre, correo, password) VALUES($1, $2, $3)', [nombre, correo, password]);
    res.send('OK');
});

app.listen(process.env.PORT || 3000);