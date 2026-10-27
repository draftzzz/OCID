/* L?gica propia de archivos.html */
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

const apiArchivos = window.OCID_API_BASE;
    const modalArchivo = document.getElementById('modal_subir_archivo');
    const selectorArchivo = document.getElementById('input_archivo_oculto');
    const cuerpoArchivos = document.querySelector('#tabla_documentos tbody');
    let archivosCargados = [];

    function sesionArchivos() {
      try {
        return JSON.parse(localStorage.getItem('usuario_ocid') || 'null');
      } catch (error) {
        console.error('No se pudo leer la sesión:', error);
        return null;
      }
    }

    async function respuestaArchivos(ruta, opciones) {
      const respuesta = await fetch(apiArchivos + ruta, opciones);
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudo completar la operación');
      return datos;
    }

    function formatearTamano(bytes) {
      if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    }

    function dibujarArchivos() {
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
        const nombre = document.createElement('div');
        nombre.className = 'texto_nombre_archivo';
        nombre.textContent = archivo.nombre;
        const tamano = document.createElement('div');
        tamano.className = 'texto_tamano_archivo';
        tamano.textContent = formatearTamano(Number(archivo.tamano) || 0);
        celdaNombre.append(nombre, tamano);
        const extension = (archivo.nombre.split('.').pop() || '').toUpperCase();
        const celdaTipo = document.createElement('td');
        celdaTipo.textContent = extension;
        const celdaDepartamento = document.createElement('td');
        celdaDepartamento.textContent = archivo.departamento_nombre || 'Sin departamento';
        const celdaAutor = document.createElement('td');
        celdaAutor.textContent = archivo.autor_nombre || 'Usuario';
        const celdaFecha = document.createElement('td');
        celdaFecha.textContent = archivo.fecha ? new Date(archivo.fecha).toLocaleDateString('es-MX') : '';
        const celdaAcciones = document.createElement('td');
        const botonDescargar = document.createElement('button');
        botonDescargar.type = 'button';
        botonDescargar.className = 'boton_accion_icono';
        botonDescargar.textContent = 'Descargar';
        botonDescargar.addEventListener('click', () => descargarArchivo(archivo.id));
        const botonEliminar = document.createElement('button');
        botonEliminar.type = 'button';
        botonEliminar.className = 'boton_accion_icono';
        botonEliminar.textContent = 'Eliminar';
        botonEliminar.addEventListener('click', () => eliminarArchivo(archivo.id));
        celdaAcciones.append(botonDescargar, botonEliminar);
        fila.append(celdaNombre, celdaTipo, celdaDepartamento, celdaAutor, celdaFecha, celdaAcciones);
        cuerpoArchivos.appendChild(fila);
      });
      if (!visibles.length) {
        const filaVacia = document.createElement('tr');
        const celda = document.createElement('td');
        celda.colSpan = 6;
        celda.textContent = archivosCargados.length ? 'No hay archivos para esos filtros.' : 'No hay archivos disponibles.';
        filaVacia.appendChild(celda);
        cuerpoArchivos.appendChild(filaVacia);
      }
    }

    async function cargarArchivos() {
      const [archivos, departamentos] = await Promise.all([
        respuestaArchivos('/archivos'),
        respuestaArchivos('/departamentos')
      ]);
      archivosCargados = archivos;
      const selector = document.getElementById('filtro_departamento');
      selector.replaceChildren(new Option('Todos los departamentos', 'todos'));
      departamentos.forEach(departamento => selector.add(new Option(departamento.nombre, departamento.id)));
      const selectorDestino = document.getElementById('departamento_seleccion');
      selectorDestino.replaceChildren(new Option('Selecciona un departamento', ''));
      departamentos.forEach(departamento => selectorDestino.add(new Option(departamento.nombre, departamento.id)));
      const usuario = sesionArchivos();
      if (usuario && usuario.departamento_id) selectorDestino.value = String(usuario.departamento_id);
      dibujarArchivos();
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
        alert(error.message);
      }
    }

    async function eliminarArchivo(id) {
      if (!window.confirm('¿Eliminar este archivo?')) return;
      try {
        await respuestaArchivos('/archivos/' + encodeURIComponent(id), { method: 'DELETE' });
        await cargarArchivos();
      } catch (error) {
        alert(error.message);
      }
    }

    document.getElementById('abrir_modal_subir').addEventListener('click', () => { modalArchivo.style.display = 'flex'; });
    document.getElementById('cerrar_modal_subir').addEventListener('click', () => { modalArchivo.style.display = 'none'; });
    document.getElementById('cancelar_modal').addEventListener('click', () => { modalArchivo.style.display = 'none'; });
    modalArchivo.addEventListener('click', evento => {
      if (evento.target === modalArchivo) modalArchivo.style.display = 'none';
    });
    document.getElementById('zona_archivo').addEventListener('click', () => selectorArchivo.click());
    selectorArchivo.addEventListener('change', () => {
      if (selectorArchivo.files.length) document.getElementById('nombre_documento').value = selectorArchivo.files[0].name;
    });
    document.getElementById('filtro_departamento').addEventListener('change', dibujarArchivos);
    document.getElementById('filtro_tipo').addEventListener('change', dibujarArchivos);
    document.getElementById('filtro_nombre').addEventListener('input', dibujarArchivos);
    document.getElementById('guardar_archivo').addEventListener('click', async () => {
      const archivo = selectorArchivo.files[0];
      const usuario = sesionArchivos();
      const departamentoId = Number(document.getElementById('departamento_seleccion').value);
      if (!archivo || !usuario || !usuario.id || !departamentoId) {
        alert('Inicia sesión, selecciona un archivo y un departamento.');
        return;
      }
      if (archivo.size > 10 * 1024 * 1024) {
        alert('El archivo supera el límite de 10 MB.');
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
        await cargarArchivos();
      } catch (error) {
        alert(error.message);
      }
    });

    cuerpoArchivos.replaceChildren();
    cargarArchivos().catch(error => {
      console.error(error);
      alert(error.message);
    });

