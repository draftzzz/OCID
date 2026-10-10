// Profesores.js - Frontend logic for Profesores page
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

    // Load profesores data
    loadProfesores();
});

function loadProfesores() {
    fetch('/api/users/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar profesores');
            }
            return response.json();
        })
        .then(profesores => {
            const profesoresList = document.getElementById('profesores-list');
            profesoresList.innerHTML = ''; // Clear previous content

            if (profesores.length === 0) {
                profesoresList.innerHTML = '<p>No hay profesores registrados.</p>';
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
            profesores.forEach(profesor => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${profesor.nombre}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${profesor.email}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${profesor.rol}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${profesor.departamento_id || 'N/A'}</td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            profesoresList.appendChild(table);
        })
        .catch(error => {
            console.error('Error loading profesores:', error);
            document.getElementById('profesores-list').innerHTML =
                '<p>Error al cargar los profesores. Por favor intente más tarde.</p>';
        });
}