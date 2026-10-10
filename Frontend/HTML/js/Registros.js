// Registros.js - Frontend logic for Registros page
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

    // Load registros data
    loadRegistros();
});

function loadRegistros() {
    // For now, we'll use a placeholder since we don't have a specific registros endpoint
    // In a real implementation, this would fetch academic records
    const registrosList = document.getElementById('registros-list');
    registrosList.innerHTML = '<p>Cargando registros...</p>';

    // Simulate loading delay
    setTimeout(() => {
        registrosList.innerHTML = `
            <p>Esta sección mostrará los registros académicos de los alumnos.</p>
            <p>Funcionalidad en desarrollo.</p>
        `;
    }, 1000);
}