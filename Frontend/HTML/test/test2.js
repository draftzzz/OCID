"use strict";

const $ = (id) => document.getElementById(id);
const API = "https://ocid.onrender.com";
let usuario = null;
let listaAnunciosGlobal = [];
let listaUsuariosGlobal = [];
let listaDepartamentosGlobal = [];

try {
    usuario = JSON.parse(localStorage.getItem("usuario_ocid") || "null");
    if (!usuario || !usuario.id) usuario = null;
} catch (error) {
    localStorage.removeItem("usuario_ocid");
    usuario = null;
}

function escaparHTML(texto) {
    return String(texto ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

async function leerRespuesta(respuesta) {
    const tipo = respuesta.headers.get("content-type") || "";
    let datos = {};
    if (tipo.includes("application/json")) datos = await respuesta.json();
    else {
        const texto = await respuesta.text();
        datos = texto ? { message: texto } : {};
    }
    if (!respuesta.ok) throw new Error(datos.error || datos.message || `Error HTTP ${respuesta.status}`);
    return datos;
}

function obtenerLista(datos) {
    if (Array.isArray(datos)) return datos;
    if (Array.isArray(datos?.data)) return datos.data;
    if (Array.isArray(datos?.usuarios)) return datos.usuarios;
    if (Array.isArray(datos?.departamentos)) return datos.departamentos;
    return [];
}

function mostrarMensaje(texto, esError = false) {
    const caja = $("aviso_notificacion");
    const textoCaja = $("texto_aviso_notificacion");
    const icono = $("icono_aviso_notificacion");
    if (!caja || !textoCaja) { (esError ? console.error : console.log)(texto); return; }
    textoCaja.textContent = texto;
    if (icono) {
        icono.className = esError ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
        icono.style.color = esError ? "#ef4444" : "#22c55e";
    }
    caja.classList.add("visible");
    setTimeout(() => caja.classList.remove("visible"), 3500);
}

function inicializarSesion() {
    const nombre = usuario?.nombre || usuario?.correo || "Usuario";
    const primerNombre = nombre.split(" ")[0] || "Usuario";
    if ($("nombreUsuario")) $("nombreUsuario").textContent = nombre;
    if ($("texto_bienvenida_saludo")) $("texto_bienvenida_saludo").textContent = `¡Hola, ${primerNombre}!`;
    if ($("etiqueta_rol_usuario")) $("etiqueta_rol_usuario").textContent = usuario?.rol || "";
    if ($("etiqueta_nombre_departamento")) $("etiqueta_nombre_departamento").textContent = usuario ? (usuario.departamento_nombre || usuario.departamento || "—") : "—";
}

function cerrarSesion() {
    localStorage.removeItem("usuario_ocid");
    usuario = null;
    inicializarSesion();
    mostrarMensaje("Sesión cerrada.");
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
        const datos = await leerRespuesta(await fetch(`${API}/anuncios`));
        listaAnunciosGlobal = obtenerLista(datos).map(a => ({
            id: a.id, titulo: a.titulo || "", contenido: a.contenido || "",
            prioridad: normalizarPrioridad(a.prioridad), autor: a.autor_nombre || "Usuario",
            fecha: a.fecha || ""
        }));
        renderizarAnunciosUI(listaAnunciosGlobal);
    } catch (error) {
        console.error("Error al cargar anuncios:", error);
        listaAnunciosGlobal = [];
        if (contenedor) contenedor.innerHTML = `<p class="texto_vacio">No se pudieron cargar los anuncios: ${escaparHTML(error.message)}</p>`;
        actualizarContadorAnuncios(null);
    }
}

function actualizarContadorAnuncios(cantidad) {
    const valor = cantidad === null || cantidad === 0 ? "—" : String(cantidad);
    ["conteo_anu", "badge_conteo_anuncios", "indicador_notificaciones"].forEach(id => { if ($(id)) $(id).textContent = valor; });
}

function renderizarAnunciosUI(anuncios = listaAnunciosGlobal) {
    const contenedor = $("contenedor_lista_anuncios");
    if (!contenedor) return;
    actualizarContadorAnuncios(listaAnunciosGlobal.length);
    if (!anuncios.length) {
        contenedor.innerHTML = '<p class="texto_vacio">—</p>';
        return;
    }
    contenedor.innerHTML = anuncios.slice(0, 5).map(a => {
        const clase = a.prioridad === "Importante" ? "etiqueta_importante" : a.prioridad === "Aviso" ? "etiqueta_aviso" : "etiqueta_general";
        const fecha = a.fecha ? new Date(a.fecha) : null;
        const fechaTexto = fecha && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleDateString("es-MX") : "";
        const id = Number(a.id);
        const boton = Number.isFinite(id) && id > 0 ? `<button class="boton_eliminar_anuncio" onclick="eliminarAnuncio(${id}, event)" title="Eliminar anuncio"><i class="fa-regular fa-trash-can"></i></button>` : "";
        return `<div class="tarjeta_item_anuncio"><div class="contenido_item_anuncio" onclick="mostrarDetalleAnuncio(${id})"><span class="etiqueta_prioridad ${clase}">${escaparHTML(a.prioridad)}</span><div class="detalles_texto_anuncio"><span class="titulo_item_anuncio">${escaparHTML(a.titulo)}</span><span class="meta_item_anuncio">Publicado por: ${escaparHTML(a.autor)}${fechaTexto ? " · " + escaparHTML(fechaTexto) : ""}</span></div></div><div class="acciones_item_anuncio">${boton}<i class="fa-solid fa-chevron-right icono_flecha_anuncio" onclick="mostrarDetalleAnuncio(${id})"></i></div></div>`;
    }).join("");
}

function mostrarDetalleAnuncio(id) {
    const a = listaAnunciosGlobal.find(x => Number(x.id) === Number(id));
    if (a) mostrarMensaje(`${a.titulo}: ${a.contenido}`);
}

async function publicarAnuncio(evento) {
    evento.preventDefault();
    if (!usuario?.id) { mostrarMensaje("Inicia sesión para publicar un anuncio.", true); abrirModalLogin(); return; }
    const titulo = $("campo_titulo_anuncio")?.value.trim() || "";
    const contenido = $("campo_contenido_anuncio")?.value.trim() || "";
    const prioridad = $("campo_prioridad_anuncio")?.value || "General";
    const departamento = $("campo_departamento_anuncio")?.value || "";
    if (!titulo || !contenido) { mostrarMensaje("Escribe el título y el contenido.", true); return; }
    if (!departamento) { mostrarMensaje("Selecciona un departamento.", true); return; }
    const boton = $("btn_guardar_anuncio");
    if (boton) boton.disabled = true;
    try {
        const datos = await leerRespuesta(await fetch(`${API}/anuncios`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titulo, contenido, prioridad, autor_id: Number(usuario.id), departamento_id: Number(departamento) })
        }));
        if (datos.success !== true) throw new Error(datos.error || "El servidor no confirmó la publicación.");
        $("formulario_crear_anuncio")?.reset();
        cerrarModal("modal_nuevo_anuncio");
        mostrarMensaje("Anuncio publicado correctamente.");
        await cargarAnuncios();
    } catch (error) { mostrarMensaje(`No se pudo publicar: ${error.message}`, true); }
    finally { if (boton) boton.disabled = false; }
}

async function eliminarAnuncio(id, evento) {
    evento?.stopPropagation();
    if (!usuario?.id) { mostrarMensaje("Inicia sesión para eliminar anuncios.", true); return; }
    if (!id || !confirm("¿Deseas eliminar este anuncio?")) return;
    try {
        const datos = await leerRespuesta(await fetch(`${API}/anuncios/${Number(id)}`, { method: "DELETE" }));
        if (datos.success !== true) throw new Error(datos.error || "No se confirmó la eliminación.");
        mostrarMensaje("Anuncio eliminado correctamente.");
        await cargarAnuncios();
    } catch (error) { mostrarMensaje(`No se pudo eliminar: ${error.message}`, true); }
}

async function cargarUsuarios() {
    try {
        // El backend existente expone la lista de usuarios en GET /login.
        const datos = await leerRespuesta(await fetch(`${API}/login`));
        listaUsuariosGlobal = obtenerLista(datos);
        const docentes = listaUsuariosGlobal.filter(u => String(u.rol || "").toLowerCase().includes("docente"));
        if ($("conteo_usr")) $("conteo_usr").textContent = docentes.length ? String(docentes.length) : "—";
        return listaUsuariosGlobal;
    } catch (error) {
        console.error("Error al cargar docentes:", error);
        if ($("conteo_usr")) $("conteo_usr").textContent = "—";
        return [];
    }
}

async function cargarDepartamentos() {
    try {
        const datos = await leerRespuesta(await fetch(`${API}/departamentos`));
        listaDepartamentosGlobal = obtenerLista(datos);
        const selector = $("campo_departamento_anuncio");
        if (selector) {
            selector.innerHTML = '<option value="">Selecciona un departamento</option>' + listaDepartamentosGlobal.map(d => {
                const id = Number(d.id);
                return Number.isFinite(id) && d.nombre ? `<option value="${id}">${escaparHTML(d.nombre)}</option>` : "";
            }).join("");
        }
        const departamentoUsuario = usuario?.departamento_nombre || usuario?.departamento;
        if ($("etiqueta_nombre_departamento")) $("etiqueta_nombre_departamento").textContent = departamentoUsuario || "—";
        return listaDepartamentosGlobal;
    } catch (error) {
        console.error("Error al cargar departamentos:", error);
        const selector = $("campo_departamento_anuncio");
        if (selector) selector.innerHTML = '<option value="">—</option>';
        if ($("etiqueta_nombre_departamento")) $("etiqueta_nombre_departamento").textContent = "—";
        return [];
    }
}

function filtrarAnunciosEnTiempoReal() {
    const termino = ($("campo_busqueda_general")?.value || "").toLowerCase().trim();
    const filtrados = listaAnunciosGlobal.filter(a => [a.titulo, a.autor, a.prioridad, a.contenido].some(v => String(v).toLowerCase().includes(termino)));
    renderizarAnunciosUI(filtrados);
}
function confirmarSubidaArchivo() { mostrarMensaje("—"); }
function enviarPreguntaIA() { mostrarMensaje("El asistente de IA aún no está conectado.", true); }

async function ejecutarAutenticacion(evento) {
    evento.preventDefault();
    const correo = $("campo_login_correo")?.value.trim() || "";
    const password = $("campo_login_password")?.value || "";
    try {
        const datos = await leerRespuesta(await fetch(`${API}/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, password })
        }));
        if (datos.success !== true || !datos.usuario?.id) throw new Error(datos.error || "No se pudo iniciar sesión.");
        usuario = datos.usuario;
        localStorage.setItem("usuario_ocid", JSON.stringify(usuario));
        inicializarSesion();
        cerrarModal("modal_login_sesion");
        mostrarMensaje(`Hola, ${usuario.nombre || "Usuario"}.`);
        await cargarDepartamentos();
    } catch (error) { mostrarMensaje(error.message, true); }
}

function abrirModalCrearAnuncio() { $("modal_nuevo_anuncio")?.classList.add("visible"); }
function abrirModalSubirArchivo() { mostrarMensaje("La sección de archivos todavía no está conectada; cantidad: —.", true); }
function abrirModalIA() { $("modal_asistente_ia")?.classList.add("visible"); }
function abrirModalLogin() { $("modal_login_sesion")?.classList.add("visible"); }
function abrirModalDocentes() { mostrarMensaje(listaUsuariosGlobal.filter(u => String(u.rol || "").toLowerCase().includes("docente")).length ? "Consulta los docentes desde el panel administrativo." : "—"); }
function cerrarModal(id) { $(id)?.classList.remove("visible"); }

document.addEventListener("DOMContentLoaded", () => {
    inicializarSesion();
    if ($("metrica_conteo_eventos")) $("metrica_conteo_eventos").textContent = "—";
    if ($("conteo_dep")) $("conteo_dep").textContent = "—"; // Archivos: no hay ruta de archivos en el backend actual.
    cargarAnuncios();
    cargarUsuarios();
    cargarDepartamentos();
});
