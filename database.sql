-- CoorCBTIS 258 Database Schema
-- Drop tables if they exist (for development purposes)
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS tareas;
DROP TABLE IF EXISTS eventos;
DROP TABLE IF EXISTS documentos;
DROP TABLE IF EXISTS anuncios;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS departamentos;
DROP TABLE IF EXISTS session;

-- Create departamentos table
CREATE TABLE departamentos (
    id_departamento SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_jefe INTEGER REFERENCES usuarios(id_usuario)
);

-- Create usuarios table
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'docente' CHECK (rol IN ('admin', 'jefe_departamento', 'docente')),
    id_departamento INTEGER REFERENCES departamentos(id_departamento),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create anuncios table
CREATE TABLE anuncios (
    id_anuncio SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    fecha_publicacion DATE NOT NULL,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    id_departamento INTEGER REFERENCES departamentos(id_departamento)
);

-- Create documentos table
CREATE TABLE documentos (
    id_documento SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    id_departamento INTEGER REFERENCES departamentos(id_departamento)
);

-- Create eventos table
CREATE TABLE eventos (
    id_evento SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    id_departamento INTEGER REFERENCES departamentos(id_departamento)
);

-- Create tareas table
CREATE TABLE tareas (
    id_tarea SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_limite DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completada')),
    id_creador INTEGER REFERENCES usuarios(id_usuario),
    id_asignado INTEGER REFERENCES usuarios(id_usuario),
    id_departamento INTEGER REFERENCES departamentos(id_departamento)
);

-- Create notificaciones table
CREATE TABLE notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    mensaje TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT FALSE,
    id_usuario INTEGER REFERENCES usuarios(id_usuario)
);

-- Create session table for express-session
CREATE TABLE session (
    sid VARCHAR(255) NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IDX_session_expire ON session(expire);

-- Insert test data
-- Insert sample departments
INSERT INTO departamentos (nombre, descripcion) VALUES
('Dirección', 'Dirección general del plantel'),
('Academia', 'Departamento académico y docente'),
('Administración', 'Departamento de actividades administrativas'),
('Servicios Escolares', 'Departamento de servicios escolares');

-- Update departments with jefes (will be updated after users are inserted)
-- We'll do this after inserting users

-- Insert sample users
-- Password for all users is 'password123' (hashed)
INSERT INTO usuarios (nombre, correo, contrasena, rol, id_departamento) VALUES
('Administrador Sistema', 'admin@coorcbtis258.edu.mx', '$2b$10$8c.jvOJdNjZ6u5u7Y6Y6J.Q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8', 'admin', NULL),
('Juan Pérez López', 'jefe.academia@coorcbtis258.edu.mx', '$2b$10$8c.jvOJdNjZ6u5u7Y6Y6J.Q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8', 'jefe_departamento', 2),
('María García Martínez', 'docente1@coorcbtis258.edu.mx', '$2b$10$8c.jvOJdNjZ6u5u7Y6Y6J.Q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8', 'docente', 2),
('Carlos Rodríguez Hernández', 'docente2@coorcbtis258.edu.mx', '$2b$10$8c.jvOJdNjZ6u5u7Y6Y6J.Q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8', 'docente', 3);

-- Update departamentos with their jefes
UPDATE departamentos SET id_jefe = 2 WHERE id_departamento = 2; -- Juan Pérez López as jefe de Academia
UPDATE departamentos SET id_jefe = NULL WHERE id_departamento = 1; -- Dirección doesn't have a jefe yet
UPDATE departamentos SET id_jefe = NULL WHERE id_departamento = 3; -- Administración doesn't have a jefe yet
UPDATE departamentos SET id_jefe = NULL WHERE id_departamento = 4; -- Servicios Escolares doesn't have a jefe yet

-- Insert sample announcements
INSERT INTO anuncios (titulo, contenido, fecha_publicacion, id_usuario, id_departamento) VALUES
('Inicio del ciclo escolar 2026-2027', 'Se informa a la comunidad estudiantil que el ciclo escolar 2026-2027 iniciará el lunes 21 de agosto de 2026.', '2026-08-21', 1, NULL),
('Reunión de padres de familia', 'Se convoca a reunión de padres de familia el viernes 15 de septiembre de 2026 a las 17:00 horas en el auditorio escolar.', '2026-09-15', 2, 2);

-- Insert sample events
INSERT INTO eventos (titulo, descripcion, fecha_inicio, fecha_fin, id_usuario, id_departamento) VALUES
('Día de la Independencia', 'Celebración del Día de la Independencia con desfile cívico y actividades culturales.', '2026-09-16', '2026-09-16', 1, NULL),
('Festival Cultural', 'Festival cultural con presentación de danza, música y arte estudiantil.', '2026-10-30', '2026-10-30', 2, 2);

-- Insert sample tasks
INSERT INTO tareas (titulo, descripcion, fecha_limite, estado, id_creador, id_asignado, id_departamento) VALUES
('Revisar planeación didáctica', 'Revisar y actualizar la planeación didáctica para el próximo bimestre.', '2026-09-15', 'pendiente', 2, 3, 2),
('Calificar examen parcial', 'Calificar los exámenes parciales de matemáticas del grupo 203.', '2026-09-20', 'en_proceso', 2, 4, 3);

-- Insert sample notifications
INSERT INTO notificaciones (mensaje, leida, id_usuario) VALUES
('Bienvenido al sistema CoorCBTIS 258. Su cuenta ha sido creada exitosamente.', false, 3),
('Tiene una nueva tarea asignada: Revisar planeación didáctica', false, 3),
('Recuerde asistir a la reunión de padres de familia el viernes 15 de septiembre.', false, 4);