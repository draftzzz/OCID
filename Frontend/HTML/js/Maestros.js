// Maestros.js - Frontend logic for Maestros page
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

    // Load maestros form
    loadMaestrosForm();
});

function loadMaestrosForm() {
    const maestrosForm = document.getElementById('maestros-form');
    maestrosForm.innerHTML = `
        <form id="maestroForm">
            <div>
                <label for="nombre">Nombre:</label>
                <input type="text" id="nombre" name="nombre" required>
            </div>
            <div>
                <label for="email">Correo electrónico:</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div>
                <label for="departamento">Departamento:</label>
                <select id="departamento" name="departamento">
                    <option value="">Seleccione un departamento</option>
                    <!-- Departments will be populated here -->
                </select>
            </div>
            <div>
                <label for="rol">Rol:</label>
                <select id="rol" name="rol">
                    <option value="docente">Docente</option>
                    <option value="jefe_departamento">Jefe de Departamento</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>
            <button type="submit">Registrar Maestro</button>
        </form>
    `;

    // Handle form submission
    const form = document.getElementById('maestroForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const departamento = document.getElementById('departamento').value;
        const rol = document.getElementById('rol').value;

        // In a real app, this would send data to the backend
        fetch('/api/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, email, departamento_id: departamento, rol })
        })
        .then(response => response.json())
        .then(data => {
            alert('Maestro registrado exitosamente');
            form.reset();
        })
        .catch(error => {
            console.error('Error registering maestro:', error);
            alert('Error al registrar maestro');
        });
    });

    // Load departments for the dropdown
    loadDepartamentosForForm();
}

function loadDepartamentosForForm() {
    fetch('/api/departamentos/')
        .then(response => response.json())
        .then(departamentos => {
            const select = document.getElementById('departamento');
            departamentos.forEach(depto => {
                const option = document.createElement('option');
                option.value = depto.id;
                option.textContent = depto.nombre;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading departments:', error);
        });
}