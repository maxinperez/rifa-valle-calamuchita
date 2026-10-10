/** @OnlyCurrentDoc */
// ↑ Limita el script a ESTA hoja: Google solo pide permiso sobre este archivo, no sobre todas tus hojas.

/**
 * Rifa Arts Lohema · conexión entre la hoja "Ventas" y la página web.
 *
 * Cómo instalarlo (una sola vez):
 *   1. En la hoja de cálculo: Extensiones → Apps Script.
 *   2. Borrá lo que haya y pegá todo este archivo. Guardá (ícono de disquete).
 *   3. Implementar → Nueva implementación → tipo "Aplicación web".
 *      Ejecutar como: Yo. Quién tiene acceso: Cualquier usuario.
 *   4. Autorizá los permisos y copiá la URL que termina en /exec.
 *   5. Cargá esa URL en Vercel como variable de entorno APPS_SCRIPT_URL (ver README.md).
 *      No la publiques en la página ni la compartas.
 *
 * Si más adelante cambiás este código: Implementar → Administrar implementaciones →
 * lápiz → Versión: "Nueva versión" → Implementar. La URL no cambia.
 *
 * Activador (una sola vez, para que la web cargue rápido):
 *   En el editor elegí la función "instalarActivador" arriba y tocá Ejecutar.
 *   Cada 5 minutos deja calculada la lista de números; así la web no espera a que se lea la hoja.
 *
 * Seguridad:
 *  - doGet solo LEE la hoja y devuelve la lista de números. Nombres, DNI y teléfonos nunca salen.
 *  - No hay doPost: desde internet nadie puede escribir ni borrar nada en la hoja.
 *  - doGet ignora cualquier parámetro que le manden en la URL.
 */

const HOJA = 'Ventas';
const TOTAL_NUMEROS = 500;
const COL = { FECHA: 4, NUMEROS: 5, ESTADO: 6, CONTROL: 8 }; // A = 1
const CLAVE_CACHE = 'estado-numeros';
const SEGUNDOS_CACHE_LARGA = 600;
const PRECIO = 15000;

/* ---------- API para la web ---------- */

function doGet() {
  const json = CacheService.getScriptCache().get(CLAVE_CACHE) ||
    PropertiesService.getScriptProperties().getProperty(CLAVE_CACHE) ||
    guardarEstado_();
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// Calcula la lista y la deja guardada (caché rápida + copia permanente). Devuelve el JSON.
function guardarEstado_() {
  const json = JSON.stringify(calcularEstado_());
  CacheService.getScriptCache().put(CLAVE_CACHE, json, SEGUNDOS_CACHE_LARGA);
  PropertiesService.getScriptProperties().setProperty(CLAVE_CACHE, json);
  return json;
}

// Lo ejecuta el activador cada 5 minutos.
function actualizarEstado() {
  guardarEstado_();
}

// Ejecutar UNA vez a mano desde el editor. Si se ejecuta de nuevo, no duplica el activador.
function instalarActivador() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'actualizarEstado')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('actualizarEstado').timeBased().everyMinutes(5).create();
  guardarEstado_();
}

function calcularEstado_() {
  const vendidos = new Set();
  const reservados = new Set();
  leerFilas_().forEach((fila) => {
    const estado = normalizarEstado_(fila[COL.ESTADO - 1]);
    if (estado === 'anulado') return;
    extraerNumeros_(fila[COL.NUMEROS - 1]).forEach((n) => {
      if (n < 1 || n > TOTAL_NUMEROS) return;
      (estado === 'pagado' ? vendidos : reservados).add(n);
    });
  });
  vendidos.forEach((n) => reservados.delete(n));
  const ordenar = (s) => [...s].sort((a, b) => a - b);
  return {
    ok: true,
    total: TOTAL_NUMEROS,
    vendidos: ordenar(vendidos),
    reservados: ordenar(reservados),
    actualizado: new Date().toISOString(),
  };
}

/* ---------- Ayudas a quien carga la hoja ---------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rifa')
    .addItem('Revisar números repetidos', 'revisarDesdeMenu')
    .addItem('Ver resumen', 'verResumen')
    .addToUi();
}

function onEdit(e) {
  const hoja = e.range.getSheet();
  if (hoja.getName() !== HOJA) return;
  completarFechas_(hoja, e.range);
  revisarNumeros_(hoja);
  guardarEstado_(); // la web ve el cambio enseguida
}

function revisarDesdeMenu() {
  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA);
  const problemas = revisarNumeros_(hoja);
  guardarEstado_();
  SpreadsheetApp.getUi().alert(problemas
    ? `Hay ${problemas} fila(s) con problemas. Mirá la columna "Control".`
    : 'Todo en orden: no hay números repetidos ni fuera de rango.');
}

function verResumen() {
  const d = calcularEstado_();
  const libres = TOTAL_NUMEROS - d.vendidos.length - d.reservados.length;
  SpreadsheetApp.getUi().alert(
    `Vendidos: ${d.vendidos.length}\nReservados: ${d.reservados.length}\nDisponibles: ${libres}\n\n` +
    `Recaudado por números vendidos: $${(d.vendidos.length * PRECIO).toLocaleString('es-AR')}`
  );
}

// Si se cargan números en una fila sin fecha, pone la fecha de hoy.
function completarFechas_(hoja, rango) {
  if (rango.getColumn() > COL.NUMEROS || rango.getLastColumn() < COL.NUMEROS) return;
  const primera = Math.max(rango.getRow(), 2);
  const ultima = rango.getLastRow();
  if (ultima < primera) return;
  const filas = hoja.getRange(primera, 1, ultima - primera + 1, COL.NUMEROS).getValues();
  filas.forEach((fila, i) => {
    if (String(fila[COL.NUMEROS - 1]).trim() && !fila[COL.FECHA - 1]) {
      hoja.getRange(primera + i, COL.FECHA).setValue(new Date());
    }
  });
}

// Marca números repetidos (en filas no anuladas) o fuera de rango. Devuelve cuántas filas tienen problemas.
function revisarNumeros_(hoja) {
  const filas = leerFilas_(hoja);
  if (!filas.length) return 0;

  const filasPorNumero = {};
  filas.forEach((fila, i) => {
    if (normalizarEstado_(fila[COL.ESTADO - 1]) === 'anulado') return;
    new Set(extraerNumeros_(fila[COL.NUMEROS - 1])).forEach((n) => {
      (filasPorNumero[n] = filasPorNumero[n] || []).push(i + 2);
    });
  });

  let conProblemas = 0;
  const avisos = filas.map((fila, i) => {
    const filaHoja = i + 2;
    if (normalizarEstado_(fila[COL.ESTADO - 1]) === 'anulado') return [''];
    const numeros = extraerNumeros_(fila[COL.NUMEROS - 1]);
    const problemas = [];
    const vistos = new Set();
    numeros.forEach((n) => {
      if (n < 1 || n > TOTAL_NUMEROS) {
        problemas.push(`El ${n} no existe (van del 1 al ${TOTAL_NUMEROS})`);
      } else if (vistos.has(n)) {
        problemas.push(`El ${pad_(n)} está dos veces en esta fila`);
      } else {
        const otras = filasPorNumero[n].filter((f) => f !== filaHoja);
        if (otras.length) problemas.push(`El ${pad_(n)} también está en la fila ${otras.join(', ')}`);
      }
      vistos.add(n);
    });
    if (problemas.length) conProblemas++;
    return [problemas.length ? '⚠ ' + problemas.join('. ') : ''];
  });

  hoja.getRange(2, COL.CONTROL, avisos.length, 1).setValues(avisos);
  hoja.getRange(2, COL.NUMEROS, avisos.length, 1)
    .setFontColors(avisos.map((a) => [a[0] ? '#C62828' : null]))
    .setFontWeights(avisos.map((a) => [a[0] ? 'bold' : 'normal']));
  return conProblemas;
}

/* ---------- Utilidades ---------- */

function leerFilas_(hoja) {
  hoja = hoja || SpreadsheetApp.getActive().getSheetByName(HOJA);
  const ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  // getDisplayValues: lee el texto tal como se ve (evita que "12,450" se interprete como decimal).
  return hoja.getRange(2, 1, ultima - 1, COL.ESTADO).getDisplayValues();
}

function extraerNumeros_(texto) {
  return (String(texto).match(/\d+/g) || []).map(Number);
}

// Vacío o "Pagado" = vendido. "Reservado" = reservado. "Anulado" = no cuenta.
function normalizarEstado_(estado) {
  const e = String(estado).trim().toLowerCase();
  if (e === 'reservado') return 'reservado';
  if (e === 'anulado') return 'anulado';
  return 'pagado';
}

function pad_(n) {
  return ('00' + n).slice(-3);
}
