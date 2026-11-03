/* Lógica propia de anuncios.html */
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
          const noLeidas = Array.isArray(datos) ? datos.filter(notificacion => !notificacion.leida).length : 0;
          document.querySelectorAll(
            '.badge_campana, .insignia_notificacion, .etiqueta_notificaciones, .insignia_notificacion_lateral, #indicador_notificaciones'
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

    // Control Único y Visible del Menú Móvil
    let botonMenu = barraSuperior.querySelector('.menu_movil, .boton_menu_hamburguesa');
    if (!botonMenu) {
      botonMenu = document.createElement('button');
      botonMenu.type = 'button';
      botonMenu.className = 'boton_menu_hamburguesa';
      botonMenu.setAttribute('aria-label', 'Abrir menú de navegación');
      botonMenu.setAttribute('aria-expanded', 'false');
      
      botonMenu.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      
      const seccionIzquierda = barraSuperior.querySelector('.seccion_superior_izquierda') || barraSuperior;
      seccionIzquierda.prepend(botonMenu);
    } else {
      if (!botonMenu.querySelector('svg')) {
        botonMenu.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      }
    }

    let fondoMovil = document.querySelector('.fondo_menu_movil');
    if (!fondoMovil) {
      fondoMovil = document.createElement('button');
      fondoMovil.type = 'button';
      fondoMovil.className = 'fondo_menu_movil';
      fondoMovil.setAttribute('aria-label', 'Cerrar menú de navegación');
      document.body.appendChild(fondoMovil);
    }

    function alternarMenu(abrir) {
      const estado = abrir !== undefined ? abrir : !document.body.classList.contains('menu_movil_abierto');
      document.body.classList.toggle('menu_movil_abierto', estado);
      botonMenu.setAttribute('aria-expanded', String(estado));
    }

    botonMenu.addEventListener('click', (evento) => {
      evento.stopPropagation();
      alternarMenu();
    });

    fondoMovil.addEventListener('click', () => alternarMenu(false));

    barraLateral.querySelectorAll('a').forEach(enlace => {
      enlace.addEventListener('click', () => alternarMenu(false));
    });

    document.addEventListener('keydown', evento => {
      if (evento.key === 'Escape') alternarMenu(false);
    });

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
let anuncioEnEdicionId = null;

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

  let textoFinal = mensaje;
  if (mensaje && (mensaje.toLowerCase().includes('failed to fetch') || mensaje.toLowerCase().includes('networkerror'))) {
    textoFinal = 'No se pudo cargar';
  }

  aviso.textContent = textoFinal;
  aviso.hidden = false;

  if (window.temporizadorAvisoAnuncios) {
    clearTimeout(window.temporizadorAvisoAnuncios);
  }

  window.temporizadorAvisoAnuncios = setTimeout(() => {
    aviso.hidden = true;
  }, 7000);
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
    if (!respuestaAnuncios.ok) throw new Error('No se pudo cargar');
    if (!respuestaDepartamentos.ok) throw new Error('No se pudo cargar');
    if (!Array.isArray(datosAnuncios) || !Array.isArray(datosDepartamentos)) {
      throw new Error('No se pudo cargar');
    }

    lista_de_anuncios = datosAnuncios.map(anuncio => ({
      ...anuncio,
      tipo: anuncio.prioridad || 'Urgente',
      departamento: anuncio.departamento_nombre || 'General',
      autor: anuncio.autor_nombre || 'Coordinación',
      fecha: anuncio.fecha ? new Date(anuncio.fecha).toLocaleDateString('es-MX') : ''
    }));
    departamentos_anuncios = datosDepartamentos;

    const selectorDepartamento = document.getElementById('campo_departamento');
    if (selectorDepartamento) {
      selectorDepartamento.replaceChildren();
      datosDepartamentos.forEach(departamento => {
        const opcion = document.createElement('option');
        opcion.value = String(departamento.id);
        opcion.textContent = departamento.nombre;
        selectorDepartamento.appendChild(opcion);
      });
    }
  } catch (error) {
    lista_de_anuncios = [];
    mostrarErrorAnuncios('No se pudo cargar');
  }
  renderizar_interfaz();
}

function renderizar_interfaz() {
  const termino_busqueda = document.getElementById('filtro_busqueda_titulo').value.toLowerCase().trim();
  const depto_seleccionado = document.getElementById('filtro_departamento').value;
  const tipo_seleccionado = document.getElementById('filtro_tipo').value;

  let usuarioActual = null;
  try {
    usuarioActual = JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
  } catch (e) {
    usuarioActual = null;
  }

  const anuncios_filtrados = lista_de_anuncios.filter(item => {
    const coincide_titulo = String(item.titulo || '').toLowerCase().includes(termino_busqueda);
    const coincide_depto = !depto_seleccionado || item.departamento === depto_seleccionado;
    const coincide_tipo = !tipo_seleccionado || item.tipo === tipo_seleccionado;
    return coincide_titulo && coincide_depto && coincide_tipo;
  });

  const contenedor = document.getElementById('contenedor_tarjetas_anuncios');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  if (anuncios_filtrados.length === 0) {
    contenedor.innerHTML = '<div class="estado_vacio">No se encontraron anuncios que coincidan con los filtros seleccionados.</div>';
  } else {
    anuncios_filtrados.forEach(anuncio => {
      let clase_etiqueta = 'etiqueta_general';
      if (anuncio.tipo === 'Urgente') clase_etiqueta = 'etiqueta_urgente';
      if (anuncio.tipo === 'Moderado') clase_etiqueta = 'etiqueta_moderado';

      const esAutor = usuarioActual && (Number(usuarioActual.id) === Number(anuncio.autor_id));

      const tarjeta = document.createElement('article');
      tarjeta.className = 'tarjeta_anuncio';
      tarjeta.style.position = 'relative';
      
tarjeta.innerHTML = `
        <div class="fila_etiqueta_anuncio">
          <span class="etiqueta_tipo ${clase_etiqueta}">
            <span class="punto_etiqueta"></span>
            ${escaparHTML(anuncio.tipo)}
          </span>
          <div style="position: relative;">
            <button class="boton_opciones_anuncio" title="Más opciones" onclick="toggleMenuOpciones(event, ${anuncio.id})">&#8942;</button>
            <div id="menu_opciones_${anuncio.id}" style="display: none; position: absolute; right: 0; top: 25px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; box-shadow: 0px 4px 12px rgba(0,0,0,0.15); z-index: 50; width: 140px; padding: 4px 0;">
              <button onclick="prepararEdicionAnuncio(${anuncio.id}, ${esAutor})" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 13px; cursor: pointer; color: ${esAutor ? '#0f172a' : '#94a3b8'}; display: flex; align-items: center; gap: 8px;">
                <svg fill="none" height="15" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Editar
              </button>
              <button onclick="eliminarAnuncio(${anuncio.id}, ${esAutor})" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-size: 13px; cursor: pointer; color: ${esAutor ? '#ef4444' : '#94a3b8'}; display: flex; align-items: center; gap: 8px;">
                <svg fill="none" height="15" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="15"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Eliminar
              </button>
            </div>
          </div>
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

function toggleMenuOpciones(evento, idAnuncio) {
  evento.stopPropagation();
  document.querySelectorAll('[id^="menu_opciones_"]').forEach(menu => {
    if (menu.id !== `menu_opciones_${idAnuncio}`) menu.style.display = 'none';
  });

  const menu = document.getElementById(`menu_opciones_${idAnuncio}`);
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}

window.addEventListener('click', () => {
  document.querySelectorAll('[id^="menu_opciones_"]').forEach(menu => {
    menu.style.display = 'none';
  });
});

function prepararEdicionAnuncio(id, esAutor) {
  if (!esAutor) {
    mostrarErrorAnuncios('No tienes permisos para editar este anuncio porque no eres el autor.');
    return;
  }

  const anuncio = lista_de_anuncios.find(a => a.id === id);
  if (!anuncio) return;

  anuncioEnEdicionId = id;
  document.getElementById('campo_titulo').value = anuncio.titulo;
  document.getElementById('campo_tipo').value = anuncio.prioridad || anuncio.tipo;
  document.getElementById('campo_contenido').value = anuncio.contenido;
  
  const deptoEncontrado = departamentos_anuncios.find(d => d.nombre === anuncio.departamento);
  if (deptoEncontrado) {
    document.getElementById('campo_departamento').value = String(deptoEncontrado.id);
  }

  abrir_modal();
}

async function eliminarAnuncio(id, esAutor) {
  if (!esAutor) {
    mostrarErrorAnuncios('No tienes permisos para eliminar este anuncio porque no eres el autor.');
    return;
  }

  if (!confirm('¿Estás seguro de que deseas eliminar este anuncio?')) return;

  try {
    const respuesta = await fetch(`${window.OCID_API_BASE}/anuncios/${id}`, {
      method: 'DELETE'
    });
    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.success) {
      throw new Error('No se pudo cargar');
    }
    await cargar_anuncios_desde_servidor();
  } catch (error) {
    mostrarErrorAnuncios('No se pudo cargar');
  }
}

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

  if (document.getElementById('conteo_servicios')) document.getElementById('conteo_servicios').textContent = conteos['Servicios Escolares'];
  if (document.getElementById('conteo_control')) document.getElementById('conteo_control').textContent = conteos['Control Escolar'];
  if (document.getElementById('conteo_academico')) document.getElementById('conteo_academico').textContent = conteos['Académico'];
  if (document.getElementById('conteo_vinculacion')) document.getElementById('conteo_vinculacion').textContent = conteos['Vinculación'];
  if (document.getElementById('conteo_orientacion')) document.getElementById('conteo_orientacion').textContent = conteos['Orientación'];

  const contenedor_ultimos = document.getElementById('contenedor_ultimos_anuncios');
  if (!contenedor_ultimos) return;
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

const modal_nuevo = document.getElementById('modal_nuevo_anuncio');
const boton_abrir_modal = document.getElementById('boton_abrir_modal');
const boton_cerrar_cruz = document.getElementById('boton_cerrar_cruz');
const boton_cancelar = document.getElementById('boton_cancelar_modal');
const form_nuevo_anuncio = document.getElementById('formulario_nuevo_anuncio');

function abrir_modal() {
  if (modal_nuevo) modal_nuevo.classList.add('modal_activo');
}

function cerrar_modal() {
  if (modal_nuevo) modal_nuevo.classList.remove('modal_activo');
  if (form_nuevo_anuncio) form_nuevo_anuncio.reset();
  anuncioEnEdicionId = null;
}

if (boton_abrir_modal) {
  boton_abrir_modal.addEventListener('click', () => {
    anuncioEnEdicionId = null;
    abrir_modal();
  });
}
if (boton_cerrar_cruz) boton_cerrar_cruz.addEventListener('click', cerrar_modal);
if (boton_cancelar) boton_cancelar.addEventListener('click', cerrar_modal);

if (modal_nuevo) {
  modal_nuevo.addEventListener('click', (evento) => {
    if (evento.target === modal_nuevo) cerrar_modal();
  });
}

if (form_nuevo_anuncio) {
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

    const objeto_anuncio = {
      titulo: document.getElementById('campo_titulo').value.trim(),
      prioridad: document.getElementById('campo_tipo').value,
      departamento_id: Number(document.getElementById('campo_departamento').value),
      contenido: document.getElementById('campo_contenido').value.trim(),
      autor_id: Number(usuario.id)
    };

    try {
      let url = `${window.OCID_API_BASE}/anuncios`;
      let metodo = 'POST';

      if (anuncioEnEdicionId !== null) {
        url = `${window.OCID_API_BASE}/anuncios/${anuncioEnEdicionId}`;
        metodo = 'PUT';
      }

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objeto_anuncio)
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.success) {
        throw new Error('No se pudo cargar');
      }
      cerrar_modal();
      await cargar_anuncios_desde_servidor();
    } catch (error) {
      mostrarErrorAnuncios('No se pudo cargar');
    }
  });
}

if (document.getElementById('filtro_busqueda_titulo')) document.getElementById('filtro_busqueda_titulo').addEventListener('input', renderizar_interfaz);
if (document.getElementById('filtro_departamento')) document.getElementById('filtro_departamento').addEventListener('change', renderizar_interfaz);
if (document.getElementById('filtro_tipo')) document.getElementById('filtro_tipo').addEventListener('change', renderizar_interfaz);

if (document.getElementById('boton_limpiar')) {
  document.getElementById('boton_limpiar').addEventListener('click', () => {
    document.getElementById('filtro_busqueda_titulo').value = '';
    document.getElementById('filtro_departamento').value = '';
    document.getElementById('filtro_tipo').value = '';
    renderizar_interfaz();
  });
}

window.addEventListener('DOMContentLoaded', cargar_anuncios_desde_servidor);