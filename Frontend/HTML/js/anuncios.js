/* L?gica propia de anuncios.html */
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

    if (!barraSuperior.querySelector('.boton_menu_hamburguesa')) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'boton_menu_hamburguesa';
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

let lista_de_anuncios = [];
    let departamentos_anuncios = [];

    function escaparHTML(valor) {
      return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[caracter]);
    }

    function mostrarErrorAnuncios(mensaje) {
      let aviso = document.getElementById('aviso_anuncios');
      if (!aviso) {
        aviso = document.createElement('p');
        aviso.id = 'aviso_anuncios';
        aviso.className = 'aviso_docentes aviso_docentes_error';
        aviso.setAttribute('role', 'alert');
        document.querySelector('.barra_filtros').before(aviso);
      }
      aviso.textContent = mensaje;
      aviso.hidden = false;
    }

    async function cargar_anuncios_desde_servidor() {
      try {
        const [respuestaAnuncios, respuestaDepartamentos] = await Promise.all([
          fetch(`${window.OCID_API_BASE}/anuncios`),
          fetch(`${window.OCID_API_BASE}/departamentos`)
        ]);
        const [datosAnuncios, datosDepartamentos] = await Promise.all([
          respuestaAnuncios.json(),
          respuestaDepartamentos.json()
        ]);
        if (!respuestaAnuncios.ok) throw new Error(datosAnuncios.error || 'No se pudieron cargar los anuncios.');
        if (!respuestaDepartamentos.ok) throw new Error(datosDepartamentos.error || 'No se pudieron cargar los departamentos.');
        if (!Array.isArray(datosAnuncios) || !Array.isArray(datosDepartamentos)) {
          throw new Error('El servidor devolvió datos no válidos.');
        }

        lista_de_anuncios = datosAnuncios.map(anuncio => ({
          ...anuncio,
          tipo: anuncio.prioridad || 'Informativo',
          departamento: anuncio.departamento_nombre || 'General',
          autor: anuncio.autor_nombre || 'Coordinación',
          fecha: anuncio.fecha ? new Date(anuncio.fecha).toLocaleDateString('es-MX') : ''
        }));
        departamentos_anuncios = datosDepartamentos;

        const selectorDepartamento = document.getElementById('campo_departamento');
        selectorDepartamento.replaceChildren();
        datosDepartamentos.forEach(departamento => {
          const opcion = document.createElement('option');
          opcion.value = String(departamento.id);
          opcion.textContent = departamento.nombre;
          selectorDepartamento.appendChild(opcion);
        });
      } catch (error) {
        lista_de_anuncios = [];
        mostrarErrorAnuncios(error.message || 'No se pudo conectar con el servidor.');
      }
      renderizar_interfaz();
    }

    // Renderizar tarjetas principales según filtros activos
    function renderizar_interfaz() {
      const termino_busqueda = document.getElementById('filtro_busqueda_titulo').value.toLowerCase().trim();
      const depto_seleccionado = document.getElementById('filtro_departamento').value;
      const tipo_seleccionado = document.getElementById('filtro_tipo').value;

      const anuncios_filtrados = lista_de_anuncios.filter(item => {
        const coincide_titulo = String(item.titulo || '').toLowerCase().includes(termino_busqueda);
        const coincide_depto = !depto_seleccionado || item.departamento === depto_seleccionado;
        const coincide_tipo = !tipo_seleccionado || item.tipo === tipo_seleccionado;
        return coincide_titulo && coincide_depto && coincide_tipo;
      });

      const contenedor = document.getElementById('contenedor_tarjetas_anuncios');
      contenedor.innerHTML = '';

      if (anuncios_filtrados.length === 0) {
        contenedor.innerHTML = '<div class="estado_vacio">No se encontraron anuncios que coincidan con los filtros seleccionados.</div>';
      } else {
        anuncios_filtrados.forEach(anuncio => {
          let clase_etiqueta = 'etiqueta_general';
          if (anuncio.tipo === 'Importante') clase_etiqueta = 'etiqueta_importante';
          if (anuncio.tipo === 'Aviso') clase_etiqueta = 'etiqueta_aviso';

          const tarjeta = document.createElement('article');
          tarjeta.className = 'tarjeta_anuncio';
          tarjeta.innerHTML = `
            <div class="fila_etiqueta_anuncio">
              <span class="etiqueta_tipo ${clase_etiqueta}">
                <span class="punto_etiqueta"></span>
                ${escaparHTML(anuncio.tipo)}
              </span>
              <button class="boton_opciones_anuncio" title="Más opciones">&#8942;</button>
            </div>
            <h3 class="titulo_anuncio">${escaparHTML(anuncio.titulo)}</h3>
            <p class="descripcion_anuncio">${escaparHTML(anuncio.contenido)}</p>
            <div class="fila_metadatos_anuncio">
              <span class="item_metadato">
                <svg class="icono_metadato" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>
                ${escaparHTML(anuncio.departamento)}
              </span>
              <span class="item_metadato">
                <svg class="icono_metadato" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                ${escaparHTML(anuncio.autor || 'Coordinación')}
              </span>
              <span class="item_metadato">
                <svg class="icono_metadato" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 7V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                ${escaparHTML(anuncio.fecha)}
              </span>
            </div>
          `;
          contenedor.appendChild(tarjeta);
        });
      }

      actualizar_panel_lateral();
    }

    // Actualizar conteos por departamento y lista de últimos anuncios
    function actualizar_panel_lateral() {
      const conteos = {
        "Servicios Escolares": 0,
        "Control Escolar": 0,
        "Académico": 0,
        "Vinculación": 0,
        "Orientación": 0
      };

      lista_de_anuncios.forEach(item => {
        if (conteos[item.departamento] !== undefined) {
          conteos[item.departamento]++;
        }
      });

      document.getElementById('conteo_servicios').textContent = conteos['Servicios Escolares'];
      document.getElementById('conteo_control').textContent = conteos['Control Escolar'];
      document.getElementById('conteo_academico').textContent = conteos['Académico'];
      document.getElementById('conteo_vinculacion').textContent = conteos['Vinculación'];
      document.getElementById('conteo_orientacion').textContent = conteos['Orientación'];

      // Renderizar los 3 más recientes
      const contenedor_ultimos = document.getElementById('contenedor_ultimos_anuncios');
      contenedor_ultimos.innerHTML = '';
      
      const ultimos_tres = lista_de_anuncios.slice(0, 3);
      ultimos_tres.forEach(u => {
        const item_div = document.createElement('div');
        item_div.className = 'item_ultimo_anuncio';
        item_div.innerHTML = `
          <div class="item_ultimo_titulo">${escaparHTML(u.titulo)}</div>
          <div class="item_ultimo_fecha">${escaparHTML(u.fecha)}</div>
        `;
        contenedor_ultimos.appendChild(item_div);
      });
    }

    // Manejo del Modal
    const modal_nuevo = document.getElementById('modal_nuevo_anuncio');
    const boton_abrir_modal = document.getElementById('boton_abrir_modal');
    const boton_cerrar_cruz = document.getElementById('boton_cerrar_cruz');
    const boton_cancelar = document.getElementById('boton_cancelar_modal');
    const form_nuevo_anuncio = document.getElementById('formulario_nuevo_anuncio');

    function abrir_modal() {
      modal_nuevo.classList.add('modal_activo');
    }

    function cerrar_modal() {
      modal_nuevo.classList.remove('modal_activo');
      form_nuevo_anuncio.reset();
    }

    boton_abrir_modal.addEventListener('click', abrir_modal);
    boton_cerrar_cruz.addEventListener('click', cerrar_modal);
    boton_cancelar.addEventListener('click', cerrar_modal);

    modal_nuevo.addEventListener('click', (evento) => {
      if (evento.target === modal_nuevo) cerrar_modal();
    });

    // Guardar nuevo anuncio (POST compatible)
    form_nuevo_anuncio.addEventListener('submit', async (e) => {
      e.preventDefault();

      let usuario;
      try {
        usuario = JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
      } catch (error) {
        usuario = null;
      }
      if (!usuario || !usuario.id) {
        mostrarErrorAnuncios('Inicia sesión para publicar un anuncio.');
        return;
      }

      const nuevo_objeto = {
        titulo: document.getElementById('campo_titulo').value.trim(),
        prioridad: document.getElementById('campo_tipo').value,
        departamento_id: Number(document.getElementById('campo_departamento').value),
        contenido: document.getElementById('campo_contenido').value.trim(),
        autor_id: Number(usuario.id)
      };

      try {
        const respuesta = await fetch(`${window.OCID_API_BASE}/anuncios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevo_objeto)
        });
        const datos = await respuesta.json();
        if (!respuesta.ok || !datos.success) {
          throw new Error(datos.error || 'No se pudo publicar el anuncio.');
        }
        cerrar_modal();
        await cargar_anuncios_desde_servidor();
      } catch (error) {
        mostrarErrorAnuncios(error.message || 'No se pudo conectar con el servidor.');
      }
    });

    // Filtros dinámicos
    document.getElementById('filtro_busqueda_titulo').addEventListener('input', renderizar_interfaz);
    document.getElementById('filtro_departamento').addEventListener('change', renderizar_interfaz);
    document.getElementById('filtro_tipo').addEventListener('change', renderizar_interfaz);

    document.getElementById('boton_limpiar').addEventListener('click', () => {
      document.getElementById('filtro_busqueda_titulo').value = '';
      document.getElementById('filtro_departamento').value = '';
      document.getElementById('filtro_tipo').value = '';
      renderizar_interfaz();
    });

    // Inicialización al cargar la ventana
    window.addEventListener('DOMContentLoaded', cargar_anuncios_desde_servidor);

