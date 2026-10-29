'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

function limitMessage(message) {
  return {
    success: false,
    error: { message, code: 'RATE_LIMITED' },
  };
}

/**
 * Límite general de peticiones por IP para mitigar abuso de la API.
 * Se desactiva en el entorno de pruebas.
 */
const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: limitMessage('Demasiadas peticiones. Intenta de nuevo más tarde.'),
});

/**
 * Límite más estricto para login/registro: mitiga ataques de fuerza bruta.
 */
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.authMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => env.isTest,
  message: limitMessage(
    'Demasiados intentos de autenticación. Espera unos minutos antes de reintentar.'
  ),
});

module.exports = { globalLimiter, authLimiter };
