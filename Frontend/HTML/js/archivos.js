/* Lógica propia de archivos.html */
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

    if (!barraSuperior.querySelector('.boton_menu_hamburguesa')) {
      const boton = barraSuperior.querySelector('.boton_menu_hamburguesa') || document.createElement('button');
      if (!boton.classList.contains('boton_menu_hamburguesa')) {
        boton.type = 'button';
        boton.className = 'boton_menu_hamburguesa';
        boton.setAttribute('aria-label', 'Abrir menú de navegación');
        boton.innerHTML = '<i class="fa-solid fa-bars"></i>';
        barraSuperior.querySelector('.seccion_superior_izquierda').prepend(boton);
      }

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

const apiArchivos = window.OCID_API_BASE;
const modalArchivo = document.getElementById('modal_subir_archivo');
const selectorArchivo = document.getElementById('input_archivo_oculto');
const cuerpoArchivos = document.getElementById('cuerpo_tabla_archivos');
let archivosCargados = [];

function sesionArchivos() {
  try {
    return JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
  } catch (error) {
    console.error('No se pudo leer la sesión:', error);
    return null;
  }
}

// Función centralizada para mostrar avisos con auto-ocultado a los 7 segundos
function mostrarAvisoArchivos(mensaje, esError) {
  let aviso = document.getElementById('aviso_archivos');
  if (!aviso) {
    aviso = document.createElement('div');
    aviso.id = 'aviso_archivos';
    aviso.className = 'aviso_docentes';
    aviso.setAttribute('role', 'status');
    const barraFiltros = document.querySelector('.barra_filtros');
    if (barraFiltros) {
      barraFiltros.before(aviso);
    } else {
      document.body.prepend(aviso);
    }
  }

  let textoFinal = mensaje;
  if (esError && (mensaje.toLowerCase().includes('failed to fetch') || mensaje.toLowerCase().includes('networkerror') || mensaje.toLowerCase().includes('error'))) {
    textoFinal = 'No se pudo cargar';
  }

  aviso.textContent = textoFinal;

  if (esError) {
    aviso.classList.add('aviso_docentes_error');
  } else {
    aviso.classList.remove('aviso_docentes_error');
  }

  aviso.style.display = 'flex';

  if (window.temporizadorAvisoArchivos) {
    clearTimeout(window.temporizadorAvisoArchivos);
  }

  window.temporizadorAvisoArchivos = setTimeout(() => {
    aviso.style.display = 'none';
  }, 7000);
}

async function respuestaArchivos(ruta, opciones) {
  try {
    const respuesta = await fetch(apiArchivos + ruta, opciones);
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error('No se pudo cargar');
    return datos;
  } catch (err) {
    throw new Error('No se pudo cargar');
  }
}

function formatearTamano(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

function dibujarArchivos() {
  if (!cuerpoArchivos) return;
  cuerpoArchivos.replaceChildren();
  
  const filtroDepartamento = document.getElementById('filtro_departamento').value;
  const filtroTipo = document.getElementById('filtro_tipo').value;
  const filtroNombre = document.getElementById('filtro_nombre').value.toLowerCase().trim();

  const visibles = archivosCargados.filter(archivo => {
    const departamento = String(archivo.departamento_id || '');
    const extension = (archivo.nombre.split('.').pop() || '').toLowerCase();
    return (filtroDepartamento === 'todos' || filtroDepartamento === departamento) &&
      (filtroTipo === 'todos' || filtroTipo === extension) &&
      archivo.nombre.toLowerCase().includes(filtroNombre);
  });

  visibles.forEach(archivo => {
    const fila = document.createElement('tr');
    
    const celdaNombre = document.createElement('td');
    const contenedorNombre = document.createElement('div');
    contenedorNombre.className = 'contenedor_nombre_archivo';
    
    const extension = (archivo.nombre.split('.').pop() || '').toUpperCase();
    const iconoTipo = document.createElement('div');
    iconoTipo.className = extension === 'PDF' ? 'icono_tipo_pdf' : 'icono_tipo_xlsx';
    iconoTipo.textContent = extension.slice(0, 4);

    const textosDiv = document.createElement('div');
    const nombreDiv = document.createElement('div');
    nombreDiv.className = 'texto_nombre_archivo';
    nombreDiv.textContent = archivo.nombre;
    const tamanoDiv = document.createElement('div');
    tamanoDiv.className = 'texto_tamano_archivo';
    tamanoDiv.textContent = formatearTamano(Number(archivo.tamano) || 0);
    textosDiv.append(nombreDiv, tamanoDiv);

    contenedorNombre.append(iconoTipo, textosDiv);
    celdaNombre.appendChild(contenedorNombre);

    const celdaTipo = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = extension === 'PDF' ? 'badge_pdf' : 'badge_xlsx';
    badge.textContent = extension;
    celdaTipo.appendChild(badge);

    const celdaDepartamento = document.createElement('td');
    celdaDepartamento.textContent = archivo.departamento_nombre || 'Sin departamento';

    const celdaAutor = document.createElement('td');
    celdaAutor.textContent = archivo.autor_nombre || 'Usuario';

    const celdaFecha = document.createElement('td');
    celdaFecha.textContent = archivo.fecha ? new Date(archivo.fecha).toLocaleDateString('es-MX') : '';

    const celdaAcciones = document.createElement('td');
    const contenedorAcciones = document.createElement('div');
    contenedorAcciones.className = 'acciones_celda';

    const botonDescargar = document.createElement('button');
    botonDescargar.type = 'button';
    botonDescargar.className = 'boton_accion_icono';
    botonDescargar.title = 'Descargar';
    botonDescargar.innerHTML = '<svg fill="none" height="17" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="17"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>';
    botonDescargar.addEventListener('click', () => descargarArchivo(archivo.id));

    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.className = 'boton_accion_icono';
    botonEliminar.title = 'Eliminar';
    botonEliminar.innerHTML = '<svg fill="none" height="17" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="17"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    botonEliminar.addEventListener('click', () => eliminarArchivo(archivo.id, archivo.autor_id));

    contenedorAcciones.append(botonDescargar, botonEliminar);
    celdaAcciones.appendChild(contenedorAcciones);

    fila.append(celdaNombre, celdaTipo, celdaDepartamento, celdaAutor, celdaFecha, celdaAcciones);
    cuerpoArchivos.appendChild(fila);
  });

  if (!visibles.length) {
    const filaVacia = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 6;
    celda.style.textAlign = 'center';
    celda.style.padding = '20px';
    celda.textContent = archivosCargados.length ? 'No hay archivos para esos filtros.' : 'No hay archivos disponibles.';
    filaVacia.appendChild(celda);
    cuerpoArchivos.appendChild(filaVacia);
  }
}

async function cargarArchivos() {
  try {
    const [archivos, departamentos] = await Promise.all([
      respuestaArchivos('/archivos'),
      respuestaArchivos('/departamentos')
    ]);
    archivosCargados = archivos;

    const selector = document.getElementById('filtro_departamento');
    if (selector) {
      selector.replaceChildren(new Option('Todos los departamentos', 'todos'));
      departamentos.forEach(departamento => selector.add(new Option(departamento.nombre, String(departamento.id))));
    }

    const selectorDestino = document.getElementById('departamento_seleccion');
    if (selectorDestino) {
      selectorDestino.replaceChildren(new Option('Selecciona un departamento', ''));
      departamentos.forEach(departamento => selectorDestino.add(new Option(departamento.nombre, String(departamento.id))));
      const usuario = sesionArchivos();
      if (usuario && usuario.departamento_id) selectorDestino.value = String(usuario.departamento_id);
    }

    dibujarArchivos();
  } catch (error) {
    mostrarAvisoArchivos('No se pudo cargar', true);
  }
}

async function descargarArchivo(id) {
  try {
    const datos = await respuestaArchivos('/archivos/' + encodeURIComponent(id));
    const archivo = datos.archivo;
    const partes = archivo.ruta.split(',');
    const binario = atob(partes[1]);
    const bytes = new Uint8Array(binario.length);
    for (let indice = 0; indice < binario.length; indice++) bytes[indice] = binario.charCodeAt(indice);
    const url = URL.createObjectURL(new Blob([bytes], { type: archivo.tipo }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = archivo.nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    mostrarAvisoArchivos('No se pudo cargar', true);
  }
}

async function eliminarArchivo(id, autorId) {
  const usuario = sesionArchivos();
  
  if (!usuario || Number(usuario.id) !== Number(autorId)) {
    mostrarAvisoArchivos('No puedes eliminar este archivo porque no te pertenece.', true);
    return;
  }

  if (!window.confirm('¿Estás seguro de eliminar este archivo?')) return;
  
  try {
    await respuestaArchivos('/archivos/' + encodeURIComponent(id), { method: 'DELETE' });
    mostrarAvisoArchivos('El archivo se eliminó correctamente.', false);
    await cargarArchivos();
  } catch (error) {
    mostrarAvisoArchivos('No se pudo cargar', true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const abrirModalBtn = document.getElementById('abrir_modal_subir');
  const cerrarModalBtn = document.getElementById('cerrar_modal_subir');
  const cancelarModalBtn = document.getElementById('cancelar_modal');
  const zonaArchivo = document.getElementById('zona_archivo');

  if (abrirModalBtn) abrirModalBtn.addEventListener('click', () => { modalArchivo.style.display = 'flex'; });
  if (cerrarModalBtn) cerrarModalBtn.addEventListener('click', () => { modalArchivo.style.display = 'none'; });
  if (cancelarModalBtn) cancelarModalBtn.addEventListener('click', () => { modalArchivo.style.display = 'none'; });
  
  if (modalArchivo) {
    modalArchivo.addEventListener('click', evento => {
      if (evento.target === modalArchivo) modalArchivo.style.display = 'none';
    });
  }

  if (zonaArchivo && selectorArchivo) {
    zonaArchivo.addEventListener('click', () => selectorArchivo.click());
    selectorArchivo.addEventListener('change', () => {
      if (selectorArchivo.files.length) {
        document.getElementById('nombre_documento').value = selectorArchivo.files[0].name;
      }
    });
  }

  const filtroDepto = document.getElementById('filtro_departamento');
  const filtroTipo = document.getElementById('filtro_tipo');
  const filtroNombre = document.getElementById('filtro_nombre');

  if (filtroDepto) filtroDepto.addEventListener('change', dibujarArchivos);
  if (filtroTipo) filtroTipo.addEventListener('change', dibujarArchivos);
  if (filtroNombre) filtroNombre.addEventListener('input', dibujarArchivos);

  const guardarBtn = document.getElementById('guardar_archivo');
  if (guardarBtn) {
    guardarBtn.addEventListener('click', async () => {
      const archivo = selectorArchivo.files[0];
      const usuario = sesionArchivos();
      const departamentoIdSelect = document.getElementById('departamento_seleccion').value;
      const departamentoId = departamentoIdSelect ? Number(departamentoIdSelect) : null;

      if (!archivo || !usuario || !usuario.id || !departamentoId) {
        mostrarAvisoArchivos('Inicia sesión, selecciona un archivo y elige un departamento de destino.', true);
        return;
      }
      if (archivo.size > 10 * 1024 * 1024) {
        mostrarAvisoArchivos('El archivo supera el límite de 10 MB.', true);
        return;
      }

      try {
        const contenido = await new Promise((resolver, rechazar) => {
          const lector = new FileReader();
          lector.onload = () => resolver(lector.result);
          lector.onerror = () => rechazar(new Error('No se pudo leer el archivo seleccionado.'));
          lector.readAsDataURL(archivo);
        });

        await respuestaArchivos('/archivos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: document.getElementById('nombre_documento').value.trim() || archivo.name,
            contenido,
            tipo: archivo.type || 'application/octet-stream',
            tamano: archivo.size,
            autor_id: usuario.id,
            departamento_id: departamentoId
          })
        });

        modalArchivo.style.display = 'none';
        selectorArchivo.value = '';
        document.getElementById('nombre_documento').value = '';
        mostrarAvisoArchivos('Archivo subido correctamente.', false);
        await cargarArchivos();
      } catch (error) {
        mostrarAvisoArchivos('No se pudo cargar', true);
      }
    });
  }

  cargarArchivos().catch(error => {
    console.error(error);
  });
});