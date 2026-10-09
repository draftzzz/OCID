// Funcionalidad principal del frontend de CoorCBTIS 258

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const navItems = document.querySelectorAll('.nav-item');
    const logoutBtn = document.querySelector('.nav-item.logout');

    // Modals
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const createAnnouncementModal = document.getElementById('createAnnouncementModal');

    // Botones para abrir modales
    const loginLinks = document.querySelectorAll('#showLoginLink, .topbar-user img');
    const registerLinks = document.querySelectorAll('#showRegisterLink');
    const createAnnouncementBtns = document.querySelectorAll('.btn-primary, .action-item:nth-child(1)');
    const closeButtons = document.querySelectorAll('.close');

    // Estado de autenticación (en una app real, esto vendría del backend)
    let isAuthenticated = false;
    let currentUser = null;

    // Inicialización
    function init() {
        // Verificar estado de autenticación (simulado)
        checkAuthStatus();

        // Añadir event listeners
        addEventListeners();

        // Cargar datos iniciales del dashboard
        loadDashboardData();
    }

    // Verificar estado de autenticación
    function checkAuthStatus() {
        // En una app real, esto haría una llamada al backend
        // Por ahora, simulamos que no está autenticado
        isAuthenticated = false;

        if (!isAuthenticated) {
            showModal(loginModal);
        }
    }

    // Añadir event listeners
    function addEventListeners() {
        // Navegación lateral
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                // No procesar el logout aquí
                if (this.classList.contains('logout')) return;

                // Remover clase active de todos los items
                navItems.forEach(i => i.classList.remove('active'));
                // Añadir active al item clickeado
                this.classList.add('active');
            });
        });

        // Logout
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });

        // Abrir modales
        loginLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showModal(loginModal);
            });
        });

        registerLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showModal(registerModal);
            });
        });

        createAnnouncementBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                showModal(createAnnouncementModal);
                // Aquí cargaríamos los departamentos para el select
                loadDepartmentsForSelect();
            });
        });

        // Cerrar modales
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                hideModal(modal);
            });
        });

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                hideModal(e.target);
            }
        });

        // Manejar envío de formularios
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleLogin(e);
            });
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleRegister(e);
            });
        }

        const announcementForm = document.getElementById('announcementForm');
        if (announcementForm) {
            announcementForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleCreateAnnouncement(e);
            });
        }

        // Búsqueda en la barra superior
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch(this.value);
                }
            });
        }
    }

    // Mostrar modal
    function showModal(modal) {
        modal.style.display = 'flex';
        // Enfocar el primer input del modal
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Ocultar modal
    function hideModal(modal) {
        modal.style.display = 'none';
        // Limpiar formularios
        const form = modal.querySelector('form');
        if (form) form.reset();
    }

    // Manejar login
    function handleLogin(form) {
        const email = form.elements.loginEmail.value.trim();
        const password = form.elements.loginPassword.value;

        if (!email || !password) {
            showError('Por favor complete todos los campos');
            return;
        }

        // Simular llamada al backend
        // En una app real: fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
        simulateApiCall('/api/auth/login', { email, password }, 'POST')
            .then(response => {
                if (response.success) {
                    isAuthenticated = true;
                    currentUser = response.user;
                    hideModal(loginModal);
                    updateUserInterface();
                    showSuccess('Inicio de sesión exitoso');
                } else {
                    showError(response.message || 'Credenciales inválidas');
                }
            })
            .catch(error => {
                showError('Error de conexión. Por favor intente de nuevo.');
                console.error('Login error:', error);
            });
    }

    // Manejar registro
    function handleRegister(form) {
        const nombre = form.elements.registerNombre.value.trim();
        const email = form.elements.registerEmail.value.trim();
        const password = form.elements.registerPassword.value;
        const rol = form.elements.registerRol.value;
        const departamento = form.elements.registerDepartamento.value;

        if (!nombre || !email || !password || !rol || !departamento) {
            showError('Por favor complete todos los campos');
            return;
        }

        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // Simular llamada al backend
        simulateApiCall('/api/auth/register', {
            nombre, email, password, rol, departamentoId: departamento
        }, 'POST')
            .then(response => {
                if (response.success) {
                    hideModal(registerModal);
                    showSuccess('Registro exitoso. Ahora puede iniciar sesión');
                } else {
                    showError(response.message || 'Error al registrar usuario');
                }
            })
            .catch(error => {
                showError('Error de conexión. Por favor intente de nuevo.');
                console.error('Register error:', error);
            });
    }

    // Manejar creación de anuncio
    function handleCreateAnnouncement(form) {
        const titulo = form.elements.announcementTitle.value.trim();
        const descripcion = form.elements.announcementDescription.value.trim();
        const departamentoId = form.elements.announcementDepartment.value;
        const fechaExpiracion = form.elements.announcementDate.value;
        const importante = form.elements.announcementImportant.checked;
        const prioridad = form.elements.announcementPriority.value;

        if (!titulo || !descripcion || !departamentoId) {
            showError('Por favor complete los campos requeridos');
            return;
        }

        // Simular llamada al backend
        simulateApiCall('/api/anuncios', {
            titulo,
            descripcion,
            departamento: departamentoId,
            fechaExpiracion: fechaExpiracion || null,
            importante,
            prioridad
        }, 'POST')
            .then(response => {
                if (response.success) {
                    hideModal(createAnnouncementModal);
                    showSuccess('Anuncio creado exitosamente');
                    // Recargar anuncios en el dashboard
                    loadDashboardData();
                } else {
                    showError(response.message || 'Error al crear anuncio');
                }
            })
            .catch(error => {
                showError('Error de conexión. Por favor intente de nuevo.');
                console.error('Create announcement error:', error);
            });
    }

    // Manejar logout
    function handleLogout() {
        // Simular llamada al backend
        // En una app real: fetch('/api/auth/logout', { method: 'POST' })
        simulateApiCall('/api/auth/logout', {}, 'POST')
            .then(() => {
                isAuthenticated = false;
                currentUser = null;
                // Recargar página para mostrar login
                window.location.reload();
            })
            .catch(error => {
                console.error('Logout error:', error);
                // Aún así limpiar estado local
                isAuthenticated = false;
                currentUser = null;
                window.location.reload();
            });
    }

    // Actualizar interfaz de usuario después del login
    function updateUserInterface() {
        // Actualizar información del usuario en la barra superior
        const userInfoImg = document.querySelector('.user-info img');
        const userInfoSpan = document.querySelector('.user-info span');

        if (currentUser) {
            // En una app real, usaríamos la foto del usuario o un avatar basado en el nombre
            userInfoImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nombre)}&background=random`;
            userInfoSpan.textContent = currentUser.nombre;
        }

        // Aquí podríamos mostrar/ocultar elementos según el rol del usuario
        updateUIBasedOnRole();
    }

    // Actualizar interfaz según rol del usuario
    function updateUIBasedOnRole() {
        // En una implementación completa, mostraríamos/ocultaríamos elementos según el rol
        // Por ahora, dejamos todo visible para demostración
    }

    // Cargar datos iniciales del dashboard
    function loadDashboardData() {
        // En una app real, haríamos múltiples llamadas al backend para cargar:
        // - Anuncios recientes
        // - Archivos recientes
        // - Próximos eventos
        // - Docentes del departamento

        // Por ahora, simulamos con datos estáticos (ya están en el HTML)
        // Pero en una app real, haríamos algo como:
        /*
        Promise.all([
            fetchApi('/api/anuncios?limite=5'),
            fetchApi('/api/archivos?limite=5'),
            fetchApi('/api/eventos/proximos'),
            fetchApi(`/api/departamentos/${currentUser.departamentoId}/docentes`)
        ]).then(([anuncios, archivos, eventos, docentes]) => {
            // Actualizar el DOM con los datos recibidos
            updateAnnouncementsList(anuncios);
            updateFilesList(archivos);
            updateEventsList(eventos);
            updateTeachersList(docentes);
        });
        */
    }

    // Cargar departamentos para el select en el modal de anuncio
    function loadDepartmentsForSelect() {
        const departmentSelect = document.getElementById('announcementDepartment');
        if (!departmentSelect) return;

        // Mostrar opciones de carga
        departmentSelect.innerHTML = '<option value="">Cargando departamentos...</option>';

        // Simular llamada al backend
        simulateApiCall('/api/departamentos', {}, 'GET')
            .then(response => {
                if (response.success && response.departamentos) {
                    departmentSelect.innerHTML = '<option value="">Seleccione departamento</option>';
                    response.departamentos.forEach(dept => {
                        const option = document.createElement('option');
                        option.value = dept._id;
                        option.textContent = dept.nombre;
                        departmentSelect.appendChild(option);
                    });
                } else {
                    departmentSelect.innerHTML = '<option value="">Error al cargar departamentos</option>';
                }
            })
            .catch(error => {
                console.error('Error loading departments:', error);
                departmentSelect.innerHTML = '<option value="">Error al cargar departamentos</option>';
            });
    }

    // Realizar búsqueda
    function performSearch(query) {
        if (!query.trim()) return;

        // En una app real, esto haría una llamada al backend de búsqueda
        // Por ahora, simulamos
        showSuccess(`Buscando: "${query}"`);
        // Aquí redirigiríamos a una página de resultados o mostraríamos un modal
    }

    // Simular llamada al backend (para desarrollo)
    function simulateApiCall(endpoint, data, method = 'GET') {
        return new Promise((resolve, reject) => {
            // Simular latencia de red
            setTimeout(() => {
                // Simular diferentes respuestas según el endpoint
                if (endpoint === '/api/auth/login') {
                    // Simular login exitoso con credenciales de prueba
                    if (data.email === 'docente@cbti258.edu.mx' && data.password === '123456') {
                        resolve({
                            success: true,
                            user: {
                                _id: 'user123',
                                nombre: 'Docente Ejemplo',
                                email: data.email,
                                rol: 'docente',
                                departamento: {
                                    _id: 'dept1',
                                    nombre: 'Académico'
                                }
                            }
                        });
                    } else if (data.email === 'admin@cbti258.edu.mx' && data.password === 'admin123') {
                        resolve({
                            success: true,
                            user: {
                                _id: 'admin123',
                                nombre: 'Administrador Sistema',
                                email: data.email,
                                rol: 'administrador',
                                departamento: null
                            }
                        });
                    } else if (data.email === 'jefe@cbti258.edu.mx' && data.password === 'jefe123') {
                        resolve({
                            success: true,
                            user: {
                                _id: 'jefe123',
                                nombre: 'Jefe de Departamento',
                                email: data.email,
                                rol: 'jefe_departamento',
                                departamento: {
                                    _id: 'dept1',
                                    nombre: 'Académico'
                                }
                            }
                        });
                    } else {
                        resolve({
                            success: false,
                            message: 'Credenciales inválidas'
                        });
                    }
                } else if (endpoint === '/api/auth/register') {
                    resolve({
                        success: true,
                        message: 'Usuario registrado exitosamente'
                    });
                } else if (endpoint === '/api/auth/logout') {
                    resolve({ success: true });
                } else if (endpoint === '/api/departamentos') {
                    resolve({
                        success: true,
                        departamentos: [
                            { _id: 'dept1', nombre: 'Académico' },
                            { _id: 'dept2', nombre: 'Servicios Escolares' },
                            { _id: 'dept3', nombre: 'Vinculación' },
                            { _id: 'dept4', nombre: 'Orientación' },
                            { _id: 'dept5', nombre: 'Control Escolar' }
                        ]
                    });
                } else if (endpoint === '/api/anuncios' && method === 'GET') {
                    resolve({
                        success: true,
                        anuncios: [
                            {
                                _id: 'ann1',
                                titulo: 'Reunión de Departamento',
                                descripcion: 'Se informa que hoy habrá reunión de departamento a las 3:00 PM en la sala de juntas.',
                                departamento: { _id: 'dept1', nombre: 'Académico' },
                                autor: { _id: 'user456', nombre: 'Jefe de Departamento' },
                                fechaPublicacion: new Date().toISOString(),
                                importante: true,
                                prioridad: 'alta'
                            },
                            {
                                _id: 'ann2',
                                titulo: 'Entrega de Calificaciones',
                                descripcion: 'Recuerde entregar las calificaciones del parcial antes del viernes.',
                                departamento: { _id: 'dept1', nombre: 'Académico' },
                                autor: { _id: 'user456', nombre: 'Jefe de Departamento' },
                                fechaPublicacion: new Date(Date.now() - 86400000).toISOString(), // Ayer
                                importante: false,
                                prioridad: 'media'
                            }
                        ]
                    });
                } else if (endpoint === '/api/anuncios' && method === 'POST') {
                    resolve({
                        success: true,
                        message: 'Anuncio creado exitosamente',
                        anuncio: {
                            _id: 'ann' + Date.now(),
                            titulo: data.titulo,
                            descripcion: data.descripcion,
                            departamento: { _id: data.departamento, nombre: 'Departamento' },
                            autor: { _id: 'user123', nombre: currentUser.nombre },
                            fechaPublicacion: new Date().toISOString(),
                            importante: data.importante,
                            prioridad: data.prioridad
                        }
                    });
                } else if (endpoint === '/api/archivos' && method === 'GET') {
                    resolve({
                        success: true,
                        archivos: [
                            {
                                _id: 'file1',
                                nombreOriginal: 'Plan de Estudios.pdf',
                                tipo: 'application/pdf',
                                tamaño: 2400000,
                                departamento: { _id: 'dept1', nombre: 'Académico' },
                                subidoPor: { _id: 'user456', nombre: 'Jefe de Departamento' },
                                fechaSubida: new Date().toISOString()
                            },
                            {
                                _id: 'file2',
                                nombreOriginal: 'Lista de Alumnos.xlsx',
                                tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                tamaño: 1800000,
                                departamento: { _id: 'dept5', nombre: 'Control Escolar' },
                                subidoPor: { _id: 'user789', nombre: 'Docente de Control Escolar' },
                                fechaSubida: new Date(Date.now() - 86400000).toISOString()
                            }
                        ]
                    });
                } else if (endpoint === '/api/eventos/proximos') {
                    resolve({
                        success: true,
                        eventos: [
                            {
                                _id: 'event1',
                                titulo: 'Reunión de Profesores',
                                descripcion: 'Reunión mensual de profesores para revisión de avances',
                                fechaInicio: new Date(Date.now() + 2 * 86400000).toISOString(), // En 2 días
                                tipo: 'reunion',
                                departamento: { _id: 'dept1', nombre: 'Académico' },
                                creadoPor: { _id: 'user456', nombre: 'Jefe de Departamento' }
                            },
                            {
                                _id: 'event2',
                                titulo: 'Entrega de Proyectos',
                                descripcion: 'Fecha límite para entrega de proyectos finales',
                                fechaInicio: new Date(Date.now() + 7 * 86400000).toISOString(), // En 1 semana
                                tipo: 'entrega',
                                departamento: { _id: 'dept1', nombre: 'Académico' },
                                creadoPor: { _id: 'user123', nombre: currentUser.nombre }
                            }
                        ]
                    });
                } else {
                    // Respuesta genérica para otros endpoints
                    resolve({ success: true, message: 'Operación exitosa' });
                }
            }, Math.random() * 800 + 200); // Latencia entre 200ms y 1000ms
        });
    }

    // Funciones helper para mostrar mensajes
    function showError(message) {
        alert(message); // En una app real, usaríamos un toast o modal de notificación
    }

    function showSuccess(message) {
        alert(message); // En una app real, usaríamos un toast o modal de notificación
    }

    // Inicializar la aplicación
    init();
});

// Funciones utilitarias adicionales que podrían ser necesarias
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}