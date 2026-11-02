/* Lógica interactiva y de backend para calendario.html usando la tabla 'tareas' */
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
      '.nombre_usuario, .nombre_perfil, .nombre_usuario_superior, #nombreUsuario'
    );
    const etiquetaRol = document.querySelector(
      '.rol_usuario, .cargo_perfil, .rol_usuario_superior, #etiqueta_rol_usuario'
    );
    const avatar = document.querySelector(
      '.avatar_usuario, .avatar_perfil, .avatar_superior, #avatar_usuario_circulo'
    );

    if (nombre && etiquetaNombre) etiquetaNombre.textContent = nombre;
    if (usuario && usuario.rol && etiquetaRol) etiquetaRol.textContent = usuario.rol;
    if (nombre && avatar) {
      const iniciales = nombre.split(/\s+/)
        .slice(0, 2)
        .map(parte => parte.charAt(0))
        .join('')
        .toUpperCase();
      avatar.textContent = iniciales;
      avatar.style.fontSize = '14px';
      avatar.style.fontWeight = '700';
    }

    if (usuario && usuario.id) {
      fetch(window.OCID_API_BASE + '/notificaciones?usuario_id=' + encodeURIComponent(usuario.id))
        .then(async respuesta => {
          const datos = await respuesta.json();
          if (!respuesta.ok) throw new Error('No se pudo cargar');
          const noLeidas = Array.isArray(datos) ? datos.filter(n => !n.leida).length : 0;
          document.querySelectorAll(
            '.badge_campana, .insignia_notificacion, .etiqueta_notificaciones, #indicador_notificaciones'
          ).forEach(insignia => {
            insignia.textContent = noLeidas;
            insignia.style.display = noLeidas === 0 ? 'none' : '';
          });
        })
        .catch(error => console.error('Error al actualizar notificaciones:', error));
    }

    // Menú hamburguesa móvil
    let botonMenu = barraSuperior.querySelector('.menu_movil, .boton_menu_hamburguesa');
    if (!botonMenu) {
      botonMenu = document.createElement('button');
      botonMenu.type = 'button';
      botonMenu.className = 'boton_menu_hamburguesa';
      botonMenu.setAttribute('aria-label', 'Abrir menú');
      botonMenu.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      const seccionIzquierda = barraSuperior.querySelector('.seccion_superior_izquierda') || barraSuperior;
      seccionIzquierda.prepend(botonMenu);
    }

    let fondoMovil = document.querySelector('.fondo_menu_movil');
    if (!fondoMovil) {
      fondoMovil = document.createElement('button');
      fondoMovil.type = 'button';
      fondoMovil.className = 'fondo_menu_movil';
      document.body.appendChild(fondoMovil);
    }

    function alternarMenu(abrir) {
      const estado = abrir !== undefined ? abrir : !document.body.classList.contains('menu_movil_abierto');
      document.body.classList.toggle('menu_movil_abierto', estado);
    }

    botonMenu.addEventListener('click', (e) => { e.stopPropagation(); alternarMenu(); });
    fondoMovil.addEventListener('click', () => alternarMenu(false));
    barraLateral.querySelectorAll('a').forEach(e => e.addEventListener('click', () => alternarMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') alternarMenu(false); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarInterfaz);
  } else {
    iniciarInterfaz();
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mesesCortos = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  
  let tareas = [];
  let fechaSeleccionada = new Date(2026, 8, 15);
  let vistaActual = 'mes';

  const grilla = document.getElementById('contenedor_grilla_dias');
  const listaEventos = document.getElementById('lista_eventos_contenedor');
  const modal = document.getElementById('modal_nuevo_evento');
  const campoFecha = document.getElementById('input_dia_evento');

  function mostrarAviso(mensaje) {
    let aviso = document.getElementById('aviso_calendario');
    if (!aviso) {
      aviso = document.createElement('p');
      aviso.id = 'aviso_calendario';
      aviso.className = 'aviso_docentes aviso_docentes_error';
      const cuerpo = document.querySelector('.cuerpo_pagina');
      if (cuerpo) cuerpo.prepend(aviso);
    }
    aviso.textContent = mensaje;
    aviso.style.display = 'flex';
    setTimeout(() => { aviso.style.display = 'none'; }, 7000);
  }

  function fechaClave(fecha) {
    return fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0');
  }

  async function cargarTareasDesdeDB() {
    try {
      const respuesta = await fetch(`${window.OCID_API_BASE}/tareas`);
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error('No se pudo cargar');
      if (Array.isArray(datos)) {
        tareas = datos;
      } else {
        tareas = [];
      }
    } catch (error) {
      tareas = [];
      mostrarAviso('No se pudo cargar');
    }
    dibujarTodo();
  }

  function dibujarListaEventos() {
    if (!listaEventos) return;
    listaEventos.replaceChildren();

    const ordenados = tareas.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

    ordenados.forEach(tarea => {
      const f = new Date((tarea.fecha.includes('T') ? tarea.fecha : tarea.fecha + 'T00:00:00'));
      const item = document.createElement('div');
      item.className = 'item_evento';

      item.innerHTML = `
        <div class="caja_fecha">
          <span class="caja_fecha_numero">${f.getDate()}</span>
          <span class="caja_fecha_mes">${mesesCortos[f.getMonth()]}</span>
        </div>
        <div class="detalles_evento">
          <div class="titulo_item_evento">${escaparHTML(tarea.titulo)}</div>
          <div class="horario_item_evento">${escaparHTML(tarea.horario || 'Horario a confirmar')}</div>
          <div class="departamento_item_evento">
            <span class="punto_departamento"></span>
            ${escaparHTML(tarea.departamento || 'General')}
          </div>
        </div>
      `;

      const botonEliminar = document.createElement('button');
      botonEliminar.type = 'button';
      botonEliminar.className = 'boton_eliminar_evento';
      botonEliminar.title = 'Eliminar tarea';
      botonEliminar.innerHTML = '<i class="fa-solid fa-trash"></i>';
      botonEliminar.addEventListener('click', () => eliminarTareaBD(tarea.id));

      item.appendChild(botonEliminar);
      listaEventos.appendChild(item);
    });

    if (!ordenados.length) {
      const vacio = document.createElement('p');
      vacio.style.fontSize = '13px';
      vacio.style.color = '#64748b';
      vacio.textContent = 'No hay tareas registradas.';
      listaEventos.appendChild(vacio);
    }
  }

  function dibujarGrilla() {
    if (!grilla) return;
    grilla.replaceChildren();

    document.getElementById('texto_mes_actual').textContent =
      meses[fechaSeleccionada.getMonth()] + ' ' + fechaSeleccionada.getFullYear();

    grilla.style.gridTemplateColumns = vistaActual === 'dia' ? '1fr' : 'repeat(7, minmax(0, 1fr))';

    let fechas = [];
    if (vistaActual === 'mes') {
      const primero = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), 1);
      const desplazamiento = (primero.getDay() + 6) % 7;
      const inicio = new Date(primero);
      inicio.setDate(primero.getDate() - desplazamiento);
      fechas = Array.from({ length: 42 }, (_, i) => {
        const f = new Date(inicio);
        f.setDate(inicio.getDate() + i);
        return f;
      });
    } else if (vistaActual === 'semana') {
      const inicio = new Date(fechaSeleccionada);
      inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
      fechas = Array.from({ length: 7 }, (_, i) => {
        const f = new Date(inicio);
        f.setDate(inicio.getDate() + i);
        return f;
      });
    } else {
      fechas = [new Date(fechaSeleccionada)];
    }

    fechas.forEach(fecha => {
      const clave = fechaClave(fecha);
      const celda = document.createElement('div');
      celda.className = 'celda_dia';
      celda.dataset.fecha = clave;

      if (vistaActual === 'mes' && fecha.getMonth() !== fechaSeleccionada.getMonth()) {
        celda.classList.add('celda_dia_fuera');
      }
      if (clave === fechaClave(fechaSeleccionada)) {
        celda.classList.add('celda_dia_seleccionada');
      }

      const numero = document.createElement('span');
      numero.className = 'numero_dia';
      numero.textContent = fecha.getDate();
      celda.appendChild(numero);

      const tareasDia = tareas.filter(item => {
        const fechaFormatBD = item.fecha.includes('T') ? item.fecha.split('T')[0] : item.fecha;
        return fechaFormatBD === clave;
      });

      if (tareasDia.length) {
        const puntos = document.createElement('div');
        puntos.className = 'contenedor_puntos_evento';
        tareasDia.forEach(item => {
          const marca = document.createElement('span');
          marca.className = 'marca_evento_item';
          marca.textContent = item.titulo;
          puntos.appendChild(marca);
        });
        celda.appendChild(puntos);
      }

      celda.addEventListener('click', () => {
        fechaSeleccionada = new Date(fecha);
        campoFecha.value = clave;
        dibujarGrilla();
      });

      grilla.appendChild(celda);
    });
  }

  function dibujarTodo() {
    dibujarGrilla();
    dibujarListaEventos();
  }

  function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  async function crearTareaBD() {
    const titulo = document.getElementById('input_titulo_evento').value.trim();
    const fecha = campoFecha.value;
    const horario = document.getElementById('input_horario_evento').value.trim();
    const depto = document.getElementById('input_depto_evento').value.trim();

    let usuario;
    try { usuario = JSON.parse(localStorage.getItem('usuario_ocid') || 'null'); } catch (e) { usuario = null; }

    if (!titulo || !fecha) {
      alert('Ingresa un título y una fecha válida.');
      return;
    }

    try {
      const respuesta = await fetch(`${window.OCID_API_BASE}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          fecha,
          horario: horario || 'Horario a confirmar',
          departamento: depto || 'General',
          autor_id: usuario ? usuario.id : null
        })
      });

      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.success) throw new Error('No se pudo cargar');

      modal.style.display = 'none';
      document.getElementById('input_titulo_evento').value = '';
      document.getElementById('input_horario_evento').value = '';
      document.getElementById('input_depto_evento').value = '';

      await cargarTareasDesdeDB();
    } catch (error) {
      mostrarAviso('No se pudo cargar');
    }
  }

  async function eliminarTareaBD(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

    try {
      const respuesta = await fetch(`${window.OCID_API_BASE}/tareas/${id}`, {
        method: 'DELETE'
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.success) throw new Error('No se pudo cargar');

      await cargarTareasDesdeDB();
    } catch (error) {
      mostrarAviso('No se pudo cargar');
    }
  }

  // Controles de navegación y eventos de UI
  document.getElementById('boton_mes_previo').addEventListener('click', () => {
    fechaSeleccionada.setMonth(fechaSeleccionada.getMonth() - 1);
    dibujarGrilla();
  });

  document.getElementById('boton_mes_siguiente').addEventListener('click', () => {
    fechaSeleccionada.setMonth(fechaSeleccionada.getMonth() + 1);
    dibujarGrilla();
  });

  [['vista_mes', 'mes'], ['vista_semana', 'semana'], ['vista_dia', 'dia']].forEach(([id, vista]) => {
    document.getElementById(id).addEventListener('click', () => {
      vistaActual = vista;
      document.querySelectorAll('.boton_vista').forEach(b => b.classList.remove('boton_vista_activa'));
      document.getElementById(id).classList.add('boton_vista_activa');
      dibujarGrilla();
    });
  });

  document.getElementById('boton_abrir_modal').addEventListener('click', () => {
    campoFecha.value = fechaClave(fechaSeleccionada);
    modal.style.display = 'flex';
  });

  [document.getElementById('boton_cerrar_modal'), document.getElementById('boton_cancelar_modal')].forEach(b => {
    if (b) b.addEventListener('click', () => { modal.style.display = 'none'; });
  });

  document.getElementById('boton_guardar_evento').addEventListener('click', crearTareaBD);

  cargarTareasDesdeDB();
});