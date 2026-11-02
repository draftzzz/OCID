CREATE TABLE IF NOT EXISTS tareas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    horario VARCHAR(100) DEFAULT 'Horario a confirmar',
    departamento VARCHAR(100) DEFAULT 'General',
    autor_id INT,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);