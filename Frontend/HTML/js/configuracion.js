/* L?gica propia de configuracion.html */
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

    const nombre = usuario && (usuario.nombre || usuario.correo);
    const etiquetaNombre = document.querySelector(
      '.nombre_usuario, .nombre_perfil, .nombre_usuario_superior'
    );
    const etiquetaRol = document.querySelector(
      '.rol_usuario, .cargo_perfil, .rol_usuario_superior, .cargo_usuario'
    );
    const avatar = document.querySelector(
      '.avatar_usuario, .avatar_perfil, .avatar_superior'
    );

    if (nombre && etiquetaNombre) etiquetaNombre.textContent = nombre;
    if (usuario && usuario.rol && etiquetaRol) etiquetaRol.textContent = usuario.rol;
    if (nombre && avatar) {
      avatar.textContent = nombre.split(/\s+/).slice(0, 2)
        .map(parte => parte.charAt(0)).join('').toUpperCase();
    }

    if (usuario && usuario.id) {
      fetch(window.OCID_API_BASE + '/notificaciones?usuario_id=' + encodeURIComponent(usuario.id))
        .then(async respuesta => {
          const datos = await respuesta.json();
          if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar las notificaciones');
          const noLeidas = Array.isArray(datos) ? datos.filter(notificacion => !notificacion.leida).length : 0;
          document.querySelectorAll(
            '.badge_campana, .insignia_notificacion, .etiqueta_notificaciones, .insignia_notificacion_lateral'
          ).forEach(insignia => {
            insignia.textContent = noLeidas;
            insignia.style.display = noLeidas === 0 ? 'none' : '';
          });
        })
        .catch(error => console.error('Error al actualizar el contador de notificaciones:', error));
    }

    document.querySelectorAll('.boton_campana').forEach(boton => {
      boton.addEventListener('click', () => {
        window.location.href = 'notificaciones.html';
      });
    });

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

    barraLateral.querySelectorAll('a[href="#"]').forEach(enlace => {
      if (enlace.textContent.toLowerCase().includes('cerrar sesión')) {
        enlace.href = 'login.html';
        enlace.addEventListener('click', evento => {
          evento.preventDefault();
          localStorage.removeItem('usuario_ocid');
          window.location.href = 'login.html';
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarInterfaz);
  } else {
    iniciarInterfaz();
  }
})();

const apiConfiguracion = window.OCID_API_BASE;
    const modalCierre = document.getElementById('modal_confirmar_cierre');
    const botonAbrirModal = document.getElementById('boton_abrir_modal_cerrar');
    const botonCancelarModal = document.getElementById('boton_cancelar_modal');
    const botonConfirmarCierre = document.getElementById('boton_confirmar_cierre_definitivo');
    
    const toast = document.getElementById('toast_mensaje');
    const textoToast = document.getElementById('texto_toast');

    const formPerfil = document.getElementById('formulario_datos_perfil');
    const formContrasena = document.getElementById('formulario_contrasena');

    function usuarioConfiguracion() {
      try {
        return JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
      } catch (error) {
        console.error('No se pudo leer la sesión:', error);
        return null;
      }
    }

    async function respuestaConfiguracion(ruta, opciones) {
      const respuesta = await fetch(apiConfiguracion + ruta, opciones);
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudo guardar el cambio');
      return datos;
    }

    function mostrarNotificacion(mensaje) {
      textoToast.textContent = mensaje;
      toast.classList.add('toast_visible');
      setTimeout(() => {
        toast.classList.remove('toast_visible');
      }, 3500);
    }

    // Modal de Cierre de Sesión
    botonAbrirModal.addEventListener('click', () => {
      modalCierre.style.display = 'flex';
    });

    botonCancelarModal.addEventListener('click', () => {
      modalCierre.style.display = 'none';
    });

    modalCierre.addEventListener('click', (evento) => {
      if (evento.target === modalCierre) {
        modalCierre.style.display = 'none';
      }
    });

    botonConfirmarCierre.addEventListener('click', () => {
      modalCierre.style.display = 'none';
      localStorage.removeItem('usuario_ocid');
      window.location.href = 'login.html';
    });

    formPerfil.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const usuario = usuarioConfiguracion();
      if (!usuario || !usuario.id) {
        mostrarNotificacion('Inicia sesión para actualizar tu perfil.');
        return;
      }
      try {
        const datos = await respuestaConfiguracion('/usuarios/' + encodeURIComponent(usuario.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: document.getElementById('campo_nombre_completo').value.trim(),
            correo: document.getElementById('campo_correo_electronico').value.trim(),
            departamento_id: document.getElementById('campo_departamento').value || null
          })
        });
        localStorage.setItem('usuario_ocid', JSON.stringify(datos.usuario));
        document.querySelectorAll('.nombre_usuario, .nombre_usuario_superior').forEach(elemento => {
          elemento.textContent = datos.usuario.nombre;
        });
        mostrarNotificacion('Perfil actualizado correctamente.');
      } catch (error) {
        mostrarNotificacion(error.message);
      }
    });

    formContrasena.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const usuario = usuarioConfiguracion();
      const claveNueva = document.getElementById('campo_clave_nueva').value;
      const claveConfirmacion = document.getElementById('campo_clave_confirmacion').value;

      if (!usuario || !usuario.id) {
        mostrarNotificacion('Inicia sesión para cambiar tu contraseña.');
        return;
      }
      if (claveNueva !== claveConfirmacion) {
        mostrarNotificacion('Las nuevas contraseñas no coinciden.');
        return;
      }
      if (claveNueva.length < 6) {
        mostrarNotificacion('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      try {
        await respuestaConfiguracion('/usuarios/' + encodeURIComponent(usuario.id) + '/password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password_actual: document.getElementById('campo_clave_actual').value,
            password_nueva: claveNueva
          })
        });
        mostrarNotificacion('Contraseña actualizada correctamente.');
        formContrasena.reset();
      } catch (error) {
        mostrarNotificacion(error.message);
      }
    });

    const switches = ['toggle_sistema', 'toggle_tareas', 'toggle_anuncios'];
    let preferencias = {};
    try {
      preferencias = JSON.parse(localStorage.getItem('preferencias_ocid') || '{}');
    } catch (error) {
      console.error('No se pudieron leer las preferencias:', error);
    }
    switches.forEach(idSwitch => {
      const elemento = document.getElementById(idSwitch);
      if (typeof preferencias[idSwitch] === 'boolean') elemento.checked = preferencias[idSwitch];
      elemento.addEventListener('change', () => {
        preferencias[idSwitch] = elemento.checked;
        localStorage.setItem('preferencias_ocid', JSON.stringify(preferencias));
        mostrarNotificacion('Preferencia guardada.');
      });
    });

    async function cargarPerfilConfiguracion() {
      const usuario = usuarioConfiguracion();
      if (!usuario) return;
      document.getElementById('campo_nombre_completo').value = usuario.nombre || '';
      document.getElementById('campo_correo_electronico').value = usuario.correo || '';
      document.getElementById('campo_rol_usuario').value = usuario.rol || '';
      const departamentos = await respuestaConfiguracion('/departamentos');
      const selector = document.getElementById('campo_departamento');
      selector.replaceChildren(new Option('Sin departamento', ''));
      departamentos.forEach(departamento => selector.add(new Option(departamento.nombre, departamento.id)));
      selector.value = usuario.departamento_id ? String(usuario.departamento_id) : '';
    }

    cargarPerfilConfiguracion().catch(error => {
      console.error(error);
      mostrarNotificacion(error.message);
    });

