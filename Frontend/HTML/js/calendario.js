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
      botonMenu.innerHTML = '<i class="fa-solid fa-bars"></i>';
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
  let tareaEnEdicionId = null;

  const grilla = document.getElementById('contenedor_grilla_dias');
  const listaEventos = document.getElementById('lista_eventos_contenedor');
  const modal = document.getElementById('modal_nuevo_evento');
  const campoFecha = document.getElementById('input_dia_evento');

  function mostrarAviso(mensaje) {
    let aviso = document.getElementById('aviso_calendario');
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'aviso_calendario';
      aviso.className = 'aviso_docentes aviso_docentes_error';
      aviso.setAttribute('role', 'alert');
      
      // Selecciona el contenedor div principal que engloba tanto el título "Calendario" como el subtítulo
      const contenedorTitulos = document.querySelector('.cuerpo_pagina > div:first-child');
      if (contenedorTitulos) {
        contenedorTitulos.after(aviso);
      } else {
        const cuerpo = document.querySelector('.cuerpo_pagina') || document.body;
        cuerpo.prepend(aviso);
      }
    }
    
    aviso.textContent = mensaje;
    aviso.style.display = 'flex';
    aviso.hidden = false;

    if (window.temporizadorAvisoCalendario) clearTimeout(window.temporizadorAvisoCalendario);
    window.temporizadorAvisoCalendario = setTimeout(() => { 
      aviso.hidden = true;
      aviso.style.display = 'none'; 
    }, 7000);
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

  function actualizarBadgesNavMes() {
    const badgePrevio = document.getElementById('badge_mes_previo');
    const badgeSiguiente = document.getElementById('badge_mes_siguiente');
    if (!badgePrevio || !badgeSiguiente) return;

    const mesActual = fechaSeleccionada.getMonth();
    const anioActual = fechaSeleccionada.getFullYear();

    let tienePrevio = false;
    let tieneSiguiente = false;

    tareas.forEach(tarea => {
      if (!tarea.fecha) return;
      const f = new Date(tarea.fecha.includes('T') ? tarea.fecha : tarea.fecha + 'T00:00:00');
      const tAnio = f.getFullYear();
      const tMes = f.getMonth();

      if (tAnio < anioActual || (tAnio === anioActual && tMes < mesActual)) {
        tienePrevio = true;
      }
      if (tAnio > anioActual || (tAnio === anioActual && tMes > mesActual)) {
        tieneSiguiente = true;
      }
    });

    badgePrevio.style.display = tienePrevio ? 'block' : 'none';
    badgeSiguiente.style.display = tieneSiguiente ? 'block' : 'none';
  }

  window.toggleMenuOpcionesTarea = function(evento, idTarea) {
    evento.stopPropagation();
    document.querySelectorAll('[id^="menu_opciones_tarea_"]').forEach(menu => {
      if (menu.id !== `menu_opciones_tarea_${idTarea}`) menu.style.display = 'none';
    });

    const menu = document.getElementById(`menu_opciones_tarea_${idTarea}`);
    if (menu) {
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
  };

  window.addEventListener('click', () => {
    document.querySelectorAll('[id^="menu_opciones_tarea_"]').forEach(menu => {
      menu.style.display = 'none';
    });
  });

  window.prepararEdicionTarea = function(id, esAutor) {
    let usuarioActual = null;
    try {
      usuarioActual = JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
    } catch (e) {
      usuarioActual = null;
    }

    const tarea = tareas.find(t => t.id === id);
    if (!tarea) return;

    const autorVerificado = usuarioActual && (Number(usuarioActual.id) === Number(tarea.autor_id));

    if (!esAutor || !autorVerificado) {
      mostrarAviso('No tienes permisos para editar esta tarea porque no eres el autor.');
      return;
    }

    tareaEnEdicionId = id;
    document.getElementById('input_titulo_evento').value = tarea.titulo || '';
    const fechaFormatBD = tarea.fecha.includes('T') ? tarea.fecha.split('T')[0] : tarea.fecha;
    campoFecha.value = fechaFormatBD;
    document.getElementById('input_horario_evento').value = tarea.horario || '';
    document.getElementById('input_depto_evento').value = tarea.departamento || '';

    const tituloModal = modal.querySelector('.modal_titulo');
    if (tituloModal) tituloModal.textContent = 'Editar evento';

    modal.style.display = 'flex';
  };

  window.eliminarTareaBD = async function(id, esAutor) {
    let usuarioActual = null;
    try {
      usuarioActual = JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
    } catch (e) {
      usuarioActual = null;
    }

    const tarea = tareas.find(t => t.id === id);
    const autorVerificado = tarea && usuarioActual && (Number(usuarioActual.id) === Number(tarea.autor_id));

    if (!esAutor || !autorVerificado) {
      mostrarAviso('No tienes permisos para eliminar esta tarea porque no eres el autor.');
      return;
    }

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
  };

  function dibujarListaEventos() {
    if (!listaEventos) return;
    listaEventos.replaceChildren();

    let usuarioActual = null;
    try {
      usuarioActual = JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
    } catch (e) {
      usuarioActual = null;
    }

    const ordenados = tareas.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

    ordenados.forEach(tarea => {
      const f = new Date((tarea.fecha.includes('T') ? tarea.fecha : tarea.fecha + 'T00:00:00'));
      const esAutor = usuarioActual && (Number(usuarioActual.id) === Number(tarea.autor_id));

      let horaCreacionTexto = '';
      if (tarea.fecha_creacion) {
        const fechaCreacionObj = new Date(tarea.fecha_creacion);
        if (!isNaN(fechaCreacionObj.getTime())) {
          horaCreacionTexto = fechaCreacionObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        }
      }

      const nombreDueño = tarea.autor_nombre || 'Coordinación';

      const item = document.createElement('div');
      item.className = 'item_evento';
      item.style.position = 'relative';

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
            ${escaparHTML(tarea.departamento || 'General')} &bull; <small style="color: #64748b;">Creado por: <strong>${escaparHTML(nombreDueño)}</strong> ${horaCreacionTexto ? 'a las ' + horaCreacionTexto : ''}</small>
          </div>
        </div>
        <div style="position: relative;">
          <button class="boton_opciones_anuncio" title="Más opciones" onclick="toggleMenuOpcionesTarea(event, ${tarea.id})">&#8942;</button>
          <div id="menu_opciones_tarea_${tarea.id}" style="display: none; position: absolute; right: 0; top: 25px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; box-shadow: 0px 4px 12px rgba(0,0,0,0.15); z-index: 50; width: 140px; padding: 4px 0;">
            <button onclick="prepararEdicionTarea(${tarea.id}, ${esAutor})" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 13px; cursor: pointer; color: ${esAutor ? '#0f172a' : '#94a3b8'}; flex-direction: row; gap: 8px; display: flex; align-items: center;">
              <svg fill="none" height="15" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Editar
            </button>
            <button onclick="eliminarTareaBD(${tarea.id}, ${esAutor})" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 13px; cursor: pointer; color: ${esAutor ? '#ef4444' : '#94a3b8'}; flex-direction: row; gap: 8px; display: flex; align-items: center;">
              <svg fill="none" height="15" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="15"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Eliminar
            </button>
          </div>
        </div>
      `;

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
        actualizarBadgesNavMes();
      });

      grilla.appendChild(celda);
    });

    actualizarBadgesNavMes();
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

  async function guardarTareaBD() {
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

    if (tareaEnEdicionId !== null) {
      const tareaAEditar = tareas.find(t => t.id === tareaEnEdicionId);
      if (tareaAEditar && usuario && Number(tareaAEditar.autor_id) !== Number(usuario.id)) {
        mostrarAviso('No tienes permisos para editar esta tarea porque no eres el autor.');
        modal.style.display = 'none';
        tareaEnEdicionId = null;
        return;
      }
    }

    try {
      let url = `${window.OCID_API_BASE}/tareas`;
      let metodo = 'POST';

      if (tareaEnEdicionId !== null) {
        url = `${window.OCID_API_BASE}/tareas/${tareaEnEdicionId}`;
        metodo = 'PUT';
      }

      const respuesta = await fetch(url, {
        method: metodo,
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
      tareaEnEdicionId = null;

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
    tareaEnEdicionId = null;
    const tituloModal = modal.querySelector('.modal_titulo');
    if (tituloModal) tituloModal.textContent = 'Registrar nuevo evento';
    campoFecha.value = fechaClave(fechaSeleccionada);
    modal.style.display = 'flex';
  });

  [document.getElementById('boton_cerrar_modal'), document.getElementById('boton_cancelar_modal')].forEach(b => {
    if (b) b.addEventListener('click', () => { 
      modal.style.display = 'none'; 
      tareaEnEdicionId = null;
    });
  });

  document.getElementById('boton_guardar_evento').addEventListener('click', guardarTareaBD);

  cargarTareasDesdeDB();
});