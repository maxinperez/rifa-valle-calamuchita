# Gran Rifa Potrero

Página para mostrar los 500 números de la rifa (vendidos, reservados y disponibles) y pedirlos por WhatsApp.
Los datos salen de una hoja de Google Sheets: cargás una venta en la hoja y la página se actualiza sola.

```
index.html             página
css/styles.css         estilos (Feria + Bosque)
js/config.js           ← lo que vas a editar: alias, sorteo, premios, fotos
js/app.js              lógica (grilla, páginas, búsqueda, carrito, WhatsApp)
api/numeros.js         intermediario en Vercel entre la página y la hoja
vercel.json            encabezados de seguridad
img/premios/           fotos de los premios
apps-script/Codigo.gs  script que conecta la hoja
```

```
Visitante → página (Vercel) → /api/numeros (Vercel, caché 30 s) → Apps Script → hoja "Ventas"
                                    └─ solo viajan números del 1 al 500
```

## 1. Pasar la hoja a tu cuenta (maxi2017p@gmail.com)

La hoja original ya está compartida con tu Gmail.

1. Entrá a Google Drive con **maxi2017p@gmail.com** → "Compartidos conmigo" → **Rifa Potrero - Ventas**.
2. **Archivo → Hacer una copia**. Nombre: `Rifa Potrero - Ventas`. Guardala en "Mi unidad".
3. Trabajá siempre sobre **tu copia**. Revisá que en "Compartir" diga **Restringido** (solo vos).

| Columna | Qué va |
|---|---|
| Nombre y apellido | Como figura en el DNI |
| DNI | Solo números |
| Teléfono | Para llamar al ganador si no se presenta |
| Fecha de compra | Si la dejás vacía, se completa sola con la fecha de hoy |
| Números | Separados por coma: `12, 145, 300` |
| Estado | `Pagado` (pino verde), `Reservado` (pino amarillo) o `Anulado` (libera los números). Vacío cuenta como Pagado |
| Notas | Lo que quieras |
| Control (automático) | No escribas acá: avisa si un número está repetido o no existe |

**Flujo de una venta:** te llega el comprobante por WhatsApp → **verificás en la app de Naranja X que la plata entró** (no alcanza con la captura) → agregás una fila con Estado `Pagado`.
Si alguien avisa antes de pagar, cargalo como `Reservado` y pasalo a `Pagado` cuando confirmes.
Si una venta se cae, poné `Anulado` (no borres la fila, así queda el historial).

En la hoja aparece el menú **Rifa** con "Revisar números repetidos" y "Ver resumen".

## 2. Conectar la hoja (una sola vez, ~5 minutos)

1. En **tu copia** de la hoja → **Extensiones → Apps Script**.
2. Borrá el contenido de `Código.gs`, pegá todo [`apps-script/Codigo.gs`](apps-script/Codigo.gs) y guardá (Ctrl+S).
3. **Implementar → Nueva implementación** → engranaje → **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
4. **Implementar → Autorizar acceso**. Google va a pedir permiso **solo sobre esta hoja** (el script tiene `@OnlyCurrentDoc`). Si aparece "Google no verificó esta app": **Configuración avanzada → Ir a … (no seguro)**; es tu propio script.
5. Copiá la **URL de la aplicación web** (termina en `/exec`). **No la publiques**: va solamente en Vercel (paso 5).

Para probarla, abrila en el navegador: tiene que mostrar `{"ok":true,"total":500,"vendidos":[],...}`.

**Si después cambiás el script:** Implementar → Administrar implementaciones → lápiz → Versión: **Nueva versión** → Implementar. La URL no cambia.

## 3. Cambiar datos de la rifa

Todo está en `js/config.js`: `alias`, `sorteo` (fecha, lugar, modalidad), `premioMayor` (marca y modelo de la moto) y las fotos (`imagen: 'img/premios/moto.jpg'`).
Las bases y condiciones están en `index.html` (al final, sección `bases`).

## 4. Probar en tu computadora

```bash
python -m http.server 5173
```

Abrí http://localhost:5173/?demo (números de prueba). Sin `?demo` vas a ver el aviso "Todavía no conectamos la planilla", porque `/api/numeros` solo existe en Vercel (o con `npx vercel dev`).

## 5. Publicar en Vercel (plan Hobby, gratis)

Proyecto: `rifa-potrero` → **https://rifa-potrero.vercel.app** (ya creado y vinculado a esta carpeta).

`.vercelignore` funciona como lista de permitidos: solo se publican `index.html`, `css/`, `js/`, `img/`, `api/` y `vercel.json`. Cualquier otro archivo que dejes en la carpeta (por ejemplo una planilla `.xlsx`) **no** se sube.

1. Cargá la URL del Apps Script como variable de entorno:
   - En vercel.com → tu proyecto → **Settings → Environment Variables** → nombre `APPS_SCRIPT_URL`, valor la URL `/exec`, entorno **Production**.
   - O por terminal: `npx vercel env add APPS_SCRIPT_URL production`
2. Volvé a publicar para que tome la variable: `npx vercel --prod`.
3. Verificá: abrí `https://rifa-potrero.vercel.app/api/numeros` (tiene que mostrar el JSON) y la página.

Cargar ventas en la hoja **no** requiere volver a publicar: la página se actualiza sola (tarda hasta ~30 s por la caché).

## 6. Seguridad: qué ya está hecho y qué te toca

**En el código**
- La web nunca recibe nombres, DNI ni teléfonos: el script solo devuelve números y `/api/numeros` vuelve a filtrar (solo enteros del 1 al 500).
- La URL del Apps Script no aparece en la página: está en una variable de entorno de Vercel.
- Caché de 30 s en Vercel: aunque la compartan en grupos y entren cientos de personas, el script recibe un par de pedidos por minuto (Google limita las ejecuciones simultáneas por cuenta).
- El script no tiene `doPost`: desde internet nadie puede escribir ni borrar en la hoja. Tiene `@OnlyCurrentDoc`: solo puede tocar esa hoja.
- `vercel.json` agrega encabezados de seguridad (CSP, anti-iframe, nosniff, HSTS, etc.).
- No hay dependencias de npm ni formularios que guarden datos; la selección del visitante queda solo en su navegador.

**Te toca a vos**
- Verificación en dos pasos en **Google** (maxi2017p@gmail.com), **Vercel** y **WhatsApp** (Ajustes → Cuenta → Verificación en dos pasos).
- No compartas la hoja ni la URL `/exec`. Si alguna vez se filtra: Administrar implementaciones → **Archivar** y crear una nueva, y actualizar `APPS_SCRIPT_URL`.
- Confirmá cada pago **en la app de Naranja X**, no por la captura del comprobante.
- Terminada la entrega de premios, borrá los datos personales de la hoja (Ley 25.326, art. 4 inc. 7).
- Antes de vender: consultá con la **Lotería de la Provincia de Córdoba** la autorización o "toma de conocimiento" de la rifa.
