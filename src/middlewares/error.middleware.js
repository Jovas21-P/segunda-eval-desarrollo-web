'use strict';

const fs = require('node:fs');
const path = require('node:path');
const env = require('../config/env');

function notFound(req, res) {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: { message: 'Endpoint no encontrado', code: 'NOT_FOUND' },
    });
  }

  const page = path.join(__dirname, '..', '..', 'public', '404.html');
  if (fs.existsSync(page)) {
    return res.status(404).sendFile(page);
  }

  return res.status(404).send('No encontrado');
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.statusCode || 500;
  let message = error.message || 'Error interno del servidor';
  let code = typeof error.code === 'string' ? error.code : 'INTERNAL_ERROR';
  let details = error.details || null;

  if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la petición no contiene JSON válido';
    code = 'INVALID_JSON';
  }

  if (code === 'SQLITE_CONSTRAINT_UNIQUE') {
    status = 409;
    message = 'El recurso ya existe';
    code = 'DUPLICATE_RESOURCE';
  }

  if (status >= 500) {
    if (!env.isTest) {
      console.error('[FoodExpress] Error no controlado:', error);
    }
    if (env.isProduction) {
      message = 'Error interno del servidor';
      details = null;
    }
  }

  return res.status(status).json({
    success: false,
    error: {
      message,
      code,
      ...(details ? { details } : {}),
    },
  });
}

module.exports = { notFound, errorHandler };
