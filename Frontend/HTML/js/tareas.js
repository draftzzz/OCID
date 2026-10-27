/* L?gica propia de tareas.html */
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

// Variables de control de identificadores
    let contador_filas = 4;

    // Manejo de Menú Modal
    const boton_abrir = document.getElementById("boton_abrir_modal");
    const boton_cerrar = document.getElementById("boton_cerrar_modal");
    const boton_cancelar = document.getElementById("boton_cancelar_modal");
    const modal = document.getElementById("modal_nueva_tarea");
    const formulario = document.getElementById("formulario_crear_tarea");

    function abrir_modal() {
      modal.classList.add("visible");
    }

    function cerrar_modal() {
      modal.classList.remove("visible");
      formulario.reset();
    }

    boton_abrir.addEventListener("click", abrir_modal);
    boton_cerrar.addEventListener("click", cerrar_modal);
    boton_cancelar.addEventListener("click", cerrar_modal);

    modal.addEventListener("click", function (evento) {
      if (evento.target === modal) {
        cerrar_modal();
      }
    });

    // Filtros de búsqueda en la tabla
    const input_texto = document.getElementById("campo_filtro_texto");
    const select_departamento = document.getElementById("filtro_departamento");
    const select_estado = document.getElementById("filtro_estado");
    const cuerpo_tabla = document.getElementById("cuerpo_tabla_tareas");
    const texto_conteo = document.getElementById("texto_resumen_conteo");

    function aplicar_filtros() {
      const texto_busqueda = input_texto.value.toLowerCase().trim();
      const dep_filtro = select_departamento.value;
      const est_filtro = select_estado.value;

      const filas = cuerpo_tabla.querySelectorAll("tr");
      let filas_visibles = 0;

      filas.forEach(function (fila) {
        const titulo = (fila.getAttribute("data-titulo") || "").toLowerCase();
        const descripcion = (fila.querySelector(".texto_descripcion_tarea")?.textContent || "").toLowerCase();
        const asignado = (fila.children[2]?.textContent || "").toLowerCase();
        const dep_fila = fila.getAttribute("data-departamento") || "";
        const est_fila = fila.getAttribute("data-estado") || "";

        const coincide_texto = titulo.includes(texto_busqueda) || descripcion.includes(texto_busqueda) || asignado.includes(texto_busqueda);
        const coincide_dep = dep_filtro === "todos" || dep_fila === dep_filtro;
        const coincide_est = est_filtro === "todos" || est_fila === est_filtro;

        if (coincide_texto && coincide_dep && coincide_est) {
          fila.style.display = "";
          filas_visibles++;
        } else {
          fila.style.display = "none";
        }
      });

      const total_filas = filas.length;
      if (filas_visibles === 0) {
        texto_conteo.textContent = "Mostrando 0 de " + total_filas + " tareas";
      } else {
        texto_conteo.textContent = "Mostrando 1 a " + filas_visibles + " de " + total_filas + " tareas";
      }
    }

    input_texto.addEventListener("input", aplicar_filtros);
    select_departamento.addEventListener("change", aplicar_filtros);
    select_estado.addEventListener("change", aplicar_filtros);

    // Menú contextual de tres puntos
    function alternar_menu_acciones(evento, id_fila) {
      evento.stopPropagation();
      cerrar_todos_los_menus();
      const menu = document.getElementById("menu_acciones_" + id_fila);
      if (menu) {
        menu.classList.toggle("activo");
      }
    }

    function cerrar_todos_los_menus() {
      const menus = document.querySelectorAll(".menu_flotante_acciones");
      menus.forEach(function (m) {
        m.classList.remove("activo");
      });
    }

    document.addEventListener("click", function () {
      cerrar_todos_los_menus();
    });

    // Cambiar estado dinámico
    function cambiar_estado(id_fila, nuevo_estado) {
      const menu = document.getElementById("menu_acciones_" + id_fila);
      const fila = menu.closest("tr");
      fila.setAttribute("data-estado", nuevo_estado);

      const celda_estado = fila.children[5];
      let clase_badge = "badge_estado ";
      if (nuevo_estado === "Pendiente") {
        clase_badge += "estado_pendiente";
      } else if (nuevo_estado === "En proceso") {
        clase_badge += "estado_proceso";
      } else {
        clase_badge += "estado_completado";
      }

      celda_estado.innerHTML = '<span class="' + clase_badge + '">' + nuevo_estado + '</span>';
      cerrar_todos_los_menus();
      aplicar_filtros();
    }

    // Eliminar fila
    function eliminar_fila(id_fila) {
      const menu = document.getElementById("menu_acciones_" + id_fila);
      const fila = menu.closest("tr");
      if (fila) {
        fila.remove();
        aplicar_filtros();
      }
    }

    // Creación de nueva tarea desde el formulario
    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();
      contador_filas++;
      const id_nuevo = contador_filas;

      const titulo = document.getElementById("campo_modal_titulo").value;
      const descripcion = document.getElementById("campo_modal_descripcion").value;
      const asignado = document.getElementById("campo_modal_asignado").value;
      const departamento = document.getElementById("campo_modal_departamento").value;
      const fecha_valor = document.getElementById("campo_modal_fecha").value;
      const estado = document.getElementById("campo_modal_estado").value;

      // Formatear fecha yyyy-mm-dd a dd/mm/yyyy
      let fecha_formateada = fecha_valor;
      if (fecha_valor.includes("-")) {
        const partes = fecha_valor.split("-");
        fecha_formateada = partes[2] + "/" + partes[1] + "/" + partes[0];
      }

      let clase_badge = "badge_estado ";
      if (estado === "Pendiente") {
        clase_badge += "estado_pendiente";
      } else if (estado === "En proceso") {
        clase_badge += "estado_proceso";
      } else {
        clase_badge += "estado_completado";
      }

      const nueva_fila = document.createElement("tr");
      nueva_fila.setAttribute("data-titulo", titulo);
      nueva_fila.setAttribute("data-departamento", departamento);
      nueva_fila.setAttribute("data-estado", estado);

      nueva_fila.innerHTML =
        '<td class="texto_titulo_tarea">' + titulo + '</td>' +
        '<td class="texto_descripcion_tarea">' + descripcion + '</td>' +
        '<td>' + asignado + '</td>' +
        '<td>' + departamento + '</td>' +
        '<td>' + fecha_formateada + '</td>' +
        '<td><span class="' + clase_badge + '">' + estado + '</span></td>' +
        '<td class="columna_acciones">' +
          '<button class="boton_tres_puntos" onclick="alternar_menu_acciones(event, ' + id_nuevo + ')">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="12" cy="12" r="1"/>' +
              '<circle cx="12" cy="5" r="1"/>' +
              '<circle cx="12" cy="19" r="1"/>' +
            '</svg>' +
          '</button>' +
          '<div id="menu_acciones_' + id_nuevo + '" class="menu_flotante_acciones">' +
            '<button class="opcion_accion" onclick="cambiar_estado(' + id_nuevo + ', \'Pendiente\')">Pendiente</button>' +
            '<button class="opcion_accion" onclick="cambiar_estado(' + id_nuevo + ', \'En proceso\')">En proceso</button>' +
            '<button class="opcion_accion" onclick="cambiar_estado(' + id_nuevo + ', \'Completado\')">Completado</button>' +
            '<button class="opcion_accion opcion_eliminar" onclick="eliminar_fila(' + id_nuevo + ')">Eliminar</button>' +
          '</div>' +
        '</td>';

      cuerpo_tabla.appendChild(nueva_fila);
      cerrar_modal();
      aplicar_filtros();
    });

(() => {
      const cuerpo = document.getElementById('cuerpo_tabla_tareas');
      const formularioTarea = document.getElementById('formulario_crear_tarea');
      const selectorUsuario = (() => {
        try { return JSON.parse(localStorage.getItem('usuario_ocid') || 'null'); }
        catch (error) { console.error('No se pudo leer la sesión:', error); return null; }
      })();
      const claveTareas = 'tareas_ocid_' + (selectorUsuario && selectorUsuario.id ? selectorUsuario.id : 'local');
      let tareas = [];
      let siguienteId = 1;
      window.cerrar_todos_los_menus = () => {};

      function fechaIso(fecha) {
        const partes = fecha.split('/');
        return partes.length === 3 ? partes[2] + '-' + partes[1] + '-' + partes[0] : fecha;
      }

      function guardarTareas() {
        localStorage.setItem(claveTareas, JSON.stringify(tareas));
      }

      function crearCelda(texto, clase) {
        const celda = document.createElement('td');
        if (clase) celda.className = clase;
        celda.textContent = texto;
        return celda;
      }

      function dibujarTareas() {
        cuerpo.replaceChildren();
        tareas.forEach(tarea => {
          const fila = document.createElement('tr');
          fila.dataset.id = tarea.id;
          fila.dataset.titulo = tarea.titulo;
          fila.dataset.departamento = tarea.departamento;
          fila.dataset.estado = tarea.estado;
          fila.append(
            crearCelda(tarea.titulo, 'texto_titulo_tarea'),
            crearCelda(tarea.descripcion, 'texto_descripcion_tarea'),
            crearCelda(tarea.asignado),
            crearCelda(tarea.departamento),
            crearCelda(tarea.fecha ? new Date(tarea.fecha + 'T00:00:00').toLocaleDateString('es-MX') : '')
          );
          const celdaEstado = document.createElement('td');
          const etiqueta = document.createElement('span');
          etiqueta.className = 'badge_estado ' + (tarea.estado === 'Pendiente' ? 'estado_pendiente' :
            tarea.estado === 'En proceso' ? 'estado_proceso' : 'estado_completado');
          etiqueta.textContent = tarea.estado;
          celdaEstado.appendChild(etiqueta);
          fila.appendChild(celdaEstado);
          const celdaAcciones = document.createElement('td');
          celdaAcciones.className = 'columna_acciones';
          const botonMenu = document.createElement('button');
          botonMenu.type = 'button';
          botonMenu.className = 'boton_tres_puntos';
          botonMenu.textContent = 'Acciones';
          botonMenu.addEventListener('click', () => menu.classList.toggle('activo'));
          const menu = document.createElement('div');
          menu.className = 'menu_flotante_acciones';
          ['Pendiente', 'En proceso', 'Completado'].forEach(estado => {
            const botonEstado = document.createElement('button');
            botonEstado.type = 'button';
            botonEstado.className = 'opcion_accion';
            botonEstado.textContent = estado;
            botonEstado.addEventListener('click', () => {
              tarea.estado = estado;
              guardarTareas();
              dibujarTareas();
            });
            menu.appendChild(botonEstado);
          });
          const botonEliminar = document.createElement('button');
          botonEliminar.type = 'button';
          botonEliminar.className = 'opcion_accion opcion_eliminar';
          botonEliminar.textContent = 'Eliminar';
          botonEliminar.addEventListener('click', () => {
            tareas = tareas.filter(elemento => elemento.id !== tarea.id);
            guardarTareas();
            dibujarTareas();
          });
          menu.appendChild(botonEliminar);
          celdaAcciones.append(botonMenu, menu);
          fila.appendChild(celdaAcciones);
          cuerpo.appendChild(fila);
        });
        const total = tareas.length;
        const visibles = [...cuerpo.querySelectorAll('tr')].filter(fila => fila.style.display !== 'none').length;
        document.getElementById('texto_resumen_conteo').textContent =
          'Mostrando ' + visibles + ' de ' + total + ' tareas';
      }

      try {
        const guardadas = JSON.parse(localStorage.getItem(claveTareas) || 'null');
        if (Array.isArray(guardadas)) {
          tareas = guardadas;
        } else {
          tareas = [...cuerpo.querySelectorAll('tr')].map((fila, indice) => ({
            id: indice + 1,
            titulo: fila.dataset.titulo || '',
            descripcion: fila.querySelector('.texto_descripcion_tarea')?.textContent || '',
            asignado: fila.children[2]?.textContent || '',
            departamento: fila.dataset.departamento || '',
            fecha: fechaIso(fila.children[4]?.textContent || ''),
            estado: fila.dataset.estado || 'Pendiente'
          }));
          guardarTareas();
        }
      } catch (error) {
        console.error('No se pudieron cargar las tareas guardadas:', error);
        tareas = [];
      }
      siguienteId = tareas.reduce((maximo, tarea) => Math.max(maximo, Number(tarea.id) || 0), 0) + 1;
      dibujarTareas();

      function aplicarFiltrosTareas() {
        const texto = document.getElementById('campo_filtro_texto').value.toLowerCase().trim();
        const departamento = document.getElementById('filtro_departamento').value;
        const estado = document.getElementById('filtro_estado').value;
        cuerpo.querySelectorAll('tr').forEach(fila => {
          const tarea = tareas.find(elemento => String(elemento.id) === fila.dataset.id);
          const coincide = [tarea.titulo, tarea.descripcion, tarea.asignado].join(' ').toLowerCase().includes(texto) &&
            (departamento === 'todos' || tarea.departamento === departamento) &&
            (estado === 'todos' || tarea.estado === estado);
          fila.style.display = coincide ? '' : 'none';
        });
        const visibles = [...cuerpo.querySelectorAll('tr')].filter(fila => fila.style.display !== 'none').length;
        document.getElementById('texto_resumen_conteo').textContent =
          'Mostrando ' + visibles + ' de ' + tareas.length + ' tareas';
        aplicarFiltrosTareas();
      }

      ['campo_filtro_texto', 'filtro_departamento', 'filtro_estado'].forEach(id => {
        document.getElementById(id).addEventListener('input', aplicarFiltrosTareas);
        document.getElementById(id).addEventListener('change', aplicarFiltrosTareas);
      });

      formularioTarea.addEventListener('submit', evento => {
        evento.preventDefault();
        evento.stopImmediatePropagation();
        tareas.push({
          id: siguienteId++,
          titulo: document.getElementById('campo_modal_titulo').value.trim(),
          descripcion: document.getElementById('campo_modal_descripcion').value.trim(),
          asignado: document.getElementById('campo_modal_asignado').value.trim(),
          departamento: document.getElementById('campo_modal_departamento').value,
          fecha: document.getElementById('campo_modal_fecha').value,
          estado: document.getElementById('campo_modal_estado').value
        });
        guardarTareas();
        dibujarTareas();
        document.getElementById('modal_nueva_tarea').classList.remove('visible');
        formularioTarea.reset();
      }, true);
    })();

document.querySelectorAll('[data-evento-pagina="evento-1"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { alternar_menu_acciones(event, 1) }); });
document.querySelectorAll('[data-evento-pagina="evento-2"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiar_estado(1, 'En proceso') }); });
document.querySelectorAll('[data-evento-pagina="evento-3"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiar_estado(1, 'Completado') }); });
document.querySelectorAll('[data-evento-pagina="evento-4"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { eliminar_fila(1) }); });
document.querySelectorAll('[data-evento-pagina="evento-5"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { alternar_menu_acciones(event, 2) }); });
document.querySelectorAll('[data-evento-pagina="evento-6"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiar_estado(2, 'Pendiente') }); });
document.querySelectorAll('[data-evento-pagina="evento-7"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiar_estado(2, 'Completado') }); });
document.querySelectorAll('[data-evento-pagina="evento-8"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { eliminar_fila(2) }); });
document.querySelectorAll('[data-evento-pagina="evento-9"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { alternar_menu_acciones(event, 3) }); });
document.querySelectorAll('[data-evento-pagina="evento-10"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiar_estado(3, 'Pendiente') }); });
document.querySelectorAll('[data-evento-pagina="evento-11"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiar_estado(3, 'En proceso') }); });
document.querySelectorAll('[data-evento-pagina="evento-12"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { eliminar_fila(3) }); });
document.querySelectorAll('[data-evento-pagina="evento-13"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { alternar_menu_acciones(event, 4) }); });
document.querySelectorAll('[data-evento-pagina="evento-14"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiar_estado(4, 'En proceso') }); });
document.querySelectorAll('[data-evento-pagina="evento-15"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cambiar_estado(4, 'Completado') }); });
document.querySelectorAll('[data-evento-pagina="evento-16"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { eliminar_fila(4) }); });
