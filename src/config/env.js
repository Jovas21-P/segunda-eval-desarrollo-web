'use strict';

const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';
const isProduction = nodeEnv === 'production';

function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function listFromEnv(name, fallback) {
  const raw = process.env[name] || fallback;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const jwtSecret =
  process.env.JWT_SECRET ||
  (isProduction ? '' : 'dev-secret-cambia-esto-en-produccion-foodexpress');

if (!jwtSecret) {
  throw new Error(
    'JWT_SECRET es obligatorio en producción. Define la variable de entorno antes de iniciar el servidor.'
  );
}

const env = {
  nodeEnv,
  isTest,
  isProduction,
  port: numberFromEnv('PORT', 3000),
  trustProxy: process.env.TRUST_PROXY === 'true',

  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  jwtIssuer: 'foodexpress',

  bcryptRounds: numberFromEnv('BCRYPT_ROUNDS', isTest ? 4 : 10),

  databaseFile: process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'foodexpress.db'),

  corsOrigins: listFromEnv(
    'CORS_ORIGINS',
    `http://localhost:${numberFromEnv('PORT', 3000)},http://127.0.0.1:${numberFromEnv('PORT', 3000)}`
  ),

  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeCurrency: (process.env.STRIPE_CURRENCY || 'mxn').toLowerCase(),

  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '',

  delivery: {
    baseEtaMinutes: numberFromEnv('DELIVERY_BASE_ETA_MINUTES', 25),
    baseFeeCents: numberFromEnv('DELIVERY_FEE_CENTS', 3500),
    freeFromCents: numberFromEnv('DELIVERY_FREE_FROM_CENTS', 30000),
  },

  rateLimit: {
    windowMs: numberFromEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: numberFromEnv('RATE_LIMIT_MAX', 300),
    authMax: numberFromEnv('AUTH_RATE_LIMIT_MAX', 12),
  },

  admin: {
    name: process.env.ADMIN_NAME || 'Administrador FoodExpress',
    email: (process.env.ADMIN_EMAIL || 'admin@foodexpress.com').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
  },
};

module.exports = env;
