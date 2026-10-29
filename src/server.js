'use strict';

const env = require('./config/env');
const createApp = require('./app');
const { closeDatabase } = require('./config/database');

const app = createApp();

const server = app.listen(env.port, () => {
  console.log('');
  console.log('  🍔  FoodExpress API');
  console.log(`  ➜  Entorno:  ${env.nodeEnv}`);
  console.log(`  ➜  Web:      http://localhost:${env.port}`);
  console.log(`  ➜  API:      http://localhost:${env.port}/api/v1/health`);
  console.log(`  ➜  Pagos:    ${env.paymentProvider}`);
  console.log('');
});

function shutdown(signal) {
  console.log(`\n[FoodExpress] ${signal} recibido, cerrando servidor...`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[FoodExpress] Promesa rechazada sin manejar:', reason);
});

module.exports = server;
