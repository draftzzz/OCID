/* Lógica propia de docentes.html */
(function () {
  window.OCID_API_BASE = 'https://ocid.onrender.com';
  window.listaDepartamentosOCID = [];

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
      '.rol_usuario, .cargo_perfil, .rol_usuario_superior, .cargo_usuario, #etiqueta_rol_usuario'
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
          if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar las notificaciones');
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

function abrirModalDocente() {
  document.getElementById('modal_registro_docente').style.display = 'flex';
}

function cerrarModalDocente() {
  document.getElementById('modal_registro_docente').style.display = 'none';
}

window.addEventListener('click', function(evento) {
  if (evento.target === document.getElementById('modal_registro_docente')) {
    cerrarModalDocente();
  }
});

function mostrarAvisoDocentes(mensaje, error) {
  let aviso = document.getElementById('aviso_anuncios') || document.getElementById('aviso_docentes');
  if (!aviso) {
    aviso = document.createElement('p');
    aviso.id = 'aviso_docentes';
    aviso.className = 'aviso_docentes';
    aviso.setAttribute('role', 'status');
    const barraFiltros = document.querySelector('.barra_filtros');
    if (barraFiltros) {
      barraFiltros.before(aviso);
    } else {
      document.body.prepend(aviso);
    }
  }
  
  // Limpiar y formatear mensajes de error comunes (como TypeError por red / failed to fetch)
  let textoFinal = mensaje;
  if (mensaje && (mensaje.toLowerCase().includes('failed to fetch') || mensaje.toLowerCase().includes('networkerror'))) {
    textoFinal = 'No se pudo cargar';
  }

  aviso.textContent = textoFinal;
  
  if (error) {
    aviso.classList.add('aviso_docentes_error');
  } else {
    aviso.classList.remove('aviso_docentes_error');
  }
  
  aviso.style.display = 'flex';

  if (window.temporizadorAvisoDocentes) {
    clearTimeout(window.temporizadorAvisoDocentes);
  }

  window.temporizadorAvisoDocentes = setTimeout(() => {
    aviso.style.display = 'none';
  }, 7000);
}

async function cargarDocentes() {
  const cuerpo = document.getElementById('cuerpo_tabla_docentes');
  cuerpo.innerHTML = '<tr><td class="celda_docente" colspan="6">Cargando docentes...</td></tr>';
  const grupoPaginacion = document.querySelector('.botones_paginacion_grupo');
  if (grupoPaginacion) grupoPaginacion.replaceChildren();

  try {
    const respuesta = await fetch(`${window.OCID_API_BASE}/login`);
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || 'No se pudo cargar');
    if (!Array.isArray(datos)) throw new Error('La respuesta del servidor no es válida.');

    cuerpo.replaceChildren();
    datos.forEach(agregarFilaDocente);
    if (datos.length === 0) {
      cuerpo.innerHTML = '<tr><td class="celda_docente" colspan="6">No hay docentes registrados.</td></tr>';
    }
    filtrarTablaDocentes();
  } catch (error) {
    cuerpo.innerHTML = '<tr><td class="celda_docente" colspan="6">No se pudo cargar. Intenta recargar.</td></tr>';
    mostrarAvisoDocentes('No se pudo cargar', true);
    filtrarTablaDocentes();
  }
}

async function cargarDepartamentosDocentes() {
  try {
    const respuesta = await fetch(`${window.OCID_API_BASE}/departamentos`);
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.error || 'No se pudo cargar');

    window.listaDepartamentosOCID = datos;

    const filtroDepto = document.getElementById('filtro_departamento');
    if (filtroDepto) {
      filtroDepto.replaceChildren(new Option('Todos los departamentos', 'todos'));
      datos.forEach(departamento => {
        filtroDepto.add(new Option(departamento.nombre, departamento.nombre));
      });
    }

    const selectorModal = document.getElementById('departamento_select');
    if (selectorModal) {
      selectorModal.replaceChildren();
      datos.forEach(departamento => {
        const opcion = document.createElement('option');
        opcion.value = departamento.nombre;
        opcion.textContent = departamento.nombre;
        selectorModal.appendChild(opcion);
      });
    }

    cargarDocentes();
  } catch (error) {
    mostrarAvisoDocentes('No se pudo cargar', true);
  }
}

function agregarFilaDocente(docente) {
  const nombre = docente.nombre || 'Sin nombre';
  const deptoActualId = docente.departamento_id || '';
  const deptoActualNombre = docente.departamento_nombre || docente.departamento || 'Sin departamento';
  const rol = docente.rol || 'Docente';
  const iniciales = nombre.split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase();
  
  const fila = document.createElement('tr');
  fila.className = 'fila_docente';
  fila.dataset.id = String(docente.id);
  fila.dataset.nombre = nombre;
  fila.dataset.departamento = deptoActualNombre;
  fila.dataset.estado = 'Activo';

  // Columna Nombre
  const celdaNombre = document.createElement('td');
  celdaNombre.className = 'celda_docente';
  const columnaNombre = document.createElement('div');
  columnaNombre.className = 'columna_nombre_info';
  const avatar = document.createElement('div');
  avatar.className = 'avatar_docente avatar_azul';
  avatar.textContent = iniciales;
  const textoNombre = document.createElement('span');
  textoNombre.className = 'texto_nombre_docente';
  textoNombre.textContent = nombre;
  columnaNombre.append(avatar, textoNombre);
  celdaNombre.appendChild(columnaNombre);
  fila.appendChild(celdaNombre);

  // Columna Correo
  const celdaCorreo = document.createElement('td');
  celdaCorreo.className = 'celda_docente';
  celdaCorreo.textContent = docente.correo || '';
  fila.appendChild(celdaCorreo);

  // Columna Departamento
  const celdaDepto = document.createElement('td');
  celdaDepto.className = 'celda_docente';
  const selectDepto = document.createElement('select');
  selectDepto.className = 'select_modal';
  selectDepto.style.padding = '4px 8px';
  selectDepto.style.fontSize = '13px';

  const optionSinDepto = document.createElement('option');
  optionSinDepto.value = '';
  optionSinDepto.textContent = 'Sin departamento';
  selectDepto.appendChild(optionSinDepto);

  if (window.listaDepartamentosOCID) {
    window.listaDepartamentosOCID.forEach(dep => {
      const opt = document.createElement('option');
      opt.value = String(dep.id);
      opt.textContent = dep.nombre;
      if (Number(dep.id) === Number(deptoActualId) || dep.nombre === deptoActualNombre) {
        opt.selected = true;
      }
      selectDepto.appendChild(opt);
    });
  }

  selectDepto.addEventListener('change', async () => {
    const nuevoDeptoId = selectDepto.value ? Number(selectDepto.value) : null;
    try {
      const respuesta = await fetch(`${window.OCID_API_BASE}/usuarios/${docente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: docente.nombre,
          correo: docente.correo,
          departamento_id: nuevoDeptoId
        })
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.success) {
        throw new Error(datos.error || 'No se pudo cargar');
      }
      mostrarAvisoDocentes('Departamento actualizado correctamente.', false);
      const deptoSeleccionadoObj = window.listaDepartamentosOCID.find(d => Number(d.id) === Number(nuevoDeptoId));
      const nuevoNombreDepto = deptoSeleccionadoObj ? deptoSeleccionadoObj.nombre : 'Sin departamento';
      fila.dataset.departamento = nuevoNombreDepto;
    } catch (error) {
      mostrarAvisoDocentes('No se pudo cargar', true);
    }
  });

  celdaDepto.appendChild(selectDepto);
  fila.appendChild(celdaDepto);

  // Columna Rol
  const celdaRol = document.createElement('td');
  celdaRol.className = 'celda_docente';
  const insigniaRol = document.createElement('span');
  insigniaRol.className = `badge_rol ${rol === 'Jefe' ? 'badge_rol_jefe' : 'badge_rol_docente'}`;
  insigniaRol.textContent = rol;
  celdaRol.appendChild(insigniaRol);
  fila.appendChild(celdaRol);

  // Columna Estado
  const celdaEstado = document.createElement('td');
  celdaEstado.className = 'celda_docente';
  celdaEstado.innerHTML = '<span class="badge_estado badge_estado_activo"><span class="punto_estado punto_activo"></span>Activo</span>';
  fila.appendChild(celdaEstado);

  // Columna Acciones
  const celdaAccion = document.createElement('td');
  celdaAccion.className = 'celda_docente';
  celdaAccion.style.textAlign = 'right';
  const botonEliminar = document.createElement('button');
  botonEliminar.className = 'boton_accion_fila';
  botonEliminar.type = 'button';
  botonEliminar.title = 'Eliminar docente';
  botonEliminar.setAttribute('aria-label', `Eliminar a ${nombre}`);
  botonEliminar.textContent = '×';
  botonEliminar.addEventListener('click', () => eliminarDocente(docente.id));
  celdaAccion.appendChild(botonEliminar);
  fila.appendChild(celdaAccion);

  document.getElementById('cuerpo_tabla_docentes').appendChild(fila);
}

async function procesarRegistroDocente(evento) {
  evento.preventDefault();
  const formulario = document.getElementById('formulario_docente');
  const botonGuardar = formulario.querySelector('[type="submit"]');
  botonGuardar.disabled = true;

  try {
    const respuesta = await fetch(`${window.OCID_API_BASE}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: document.getElementById('nombre_docente_input').value.trim(),
        correo: document.getElementById('correo_docente_input').value.trim(),
        password: document.getElementById('password_docente_input').value,
        departamento: document.getElementById('departamento_select').value,
        rol: document.getElementById('rol_select').value
      })
    });
    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.success) {
      throw new Error(datos.error || 'No se pudo cargar');
    }

    formulario.reset();
    cerrarModalDocente();
    mostrarAvisoDocentes('Docente registrado correctamente.', false);
    await cargarDocentes();
  } catch (error) {
    mostrarAvisoDocentes('No se pudo cargar', true);
  } finally {
    botonGuardar.disabled = false;
  }
}

async function eliminarDocente(id) {
  let usuarioActual;
  try {
    usuarioActual = JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
  } catch (error) {
    usuarioActual = null;
  }
  if (Number(usuarioActual && usuarioActual.id) === Number(id)) {
    mostrarAvisoDocentes('No puedes eliminar tu propia cuenta desde esta pantalla.', true);
    return;
  }
  if (!window.confirm('¿Seguro que quieres eliminar este docente?')) return;

  try {
    const respuesta = await fetch(`${window.OCID_API_BASE}/login/${Number(id)}`, {
      method: 'DELETE'
    });
    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.success) {
      throw new Error(datos.error || 'No se pudo cargar');
    }
    mostrarAvisoDocentes('Docente eliminado correctamente.', false);
    await cargarDocentes();
  } catch (error) {
    mostrarAvisoDocentes('No se pudo cargar', true);
  }
}

let paginaDocentes = 1;
const docentesPorPagina = 4;

function filtrarTablaDocentes() {
  const textoFiltro = document.getElementById('filtro_nombre_input').value.toLowerCase().trim();
  const deptoFiltro = document.getElementById('filtro_departamento').value;
  const estadoFiltro = document.getElementById('filtro_estado').value;
  const filas = document.querySelectorAll('#cuerpo_tabla_docentes .fila_docente');
  const coincidentes = [];

  filas.forEach(fila => {
    const coincide = fila.dataset.nombre.toLowerCase().includes(textoFiltro) &&
      (deptoFiltro === 'todos' || fila.dataset.departamento === deptoFiltro) &&
      (estadoFiltro === 'todos' || fila.dataset.estado === estadoFiltro);
    if (coincide) coincidentes.push(fila);
  });

  const paginas = Math.max(1, Math.ceil(coincidentes.length / docentesPorPagina));
  paginaDocentes = Math.min(paginaDocentes, paginas);
  const inicio = (paginaDocentes - 1) * docentesPorPagina;
  
  coincidentes.forEach((fila, indice) => {
    fila.hidden = indice < inicio || indice >= inicio + docentesPorPagina;
  });
  filas.forEach(fila => {
    if (!coincidentes.includes(fila)) fila.hidden = true;
  });

  const cantidadMostrados = Math.min(docentesPorPagina, coincidentes.length - inicio);
  const totalDocentes = coincidentes.length;
  const resumenPaginacion = document.getElementById('resumen_paginacion');
  if (resumenPaginacion) {
    resumenPaginacion.textContent = `Mostrando ${Math.max(0, cantidadMostrados)} de ${totalDocentes} docentes`;
  }
  renderizarPaginacionDocentes(paginas);
}

function renderizarPaginacionDocentes(paginas) {
  const grupo = document.querySelector('.botones_paginacion_grupo');
  if (!grupo) return;
  grupo.replaceChildren();

  const agregarBoton = (texto, pagina, etiqueta) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn_pagina' + (pagina === paginaDocentes ? ' btn_pagina_activa' : '');
    boton.textContent = texto;
    boton.setAttribute('aria-label', etiqueta);
    if (pagina === paginaDocentes) {
      boton.disabled = true;
    }
    boton.addEventListener('click', () => {
      paginaDocentes = pagina;
      filtrarTablaDocentes();
    });
    grupo.appendChild(boton);
  };

  if (paginaDocentes > 1) {
    agregarBoton('‹', paginaDocentes - 1, 'Página anterior');
  }
  
  for (let pagina = 1; pagina <= paginas; pagina++) {
    agregarBoton(String(pagina), pagina, `Página ${pagina}`);
  }

  if (paginaDocentes < paginas) {
    agregarBoton('›', paginaDocentes + 1, 'Página siguiente');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarDepartamentosDocentes();
});

document.querySelectorAll('[data-evento-pagina="evento-1"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { abrirModalDocente() }); });
document.querySelectorAll('[data-evento-pagina="evento-2"]').forEach(function (elemento) { elemento.addEventListener('input', function (event) { paginaDocentes = 1; filtrarTablaDocentes() }); });
document.querySelectorAll('[data-evento-pagina="evento-3"]').forEach(function (elemento) { elemento.addEventListener('change', function (event) { paginaDocentes = 1; filtrarTablaDocentes() }); });
document.querySelectorAll('[data-evento-pagina="evento-4"]').forEach(function (elemento) { elemento.addEventListener('change', function (event) { paginaDocentes = 1; filtrarTablaDocentes() }); });
document.querySelectorAll('[data-evento-pagina="evento-5"]').forEach(function (elemento) { elemento.addEventListener('click', function (event) { cerrarModalDocente() }); });
document.querySelectorAll('[data-evento-pagina="evento-6"]').forEach(function (elemento) { elemento.addEventListener('submit', function (event) { procesarRegistroDocente(event) }); });
document.querySelectorAll('[data-evento-pagina="evento-7"]').forEach(function (elemento)  { elemento.addEventListener('click', function (event) { cerrarModalDocente() }); });