/*
 * GET /api/numeros
 * Intermediario entre la página y el Apps Script de la hoja:
 *  - La URL del Apps Script queda oculta en la variable de entorno APPS_SCRIPT_URL (Vercel).
 *  - La respuesta se guarda 30 s en la CDN de Vercel: aunque entren cientos de personas a la vez,
 *    el Apps Script recibe como mucho un par de pedidos por minuto (Google limita las ejecuciones simultáneas).
 *  - Solo se reenvían números enteros del 1 al 500; cualquier otro dato se descarta.
 */

const TOTAL_NUMEROS = 500;
const SEGUNDOS_CDN = 30;

function soloNumerosValidos(lista) {
  if (!Array.isArray(lista)) return [];
  const validos = lista.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_NUMEROS);
  return [...new Set(validos)].sort((a, b) => a - b);
}

function responder(res, estado, cuerpo, cache) {
  res.statusCode = estado;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache || 'no-store');
  res.end(JSON.stringify(cuerpo));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return responder(res, 405, { ok: false, error: 'metodo-no-permitido' });
  }

  const url = process.env.APPS_SCRIPT_URL;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
    return responder(res, 503, { ok: false, error: 'sin-config' });
  }

  try {
    const resp = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
    if (!resp.ok) throw new Error('Apps Script respondió ' + resp.status);
    const datos = await resp.json();
    if (!datos || datos.ok !== true) throw new Error('respuesta inválida');

    const vendidos = soloNumerosValidos(datos.vendidos);
    const vendidosSet = new Set(vendidos);
    const reservados = soloNumerosValidos(datos.reservados).filter((n) => !vendidosSet.has(n));

    return responder(
      res,
      200,
      { ok: true, total: TOTAL_NUMEROS, vendidos, reservados, actualizado: new Date().toISOString() },
      `public, s-maxage=${SEGUNDOS_CDN}, stale-while-revalidate=300`
    );
  } catch (err) {
    console.error('[api/numeros]', err && err.message);
    return responder(res, 502, { ok: false, error: 'sin-datos' });
  }
};
