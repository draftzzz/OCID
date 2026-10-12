const express = require('express');
const { Pool } = require('pg');

const app = express();

// OBLIGATORIO: Esto le permite a Express leer el formulario nativo de HTML
app.use(express.urlencoded({ extended: true })); 

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

app.post('/usuarios', async (req, res) => {
    const { nombre, correo, password } = req.body;
    
    // Inserta los datos en la base de datos de Neon
    await pool.query('INSERT INTO usuarios(nombre, correo, password) VALUES($1, $2, $3)', [nombre, correo, password]);
    
    // El servidor responde enviando al usuario directamente a la página de login
    res.redirect('https://ocid-iota.vercel.app/login.html'); 
});

app.listen(process.env.PORT || 3000);
