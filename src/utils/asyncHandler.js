'use strict';

/**
 * Envuelve controladores y middlewares asíncronos para delegar cualquier
 * rechazo al middleware de errores de Express.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
