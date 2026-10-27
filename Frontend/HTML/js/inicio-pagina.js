/* L?gica propia de inicio.html */
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

const $ = id => document.getElementById(id);
    const API = window.OCID_API_BASE;

    let usuario = null;

    try {
      usuario = JSON.parse(localStorage.getItem('usuario_ocid'));
    } catch (error) {
      localStorage.removeItem('usuario_ocid');
    }

    if (!usuario || !usuario.id) {
      window.location.replace('login.html');
    } else {
      $('nombreUsuario').textContent =
        usuario.nombre || usuario.correo || 'Usuario';
    }

    document.addEventListener('DOMContentLoaded', () => {
      if (!usuario || !usuario.id) return;

      cargarUsuarios();
      cargarAnuncios();
      cargarDepartamentos();
    });

    function escaparHTML(valor) {
      return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[caracter]);
    }

    async function leerRespuesta(res) {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error en la solicitud.');
      }

      return data;
    }

    function mostrarMensaje(texto, esError = false) {
      const aviso = $('aviso_notificacion');

      aviso.textContent = texto;
      aviso.className = 'alerta_mensaje ' +
        (esError ? 'alerta_error' : 'alerta_exito');

      aviso.style.display = 'block';
    }

    function mostrarSeccion(seccion, boton) {
      $('modulo_usuarios').style.display =
        seccion === 'usuarios' ? 'block' : 'none';

      $('modulo_anuncios').style.display =
        seccion === 'anuncios' ? 'block' : 'none';

      $('modulo_departamentos').style.display =
        seccion === 'departamentos' ? 'block' : 'none';

      document.querySelectorAll('.item_menu').forEach(elemento => {
        elemento.classList.remove('activo');
      });

      if (boton) boton.classList.add('activo');
    }

    async function cargarUsuarios() {
      const tbody = $('tabla_usuarios_body');

      try {
        const res = await fetch(API + '/login');
        const data = await leerRespuesta(res);

        $('conteo_usr').textContent = data.length;

        if (!data.length) {
          tbody.innerHTML =
            '<tr><td colspan="6">No hay usuarios registrados.</td></tr>';
          return;
        }

        tbody.innerHTML = data.map(u => `
          <tr>
            <td>#${Number(u.id)}</td>
            <td>${escaparHTML(u.nombre)}</td>
            <td>${escaparHTML(u.correo)}</td>
            <td>
              <span class="badge_tag">
                ${escaparHTML(u.rol || 'Docente')}
              </span>
            </td>
            <td>${escaparHTML(u.departamento_nombre || 'General')}</td>
            <td>
              <button class="boton_eliminar"
                onclick="eliminarUsuario(${Number(u.id)})">
                Eliminar
              </button>
            </td>
          </tr>
        `).join('');

      } catch (error) {
        tbody.innerHTML =
          `<tr><td colspan="6">${escaparHTML(error.message)}</td></tr>`;
      }
    }

    async function registrarUsuario(evento) {
      evento.preventDefault();

      const payload = {
        nombre: $('usr_nombre').value.trim(),
        correo: $('usr_correo').value.trim(),
        password: $('usr_pass').value,
        rol: $('usr_rol').value
      };

      try {
        const res = await fetch(API + '/registro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await leerRespuesta(res);

        if (data.success) {
          $('form_nuevo_usuario').reset();
          mostrarMensaje('Usuario registrado correctamente.');
          await cargarUsuarios();
        } else {
          mostrarMensaje(data.error || 'No se pudo registrar.', true);
        }

      } catch (error) {
        mostrarMensaje(error.message, true);
      }
    }

    async function eliminarUsuario(id) {
      if (Number(id) === Number(usuario.id)) {
        mostrarMensaje('No puedes eliminar el usuario de tu sesión actual.', true);
        return;
      }

      if (!confirm('¿Seguro que quieres eliminar este usuario?')) return;

      try {
        const res = await fetch(API + '/login/' + Number(id), {
          method: 'DELETE'
        });

        const data = await leerRespuesta(res);

        if (!data.success) {
          throw new Error(data.error || 'No se pudo eliminar el usuario.');
        }

        mostrarMensaje('Usuario eliminado correctamente.');
        await cargarUsuarios();

      } catch (error) {
        mostrarMensaje(error.message, true);
      }
    }

    async function cargarAnuncios() {
      const contenedor = $('lista_anuncios');

      try {
        const res = await fetch(API + '/anuncios');
        const data = await leerRespuesta(res);

        $('conteo_anu').textContent = data.length;

        if (!data.length) {
          contenedor.innerHTML =
            '<p class="texto_vacio">No hay anuncios publicados.</p>';
          return;
        }

        contenedor.innerHTML = data.map(a => `
          <article class="tarjeta_anuncio">
            <div class="encabezado_anuncios">
              <span class="badge_tag">
                ${escaparHTML(a.prioridad || 'Informativo')}
              </span>

              <button class="boton_eliminar"
                onclick="eliminarAnuncio(${Number(a.id)})">
                Eliminar
              </button>
            </div>

            <h3>${escaparHTML(a.titulo)}</h3>

            <div class="contenido_anuncio">${escaparHTML(a.contenido)}</div>

            <div class="info_anuncio">
              Autor: ${escaparHTML(a.autor_nombre || 'Administración')}
            </div>

            <div class="info_anuncio">
              ${a.fecha
                ? escaparHTML(new Date(a.fecha).toLocaleString())
                : ''}
            </div>
          </article>
        `).join('');

      } catch (error) {
        contenedor.innerHTML =
          `<p class="texto_vacio">${escaparHTML(error.message)}</p>`;
      }
    }

    async function publicarAnuncio(evento) {
      evento.preventDefault();

      let usuarioActual;

      try {
        usuarioActual = JSON.parse(localStorage.getItem('usuario_ocid'));
      } catch (error) {
        usuarioActual = null;
      }

      if (!usuarioActual || !usuarioActual.id) {
        mostrarMensaje('Inicia sesión nuevamente para publicar.', true);
        window.location.replace('login.html');
        return;
      }

      const payload = {
        titulo: $('anu_titulo').value.trim(),
        contenido: $('anu_contenido').value.trim(),
        prioridad: $('anu_prioridad').value,
        autor_id: Number(usuarioActual.id),
        departamento_id: usuarioActual.departamento_id || null
      };

      try {
        const res = await fetch(API + '/anuncios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await leerRespuesta(res);

        if (!data.success) {
          throw new Error(data.error || 'No se pudo publicar el anuncio.');
        }

        $('form_nuevo_anuncio').reset();
        mostrarMensaje('Anuncio publicado correctamente.');
        await cargarAnuncios();

      } catch (error) {
        mostrarMensaje(error.message, true);
      }
    }

    async function eliminarAnuncio(id) {
      if (!confirm('¿Seguro que quieres eliminar este anuncio?')) return;

      try {
        const res = await fetch(API + '/anuncios/' + Number(id), {
          method: 'DELETE'
        });

        const data = await leerRespuesta(res);

        if (!data.success) {
          throw new Error(data.error || 'No se pudo eliminar el anuncio.');
        }

        mostrarMensaje('Anuncio eliminado correctamente.');
        await cargarAnuncios();

      } catch (error) {
        mostrarMensaje(error.message, true);
      }
    }

    async function cargarDepartamentos() {
      const tbody = $('tabla_deptos_body');

      try {
        const res = await fetch(API + '/departamentos');
        const data = await leerRespuesta(res);

        $('conteo_dep').textContent = data.length;

        if (!data.length) {
          tbody.innerHTML =
            '<tr><td colspan="4">No hay departamentos registrados.</td></tr>';
          return;
        }

        tbody.innerHTML = data.map(d => `
          <tr>
            <td>#${Number(d.id)}</td>
            <td>${escaparHTML(d.nombre)}</td>
            <td>${escaparHTML(d.descripcion || 'Sin descripción')}</td>
            <td>${escaparHTML(d.nombre_jefe || 'Sin jefe asignado')}</td>
          </tr>
        `).join('');

      } catch (error) {
        tbody.innerHTML =
          `<tr><td colspan="4">${escaparHTML(error.message)}</td></tr>`;
      }
    }

    function cerrarSesion() {
      localStorage.removeItem('usuario_ocid');
      window.location.replace('login.html');
    }

document.querySelectorAll('[data-evento-pagina="evento-1"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { mostrarSeccion('usuarios', this) }); });
document.querySelectorAll('[data-evento-pagina="evento-2"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { mostrarSeccion('anuncios', this) }); });
document.querySelectorAll('[data-evento-pagina="evento-3"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { mostrarSeccion('departamentos', this) }); });
document.querySelectorAll('[data-evento-pagina="evento-4"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cerrarSesion() }); });
document.querySelectorAll('[data-evento-pagina="evento-5"]').forEach(function (elemento) { elemento.addEventListener('submit', function (event) { registrarUsuario(event) }); });
document.querySelectorAll('[data-evento-pagina="evento-6"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cargarUsuarios() }); });
document.querySelectorAll('[data-evento-pagina="evento-7"]').forEach(function (elemento) { elemento.addEventListener('submit', function (event) { publicarAnuncio(event) }); });
document.querySelectorAll('[data-evento-pagina="evento-8"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cargarAnuncios() }); });
document.querySelectorAll('[data-evento-pagina="evento-9"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cargarDepartamentos() }); });
