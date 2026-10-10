(() => {
  'use strict';

  const C = window.RIFA;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const pad = (n) => String(n).padStart(3, '0');
  const pesos = (n) => '$' + n.toLocaleString('es-AR');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const waLink = (texto) => `https://wa.me/${C.whatsapp}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;

  const DEMO = new URLSearchParams(location.search).has('demo');
  const CLAVE_SELECCION = 'rifa-potrero-seleccion';
  const TOTAL_PAGINAS = Math.ceil(C.totalNumeros / C.porPagina);
  const ETIQUETA = { libre: 'disponible', elegido: 'elegido', vendido: 'vendido', reservado: 'reservado', cargando: 'cargando' };

  const estado = {
    pagina: 0,
    vendidos: new Set(),
    reservados: new Set(),
    elegidos: new Set(leerSeleccion()),
    cargado: false,
    cargando: false,
    error: null,
    actualizado: 0,
    soloLibres: false,
  };

  /* --- Selección guardada (solo comodidad del visitante) --------------- */

  function leerSeleccion() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_SELECCION) || '[]');
      return Array.isArray(datos) ? datos.filter((n) => Number.isInteger(n) && n >= 1 && n <= C.totalNumeros) : [];
    } catch {
      return [];
    }
  }

  function guardarSeleccion() {
    try {
      localStorage.setItem(CLAVE_SELECCION, JSON.stringify([...estado.elegidos]));
    } catch { /* sin almacenamiento: no pasa nada */ }
  }

  /* --- Textos que salen de la configuración ---------------------------- */

  function completarTextos() {
    const textos = {
      nombre: C.nombre,
      precio: pesos(C.precio),
      total: String(C.totalNumeros),
      rango: `${pad(1)} al ${pad(C.totalNumeros)}`,
      alias: C.alias,
      titular: C.titular,
      cuit: C.cuit,
      billetera: C.billetera,
      whatsapp: C.whatsappVisible,
      'sorteo-fecha': C.sorteo.fecha,
      'sorteo-lugar': C.sorteo.lugar,
      'sorteo-modalidad': C.sorteo.modalidad,
      'cant-premios': String(1 + C.premios.reduce((s, p) => s + (p.cantidad || 1), 0)),
    };
    // Cada localidad queda entera en su renglón; el separador va al final de la anterior.
    $('[data-c="lugares"]').innerHTML = C.localidades.map((l) => `<span>${esc(l)}</span>`).join(' ');
    $('#lohema-zonas').innerHTML = C.localidades.map((l) => `<li>${esc(l)}</li>`).join('');
    $$('[data-c]').forEach((el) => {
      const valor = textos[el.dataset.c];
      if (valor != null) el.textContent = valor;
    });
    $$('[data-wa]').forEach((a) => {
      a.href = waLink('¡Hola! Tengo una consulta sobre la ' + C.nombre + '.');
      a.target = '_blank';
      a.rel = 'noopener';
    });
    $$('[data-grupo-wa]').forEach((a) => {
      a.href = C.grupoWhatsapp;
      a.target = '_blank';
      a.rel = 'noopener';
    });
    $('#buscar-num').max = C.totalNumeros;
  }

  /* --- Banderines ------------------------------------------------------- */

  function dibujarBanderines() {
    const svg = $('.banderines');
    const colores = ['#E63946', '#F4B400', '#2A9D8F', '#2D6A4F'];
    const cantidad = 18;
    // Guirnalda: curva cuadrática de (0,8) a (1000,8) con control en (500,68) → y = 8 + 120·t·(1−t)
    let html = '<path d="M0 8Q500 68 1000 8" fill="none" stroke="#1B4332" stroke-opacity=".35" stroke-width="2"/>';
    for (let i = 0; i < cantidad; i++) {
      const t = (i + 0.5) / cantidad;
      const x = 1000 * t;
      const y = 8 + 120 * t * (1 - t);
      const angulo = (Math.atan(0.12 * (1 - 2 * t)) * 180) / Math.PI;
      html += `<path d="M-17 0H17L0 30Z" fill="${colores[i % colores.length]}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angulo.toFixed(1)})"/>`;
    }
    svg.innerHTML = html;
  }

  /* --- Premios ---------------------------------------------------------- */

  function imagenPremio(premio, tono) {
    if (premio.imagen) {
      return `<div class="premio__foto"><img class="premio__img" src="${esc(premio.imagen)}" alt="${esc(premio.nombre)}" loading="lazy">` +
        (premio.ilustrativa ? '<span class="premio__ilustrativa">Imagen ilustrativa</span>' : '') + '</div>';
    }
    return `<div class="premio__img premio__img--vacio tono-${tono % 4}" role="img" aria-label="Foto de ${esc(premio.nombre)} próximamente">
      <svg aria-hidden="true"><use href="#regalo"/></svg><span>Foto próximamente</span></div>`;
  }

  function dibujarPremios() {
    const mayor = C.premioMayor;
    $('#premio-mayor').innerHTML = `${imagenPremio(mayor, 0)}
      <div class="premio-mayor__info">
        <span class="insignia">Primer premio</span>
        <h3>${esc(mayor.nombre)}</h3>
        <p>${esc(mayor.detalle || '')}</p>
      </div>`;

    $('#premios-lista').innerHTML = C.premios.map((p, i) => `
      <li class="premio">
        ${imagenPremio(p, i + 1)}
        ${p.cantidad > 1 ? `<span class="premio__cant" aria-label="${p.cantidad} unidades">×${p.cantidad}</span>` : ''}
        <h4 class="premio__nombre">${esc(p.nombre)}</h4>
      </li>`).join('');
  }

  /* --- Datos ------------------------------------------------------------ */

  function datosDemo() {
    let semilla = 42;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    const vendidos = [];
    const reservados = [];
    for (let n = 1; n <= C.totalNumeros; n++) {
      const r = azar();
      if (r < 0.34) vendidos.push(n);
      else if (r < 0.39) reservados.push(n);
    }
    return { ok: true, vendidos, reservados };
  }

  async function pedirDatos() {
    if (!C.apiUrl) throw new Error('sin-config');
    const control = new AbortController();
    const espera = setTimeout(() => control.abort(), 15000);
    try {
      const resp = await fetch(C.apiUrl, { cache: 'no-store', signal: control.signal });
      const datos = await resp.json().catch(() => null);
      if (datos && datos.error === 'sin-config') throw new Error('sin-config');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      if (!datos || !datos.ok || !Array.isArray(datos.vendidos)) throw new Error('respuesta inválida');
      return datos;
    } finally {
      clearTimeout(espera);
    }
  }

  async function cargarDatos() {
    if (estado.cargando) return;
    estado.cargando = true;
    dibujarEstadoDatos();
    try {
      const datos = DEMO ? datosDemo() : await pedirDatos();
      const valido = (n) => Number.isInteger(n) && n >= 1 && n <= C.totalNumeros;
      estado.vendidos = new Set(datos.vendidos.map(Number).filter(valido));
      estado.reservados = new Set((datos.reservados || []).map(Number).filter((n) => valido(n) && !estado.vendidos.has(n)));
      estado.cargado = true;
      estado.error = null;
      estado.actualizado = Date.now();
      quitarElegidosOcupados();
    } catch (err) {
      estado.error = err;
    } finally {
      estado.cargando = false;
      dibujarTodo();
    }
  }

  function quitarElegidosOcupados() {
    const ocupados = [...estado.elegidos].filter((n) => estado.vendidos.has(n) || estado.reservados.has(n));
    if (!ocupados.length) return;
    ocupados.forEach((n) => estado.elegidos.delete(n));
    guardarSeleccion();
    const lista = ocupados.sort((a, b) => a - b).map(pad).join(', ');
    tostada(ocupados.length === 1
      ? `El ${lista} ya no está disponible y lo quitamos de tu selección.`
      : `Los números ${lista} ya no están disponibles y los quitamos de tu selección.`);
  }

  /* --- Estado de cada número -------------------------------------------- */

  function estadoDe(n) {
    if (!estado.cargado) return 'cargando';
    if (estado.vendidos.has(n)) return 'vendido';
    if (estado.reservados.has(n)) return 'reservado';
    if (estado.elegidos.has(n)) return 'elegido';
    return 'libre';
  }

  function libresEn(pagina) {
    const desde = pagina * C.porPagina + 1;
    const hasta = Math.min(desde + C.porPagina - 1, C.totalNumeros);
    let libres = 0;
    for (let n = desde; n <= hasta; n++) {
      if (!estado.vendidos.has(n) && !estado.reservados.has(n)) libres++;
    }
    return libres;
  }

  /* --- Pestañas de páginas ---------------------------------------------- */

  function crearPestanas() {
    const cont = $('#paginas');
    for (let p = 0; p < TOTAL_PAGINAS; p++) {
      const desde = p * C.porPagina + 1;
      const hasta = Math.min(desde + C.porPagina - 1, C.totalNumeros);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pagina';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'grilla');
      b.dataset.pagina = p;
      b.innerHTML = `<span class="pagina__rango">${pad(desde)}–${pad(hasta)}</span><span class="pagina__libres"></span>`;
      cont.append(b);
    }
    cont.addEventListener('click', (e) => {
      const b = e.target.closest('.pagina');
      if (b) irAPagina(Number(b.dataset.pagina));
    });
    cont.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const destino = (estado.pagina + (e.key === 'ArrowRight' ? 1 : -1) + TOTAL_PAGINAS) % TOTAL_PAGINAS;
      irAPagina(destino);
      $(`.pagina[data-pagina="${destino}"]`).focus();
    });
  }

  function dibujarPestanas() {
    $$('.pagina').forEach((b) => {
      const p = Number(b.dataset.pagina);
      const activa = p === estado.pagina;
      b.setAttribute('aria-selected', activa);
      b.tabIndex = activa ? 0 : -1;
      const libres = libresEn(p);
      $('.pagina__libres', b).textContent = estado.cargado ? `${libres} ${libres === 1 ? 'libre' : 'libres'}` : '…';
    });
  }

  function irAPagina(p) {
    if (p === estado.pagina) return;
    estado.pagina = p;
    dibujarPestanas();
    dibujarGrilla();
  }

  /* --- Grilla ----------------------------------------------------------- */

  function pintarCelda(b) {
    const n = Number(b.dataset.n);
    const est = estadoDe(n);
    const ocupado = est === 'vendido' || est === 'reservado';
    b.className = `num num--${est} acento-${Math.floor((n - 1) / 10) % 3}`;
    b.disabled = ocupado || est === 'cargando';
    b.hidden = estado.soloLibres && ocupado;
    if (est === 'libre' || est === 'elegido') b.setAttribute('aria-pressed', est === 'elegido');
    else b.removeAttribute('aria-pressed');
    b.setAttribute('aria-label', `Número ${pad(n)}, ${ETIQUETA[est]}`);
    b.innerHTML = (ocupado ? '<svg class="num__pino" aria-hidden="true"><use href="#pino"/></svg>' : '') +
      `<span class="num__n">${pad(n)}</span>`;
  }

  function dibujarGrilla() {
    const desde = estado.pagina * C.porPagina + 1;
    const hasta = Math.min(desde + C.porPagina - 1, C.totalNumeros);
    const frag = document.createDocumentFragment();
    for (let n = desde; n <= hasta; n++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.n = n;
      pintarCelda(b);
      frag.append(b);
    }
    $('#grilla').replaceChildren(frag);
  }

  function alternarNumero(b) {
    const n = Number(b.dataset.n);
    const est = estadoDe(n);
    if (est === 'libre') estado.elegidos.add(n);
    else if (est === 'elegido') estado.elegidos.delete(n);
    else return;
    guardarSeleccion();
    pintarCelda(b);
    dibujarCarrito();
  }

  /* --- Progreso y avisos ------------------------------------------------ */

  function dibujarProgreso() {
    const vendidos = estado.vendidos.size;
    const reservados = estado.reservados.size;
    const libres = C.totalNumeros - vendidos - reservados;
    const pct = (x) => `${(100 * x / C.totalNumeros).toFixed(2)}%`;
    $('.progreso__vendidos').style.width = estado.cargado ? pct(vendidos) : '0';
    $('.progreso__reservados').style.width = estado.cargado ? pct(reservados) : '0';
    $('.progreso__barra').setAttribute('aria-label', estado.cargado
      ? `${vendidos} vendidos, ${reservados} reservados y ${libres} disponibles de ${C.totalNumeros}`
      : 'Cargando avance de la venta');
    const cuentas = { vendidos, reservados, libres };
    $$('[data-cuenta]').forEach((el) => {
      el.textContent = estado.cargado ? cuentas[el.dataset.cuenta] : '–';
    });
  }

  function dibujarEstadoDatos() {
    const aviso = $('#aviso');
    const sinConfig = estado.error && estado.error.message === 'sin-config';
    aviso.hidden = !(estado.error && !estado.cargado);
    if (!aviso.hidden) {
      $('#aviso-texto').textContent = sinConfig
        ? 'Todavía no conectamos la planilla de números. Volvé a entrar en un rato.'
        : 'No pudimos cargar los números. Revisá tu conexión e intentá de nuevo.';
    }

    const texto = $('#actualizado');
    if (estado.cargando && !estado.cargado) texto.textContent = 'Cargando números…';
    else if (!estado.cargado) texto.textContent = 'Sin datos todavía.';
    else {
      const seg = Math.round((Date.now() - estado.actualizado) / 1000);
      const hace = seg < 10 ? 'recién' : seg < 60 ? `hace ${seg} s` : `hace ${Math.floor(seg / 60)} min`;
      texto.textContent = (DEMO ? 'Modo demostración · ' : '') +
        (estado.error ? `No se pudo actualizar. Última actualización ${hace}.` : `Actualizado ${hace}.`);
    }
  }

  /* --- Carrito ---------------------------------------------------------- */

  function mensajeWhatsApp(lista) {
    const cant = lista.length;
    return [
      `¡Hola! Quiero comprar ${cant === 1 ? 'este número' : 'estos números'} de la ${C.nombre}:`,
      lista.map(pad).join(', '),
      '',
      `Total: ${pesos(cant * C.precio)} (${cant} × ${pesos(C.precio)})`,
      `Te envío el comprobante de la transferencia al alias ${C.alias} (${C.titular}, ${C.billetera}).`,
      '',
      'Mis datos:',
      '- Nombre y apellido: ',
      '- DNI: ',
      '- Teléfono: ',
      '',
      'Leí y acepto las bases y condiciones.',
    ].join('\n');
  }

  function dibujarCarrito() {
    const lista = [...estado.elegidos].sort((a, b) => a - b);
    const carrito = $('#carrito');
    carrito.hidden = lista.length === 0;
    document.body.classList.toggle('con-carrito', lista.length > 0);
    if (!lista.length) return;

    $('#carrito-lista').innerHTML = lista.map((n) =>
      `<button type="button" class="chip" data-quitar="${n}" aria-label="Quitar el ${pad(n)}">${pad(n)}<span aria-hidden="true">×</span></button>`
    ).join('');
    $('#carrito-resumen').innerHTML =
      `${lista.length} ${lista.length === 1 ? 'número' : 'números'} · <b>${pesos(lista.length * C.precio)}</b>`;
    $('#carrito-wa').href = waLink(mensajeWhatsApp(lista));
  }

  /* --- Buscador --------------------------------------------------------- */

  function buscar(e) {
    e.preventDefault();
    const input = $('#buscar-num');
    const msj = $('#buscador-msj');
    const n = Number(input.value);
    if (!Number.isInteger(n) || n < 1 || n > C.totalNumeros) {
      msj.textContent = `Ingresá un número del 1 al ${C.totalNumeros}.`;
      return;
    }
    const est = estadoDe(n);
    if (estado.soloLibres && (est === 'vendido' || est === 'reservado')) {
      estado.soloLibres = false;
      $('#solo-libres').checked = false;
    }
    estado.pagina = Math.floor((n - 1) / C.porPagina);
    dibujarPestanas();
    dibujarGrilla();

    const celda = $(`.num[data-n="${n}"]`);
    celda.scrollIntoView({ behavior: 'smooth', block: 'center' });
    celda.classList.remove('num--destello');
    void celda.offsetWidth;
    celda.classList.add('num--destello');
    setTimeout(() => celda.classList.remove('num--destello'), 1700);
    if (!celda.disabled) celda.focus({ preventScroll: true });

    msj.textContent = {
      libre: `¡El ${pad(n)} está disponible! Tocalo para elegirlo.`,
      elegido: `El ${pad(n)} ya está en tu pedido.`,
      vendido: `El ${pad(n)} ya está vendido.`,
      reservado: `El ${pad(n)} está reservado.`,
      cargando: `Todavía estamos cargando los números.`,
    }[est];
  }

  /* --- Utilidades ------------------------------------------------------- */

  let temporizadorTostada;
  function tostada(texto) {
    const el = $('#tostada');
    el.textContent = texto;
    el.classList.add('visible');
    clearTimeout(temporizadorTostada);
    temporizadorTostada = setTimeout(() => el.classList.remove('visible'), 3800);
  }

  async function copiarAlias() {
    try {
      await navigator.clipboard.writeText(C.alias);
    } catch {
      const area = document.createElement('textarea');
      area.value = C.alias;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    tostada(`Alias copiado: ${C.alias}`);
  }

  // Si la grilla ya muestra la página actual, repinta en el lugar (no se pierde el foco del teclado).
  function actualizarGrilla() {
    const primera = $('#grilla .num');
    if (primera && Number(primera.dataset.n) === estado.pagina * C.porPagina + 1) {
      $$('#grilla .num').forEach(pintarCelda);
    } else {
      dibujarGrilla();
    }
  }

  function dibujarTodo() {
    dibujarPestanas();
    actualizarGrilla();
    dibujarProgreso();
    dibujarEstadoDatos();
    dibujarCarrito();
  }

  /* --- Inicio ----------------------------------------------------------- */

  function iniciar() {
    completarTextos();
    dibujarBanderines();
    dibujarPremios();
    crearPestanas();
    dibujarTodo();

    $('#grilla').addEventListener('click', (e) => {
      const b = e.target.closest('.num');
      if (b) alternarNumero(b);
    });

    $('#carrito-lista').addEventListener('click', (e) => {
      const b = e.target.closest('[data-quitar]');
      if (!b) return;
      estado.elegidos.delete(Number(b.dataset.quitar));
      guardarSeleccion();
      const celda = $(`.num[data-n="${b.dataset.quitar}"]`);
      if (celda) pintarCelda(celda);
      dibujarCarrito();
    });

    $('#carrito-vaciar').addEventListener('click', () => {
      estado.elegidos.clear();
      guardarSeleccion();
      actualizarGrilla();
      dibujarCarrito();
    });

    $('#solo-libres').addEventListener('change', (e) => {
      estado.soloLibres = e.target.checked;
      $$('#grilla .num').forEach(pintarCelda);
    });

    $('#buscador').addEventListener('submit', buscar);
    $$('[data-copiar-alias]').forEach((b) => b.addEventListener('click', copiarAlias));
    $$('[data-actualizar]').forEach((b) => b.addEventListener('click', cargarDatos));

    setInterval(() => {
      if (document.visibilityState === 'visible') cargarDatos();
    }, C.refrescoSegundos * 1000);
    setInterval(dibujarEstadoDatos, 10000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - estado.actualizado > C.refrescoSegundos * 1000) {
        cargarDatos();
      }
    });

    cargarDatos();
  }

  iniciar();
})();
