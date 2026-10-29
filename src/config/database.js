'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const env = require('./env');
const { SCHEMA } = require('../database/schema');
const { seed } = require('../database/seed');

let db = null;

function applySchema(database) {
  database.pragma('foreign_keys = ON');
  if (env.databaseFile !== ':memory:') {
    database.pragma('journal_mode = WAL');
  }
  database.exec(SCHEMA);
}

function createDatabase(filename = env.databaseFile) {
  if (filename !== ':memory:') {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  const database = new Database(filename);
  applySchema(database);
  seed(database);
  return database;
}

function getDb() {
  if (!db) {
    db = createDatabase();
  }
  return db;
}

/**
 * Reconstruye la base de datos. Se usa en las pruebas de integración para
 * garantizar un estado limpio antes de cada caso.
 */
function resetDatabase() {
  const database = getDb();
  database.pragma('foreign_keys = OFF');
  database.exec(`
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS users;
  `);
  database.pragma('foreign_keys = ON');
  database.exec(SCHEMA);
  seed(database);
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { createDatabase, getDb, resetDatabase, closeDatabase };
