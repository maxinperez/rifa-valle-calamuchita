/*
 * Configuración de la rifa.
 * Todo lo que quieras cambiar (alias, fecha del sorteo, premios, fotos) se edita acá.
 * Después de editar, volvé a publicar en Vercel.
 */
window.RIFA = {
  nombre: 'Rifa Arts Lohema',
  // Zonas donde trabaja Arts Lohema (portada y apartado "Quiénes organizamos")
  localidades: ['Todo el Valle de Calamuchita', 'Departamento Santa María', 'Córdoba Capital', 'Río Cuarto', 'Las Higueras', 'Departamento Ischilín'],

  totalNumeros: 500,
  porPagina: 100,
  precio: 15000,

  // WhatsApp en formato internacional (54 9 + característica + número, sin 15 ni espacios)
  whatsapp: '5493547319359',
  whatsappVisible: '3547 31-9359',

  // Grupo comunitario de Arts Lohema (no es el canal de venta de la rifa)
  grupoWhatsapp: 'https://chat.whatsapp.com/ET9cz48G8uJ7zHoX92NKvV',

  alias: 'rosas.luz.mar',
  titular: 'Leandra Fernández',
  cuit: '27-20784885-4',
  billetera: 'Naranja X',

  sorteo: {
    fecha: 'Al completar la venta',
    lugar: 'Feria de la Economía Social · Villa Ciudad Parque',
    modalidad: 'A confirmar',
  },

  // Endpoint propio en Vercel (api/numeros.js). La URL del Apps Script NO va acá:
  // se carga en Vercel como variable de entorno APPS_SCRIPT_URL. Ver README.md.
  apiUrl: '/api/numeros',
  refrescoSegundos: 60,

  // Fotos: guardalas en img/premios/ y poné la ruta, por ejemplo: imagen: 'img/premios/moto.webp'
  // Si la imagen fue generada con IA, agregá ilustrativa: true (muestra la etiqueta "Imagen ilustrativa").
  premioMayor: {
    nombre: 'Moto',
    detalle: 'Corven Energy 110 Full · Modelo 2023',
    imagen: 'img/premios/moto.webp',
    ilustrativa: true,
  },

  premios: [
    { nombre: 'Cámara de seguridad exterior', imagen: 'img/premios/camara-exterior.webp' },
    { nombre: 'Cámara de seguridad interior', imagen: 'img/premios/camara-interior.webp', ilustrativa: true },
    { nombre: 'Caja de tubos y llaves grande', imagen: 'img/premios/caja-tubos-llaves.webp' },
    { nombre: 'Termo Argentina con mate, bombilla y escobilla', imagen: 'img/premios/termo-argentina.webp' },
    { nombre: 'Termo de 5 litros para camping', imagen: 'img/premios/termo-5-litros.webp' },
    { nombre: 'Juego de sábanas', imagen: 'img/premios/juego-sabanas.webp', ilustrativa: true },
    { nombre: 'Cubrecama acanalado de 2½ plazas', imagen: 'img/premios/cubrecama.webp' },
    { nombre: 'Sillita musical para niños', imagen: 'img/premios/sillita-musical.webp', ilustrativa: true },
    { nombre: 'Balanza personal de vidrio', imagen: 'img/premios/balanza-vidrio.webp', ilustrativa: true },
    { nombre: 'Cafetera OM', imagen: 'img/premios/cafetera-om.webp' },
    { nombre: 'Cafetera Oryx', imagen: 'img/premios/cafetera-oryx.webp', ilustrativa: true },
    { nombre: 'Depiladora de cejas y facial', imagen: 'img/premios/depiladora.webp', ilustrativa: true },
    { nombre: 'Pistola masajeadora muscular', imagen: 'img/premios/pistola-masajeadora.webp' },
    { nombre: 'Vaso Kencher rosa', imagen: 'img/premios/vaso-rosa.webp', ilustrativa: true },
    { nombre: 'Monopatín Graffiti (hasta 60 kg)', imagen: 'img/premios/monopatin-graffiti.webp' },
    { nombre: 'Valija de herramientas para el hogar', imagen: 'img/premios/valija-herramientas.webp', ilustrativa: true },
    { nombre: 'Set para asado: 6 tablas con caja', imagen: 'img/premios/set-asado.webp', ilustrativa: true },
    { nombre: 'Aro de luz con trípode grande', imagen: 'img/premios/aro-de-luz.webp', ilustrativa: true, cantidad: 2 },
    { nombre: 'Caballito saltarín de goma verde', imagen: 'img/premios/caballito-saltarin.webp' },
  ],
};
