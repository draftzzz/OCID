/* L?gica propia de notificaciones.html */
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

let filtroActual = 'todas';
    let notificacionesUsuario = [];
    let idUsuarioNotificaciones = null;

    function actualizarContadores() {
      const noLeidas = notificacionesUsuario.filter(item => !item.leida).length;
      const leidas = notificacionesUsuario.length - noLeidas;
      document.getElementById('conteo_todas').textContent = notificacionesUsuario.length;
      document.getElementById('conteo_no_leidas').textContent = noLeidas;
      document.getElementById('conteo_leidas').textContent = leidas;
      ['badge_superior', 'badge_lateral'].forEach(id => {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.style.display = noLeidas ? '' : 'none';
        badge.textContent = noLeidas;
      });
    }

    function cambiarFiltro(tipo) {
      filtroActual = tipo;
      document.getElementById('pestana_todas').classList.remove('pestana_filtro_activa');
      document.getElementById('pestana_no_leidas').classList.remove('pestana_filtro_activa');
      document.getElementById('pestana_leidas').classList.remove('pestana_filtro_activa');
      const pestana = tipo === 'todas' ? 'pestana_todas' : tipo === 'no_leidas' ? 'pestana_no_leidas' : 'pestana_leidas';
      document.getElementById(pestana).classList.add('pestana_filtro_activa');
      dibujarNotificaciones();
    }

    function dibujarNotificaciones() {
      const lista = document.getElementById('lista_notificaciones');
      lista.replaceChildren();
      const visibles = notificacionesUsuario.filter(item =>
        tipoVisible(item)
      );
      visibles.forEach(item => {
        const articulo = document.createElement('article');
        articulo.className = 'item_notificacion ' + (item.leida ? 'leido' : 'no_leido');
        articulo.dataset.estado = item.leida ? 'leido' : 'no_leido';
        const grupo = document.createElement('div');
        grupo.className = 'flex items-center gap-4';
        const texto = document.createElement('div');
        texto.className = 'flex flex-col gap-1';
        const titulo = document.createElement('span');
        titulo.style.cssText = 'font-size:14px;font-weight:700;color:#0f172a';
        titulo.textContent = item.anuncio_titulo ? 'Nuevo anuncio: ' + item.anuncio_titulo :
          item.tarea_id ? 'Tarea asignada' : 'Notificación del sistema';
        const detalle = document.createElement('span');
        detalle.style.cssText = 'font-size:13px;color:#64748b';
        detalle.textContent = item.anuncio_id ? 'Se publicó un anuncio para la comunidad.' :
          item.tarea_id ? 'Tienes una actualización de tarea.' : 'Actualización de tu cuenta.';
        texto.append(titulo, detalle);
        grupo.appendChild(texto);
        const fecha = document.createElement('span');
        fecha.style.cssText = 'font-size:12px;color:#94a3b8';
        fecha.textContent = item.fecha ? new Date(item.fecha).toLocaleString('es-MX') : '';
        articulo.append(grupo, fecha);
        articulo.addEventListener('click', () => marcarLeida(item));
        lista.appendChild(articulo);
      });
      if (!visibles.length) {
        const vacio = document.createElement('p');
        vacio.style.cssText = 'padding:24px;color:#64748b;text-align:center';
        vacio.textContent = 'No hay notificaciones para mostrar.';
        lista.appendChild(vacio);
      }
      actualizarContadores();
    }

    function tipoVisible(item) {
      return filtroActual === 'todas' ||
        (filtroActual === 'no_leidas' && !item.leida) ||
        (filtroActual === 'leidas' && item.leida);
    }

    async function actualizarNotificaciones(ruta, opciones) {
      const respuesta = await fetch(window.OCID_API_BASE + ruta, opciones);
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron actualizar las notificaciones');
      return datos;
    }

    async function marcarLeida(item) {
      if (item.leida) return;
      try {
        await actualizarNotificaciones('/notificaciones/' + encodeURIComponent(item.id) + '/leida', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: idUsuarioNotificaciones })
        });
        item.leida = true;
        dibujarNotificaciones();
      } catch (error) {
        alert(error.message);
      }
    }

    document.getElementById('boton_marcar_leidas').addEventListener('click', async () => {
      if (!idUsuarioNotificaciones) return;
      try {
        await actualizarNotificaciones('/notificaciones/leidas', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: idUsuarioNotificaciones })
        });
        notificacionesUsuario.forEach(item => { item.leida = true; });
        dibujarNotificaciones();
      } catch (error) {
        alert(error.message);
      }
    });

    document.addEventListener('DOMContentLoaded', async () => {
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
        if (!usuario || !usuario.id) throw new Error('Inicia sesión para consultar notificaciones.');
        idUsuarioNotificaciones = usuario.id;
        notificacionesUsuario = await actualizarNotificaciones('/notificaciones?usuario_id=' + encodeURIComponent(usuario.id));
        dibujarNotificaciones();
      } catch (error) {
        console.error(error);
        const lista = document.getElementById('lista_notificaciones');
        lista.textContent = error.message;
      }
    });

document.querySelectorAll('[data-evento-pagina~="evento-1"]').forEach(function (elemento) { elemento.addEventListener('mouseout', function (event) { this.style.backgroundColor='#2563eb' }); });
document.querySelectorAll('[data-evento-pagina~="evento-2"]').forEach(function (elemento) { elemento.addEventListener('mouseover', function (event) { this.style.backgroundColor='#1d4ed8' }); });
document.querySelectorAll('[data-evento-pagina~="evento-3"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiarFiltro('todas') }); });
document.querySelectorAll('[data-evento-pagina~="evento-4"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiarFiltro('no_leidas') }); });
document.querySelectorAll('[data-evento-pagina~="evento-5"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiarFiltro('leidas') }); });
