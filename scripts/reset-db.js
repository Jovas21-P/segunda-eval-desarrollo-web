'use strict';

const fs = require('node:fs');
const env = require('../src/config/env');

if (env.databaseFile === ':memory:') {
  console.log('La base de datos configurada es en memoria (:memory:). No hay archivos que borrar.');
  process.exit(0);
}

const files = [env.databaseFile, `${env.databaseFile}-wal`, `${env.databaseFile}-shm`];
let removed = 0;

for (const file of files) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    removed += 1;
    console.log(`✓ Eliminado: ${file}`);
  }
}

if (removed === 0) {
  console.log('No se encontraron archivos de base de datos. Se creará al iniciar el servidor.');
} else {
  console.log('Base de datos reiniciada. Al iniciar el servidor se ejecutará el esquema y el seed.');
}
