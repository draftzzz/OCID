/* L?gica propia de mi-departamento.html */
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

// Estructura de datos idéntica a la vista de la pantalla 2
    const datos_departamento_estatico = {
      nombre: "Servicios Escolares",
      descripcion_corta: "Gestión de la información escolar y control de trámites académicos.",
      descripcion_completa: "El departamento de Servicios Escolares se encarga de organizar el registro, inscripción, control de documentos y atención académica a estudiantes.",
      metricas: {
        docentes: 8,
        documentos: 15,
        eventos: 3
      },
      jefe: {
        nombre: "Ana López García",
        correo: "ana.lopez@cbtis258.edu.mx",
        iniciales: "AL"
      },
      integrantes: [
        { nombre: "Ana López García", puesto: "Jefe", estado: "Activo" },
        { nombre: "Luis Mendoza Ruiz", puesto: "Docente", estado: "Activo" },
        { nombre: "María Torres Silva", puesto: "Docente", estado: "Activo" },
        { nombre: "Jorge Hernández Díaz", puesto: "Docente", estado: "Activo" }
      ]
    };

    // Función para renderizar integrantes dinámicamente
    function renderizar_miembros(lista) {
      const contenedor = document.getElementById("cuerpo_tabla_integrantes");
      if (!contenedor) return;
      contenedor.innerHTML = "";

      lista.forEach(function(miembro) {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td><span class="nombre_miembro">${miembro.nombre}</span></td>
          <td>${miembro.puesto}</td>
          <td><span class="badge_estado_activo">${miembro.estado}</span></td>
          <td style="text-align: center;">
            <button class="boton_acciones" aria-label="Acciones de usuario">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
          </td>
        `;
        contenedor.appendChild(fila);
      });
    }

    // Inicialización y soporte para conexión al backend si existe
    async function inicializar_modulo_departamento() {
      try {
        const [respuestaDepartamentos, respuestaUsuarios] = await Promise.all([
          fetch(`${window.OCID_API_BASE}/departamentos`),
          fetch(`${window.OCID_API_BASE}/login`)
        ]);
        const [departamentos, usuarios] = await Promise.all([
          respuestaDepartamentos.json(),
          respuestaUsuarios.json()
        ]);
        if (!respuestaDepartamentos.ok) throw new Error(departamentos.error || "No se pudieron cargar los departamentos.");
        if (!respuestaUsuarios.ok) throw new Error(usuarios.error || "No se pudieron cargar los docentes.");
        if (!Array.isArray(departamentos) || !Array.isArray(usuarios)) {
          throw new Error("El servidor devolvió datos no válidos.");
        }

        const usuarioActual = JSON.parse(localStorage.getItem("usuario_ocid") || "null");
        const departamentoActual = departamentos.find(item =>
          Number(item.id) === Number(usuarioActual && usuarioActual.departamento_id)
        ) || departamentos[0];
        if (!departamentoActual) {
          throw new Error("No hay departamentos registrados.");
        }

        const integrantes = usuarios.filter(usuario =>
          Number(usuario.departamento_id) === Number(departamentoActual.id)
        );
        const jefe = usuarios.find(usuario =>
          Number(usuario.id) === Number(departamentoActual.jefe_id)
        );

        document.getElementById("nombre_departamento_texto").textContent = departamentoActual.nombre;
        document.getElementById("detalle_departamento_texto").textContent =
          departamentoActual.descripcion || "Sin descripción disponible.";
        document.getElementById("parrafo_descripcion").textContent =
          departamentoActual.descripcion || "Sin descripción disponible.";
        document.getElementById("total_docentes").textContent = integrantes.length;
        document.getElementById("total_documentos").textContent = "No disponible";
        document.getElementById("total_eventos").textContent = "No disponible";

        if (jefe) {
          const iniciales = jefe.nombre.split(/\s+/).slice(0, 2)
            .map(parte => parte.charAt(0)).join("").toUpperCase();
          document.getElementById("nombre_jefe").textContent = jefe.nombre;
          document.getElementById("correo_jefe").textContent = jefe.correo;
          document.getElementById("avatar_jefe").textContent = iniciales;
          document.getElementById("modal_destinatario").textContent =
            `${jefe.nombre} (${jefe.correo})`;
        }

        renderizar_miembros(integrantes.map(usuario => ({
          nombre: usuario.nombre,
          puesto: usuario.rol || "Docente",
          estado: "Activo"
        })));
      } catch (error) {
        const aviso = document.createElement("p");
        aviso.className = "aviso_docentes aviso_docentes_error";
        aviso.setAttribute("role", "alert");
        aviso.textContent = error.message || "No se pudo conectar con el servidor.";
        document.querySelector(".area_trabajo").prepend(aviso);
        renderizar_miembros([]);
      }
    }

    // Control del modal interactivo de contacto
    const modal = document.getElementById("modal_contacto");
    const boton_abrir = document.getElementById("boton_abrir_contacto");
    const boton_cerrar = document.getElementById("boton_cerrar_modal");
    const boton_cancelar = document.getElementById("boton_cancelar_modal");
    const boton_enviar = document.getElementById("boton_enviar_mensaje");

    if (boton_abrir && modal) {
      boton_abrir.addEventListener("click", function() {
        modal.style.display = "flex";
      });
    }

    function ocultar_modal() {
      if (modal) modal.style.display = "none";
    }

    if (boton_cerrar) boton_cerrar.addEventListener("click", ocultar_modal);
    if (boton_cancelar) boton_cancelar.addEventListener("click", ocultar_modal);

    if (boton_enviar) {
      boton_enviar.addEventListener("click", function() {
        const correo = document.getElementById("correo_jefe").textContent.trim();
        const asunto = document.getElementById("asunto_mensaje").value.trim();
        const mensaje = document.getElementById("cuerpo_mensaje").value.trim();
        if (!correo || !asunto || !mensaje) {
          document.getElementById("cuerpo_mensaje").setCustomValidity(
            "Completa el asunto y el mensaje antes de continuar."
          );
          document.getElementById("cuerpo_mensaje").reportValidity();
          return;
        }
        document.getElementById("cuerpo_mensaje").setCustomValidity("");
        window.location.href = `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
        ocultar_modal();
      });
    }

    window.addEventListener("DOMContentLoaded", inicializar_modulo_departamento);

