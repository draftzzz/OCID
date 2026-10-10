// Alumnos.js - Frontend logic for Alumnos page
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

    // Load alumnos data
    loadAlumnos();
});

function loadAlumnos() {
    // For now, we'll use the same endpoint as users
    // In a more complete implementation, we might filter by role or have a separate endpoint
    fetch('/api/users/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar alumnos');
            }
            return response.json();
        })
        .then(alumnos => {
            const alumnosList = document.getElementById('alumnos-list');
            alumnosList.innerHTML = ''; // Clear previous content

            if (alumnos.length === 0) {
                alumnosList.innerHTML = '<p>No hay alumnos registrados.</p>';
                return;
            }

            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';

            // Create table header
            thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid #001f3f;">Nombre</th>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid #001f3f;">Correo</th>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid #001f3f;">Rol</th>
                    <th style="text-align: left; padding: 12px; border-bottom: 2px solid #001f3f;">Departamento</th>
                </tr>
            `;
            table.appendChild(thead);

            // Create table body
            tbody = document.createElement('tbody');
            alumnos.forEach(alumno => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${alumno.nombre}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${alumno.email}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${alumno.rol}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${alumno.departamento_id || 'N/A'}</td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            alumnosList.appendChild(table);
        })
        .catch(error => {
            console.error('Error loading alumnos:', error);
            document.getElementById('alumnos-list').innerHTML =
                '<p>Error al cargar los alumnos. Por favor intente más tarde.</p>';
        });
}