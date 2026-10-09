const mongoose = require('mongoose');
const Usuario = require('../models/User');
const Departamento = require('../models/Departamento');
const Anuncio = require('../models/Anuncio');
const Archivo = require('../models/Archivo');
const Evento = require('../models/Evento');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: '../.env' });

const initData = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Limpiar colecciones existentes (solo para desarrollo)
    await Usuario.deleteMany({});
    await Departamento.deleteMany({});
    await Anuncio.deleteMany({});
    await Archivo.deleteMany({});
    await Evento.deleteMany({});
    console.log('Colecciones limpiadas');

    // Crear departamentos
    const departamentosData = [
      { nombre: 'Servicios Escolares', descripcion: 'Departamento encargado de servicios administrativos y de apoyo al estudiante' },
      { nombre: 'Académico', descripcion: 'Departamento responsable de la planeación y ejecución del currículo educativo' },
      { nombre: 'Vinculación', descripcion: 'Departamento que gestiona relaciones con empresas y instituciones externas' },
      { nombre: 'Orientación', descripcion: 'Departamento de orientación vocacional y apoyo psicológico' },
      { nombre: 'Control Escolar', descripcion: 'Departamento encargado de registros académicos y trámites escolares' }
    ];

    const departamentos = await Departamento.insertMany(departamentosData);
    console.log(`Creados ${departamentos.length} departamentos`);

    // Crear usuarios de ejemplo
    const usuariosData = [
      {
        nombre: 'Administrador Sistema',
        email: 'admin@cbti258.edu.mx',
        password: 'admin123',
        rol: 'administrador',
        departamento: null
      },
      {
        nombre: 'Jefe de Departamento Académico',
        email: 'jefe.academico@cbti258.edu.mx',
        password: 'jefe123',
        rol: 'jefe_departamento',
        departamento: departamentos[1]._id // Académico
      },
      {
        nombre: 'María González López',
        email: 'maria.gonzalez@cbti258.edu.mx',
        password: 'docente123',
        rol: 'docente',
        departamento: departamentos[1]._id // Académico
      },
      {
        nombre: 'Carlos Ramírez Méndez',
        email: 'carlos.ramirez@cbti258.edu.mx',
        password: 'docente123',
        rol: 'docente',
        departamento: departamentos[1]._id // Académico
      },
      {
        nombre: 'Ana Torres Ruiz',
        email: 'ana.torres@cbti258.edu.mx',
        password: 'docente123',
        rol: 'docente',
        departamento: departamentos[0]._id // Servicios Escolares
      },
      {
        nombre: 'Luis Hernández Castillo',
        email: 'luis.hernandez@cbti258.edu.mx',
        password: 'docente123',
        rol: 'docente',
        departamento: departamentos[2]._id // Vinculación
      }
    ];

    // Encriptar contraseñas
    for (const usuarioData of usuariosData) {
      const salt = await bcrypt.genSalt(10);
      usuarioData.password = await bcrypt.hash(usuarioData.password, salt);
    }

    const usuarios = await Usuario.insertMany(usuariosData);
    console.log(`Creados ${usuarios.length} usuarios`);

    // Actualizar departamentos con sus jefes
    for (let i = 0; i < departamentos.length; i++) {
      const jefe = usuarios.find(u =>
        u.rol === 'jefe_departamento' &&
        u.departamento.toString() === departamentos[i]._id.toString()
      );
      if (jefe) {
        departamentos[i].jefe = jefe._id;
        await departamentos[i].save();
      }
    }
    console.log('Jefes de departamento asignados');

    // Crear anuncios de ejemplo
    const anunciosData = [
      {
        titulo: 'Reunión General de Docentes',
        descripcion: 'Se convoca a reunión general de todos los docentes para revisión del avance académico y planificación de actividades extracurriculares.',
        departamento: departamentos[1]._id, // Académico
        autor: usuarios[1]._id, // Jefe de Departamento Académico
        importante: true,
        prioridad: 'alta'
      },
      {
        titulo: 'Entrega de Calificaciones Parciales',
        descripcion: 'Recordatorio importante: las calificaciones del parcial deben entregarse antes del viernes 15 de octubre.',
        departamento: departamentos[1]._id, // Académico
        autor: usuarios[1]._id, // Jefe de Departamento Académico
        importante: true,
        prioridad: 'alta'
      },
      {
        titulo: 'Taller de Actualización Pedagógica',
        descripcion: 'Invitación al taller de actualización en metodologías activas de aprendizaje, dirigido a todos los docentes de institución.',
        departamento: departamentos[0]._id, // Servicios Escolares
        autor: usuarios[4]._id, // Ana Torres Ruiz
        importante: false,
        prioridad: 'media'
      },
      {
        titulo: 'Feria de Vinculación Universitaria',
        descripcion: 'Se invita a la comunidad estudiantil a participar en la feria de vinculación con universidades el próximo mes.',
        departamento: departamentos[2]._id, // Vinculación
        autor: usuarios[5]._id, // Luis Hernández Castillo
        importante: false,
        prioridad: 'media'
      }
    ];

    const anuncios = await Anuncio.insertMany(anunciosData);
    console.log(`Creados ${anuncios.length} anuncios`);

    // Crear archivos de ejemplo
    const archivosData = [
      {
        nombreOriginal: 'Plan de Estudios 2026-2027.pdf',
        nombre: 'plan_estudios_2026_2027.pdf',
        tipo: 'application/pdf',
        tamaño: 2450000,
        ruta: 'uploads/plan_estudios_2026_2027.pdf',
        departamento: departamentos[1]._id, // Académico
        subidoPor: usuarios[1]._id, // Jefe de Departamento Académico
        categoria: 'Curricular'
      },
      {
        nombreOriginal: 'Formato de Solicitud de Constancias.docx',
        nombre: 'formato_solicitud_constancias.docx',
        tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        tamaño: 320000,
        ruta: 'uploads/formato_solicitud_constancias.docx',
        departamento: departamentos[0]._id, // Servicios Escolares
        subidoPor: usuarios[4]._id, // Ana Torres Ruiz
        categoria: 'Administrativo'
      },
      {
        nombreOriginal: 'Lista de Alumnos Inscritos.xlsx',
        nombre: 'lista_alumnos_inscritos.xlsx',
        tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        tamaño: 1850000,
        ruta: 'uploads/lista_alumnos_inscritos.xlsx',
        departamento: departamentos[4]._id, // Control Escolar
        subidoPor: usuarios[0]._id, // Administrador Sistema
        categoria: 'Estudiantil'
      },
      {
        nombreOriginal: 'Logo_CBtis_258_oficial.png',
        nombre: 'logo_cbti258_oficial.png',
        tipo: 'image/png',
        tamaño: 850000,
        ruta: 'uploads/logo_cbti258_oficial.png',
        departamento: departamentos[2]._id, // Vinculación
        subidoPor: usuarios[5]._id, // Luis Hernández Castillo
        categoria: 'Institucional'
      }
    ];

    const archivos = await Archivo.insertMany(archivosData);
    console.log(`Creados ${archivos.length} archivos`);

    // Crear eventos de ejemplo
    const eventosData = [
      {
        titulo: 'Reunión Mensual de Departamento Académico',
        descripcion: 'Reunión de seguimiento de proyectos académicos y revisión de indicadores de calidad.',
        fechaInicio: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // En 3 días
        fechaFin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 horas de duración
        tipo: 'reunion',
        departamento: departamentos[1]._id, // Académico
        creadoPor: usuarios[1]._id, // Jefe de Departamento Académico
        recordatorio: true
      },
      {
        titulo: 'Entrega de Proyectos de Investigación',
        descripcion: 'Fecha límite para la entrega de proyectos de investigación del semestre.',
        fechaInicio: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // En 2 semanas
        tipo: 'entrega',
        departamento: departamentos[1]._id, // Académico
        creadoPor: usuarios[2]._id, // María González López
        recordatorio: true
      },
      {
        titulo: 'Taller de Inteligencia Emocional para Docentes',
        descripcion: 'Capacitación en habilidades socioemocionales para mejorar el ambiente escolar.',
        fechaInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En 1 semana
        fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 horas de duración
        tipo: 'actividad',
        departamento: departamentos[3]._id, // Orientación
        creadoPor: usuarios[4]._id, // Ana Torres Ruiz
        recordatorio: true
      },
      {
        titulo: 'Día de la Juventud',
        descripcion: 'Celebración del Día de la Juventud con actividades culturales y deportivas.',
        fechaInicio: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // En 3 semanas
        tipo: 'aviso',
        departamento: departamentos[0]._id, // Servicios Escolares
        creadoPor: usuarios[4]._id, // Ana Torres Ruiz
        recordatorio: false
      }
    ];

    const eventos = await Evento.insertMany(eventosData);
    console.log(`Creados ${eventos.length} eventos`);

    console.log('Datos de inicialización completados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la inicialización de datos:', error);
    process.exit(1);
  }
};

initData();