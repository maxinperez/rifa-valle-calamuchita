# Gran Rifa Potrero · Valle de Calamuchita

Web de la rifa de 500 números ($15.000 cada uno) para Potrero de Garay, Santa Rosa de Calamuchita, Embalse, Los Reartes y alrededores.
Muestra qué números están **vendidos**, **reservados** o **disponibles**, y permite pedirlos por WhatsApp.
La venta se registra en una hoja de Google Sheets y la página se actualiza sola.

- **Producción:** https://rifa-potrero.vercel.app
- **Vista de demostración:** https://rifa-potrero.vercel.app/?demo (números de prueba, no lee la hoja)

---

## Stack

| Capa | Tecnología | Para qué |
|---|---|---|
| Frontend | **HTML5 + CSS3 + JavaScript (vanilla, ES2020)** | Página estática, sin framework, sin build y sin dependencias de npm |
| Estilos | CSS puro: variables, Grid, Flexbox, `mask` | Estética Feria + Bosque, diseño responsive (celular primero) |
| Tipografías | Google Fonts: **Lilita One** (títulos y números) y **Nunito** (texto) | |
| Íconos | SVG en línea (sprite con `<symbol>`) | Pinos, regalos, íconos de interfaz; sin librerías |
| API | **Vercel Serverless Function** en Node.js (`api/numeros.js`) | Intermediario entre la página y la hoja; caché en la CDN |
| Hosting | **Vercel** (plan Hobby) | Sitio estático + función + CDN + HTTPS |
| Base de datos | **Google Sheets** | Registro de compradores y números |
| Conector de datos | **Google Apps Script** (runtime V8) publicado como aplicación web | Lee la hoja y devuelve solo los números en JSON |
| Contacto y pago | WhatsApp (enlaces `wa.me`) + transferencia a Naranja X | El pedido se arma solo en un mensaje de WhatsApp |
| Control de versiones | Git + GitHub (`rifa-valle-calamuchita`) | |
| Herramientas | Vercel CLI (`npx vercel`), Python `http.server` para pruebas locales | |

## Arquitectura

```
Visitante
   │  (HTTPS)
   ▼
Página estática ─────────► /api/numeros  ──────────► Apps Script (doGet) ──► Hoja "Ventas"
index.html, css, js         Función en Vercel          Solo lectura              Nombre, DNI, teléfono,
                            · caché CDN 30 s           · caché 30 s              números, estado
                            · filtra: solo enteros     · devuelve solo números
                              del 1 al 500
                            · URL del script en la
                              variable APPS_SCRIPT_URL
```

- La página **nunca** recibe nombres, DNI ni teléfonos: solo listas de números.
- Gracias a la caché, aunque entren cientos de personas a la vez, el Apps Script recibe un par de pedidos por minuto (Google limita las ejecuciones simultáneas por cuenta).
- Respuesta de `/api/numeros`:
  ```json
  {"ok":true,"total":500,"vendidos":[7,145],"reservados":[12],"actualizado":"2026-10-10T02:02:08.805Z"}
  ```
  Si algo falla: `{"ok":false,"error":"sin-config"}` (falta la variable en Vercel) o `{"ok":false,"error":"sin-datos"}` (no responde el Apps Script).

## Estructura

```
├─ index.html             Página: hero, premios, grilla de números, cómo participar, bases y condiciones
├─ css/styles.css         Estilos
├─ js/config.js           ← Configuración editable: precio, alias, WhatsApp, sorteo, premios, fotos
├─ js/app.js              Lógica: pestañas, grilla, búsqueda, filtro, carrito, mensaje de WhatsApp, refresco
├─ api/numeros.js         Función serverless (Vercel) que consulta el Apps Script
├─ apps-script/Codigo.gs  Script para pegar en la hoja (no se publica en la web)
├─ img/favicon.svg
├─ img/premios/           Fotos de los premios
├─ vercel.json            Encabezados de seguridad
├─ .vercelignore          Lista de archivos que se publican (todo lo demás queda privado)
└─ .gitignore
```

## Funcionalidades

- 500 números en 5 páginas de 100 (001–100 … 401–500), con contador de libres por página.
- Estados: disponible, elegido, **reservado** (pino amarillo) y **vendido** (pino verde).
- Buscador de número, filtro "Ver solo disponibles" y barra de progreso de la venta.
- Carrito: elegís varios números (también entre páginas), ves el total y se arma el mensaje de WhatsApp con los números, el total, el alias y los datos a completar.
- La selección se guarda en el navegador del visitante (solo los números).
- Refresco automático cada 60 s mientras la pestaña está visible.
- Premios con lugar para foto ("Foto próximamente" mientras no haya imagen).
- Bases y condiciones en letra chica, incluida la cláusula de datos personales (Ley 25.326).

---

## La hoja de cálculo

Pestaña **`Ventas`**:

| Columna | Qué va |
|---|---|
| Nombre y apellido | Como figura en el DNI |
| DNI | Solo números |
| Teléfono | Para llamar al ganador si no se presenta |
| Fecha de compra | Si queda vacía, se completa sola con la fecha de hoy |
| Números | Separados por coma: `12, 145, 300` (columna en formato texto) |
| Estado | `Pagado` (vendido), `Reservado` o `Anulado` (libera los números). Vacío cuenta como Pagado |
| Notas | Libre |
| Control (automático) | No escribir: avisa si un número está repetido o fuera de rango |

**Cómo se carga una venta:** llega el comprobante por WhatsApp → se verifica **en la app de Naranja X** que la plata entró (no alcanza con la captura) → se agrega una fila con Estado `Pagado`.
Si alguien avisa antes de pagar, va como `Reservado`. Si una venta se cae, se pone `Anulado` (no se borra la fila, así queda el historial).

La hoja tiene un menú **Rifa** con "Revisar números repetidos" y "Ver resumen".

## Puesta en marcha

### 1. Apps Script (una sola vez)

1. En la hoja → **Extensiones → Apps Script**.
2. Pegar todo [`apps-script/Codigo.gs`](apps-script/Codigo.gs) y guardar.
3. **Implementar → Nueva implementación → Aplicación web**: Ejecutar como **Yo**; Quién tiene acceso **Cualquier usuario**.
4. Autorizar. Google pide permiso **solo sobre esta hoja** (`@OnlyCurrentDoc`).
5. Copiar la URL que termina en `/exec`. **No publicarla**: va solo en Vercel.

Si se modifica el script: Implementar → Administrar implementaciones → lápiz → Versión **Nueva versión**. La URL no cambia.

### 2. Vercel

Proyecto `rifa-potrero`, ya vinculado a esta carpeta.

1. **Settings → Environment Variables** → `APPS_SCRIPT_URL` = URL `/exec` (tipo **Secret**, entorno **Production**).
2. Publicar:
   ```bash
   npx vercel --prod
   ```
3. Verificar en `https://rifa-potrero.vercel.app/api/numeros` que diga `"ok":true`.

Cargar ventas en la hoja **no** requiere volver a publicar (los cambios se ven en ~30 s).

Pausar y reactivar el sitio (pide confirmar escribiendo el nombre del proyecto):

```bash
npx vercel project pause rifa-potrero
```

```bash
npx vercel project resume rifa-potrero
```

### 3. Probar en la computadora

```bash
python -m http.server 5173
```

Abrir http://localhost:5173/?demo. Sin `?demo` aparece "Todavía no conectamos la planilla", porque `/api/numeros` solo existe en Vercel (o con `npx vercel dev`).

## Configuración

Todo lo editable está en [`js/config.js`](js/config.js):

| Campo | Qué es |
|---|---|
| `precio`, `totalNumeros`, `porPagina` | Valor del número, cantidad total y números por página |
| `whatsapp`, `whatsappVisible` | Número en formato internacional (`549…`) y como se muestra |
| `alias`, `billetera` | Datos de la transferencia |
| `sorteo` | Fecha, lugar y modalidad |
| `premioMayor`, `premios` | Nombre, detalle, cantidad e imagen de cada premio |
| `refrescoSegundos` | Cada cuánto se actualiza la grilla |

Fotos: copiarlas a `img/premios/` y poner la ruta, por ejemplo `imagen: 'img/premios/moto.jpg'`.
Las bases y condiciones están en `index.html`, sección `bases`.

---

## Seguridad

**Implementado**
- La web solo recibe números; nombres, DNI y teléfonos nunca salen de la hoja. `/api/numeros` vuelve a filtrar la respuesta (solo enteros del 1 al 500).
- La URL del Apps Script está en una variable de entorno secreta de Vercel, no en el código.
- El Apps Script es de solo lectura (no hay `doPost`), ignora parámetros y tiene `@OnlyCurrentDoc`.
- `vercel.json` agrega encabezados de seguridad: Content-Security-Policy estricta, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS y `Cross-Origin-Opener-Policy`. Por la CSP, **no usar `<script>` ni `style=""` en línea**.
- `.vercelignore` funciona como lista de permitidos: solo se publican `index.html`, `css/`, `js/`, `img/`, `api/` y `vercel.json`.
- `.gitignore` excluye `.env*`, `.vercel/`, `.claude/` y planillas (`*.xlsx`, `*.xls`, `*.csv`).
- Sin dependencias de npm: no hay librerías de terceros que actualizar.

**Buenas prácticas de operación**
- Verificación en dos pasos en Google, Vercel, GitHub y WhatsApp.
- No compartir la hoja ni la URL `/exec`. Si se filtra: archivar la implementación, crear una nueva y actualizar `APPS_SCRIPT_URL`.
- Confirmar cada pago en la app de Naranja X, nunca por la captura del comprobante.
- Al terminar la entrega de premios, borrar los datos personales de la hoja (Ley 25.326, art. 4 inc. 7).
- Antes de vender, gestionar ante la **Lotería de la Provincia de Córdoba** la autorización o "toma de conocimiento" de la rifa.
