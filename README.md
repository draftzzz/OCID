# CoorCBTIS 258 - Plataforma de Coordinación y Comunicación Escolar

Una aplicación web completa para la coordinación y comunicación interna del CBTIS 258, diseñada para mejorar la organización escolar mediante la gestión de departamentos, anuncios, archivos y docentes.

## Características

- ✅ Sistema de autenticación con sesiones seguras
- ✅ Gestión de departamentos y asignación de responsables
- ✅ Módulo de anuncios con prioridades y fechas de expiración
- ✅ Sistema de gestión de archivos con subida y descarga
- ✅ Directorio de docentes con búsqueda y filtros
- ✅ Calendario para eventos y reuniones
- ✅ Asistente de inteligencia artificial integrado
- ✅ Control de roles y permisos (Administrador, Jefe de Departamento, Docente)
- ✅ Diseño responsive y profesional
- ✅ Interfaz completamente en español

## Tecnologías Utilizadas

**Frontend:**
- HTML5
- CSS3
- JavaScript Vanilla
- Font Awesome 6.0

**Backend:**
- Node.js
- Express.js
- MongoDB con Mongoose

**Otros:**
- Sesiones express con MongoStore
- Multer para subida de archivos
- Bcryptjs para encriptación de contraseñas

## Estructura del Proyecto

```
Proyecto final/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── index.html
└── README.md
```

## Instalación y Ejecución

### Prerrequisitos

- Node.js (versión 14 o superior)
- MongoDB (versión 4.4 o superior)
- Git

### Pasos de Instalación

1. **Clonar el repositorio** (si aplica):
   ```bash
   git clone <url-del-repositorio>
   cd Proyecto final
   ```

2. **Instalar dependencias del backend**:
   ```bash
   cd backend
   npm install
   ```

3. **Configurar variables de entorno**:
   Copie el archivo `.env.example` a `.env` y ajuste los valores:
   ```bash
   cp .env.example .env
   ```
   Luego edite `.env` con su configuración:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/coorcbtis258
   SESSION_SECRET=tu_secreto_super_secreto_aqui_cambiar_en_produccion
   NODE_ENV=development
   ```

4. **Inicializar la base de datos con datos de ejemplo**:
   ```bash
   node utils/initData.js
   ```

5. **Iniciar el servidor**:
   ```bash
   npm start
   ```
   O para desarrollo con recarga automática:
   ```bash
   npm run dev
   ```

6. **Acceder a la aplicación**:
   Abra su navegador y visite: `http://localhost:5000`

### Usuario de Prueba

- **Administrador**
  - Email: admin@cbti258.edu.mx
  - Password: admin123

- **Jefe de Departamento**
  - Email: jefe.academico@cbti258.edu.mx
  - Password: jefe123

- **Docente**
  - Email: maria.gonzalez@cbti258.edu.mx
  - Password: docente123

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Departamentos
- `GET /api/departamentos` - Obtener todos los departamentos
- `GET /api/departamentos/:id` - Obtener departamento por ID
- `POST /api/departamentos` - Crear nuevo departamento (solo admin)
- `PUT /api/departamentos/:id` - Actualizar departamento (solo admin)
- `DELETE /api/departamentos/:id` - Eliminar departamento (solo admin)
- `GET /api/departamentos/:id/docentes` - Obtener docentes de un departamento

### Anuncios
- `GET /api/anuncios` - Obtener todos los anuncios (con filtros)
- `GET /api/anuncios/:id` - Obtener anuncio por ID
- `POST /api/anuncios` - Crear nuevo anuncio
- `PUT /api/anuncios/:id` - Actualizar anuncio
- `DELETE /api/anuncios/:id` - Eliminar anuncio
- `GET /api/anuncios/departamento/:departamentoId` - Obtener anuncios por departamento

### Archivos
- `POST /api/archivos/upload` - Subir archivo
- `GET /api/archivos` - Obtener todos los archivos (con filtros)
- `GET /api/archivos/:id` - Obtener archivo por ID
- `GET /api/archivos/:id/download` - Descargar archivo
- `DELETE /api/archivos/:id` - Eliminar archivo
- `GET /api/archivos/departamento/:departamentoId` - Obtener archivos por departamento

### Docentes
- `GET /api/docentes` - Obtener todos los docentes (con filtros)
- `GET /api/docentes/:id` - Obtener docente por ID
- `POST /api/docentes` - Crear nuevo docente (solo admin)
- `PUT /api/docentes/:id` - Actualizar docente
- `DELETE /api/docentes/:id` - Eliminar docente (solo admin)
- `GET /api/docentes/departamento/:departamentoId` - Obtener docentes por departamento

### Calendario
- `GET /api/calendario` - Obtener todos los eventos (con filtros)
- `GET /api/calendario/:id` - Obtener evento por ID
- `POST /api/calendario` - Crear nuevo evento
- `PUT /api/calendario/:id` - Actualizar evento
- `DELETE /api/calendario/:id` - Eliminar evento
- `GET /api/calendario/departamento/:departamentoId` - Obtener eventos por departamento
- `GET /api/calendario/proximos/departamento/:departamentoId` - Obtener próximos eventos

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - vea el archivo [LICENSE](LICENSE) para más detalles.

## Créditos

Desarrollado para el CBTIS 258 como plataforma de coordinación y comunicación interna.

© 2026 CoorCBTIS 258 - Todos los derechos reservados