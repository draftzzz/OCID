// Historial.js - Frontend logic for Historial page
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

    // Load historial data
    loadHistorial();
});

function loadHistorial() {
    const historialList = document.getElementById('historial-list');
    historialList.innerHTML = '<p>Cargando historial...</p>';

    // For now, we'll show some sample data
    // In a real implementation, this would fetch from notifications or activity logs
    setTimeout(() => {
        historialList.innerHTML = `
            <div class="historial-item">
                <h3>Inicio del ciclo escolar 2026-2027</h3>
                <p>21 de agosto de 2026 - Se inició el nuevo ciclo escolar con éxito.</p>
                <small>Hace 2 meses</small>
            </div>
            <div class="historial-item">
                <h3>Reunión de padres de familia</h3>
                <p>15 de septiembre de 2026 - Se realizó la reunión informativa para padres.</p>
                <small>Hace 1.5 meses</small>
            </div>
            <div class="historial-item">
                <h3>Festival Cultural Escolar</h3>
                <p>30 de octubre de 2026 - Se celebró el festival cultural con participación estudiantil.</p>
                <small>Hace 1 mes</small>
            </div>
        `;
    }, 1000);
}