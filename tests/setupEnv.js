'use strict';

/**
 * Variables de entorno para la suite de pruebas. Jest ejecuta este archivo
 * antes de cargar cualquier módulo de la aplicación.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'foodexpress-test-secret-no-usar-en-produccion';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_FILE = ':memory:';
process.env.BCRYPT_ROUNDS = '4';
process.env.PAYMENT_PROVIDER = 'mock';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.OPENWEATHER_API_KEY = '';
process.env.RATE_LIMIT_MAX = '10000';
process.env.AUTH_RATE_LIMIT_MAX = '10000';
