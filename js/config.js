/*
 * Configuración de la rifa.
 * Todo lo que quieras cambiar (alias, fecha del sorteo, premios, fotos) se edita acá.
 * Después de editar, volvé a publicar en Vercel.
 */
window.RIFA = {
  nombre: 'Gran Rifa Potrero',
  localidades: ['Potrero de Garay', 'Santa Rosa de Calamuchita', 'Embalse', 'Los Reartes', 'y alrededores'],

  totalNumeros: 500,
  porPagina: 100,
  precio: 15000,

  // WhatsApp en formato internacional (54 9 + característica + número, sin 15 ni espacios)
  whatsapp: '5493547319359',
  whatsappVisible: '3547 31-9359',

  alias: 'xxxxxx',
  billetera: 'Naranja X',

  sorteo: {
    fecha: 'A confirmar',
    lugar: 'Lugar a confirmar',
    modalidad: 'A confirmar',
  },

  // Endpoint propio en Vercel (api/numeros.js). La URL del Apps Script NO va acá:
  // se carga en Vercel como variable de entorno APPS_SCRIPT_URL. Ver README.md.
  apiUrl: '/api/numeros',
  refrescoSegundos: 60,

  // Fotos: guardalas en img/premios/ y poné la ruta, por ejemplo: imagen: 'img/premios/moto.jpg'
  premioMayor: {
    nombre: 'Moto',
    detalle: 'Marca y modelo a confirmar',
    imagen: null,
  },

  premios: [
    { nombre: 'Cámara de seguridad exterior', imagen: null },
    { nombre: 'Cámara de seguridad interior', imagen: null },
    { nombre: 'Caja de tubos y llaves grande', imagen: null },
    { nombre: 'Termo Argentina con mate, bombilla y escobilla', imagen: null },
    { nombre: 'Termo de 5 litros para camping', imagen: null },
    { nombre: 'Juego de sábanas', imagen: null },
    { nombre: 'Cubrecama acanalado de 2½ plazas', imagen: null },
    { nombre: 'Sillita musical para niños', imagen: null },
    { nombre: 'Balanza personal de vidrio', imagen: null },
    { nombre: 'Cafetera OM', imagen: null },
    { nombre: 'Cafetera Oryx', imagen: null },
    { nombre: 'Depiladora de cejas y facial', imagen: null },
    { nombre: 'Masajeador facial', imagen: null },
    { nombre: 'Vaso Kencher rosa', imagen: null },
    { nombre: 'Monopatín Graffiti (hasta 60 kg)', imagen: null },
    { nombre: 'Valija de herramientas para el hogar', imagen: null },
    { nombre: 'Set para asado: 6 tablas con caja', imagen: null },
    { nombre: 'Aro de luz con trípode grande', imagen: null, cantidad: 2 },
    { nombre: 'Caballito saltarín de goma verde', imagen: null },
  ],
};
