// Inicio.js - Frontend logic for Inicio (dashboard) page
document.addEventListener('DOMContentLoaded', function() {
    // Fetch user data for welcome message
    fetch('/api/usuario/1') // In a real app, this would come from session
        .then(response => response.json())
        .then(data => {
            document.getElementById('usuario').textContent = data.usuario || 'Usuario';
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            document.getElementById('usuario').textContent = 'Usuario';
        });

    // Load dashboard data
    loadDashboardStats();
    loadRecentActivity();
    loadUpcomingEvents();
});

function loadDashboardStats() {
    // Load counts for dashboard stats
    Promise.all([
        fetch('/api/users/').then(res => res.json()).then(users => users.filter(u => u.rol === 'docente').length),
        fetch('/api/users/').then(res => res.json()).then(users => users.length),
        fetch('/api/anuncios/').then(res => res.json()).then(anuncios => anuncios.length),
        fetch('/api/tareas/').then(res => res.json()).then(tareas => tareas.filter(t => t.estado !== 'completada').length)
    ]).then(([profesoresCount, alumnosCount, anunciosCount, tareasPendientes]) => {
        document.getElementById('count-profesores').textContent = profesoresCount;
        document.getElementById('count-alumnos').textContent = alumnosCount;
        document.getElementById('count-anuncios').textContent = anunciosCount;
        document.getElementById('count-tareas').textContent = tareasPendientes;
    }).catch(error => {
        console.error('Error loading dashboard stats:', error);
    });
}

function loadRecentActivity() {
    const activityFeed = document.getElementById('activity-feed');
    activityFeed.innerHTML = '<p>Cargando actividad reciente...</p>';

    // Fetch notifications for the current user (assuming user ID 1 for now)
    fetch('/api/notificaciones/')
        .then(response => response.json())
        .then(notificaciones => {
            if (notificaciones.length === 0) {
                activityFeed.innerHTML = '<p>No hay actividad reciente.</p>';
                return;
            }

            // Show last 5 notifications
            const recent = notificaciones.slice(0, 5);
            activityFeed.innerHTML = '';

            recent.forEach(notif => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <div class="activity-content">
                        <p>${notif.mensaje}</p>
                        <small>${new Date(notif.creado_en).toLocaleDateString()}</small>
                    </div>
                `;
                activityFeed.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading recent activity:', error);
            activityFeed.innerHTML = '<p>Error al cargar la actividad reciente.</p>';
        });
}

function loadUpcomingEvents() {
    const eventsList = document.getElementById('events-list');
    eventsList.innerHTML = '<p>Cargando próximos eventos...</p>';

    fetch('/api/calendario/')
        .then(response => response.json())
        .then(eventos => {
            // Filter for upcoming events (today or future)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = eventos.filter(evento => {
                const eventDate = new Date(evento.fecha);
                return eventDate >= today;
            }).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            if (upcoming.length === 0) {
                eventsList.innerHTML = '<p>No hay eventos próximos.</p>';
                return;
            }

            // Show next 5 events
            const toShow = upcoming.slice(0, 5);
            eventsList.innerHTML = '';

            toShow.forEach(evento => {
                const item = document.createElement('div');
                item.className = 'event-item';
                item.innerHTML = `
                    <div class="event-content">
                        <h3>${evento.titulo}</h3>
                        <p>${evento.descripcion || 'Sin descripción'}</p>
                        <small>${new Date(evento.fecha).toLocaleDateString()}</small>
                        ${evento.ubicacion ? `<p><strong>Ubicación:</strong> ${evento.ubicacion}</p>` : ''}
                    </div>
                `;
                eventsList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error loading upcoming events:', error);
            eventsList.innerHTML = '<p>Error al cargar los próximos eventos.</p>';
        });
}