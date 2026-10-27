/* L?gica propia de calendario.html */
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

document.addEventListener('DOMContentLoaded', function () {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      let mesIndice = 8; // Septiembre
      let anioActual = 2026;

      const textoMes = document.getElementById('texto_mes_actual');
      const botonMesPrevio = document.getElementById('boton_mes_previo');
      const botonMesSiguiente = document.getElementById('boton_mes_siguiente');
      const celdas = document.querySelectorAll('.celda_dia:not(.celda_dia_fuera)');

      // Navegación de mes
      botonMesPrevio.addEventListener('click', function () {
        mesIndice--;
        if (mesIndice < 0) {
          mesIndice = 11;
          anioActual--;
        }
        textoMes.textContent = meses[mesIndice] + ' ' + anioActual;
      });

      botonMesSiguiente.addEventListener('click', function () {
        mesIndice++;
        if (mesIndice > 11) {
          mesIndice = 0;
          anioActual++;
        }
        textoMes.textContent = meses[mesIndice] + ' ' + anioActual;
      });

      // Selección de día
      celdas.forEach(function (celda) {
        celda.addEventListener('click', function () {
          celdas.forEach(function (c) { c.classList.remove('celda_dia_seleccionada'); });
          celda.classList.add('celda_dia_seleccionada');
          const diaNum = celda.getAttribute('data-dia');
          if (diaNum) {
            document.getElementById('input_dia_evento').value = diaNum;
          }
        });
      });

      // Vistas (Mes / Semana / Día)
      const botonesVista = document.querySelectorAll('.boton_vista');
      botonesVista.forEach(function (btn) {
        btn.addEventListener('click', function () {
          botonesVista.forEach(function (b) { b.classList.remove('boton_vista_activa'); });
          btn.classList.add('boton_vista_activa');
        });
      });

      // Modal de nuevo evento
      const modal = document.getElementById('modal_nuevo_evento');
      const botonAbrir = document.getElementById('boton_abrir_modal');
      const botonCerrar = document.getElementById('boton_cerrar_modal');
      const botonCancelar = document.getElementById('boton_cancelar_modal');
      const botonGuardar = document.getElementById('boton_guardar_evento');

      function abrirModal() {
        modal.style.display = 'flex';
      }

      function cerrarModal() {
        modal.style.display = 'none';
      }

      botonAbrir.addEventListener('click', abrirModal);
      botonCerrar.addEventListener('click', cerrarModal);
      botonCancelar.addEventListener('click', cerrarModal);

      // Agregar nuevo evento
      botonGuardar.addEventListener('click', function () {
        const titulo = document.getElementById('input_titulo_evento').value.trim();
        const dia = document.getElementById('input_dia_evento').value.trim();
        const horario = document.getElementById('input_horario_evento').value.trim();
        const depto = document.getElementById('input_depto_evento').value.trim();

        if (!titulo || !dia) {
          alert('Por favor introduce un título y día válidos.');
          return;
        }

        const listaEventos = document.getElementById('lista_eventos_contenedor');
        const nuevoElemento = document.createElement('div');
        nuevoElemento.className = 'item_evento';
        nuevoElemento.innerHTML = `
          <div class="caja_fecha">
            <span class="caja_fecha_numero">${dia}</span>
            <span class="caja_fecha_mes">SEP</span>
          </div>
          <div class="detalles_evento">
            <div class="titulo_item_evento">${titulo}</div>
            <div class="horario_item_evento">${horario || 'Horario a confirmar'}</div>
            <div class="departamento_item_evento">
              <span class="punto_departamento"></span>
              ${depto || 'General'}
            </div>
          </div>
        `;

        listaEventos.prepend(nuevoElemento);

        // Agregar insignia visual a la celda del día
        const celdaDestino = document.querySelector(`.celda_dia[data-dia="${dia}"]`);
        if (celdaDestino) {
          let contenedorPuntos = celdaDestino.querySelector('.contenedor_puntos_evento');
          if (!contenedorPuntos) {
            contenedorPuntos = document.createElement('div');
            contenedorPuntos.className = 'contenedor_puntos_evento';
            celdaDestino.appendChild(contenedorPuntos);
          }
          const nuevaMarca = document.createElement('span');
          nuevaMarca.className = 'marca_evento_item marca_azul';
          nuevaMarca.textContent = titulo;
          contenedorPuntos.appendChild(nuevaMarca);
        }

        // Limpiar campos y cerrar modal
        document.getElementById('input_titulo_evento').value = '';
        document.getElementById('input_horario_evento').value = '';
        document.getElementById('input_depto_evento').value = '';
        cerrarModal();
      });
    });

document.addEventListener('DOMContentLoaded', () => {
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mesesCortos = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      let usuarioCalendario = null;
      try { usuarioCalendario = JSON.parse(localStorage.getItem('usuario_ocid') || 'null'); }
      catch (error) { console.error('No se pudo leer la sesión:', error); }
      const claveEventos = 'eventos_ocid_' + (usuarioCalendario && usuarioCalendario.id ? usuarioCalendario.id : 'local');
      let eventos = [];
      let fechaSeleccionada = new Date(2026, 8, 15);
      let vistaActual = 'mes';
      const grilla = document.getElementById('contenedor_grilla_dias');
      const listaEventos = document.getElementById('lista_eventos_contenedor');
      const modal = document.getElementById('modal_nuevo_evento');
      const campoFecha = document.getElementById('input_dia_evento');

      ['boton_mes_previo', 'boton_mes_siguiente', 'vista_mes', 'vista_semana', 'vista_dia',
        'boton_abrir_modal', 'boton_cerrar_modal', 'boton_cancelar_modal', 'boton_guardar_evento']
        .forEach(id => {
          const anterior = document.getElementById(id);
          anterior.replaceWith(anterior.cloneNode(true));
        });

      function guardarEventos() {
        localStorage.setItem(claveEventos, JSON.stringify(eventos));
      }

      function fechaClave(fecha) {
        return fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0');
      }

      function dibujarListaEventos() {
        listaEventos.replaceChildren();
        const ordenados = eventos.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
        ordenados.forEach(evento => {
          const fecha = new Date(evento.fecha + 'T00:00:00');
          const item = document.createElement('div');
          item.className = 'item_evento';
          const cajaFecha = document.createElement('div');
          cajaFecha.className = 'caja_fecha';
          const numero = document.createElement('span');
          numero.className = 'caja_fecha_numero';
          numero.textContent = fecha.getDate();
          const mes = document.createElement('span');
          mes.className = 'caja_fecha_mes';
          mes.textContent = mesesCortos[fecha.getMonth()];
          cajaFecha.append(numero, mes);
          const detalles = document.createElement('div');
          detalles.className = 'detalles_evento';
          const titulo = document.createElement('div');
          titulo.className = 'titulo_item_evento';
          titulo.textContent = evento.titulo;
          const horario = document.createElement('div');
          horario.className = 'horario_item_evento';
          horario.textContent = evento.horario || 'Horario a confirmar';
          const departamento = document.createElement('div');
          departamento.className = 'departamento_item_evento';
          const punto = document.createElement('span');
          punto.className = 'punto_departamento';
          departamento.append(punto, document.createTextNode(evento.departamento || 'General'));
          detalles.append(titulo, horario, departamento);
          const eliminar = document.createElement('button');
          eliminar.type = 'button';
          eliminar.className = 'boton_flecha';
          eliminar.textContent = 'Eliminar';
          eliminar.addEventListener('click', () => {
            eventos = eventos.filter(itemEvento => itemEvento.id !== evento.id);
            guardarEventos();
            dibujarTodo();
          });
          item.append(cajaFecha, detalles, eliminar);
          listaEventos.appendChild(item);
        });
        if (!ordenados.length) {
          const vacio = document.createElement('p');
          vacio.textContent = 'No hay eventos registrados.';
          listaEventos.appendChild(vacio);
        }
      }

      function dibujarGrilla() {
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
          fechas = Array.from({ length: 42 }, (_, indice) => {
            const fecha = new Date(inicio);
            fecha.setDate(inicio.getDate() + indice);
            return fecha;
          });
        } else if (vistaActual === 'semana') {
          const inicio = new Date(fechaSeleccionada);
          inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
          fechas = Array.from({ length: 7 }, (_, indice) => {
            const fecha = new Date(inicio);
            fecha.setDate(inicio.getDate() + indice);
            return fecha;
          });
        } else {
          fechas = [new Date(fechaSeleccionada)];
        }
        fechas.forEach(fecha => {
          const clave = fechaClave(fecha);
          const celda = document.createElement('div');
          celda.className = 'celda_dia';
          celda.dataset.fecha = clave;
          if (vistaActual === 'mes' && fecha.getMonth() !== fechaSeleccionada.getMonth()) celda.classList.add('celda_dia_fuera');
          if (clave === fechaClave(fechaSeleccionada)) celda.classList.add('celda_dia_seleccionada');
          const numero = document.createElement('span');
          numero.className = 'numero_dia';
          numero.textContent = fecha.getDate();
          celda.appendChild(numero);
          const eventosDia = eventos.filter(item => item.fecha === clave);
          if (eventosDia.length) {
            const puntos = document.createElement('div');
            puntos.className = 'contenedor_puntos_evento';
            eventosDia.forEach(item => {
              const marca = document.createElement('span');
              marca.className = 'marca_evento_item marca_azul';
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

      const listaEstatica = [...listaEventos.querySelectorAll('.item_evento')].map((item, indice) => {
        const dia = item.querySelector('.caja_fecha_numero')?.textContent.trim() || '1';
        const nombreMes = item.querySelector('.caja_fecha_mes')?.textContent.trim().toUpperCase() || 'SEP';
        const mes = Math.max(0, mesesCortos.indexOf(nombreMes));
        return {
          id: 'inicial-' + indice,
          titulo: item.querySelector('.titulo_item_evento')?.textContent.trim() || 'Evento',
          horario: item.querySelector('.horario_item_evento')?.textContent.trim() || '',
          departamento: item.querySelector('.departamento_item_evento')?.textContent.trim() || '',
          fecha: '2026-' + String(mes + 1).padStart(2, '0') + '-' + String(Number(dia)).padStart(2, '0')
        };
      });
      try {
        const guardados = JSON.parse(localStorage.getItem(claveEventos) || 'null');
        eventos = Array.isArray(guardados) ? guardados : listaEstatica;
        if (!Array.isArray(guardados)) guardarEventos();
      } catch (error) {
        console.error('No se pudieron cargar los eventos:', error);
        eventos = [];
      }

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
          document.querySelectorAll('.boton_vista').forEach(boton => boton.classList.remove('boton_vista_activa'));
          document.getElementById(id).classList.add('boton_vista_activa');
          dibujarGrilla();
        });
      });
      document.getElementById('boton_abrir_modal').addEventListener('click', () => {
        campoFecha.value = fechaClave(fechaSeleccionada);
        modal.style.display = 'flex';
      });
      [document.getElementById('boton_cerrar_modal'), document.getElementById('boton_cancelar_modal')].forEach(boton => {
        boton.addEventListener('click', () => { modal.style.display = 'none'; });
      });
      document.getElementById('boton_guardar_evento').addEventListener('click', () => {
        const titulo = document.getElementById('input_titulo_evento').value.trim();
        const fecha = campoFecha.value;
        if (!titulo || !fecha) {
          alert('Ingresa un título y una fecha válida.');
          return;
        }
        eventos.push({
          id: Date.now().toString(),
          titulo,
          fecha,
          horario: document.getElementById('input_horario_evento').value.trim(),
          departamento: document.getElementById('input_depto_evento').value.trim()
        });
        guardarEventos();
        document.getElementById('input_titulo_evento').value = '';
        document.getElementById('input_horario_evento').value = '';
        document.getElementById('input_depto_evento').value = '';
        fechaSeleccionada = new Date(fecha + 'T00:00:00');
        modal.style.display = 'none';
        dibujarTodo();
      });
      dibujarTodo();
    });

