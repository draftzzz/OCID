/* Lógica propia de mi-departamento.html */
(function () {
  window.OCID_API_BASE = 'https://ocid.onrender.com';

  function iniciarInterfaz() {
    const barraSuperior = document.querySelector('.barra_superior');
    const barraLateral = document.querySelector('.barra_lateral');

    if (!barraSuperior || !barraLateral) return;

    let usuario = null;
    try {
      usuario = JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
    } catch (error) {
      console.error('No se pudieron leer los datos de sesión:', error);
      localStorage.removeItem('usuario_ocid');
    }

    // Cargar nombre y rol correctamente en la barra superior
    const nombreUsuarioEl = document.getElementById('nombreUsuario');
    const rolUsuarioEl = document.getElementById('etiqueta_rol_usuario');
    const avatarEl = document.getElementById('avatar_usuario_circulo');

    if (usuario) {
      if (nombreUsuarioEl) nombreUsuarioEl.textContent = usuario.nombre || usuario.correo || 'Usuario';
      if (rolUsuarioEl) rolUsuarioEl.textContent = usuario.rol || 'Jefe de Departamento';
      if (avatarEl && (usuario.nombre || usuario.correo)) {
        const textoAvatar = (usuario.nombre || usuario.correo).split(/\s+/).slice(0, 2)
          .map(parte => parte.charAt(0)).join('').toUpperCase();
        avatarEl.textContent = textoAvatar;
      }

      // Cargar notificaciones
      if (usuario.id) {
        fetch(window.OCID_API_BASE + '/notificaciones?usuario_id=' + encodeURIComponent(usuario.id))
          .then(async respuesta => {
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar las notificaciones');
            const noLeidas = Array.isArray(datos) ? datos.filter(notificacion => !notificacion.leida).length : 0;
            const indicador = document.getElementById('indicador_notificaciones');
            if (indicador) {
              indicador.textContent = noLeidas;
              indicador.style.display = noLeidas === 0 ? 'none' : '';
            }
          })
          .catch(error => console.error('Error al actualizar el contador de notificaciones:', error));
      }
    } else {
      if (nombreUsuarioEl) nombreUsuarioEl.textContent = 'Invitado';
    }

    // Menú móvil responsive
    if (!barraSuperior.querySelector('.menu_movil')) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'menu_movil';
      boton.setAttribute('aria-label', 'Abrir menú de navegación');
      boton.setAttribute('aria-expanded', 'false');
      boton.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"></path></svg>';
      barraSuperior.prepend(boton);

      const fondo = document.createElement('button');
      fondo.type = 'button';
      fondo.className = 'fondo_menu_movil';
      fondo.setAttribute('aria-label', 'Cerrar menú de navegación');
      document.body.appendChild(fondo);

      function cambiarMenu(abierto) {
        document.body.classList.toggle('menu_movil_abierto', abierto);
        boton.setAttribute('aria-expanded', String(abierto));
      }

      boton.addEventListener('click', () => {
        cambiarMenu(!document.body.classList.contains('menu_movil_abierto'));
      });
      fondo.addEventListener('click', () => cambiarMenu(false));
      barraLateral.querySelectorAll('a').forEach(enlace => {
        enlace.addEventListener('click', () => cambiarMenu(false));
      });
      document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') cambiarMenu(false);
      });
    }

    // Botón de cerrar sesión
    const botonCerrarSesion = document.getElementById('boton_cerrar_sesion');
    if (botonCerrarSesion) {
      botonCerrarSesion.addEventListener('click', evento => {
        evento.preventDefault();
        localStorage.removeItem('usuario_ocid');
        window.location.href = 'login.html';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarInterfaz);
  } else {
    iniciarInterfaz();
  }
})();

let departamentoIdActual = null;

// Función para renderizar integrantes con opciones de inhabilitar (localmente) o eliminar
function renderizar_miembros(lista) {
  const contenedor = document.getElementById("cuerpo_tabla_integrantes");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  lista.forEach(function(miembro) {
    const fila = document.createElement("tr");
    const esInactivo = miembro.estado === 'Inactivo';
    const estadoClase = esInactivo ? 'badge_estado_inactivo' : 'badge_estado_activo';
    const estadoTexto = miembro.estado || 'Activo';

    fila.innerHTML = `
      <td><span class="nombre_miembro">${miembro.nombre}</span></td>
      <td>${miembro.puesto || 'Docente'}</td>
      <td><span class="${estadoClase}" id="estado_usuario_${miembro.id}">${estadoTexto}</span></td>
      <td style="text-align: center; position: relative;">
        <button class="boton_acciones boton_menu_integrante" data-id="${miembro.id}" aria-label="Acciones de usuario" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
        <div id="menu_opciones_integrante_${miembro.id}" style="display: none; position: absolute; right: 20px; top: 30px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; box-shadow: 0px 4px 12px rgba(0,0,0,0.15); z-index: 50; width: 140px; padding: 4px 0; text-align: left;">
          <button class="btn_cambiar_estado" data-id="${miembro.id}" data-estado-actual="${estadoTexto}" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 13px; cursor: pointer; color: #0f172a;" type="button">
            ${estadoTexto === 'Activo' ? 'Hacer Inactivo' : 'Hacer Activo'}
          </button>
          <button class="btn_eliminar_integrante" data-id="${miembro.id}" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 13px; cursor: pointer; color: #ef4444;" type="button">
            Eliminar
          </button>
        </div>
      </td>
    `;
    contenedor.appendChild(fila);
  });

  // Abrir o cerrar menú de cada integrante
  document.querySelectorAll('.boton_menu_integrante').forEach(boton => {
    boton.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = boton.getAttribute('data-id');
      const menu = document.getElementById(`menu_opciones_integrante_${id}`);
      
      document.querySelectorAll('[id^="menu_opciones_integrante_"]').forEach(m => {
        if (m.id !== `menu_opciones_integrante_${id}`) m.style.display = 'none';
      });
      const menuDepto = document.getElementById('menu_opciones_departamento');
      if (menuDepto) menuDepto.style.display = 'none';

      if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      }
    });
  });

  // Cambiar estado visualmente (al no existir columna estado en BD backend actual, se gestiona dinámicamente)
  document.querySelectorAll('.btn_cambiar_estado').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const estadoActual = btn.getAttribute('data-estado-actual');
      const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
      
      const badge = document.getElementById(`estado_usuario_${id}`);
      if (badge) {
        badge.textContent = nuevoEstado;
        badge.className = nuevoEstado === 'Inactivo' ? 'badge_estado_inactivo' : 'badge_estado_activo';
      }
      btn.setAttribute('data-estado-actual', nuevoEstado);
      btn.textContent = nuevoEstado === 'Activo' ? 'Hacer Inactivo' : 'Hacer Activo';

      // Cerrar menú
      const menu = document.getElementById(`menu_opciones_integrante_${id}`);
      if (menu) menu.style.display = 'none';
    });
  });

  // Eliminar usuario conectado a la API
  document.querySelectorAll('.btn_eliminar_integrante').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (!confirm('¿Estás seguro de eliminar a este integrante?')) return;
      const id = btn.getAttribute('data-id');

      try {
        const respuesta = await fetch(`${window.OCID_API_BASE}/login/${id}`, {
          method: 'DELETE'
        });
        const datosRespuesta = await respuesta.json();
        if (!respuesta.ok || !datosRespuesta.success) {
          throw new Error(datosRespuesta.error || 'No se pudo eliminar');
        }

        await inicializar_modulo_departamento();
      } catch (err) {
        console.error(err);
        alert(err.message || 'Error al eliminar el integrante.');
      }
    });
  });
}

// Inicialización de datos del departamento
async function inicializar_modulo_departamento() {
  try {
    const [respuestaDepartamentos, respuestaUsuarios, respuestaArchivos, respuestaTareas] = await Promise.all([
      fetch(`${window.OCID_API_BASE}/departamentos`),
      fetch(`${window.OCID_API_BASE}/login`),
      fetch(`${window.OCID_API_BASE}/archivos`),
      fetch(`${window.OCID_API_BASE}/tareas`)
    ]);

    const [departamentos, usuarios, archivos, tareas] = await Promise.all([
      respuestaDepartamentos.json(),
      respuestaUsuarios.json(),
      respuestaArchivos.json().catch(() => []),
      respuestaTareas.json().catch(() => [])
    ]);

    if (!respuestaDepartamentos.ok) throw new Error(departamentos.error || "No se pudieron cargar los departamentos.");
    if (!respuestaUsuarios.ok) throw new Error(usuarios.error || "No se pudieron cargar los docentes.");

    const usuarioActual = JSON.parse(localStorage.getItem("usuario_ocid") || "null");
    const departamentoActual = departamentos.find(item =>
      Number(item.id) === Number(usuarioActual && usuarioActual.departamento_id)
    ) || departamentos[0];
    
    if (!departamentoActual) throw new Error("No hay departamentos registrados.");

    departamentoIdActual = departamentoActual.id;

    const integrantes = usuarios.filter(usuario =>
      Number(usuario.departamento_id) === Number(departamentoActual.id)
    );
    const jefe = usuarios.find(usuario =>
      Number(usuario.id) === Number(departamentoActual.jefe_id)
    );

    document.getElementById("nombre_departamento_texto").textContent = departamentoActual.nombre;
    document.getElementById("detalle_departamento_texto").textContent =
      departamentoActual.descripcion || "Sin descripción disponible.";
    document.getElementById("parrafo_descripcion").textContent =
      departamentoActual.descripcion || "Sin descripción disponible.";
    
    document.getElementById("total_docentes").textContent = integrantes.length;
    document.getElementById("total_documentos").textContent = Array.isArray(archivos) ? archivos.length : 0;
    document.getElementById("total_eventos").textContent = Array.isArray(tareas) ? tareas.length : 0;

    if (jefe) {
      const iniciales = jefe.nombre.split(/\s+/).slice(0, 2)
        .map(parte => parte.charAt(0)).join("").toUpperCase();
      document.getElementById("nombre_jefe").textContent = jefe.nombre;
      document.getElementById("correo_jefe").textContent = jefe.correo;
      document.getElementById("avatar_jefe").textContent = iniciales;
      document.getElementById("modal_destinatario").textContent =
        `${jefe.nombre} (${jefe.correo})`;
    }

    renderizar_miembros(integrantes.map(usuario => ({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      puesto: usuario.rol || "Docente",
      estado: "Activo"
    })));
  } catch (error) {
    console.error(error);
  }
}

// Control de los tres puntitos de la tarjeta general de departamento
const botonOpcionesDepto = document.querySelector('.tarjeta_general .boton_acciones');
const menuOpcionesDepto = document.getElementById('menu_opciones_departamento');
const modalEditarDepto = document.getElementById('modal_editar_departamento');

if (botonOpcionesDepto && menuOpcionesDepto) {
  botonOpcionesDepto.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('[id^="menu_opciones_integrante_"]').forEach(m => m.style.display = 'none');
    
    const rect = botonOpcionesDepto.getBoundingClientRect();
    menuOpcionesDepto.style.top = (rect.bottom + window.scrollY) + 'px';
    menuOpcionesDepto.style.left = (rect.left - 120 + window.scrollX) + 'px';
    menuOpcionesDepto.style.display = menuOpcionesDepto.style.display === 'block' ? 'none' : 'block';
  });
}

const opcionEditarDepto = document.getElementById('opcion_editar_departamento');
if (opcionEditarDepto) {
  opcionEditarDepto.addEventListener('click', () => {
    menuOpcionesDepto.style.display = 'none';
    document.getElementById('input_editar_nombre_depto').value = document.getElementById('nombre_departamento_texto').textContent;
    document.getElementById('input_editar_desc_depto').value = document.getElementById('parrafo_descripcion').textContent;
    modalEditarDepto.style.display = 'flex';
  });
}

const cerrarModalDepto = document.getElementById('boton_cerrar_modal_depto');
const cancelarModalDepto = document.getElementById('boton_cancelar_modal_depto');
if (cerrarModalDepto) cerrarModalDepto.addEventListener('click', () => modalEditarDepto.style.display = 'none');
if (cancelarModalDepto) cancelarModalDepto.addEventListener('click', () => modalEditarDepto.style.display = 'none');

// Guardar cambios del departamento (Nota: Requiere que exista el endpoint en el backend si se desea persistir en BD)
const guardarModalDepto = document.getElementById('boton_guardar_modal_depto');
if (guardarModalDepto) {
  guardarModalDepto.addEventListener('click', async () => {
    const nuevoNombre = document.getElementById('input_editar_nombre_depto').value.trim();
    const nuevaDesc = document.getElementById('input_editar_desc_depto').value.trim();

    if (!nuevoNombre) {
      alert('El nombre del departamento no puede estar vacío.');
      return;
    }

    try {
      const respuesta = await fetch(`${window.OCID_API_BASE}/departamentos/${departamentoIdActual}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre, descripcion: nuevaDesc })
      });

      if (!respuesta.ok) throw new Error('No se pudo actualizar el departamento');

      modalEditarDepto.style.display = 'none';
      await inicializar_modulo_departamento();
    } catch (error) {
      // Fallback visual si el backend no tiene implementado el PUT de departamentos aún
      document.getElementById("nombre_departamento_texto").textContent = nuevoNombre;
      document.getElementById("detalle_departamento_texto").textContent = nuevaDesc;
      document.getElementById("parrafo_descripcion").textContent = nuevaDesc;
      modalEditarDepto.style.display = 'none';
    }
  });
}

// Cerrar menús al hacer clic fuera
window.addEventListener('click', () => {
  if (menuOpcionesDepto) menuOpcionesDepto.style.display = 'none';
  document.querySelectorAll('[id^="menu_opciones_integrante_"]').forEach(m => m.style.display = 'none');
});

// Control del modal interactivo de contacto
const modal = document.getElementById("modal_contacto");
const boton_abrir = document.getElementById("boton_abrir_contacto");
const boton_cerrar = document.getElementById("boton_cerrar_modal");
const boton_cancelar = document.getElementById("boton_cancelar_modal");
const boton_enviar = document.getElementById("boton_enviar_mensaje");

if (boton_abrir && modal) {
  boton_abrir.addEventListener("click", function() {
    modal.style.display = "flex";
  });
}

function ocultar_modal() {
  if (modal) modal.style.display = "none";
}

if (boton_cerrar) boton_cerrar.addEventListener("click", ocultar_modal);
if (boton_cancelar) boton_cancelar.addEventListener("click", ocultar_modal);

if (boton_enviar) {
  boton_enviar.addEventListener("click", function() {
    const correo = document.getElementById("correo_jefe").textContent.trim();
    const asunto = document.getElementById("asunto_mensaje").value.trim();
    const mensaje = document.getElementById("cuerpo_mensaje").value.trim();
    if (!correo || !asunto || !mensaje) {
      document.getElementById("cuerpo_mensaje").setCustomValidity(
        "Completa el asunto y el mensaje antes de continuar."
      );
      document.getElementById("cuerpo_mensaje").reportValidity();
      return;
    }
    document.getElementById("cuerpo_mensaje").setCustomValidity("");
    window.location.href = `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
    ocultar_modal();
  });
}

window.addEventListener("DOMContentLoaded", inicializar_modulo_departamento);