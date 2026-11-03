/* ==========================================================================
   Lógica Módulo de Tareas - OCID (Con Paginación de 4 en 4 y Sustitución)
   ========================================================================== */
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
    const etiquetaNombre = document.querySelector('#nombreUsuario, .nombre_usuario, .nombre_perfil');
    const etiquetaRol = document.querySelector('#etiqueta_rol_usuario, .rol_usuario, .cargo_perfil');
    const avatar = document.querySelector('#avatar_usuario_circulo, .avatar_usuario');

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
          document.querySelectorAll('.punto_notificacion, .insignia_notificacion').forEach(insignia => {
            insignia.textContent = noLeidas;
            insignia.style.display = noLeidas === 0 ? 'none' : '';
          });
        })
        .catch(error => console.error('Error al actualizar el contador de notificaciones:', error));
    }

    document.querySelectorAll('.boton_notificaciones').forEach(boton => {
      boton.addEventListener('click', () => {
        window.location.href = 'notificaciones.html';
      });
    });

    // Menú móvil responsive
    const botonHamburguesa = document.querySelector('.boton_menu_hamburguesa');
    if (botonHamburguesa) {
      let fondo = document.querySelector('.fondo_menu_movil');
      if (!fondo) {
        fondo = document.createElement('button');
        fondo.type = 'button';
        fondo.className = 'fondo_menu_movil';
        fondo.setAttribute('aria-label', 'Cerrar menú de navegación');
        document.body.appendChild(fondo);
      }

      function cambiarMenu(abierto) {
        document.body.classList.toggle('menu_movil_abierto', abierto);
        botonHamburguesa.setAttribute('aria-expanded', String(abierto));
      }

      botonHamburguesa.addEventListener('click', () => {
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

/* ==========================================================================
   Gestión de Tareas con Límite de 4 por Página y Paginación (Apartado 2)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const cuerpoTabla = document.getElementById('cuerpo_tabla_tareas');
  const formularioTarea = document.getElementById('formulario_crear_tarea');
  const modal = document.getElementById('modal_nueva_tarea');
  const botonAbrir = document.getElementById('boton_abrir_modal');
  const botonCerrar = document.getElementById('boton_cerrar_modal');
  const botonCancelar = document.getElementById('boton_cancelar_modal');
  const textoConteo = document.getElementById('texto_resumen_conteo');

  const inputTexto = document.getElementById('campo_filtro_texto');
  const selectDepartamento = document.getElementById('filtro_departamento');
  const selectEstado = document.getElementById('filtro_estado');

  const btnAnterior = document.getElementById('boton_pagina_anterior');
  const btnSiguiente = document.getElementById('boton_pagina_siguiente');
  const indicadorPagina = document.getElementById('indicador_pagina_actual');

  let usuarioLocal = null;
  try {
    usuarioLocal = JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
  } catch (e) {
    usuarioLocal = null;
  }
  const claveTareas = 'tareas_ocid_' + (usuarioLocal && usuarioLocal.id ? usuarioLocal.id : 'local');

  let tareas = [];
  let siguienteId = 1;
  let paginaActual = 1;
  const elementosPorPagina = 4;

  function abrirModal() {
    if (modal) modal.style.display = 'flex';
  }

  function cerrarModal() {
    if (modal) modal.style.display = 'none';
    if (formularioTarea) formularioTarea.reset();
  }

  if (botonAbrir) botonAbrir.addEventListener('click', abrirModal);
  if (botonCerrar) botonCerrar.addEventListener('click', cerrarModal);
  if (botonCancelar) botonCancelar.addEventListener('click', cerrarModal);

  if (modal) {
    modal.addEventListener('click', evento => {
      if (evento.target === modal) cerrarModal();
    });
  }

  function guardarTareas() {
    localStorage.setItem(claveTareas, JSON.stringify(tareas));
  }

  function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    if (fechaStr.includes('-')) {
      const partes = fechaStr.split('-');
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  }

  function obtenerTareasFiltradas() {
    const textoBusqueda = inputTexto ? inputTexto.value.toLowerCase().trim() : '';
    const depFiltro = selectDepartamento ? selectDepartamento.value : 'todos';
    const estFiltro = selectEstado ? selectEstado.value : 'todos';

    return tareas.filter(tarea => {
      const coincideTexto = [tarea.titulo, tarea.descripcion, tarea.asignado].join(' ').toLowerCase().includes(textoBusqueda);
      const coincideDep = depFiltro === 'todos' || tarea.departamento === depFiltro;
      const coincideEst = estFiltro === 'todos' || tarea.estado === estFiltro;
      return coincideTexto && coincideDep && coincideEst;
    });
  }

  function renderizarTabla() {
    if (!cuerpoTabla) return;
    cuerpoTabla.replaceChildren();

    const tareasFiltradas = obtenerTareasFiltradas();
    const totalPaginas = Math.ceil(tareasFiltradas.length / elementosPorPagina) || 1;

    if (paginaActual > totalPaginas) {
      paginaActual = totalPaginas;
    }

    const inicio = (paginaActual - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    const tareasPagina = tareasFiltradas.slice(inicio, fin);

    tareasPagina.forEach(tarea => {
      const fila = document.createElement('tr');
      fila.dataset.id = tarea.id;
      fila.dataset.titulo = tarea.titulo;
      fila.dataset.departamento = tarea.departamento;
      fila.dataset.estado = tarea.estado;

      let claseBadge = 'badge_estado ';
      if (tarea.estado === 'Pendiente') claseBadge += 'estado_pendiente';
      else if (tarea.estado === 'En proceso') claseBadge += 'estado_proceso';
      else claseBadge += 'estado_completado';

      fila.innerHTML = `
        <td class="texto_titulo_tarea">${tarea.titulo}</td>
        <td class="texto_descripcion_tarea">${tarea.descripcion}</td>
        <td>${tarea.asignado}</td>
        <td>${tarea.departamento}</td>
        <td>${formatearFecha(tarea.fecha)}</td>
        <td><span class="${claseBadge}">${tarea.estado}</span></td>
        <td class="columna_acciones">
          <button aria-label="Opciones de tarea" class="boton_tres_puntos" type="button">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <div class="menu_flotante_acciones" id="menu_acciones_${tarea.id}">
            <button class="opcion_accion" type="button" data-estado="Pendiente">Pendiente</button>
            <button class="opcion_accion" type="button" data-estado="En proceso">En proceso</button>
            <button class="opcion_accion" type="button" data-estado="Completado">Completado</button>
            <button class="opcion_accion opcion_eliminar" type="button">Eliminar</button>
          </div>
        </td>
      `;

      const botonMenu = fila.querySelector('.boton_tres_puntos');
      const menuAcciones = fila.querySelector('.menu_flotante_acciones');

      botonMenu.addEventListener('click', evento => {
        evento.stopPropagation();
        document.querySelectorAll('.menu_flotante_acciones').forEach(m => {
          if (m !== menuAcciones) m.classList.remove('activo');
        });
        menuAcciones.classList.toggle('activo');
      });

      menuAcciones.querySelectorAll('.opcion_accion[data-estado]').forEach(btnEstado => {
        btnEstado.addEventListener('click', () => {
          tarea.estado = btnEstado.dataset.estado;
          guardarTareas();
          renderizarTabla();
        });
      });

      const btnEliminar = menuAcciones.querySelector('.opcion_eliminar');
      btnEliminar.addEventListener('click', () => {
        tareas = tareas.filter(t => t.id !== tarea.id);
        guardarTareas();
        renderizarTabla();
      });

      cuerpoTabla.appendChild(fila);
    });

    // Actualizar contadores y textos de paginación
    if (textoConteo) {
      textoConteo.textContent = `Mostrando ${tareasFiltradas.length > 0 ? inicio + 1 : 0} a ${Math.min(fin, tareasFiltradas.length)} de ${tareasFiltradas.length} tareas`;
    }
    if (indicadorPagina) {
      indicadorPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    }
    if (btnAnterior) btnAnterior.disabled = paginaActual <= 1;
    if (btnSiguiente) btnSiguiente.disabled = paginaActual >= totalPaginas;
  }

  document.addEventListener('click', () => {
    document.querySelectorAll('.menu_flotante_acciones').forEach(m => m.classList.remove('activo'));
  });

  if (inputTexto) inputTexto.addEventListener('input', () => { paginaActual = 1; renderizarTabla(); });
  if (selectDepartamento) selectDepartamento.addEventListener('change', () => { paginaActual = 1; renderizarTabla(); });
  if (selectEstado) selectEstado.addEventListener('change', () => { paginaActual = 1; renderizarTabla(); });

  if (btnAnterior) {
    btnAnterior.addEventListener('click', () => {
      if (paginaActual > 1) {
        paginaActual--;
        renderizarTabla();
      }
    });
  }

  if (btnSiguiente) {
    btnSiguiente.addEventListener('click', () => {
      const totalPaginas = Math.ceil(obtenerTareasFiltradas().length / elementosPorPagina) || 1;
      if (paginaActual < totalPaginas) {
        paginaActual++;
        renderizarTabla();
      }
    });
  }

  // Carga inicial y sustitución de placeholders estáticos del HTML por almacenamiento local
  try {
    const guardadas = JSON.parse(localStorage.getItem(claveTareas) || 'null');
    if (Array.isArray(guardadas) && guardadas.length > 0) {
      tareas = guardadas;
    } else {
      // Captura los placeholders iniciales del HTML si no hay datos guardados aún
      tareas = [...cuerpoTabla.querySelectorAll('tr')].map((fila, indice) => ({
        id: indice + 1,
        titulo: fila.getAttribute('data-titulo') || fila.querySelector('.texto_titulo_tarea')?.textContent || '',
        descripcion: fila.querySelector('.texto_descripcion_tarea')?.textContent || '',
        asignado: fila.children[2]?.textContent || '',
        departamento: fila.getAttribute('data-departamento') || fila.children[3]?.textContent || '',
        fecha: fila.children[4]?.textContent || '',
        estado: fila.getAttribute('data-estado') || 'Pendiente'
      }));
      guardarTareas();
    }
  } catch (error) {
    console.error('Error al recuperar tareas:', error);
    tareas = [];
  }

  siguienteId = tareas.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0) + 1;
  renderizarTabla();

  // Envío del formulario (Sustituye y agrega dinámicamente)
  if (formularioTarea) {
    formularioTarea.addEventListener('submit', evento => {
      evento.preventDefault();

      const nuevaTarea = {
        id: siguienteId++,
        titulo: document.getElementById('campo_modal_titulo').value.trim(),
        descripcion: document.getElementById('campo_modal_descripcion').value.trim(),
        asignado: document.getElementById('campo_modal_asignado').value.trim(),
        departamento: document.getElementById('campo_modal_departamento').value,
        fecha: document.getElementById('campo_modal_fecha').value,
        estado: document.getElementById('campo_modal_estado').value
      };

      tareas.unshift(nuevaTarea); // Agrega la nueva tarea al principio
      guardarTareas();
      paginaActual = 1; // Vuelve a la primera página para ver la recién creada
      renderizarTabla();
      cerrarModal();
    });
  }
});