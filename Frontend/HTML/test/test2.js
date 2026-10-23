"use strict";

const $ = (id) => document.getElementById(id);
const API = "https://ocid.onrender.com";
let usuario = null;
let listaAnunciosGlobal = [];
let listaUsuariosGlobal = [];
let listaDepartamentosGlobal = [];

try {
    usuario = JSON.parse(localStorage.getItem("usuario_ocid") || "null");
} catch (error) {
    localStorage.removeItem("usuario_ocid");
}

function escaparHTML(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function leerRespuesta(respuesta) {
    const tipo = respuesta.headers.get("content-type") || "";
    let datos;
    if (tipo.includes("application/json")) {
        datos = await respuesta.json();
    } else {
        const texto = await respuesta.text();
        datos = texto ? { message: texto } : {};
    }
    if (!respuesta.ok) {
        throw new Error(datos.message || datos.error || `Error HTTP ${respuesta.status}`);
    }
    return datos;
}

function obtenerLista(datos) {
    if (Array.isArray(datos)) return datos;
    if (datos && Array.isArray(datos.data)) return datos.data;
    if (datos && Array.isArray(datos.usuarios)) return datos.usuarios;
    if (datos && Array.isArray(datos.departamentos)) return datos.departamentos;
    return [];
}

function mostrarMensaje(texto, esError = false) {
    const contenedor = $("aviso_notificacion");
    const mensajeTexto = $("texto_aviso_notificacion");
    const icono = $("icono_aviso_notificacion");
    if (!contenedor || !mensajeTexto) {
        if (esError) console.error(texto);
        else console.log(texto);
        return;
    }
    mensajeTexto.textContent = texto;
    if (icono) {
        icono.className = esError ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
        icono.style.color = esError ? "#ef4444" : "#22c55e";
    }
    contenedor.classList.add("visible");
    setTimeout(() => contenedor.classList.remove("visible"), 3500);
}

function inicializarSesion() {
    const nombre = usuario?.nombre || usuario?.nombre_completo || usuario?.correo || usuario?.email || "Usuario";
    const primerNombre = nombre.split(" ")[0];
    if ($("nombreUsuario")) $("nombreUsuario").textContent = nombre;
    if ($("etiqueta_nombre_usuario")) $("etiqueta_nombre_usuario").textContent = nombre;
    if ($("texto_bienvenida_saludo")) $("texto_bienvenida_saludo").textContent = `¡Hola, ${primerNombre}!`;
    if ($("etiqueta_rol_usuario")) $("etiqueta_rol_usuario").textContent = usuario?.rol || "";
    if ($("etiqueta_nombre_departamento")) {
        $("etiqueta_nombre_departamento").textContent = usuario?.departamento || usuario?.departamento_nombre || "Sin departamento asignado";
    }
}

function cerrarSesion() {
    localStorage.removeItem("usuario_ocid");
    usuario = null;
    mostrarMensaje("Sesión cerrada.");
    abrirModalLogin();
}

function normalizarPrioridad(valor) {
    const v = String(valor || "General").toLowerCase();
    if (v.includes("import") || v.includes("alta") || v.includes("urgente")) return "Importante";
    if (v.includes("aviso") || v.includes("media")) return "Aviso";
    return "General";
}

async function cargarAnuncios() {
    const contenedor = $("contenedor_lista_anuncios");
    if (contenedor) contenedor.innerHTML = '<p class="texto_vacio">Cargando anuncios...</p>';
    try {
        const respuesta = await fetch(`${API}/anuncios`);
        const datos = await leerRespuesta(respuesta);
        listaAnunciosGlobal = obtenerLista(datos).map(a => ({
            id: a.id,
            titulo: a.titulo || a.title || "",
            contenido: a.contenido || a.descripcion || "",
            prioridad: normalizarPrioridad(a.prioridad),
            autor: a.autor_nombre || a.autor || a.creado_por || "",
            fecha: a.fecha || a.created_at || a.fecha_creacion || ""
        }));
        renderizarAnunciosUI(listaAnunciosGlobal);
    } catch (error) {
        console.error("Error al cargar anuncios:", error);
        listaAnunciosGlobal = [];
        if (contenedor) contenedor.innerHTML = `<p class="texto_vacio">No se pudieron cargar los anuncios: ${escaparHTML(error.message)}</p>`;
        actualizarContadorAnuncios(0);
    }
}

function actualizarContadorAnuncios(cantidad) {
    ["conteo_anu", "badge_conteo_anuncios", "indicador_notificaciones"].forEach(id => {
        if ($(id)) $(id).textContent = String(cantidad);
    });
}

function renderizarAnunciosUI(anuncios = listaAnunciosGlobal) {
    const contenedor = $("contenedor_lista_anuncios");
    if (!contenedor) return;
    actualizarContadorAnuncios(listaAnunciosGlobal.length);
    if (!anuncios.length) {
        contenedor.innerHTML = '<p class="texto_vacio">No hay anuncios registrados.</p>';
        return;
    }
    contenedor.innerHTML = anuncios.slice(0, 5).map(anuncio => {
        let claseColor = "etiqueta_general";
        if (anuncio.prioridad === "Importante") claseColor = "etiqueta_importante";
        if (anuncio.prioridad === "Aviso") claseColor = "etiqueta_aviso";
        const fecha = anuncio.fecha ? new Date(anuncio.fecha) : null;
        const fechaTexto = fecha && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleDateString("es-MX") : "";
        const id = Number(anuncio.id);
        const botonEliminar = Number.isFinite(id) && id > 0
            ? `<button class="boton_eliminar_anuncio" onclick="eliminarAnuncio(${id}, event)" title="Eliminar anuncio"><i class="fa-regular fa-trash-can"></i></button>`
            : "";
        return `<div class="tarjeta_item_anuncio">
            <div class="contenido_item_anuncio" onclick="mostrarDetalleAnuncio(${id})">
                <span class="etiqueta_prioridad ${claseColor}">${escaparHTML(anuncio.prioridad)}</span>
                <div class="detalles_texto_anuncio">
                    <span class="titulo_item_anuncio">${escaparHTML(anuncio.titulo)}</span>
                    <span class="meta_item_anuncio">Publicado por: ${escaparHTML(anuncio.autor)}${fechaTexto ? " · " + escaparHTML(fechaTexto) : ""}</span>
                </div>
            </div>
            <div class="acciones_item_anuncio">${botonEliminar}<i class="fa-solid fa-chevron-right icono_flecha_anuncio" onclick="mostrarDetalleAnuncio(${id})"></i></div>
        </div>`;
    }).join("");
}

function mostrarDetalleAnuncio(id) {
    const anuncio = listaAnunciosGlobal.find(a => Number(a.id) === Number(id));
    if (anuncio) mostrarMensaje(`${anuncio.titulo}: ${anuncio.contenido}`);
}

async function publicarAnuncio(evento) {
    evento.preventDefault();
    const titulo = $("campo_titulo_anuncio")?.value.trim() || "";
    const contenido = $("campo_contenido_anuncio")?.value.trim() || "";
    const prioridad = $("campo_prioridad_anuncio")?.value || "General";
    const departamentoValor = $("campo_departamento_anuncio")?.value || "";
    if (!titulo || !contenido) {
        mostrarMensaje("Completa el título y el contenido del anuncio.", true);
        return;
    }
    if (!usuario || !usuario.id) {
        mostrarMensaje("Inicia sesión con una cuenta real para publicar anuncios.", true);
        return;
    }
    if (!departamentoValor) {
        mostrarMensaje("Selecciona un departamento válido.", true);
        return;
    }
    const payload = {
        titulo,
        contenido,
        prioridad,
        autor_id: Number(usuario.id),
        departamento_id: Number(departamentoValor)
    };
    const boton = $("btn_guardar_anuncio");
    if (boton) boton.disabled = true;
    try {
        const respuesta = await fetch(`${API}/anuncios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const datos = await leerRespuesta(respuesta);
        if (datos.success !== true) throw new Error(datos.message || datos.error || "El servidor no confirmó la publicación.");
        $("formulario_crear_anuncio").reset();
        cerrarModal("modal_nuevo_anuncio");
        mostrarMensaje("Anuncio publicado correctamente.");
        await cargarAnuncios();
    } catch (error) {
        mostrarMensaje(`No se pudo publicar: ${error.message}`, true);
    } finally {
        if (boton) boton.disabled = false;
    }
}

async function eliminarAnuncio(id, evento) {
    if (evento) evento.stopPropagation();
    if (!id || !confirm("¿Seguro que quieres eliminar este anuncio?")) return;
    try {
        const respuesta = await fetch(`${API}/anuncios/${Number(id)}`, { method: "DELETE" });
        const datos = await leerRespuesta(respuesta);
        if (datos.success !== true) throw new Error(datos.message || datos.error || "El servidor no confirmó la eliminación.");
        mostrarMensaje("Anuncio eliminado correctamente.");
        await cargarAnuncios();
    } catch (error) {
        mostrarMensaje(`No se pudo eliminar: ${error.message}`, true);
    }
}

async function cargarUsuarios() {
    try {
        const respuesta = await fetch(`${API}/usuarios`);
        const datos = await leerRespuesta(respuesta);
        listaUsuariosGlobal = obtenerLista(datos);
        if ($("conteo_usr")) $("conteo_usr").textContent = String(listaUsuariosGlobal.length);
        return listaUsuariosGlobal;
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        if ($("conteo_usr")) $("conteo_usr").textContent = "—";
        return [];
    }
}

async function cargarDepartamentos() {
    try {
        const respuesta = await fetch(`${API}/departamentos`);
        const datos = await leerRespuesta(respuesta);
        listaDepartamentosGlobal = obtenerLista(datos);
        if ($("conteo_dep")) $("conteo_dep").textContent = String(listaDepartamentosGlobal.length);
        const selector = $("campo_departamento_anuncio");
        if (selector) {
            const seleccionado = selector.value;
            selector.innerHTML = '<option value="">Selecciona un departamento</option>' + listaDepartamentosGlobal.map(d => {
                const id = Number(d.id ?? d.departamento_id);
                const nombre = d.nombre || d.nombre_departamento || d.departamento;
                if (!Number.isFinite(id) || !nombre) return "";
                return `<option value="${id}">${escaparHTML(nombre)}</option>`;
            }).join("");
            if (seleccionado) selector.value = seleccionado;
        }
        if (usuario && (usuario.departamento || usuario.departamento_nombre)) {
            if ($("etiqueta_nombre_departamento")) $("etiqueta_nombre_departamento").textContent = usuario.departamento || usuario.departamento_nombre;
        }
        return listaDepartamentosGlobal;
    } catch (error) {
        console.error("Error al cargar departamentos:", error);
        if ($("conteo_dep")) $("conteo_dep").textContent = "—";
        const selector = $("campo_departamento_anuncio");
        if (selector) selector.innerHTML = '<option value="">No se pudieron cargar departamentos</option>';
        return [];
    }
}

async function registrarUsuario(evento) {
    evento.preventDefault();
    const nombre = $("campo_docente_nombre")?.value.trim() || "";
    const correo = $("campo_docente_correo")?.value.trim() || "";
    const rol = $("campo_docente_rol")?.value || "";
    if (!nombre || !correo || !rol) {
        mostrarMensaje("Completa todos los campos del usuario.", true);
        return;
    }
    try {
        const respuesta = await fetch(`${API}/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, correo, rol })
        });
        const datos = await leerRespuesta(respuesta);
        if (datos.success !== true) throw new Error(datos.message || datos.error || "El servidor no confirmó el registro.");
        $("formulario_nuevo_docente").reset();
        cerrarModal("modal_gestion_docentes");
        mostrarMensaje("Usuario registrado correctamente.");
        await cargarUsuarios();
    } catch (error) {
        mostrarMensaje(`No se pudo registrar el usuario: ${error.message}`, true);
    }
}

function filtrarAnunciosEnTiempoReal() {
    const termino = ($("campo_busqueda_general")?.value || "").toLowerCase().trim();
    const filtrados = listaAnunciosGlobal.filter(a =>
        String(a.titulo).toLowerCase().includes(termino) ||
        String(a.autor).toLowerCase().includes(termino) ||
        String(a.prioridad).toLowerCase().includes(termino) ||
        String(a.contenido).toLowerCase().includes(termino)
    );
    renderizarAnunciosUI(filtrados);
}

function confirmarSubidaArchivo() {
    mostrarMensaje("La subida de archivos aún necesita conectarse a una ruta del servidor.", true);
}

function enviarPreguntaIA() {
    const input = $("campo_pregunta_ia");
    const pregunta = input?.value.trim() || "";
    if (!pregunta) return;
    const chat = $("contenedor_chat_ia");
    const mensaje = document.createElement("div");
    mensaje.className = "burbuja_usuario_pregunta";
    mensaje.textContent = pregunta;
    chat?.appendChild(mensaje);
    const respuesta = document.createElement("div");
    respuesta.className = "burbuja_ia_respuesta";
    respuesta.textContent = "El asistente de IA aún no está conectado a un servicio de inteligencia artificial.";
    chat?.appendChild(respuesta);
    input.value = "";
    if (chat) chat.scrollTop = chat.scrollHeight;
}

function ejecutarAutenticacion(evento) {
    evento.preventDefault();
    mostrarMensaje("El inicio de sesión debe conectarse a la ruta de autenticación real del backend. No se creará una sesión ficticia.", true);
}

function abrirModalCrearAnuncio() { $("modal_nuevo_anuncio")?.classList.add("visible"); }
function abrirModalSubirArchivo() { $("modal_subir_archivo")?.classList.add("visible"); }
function abrirModalIA() { $("modal_asistente_ia")?.classList.add("visible"); }
function abrirModalLogin() { $("modal_login_sesion")?.classList.add("visible"); }
function abrirModalDocentes() { $("modal_gestion_docentes")?.classList.add("visible"); }
function cerrarModal(id) { $(id)?.classList.remove("visible"); }

// Carga datos reales; no crea anuncios ni usuarios de prueba en el navegador.
document.addEventListener("DOMContentLoaded", () => {
    inicializarSesion();
    cargarAnuncios();
    cargarUsuarios();
    cargarDepartamentos();
    if ($("metrica_conteo_eventos")) $("metrica_conteo_eventos").textContent = "—";
});
