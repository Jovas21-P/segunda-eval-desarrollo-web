'use strict';

/**
 * Elimina etiquetas HTML y caracteres de control de los campos de texto libre.
 * Es una capa de defensa adicional contra XSS almacenado; el frontend además
 * inserta todos los datos con `textContent` (nunca `innerHTML`).
 */
function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { sanitizeText };
