'use strict';

const { getDb } = require('../config/database');

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    phone: row.phone,
    address: row.address,
    role: row.role,
    createdAt: row.created_at,
  };
}

const userRepository = {
  create({ name, email, passwordHash, phone = null, address = null, role = 'customer' }) {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, phone, address, role)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(name, email, passwordHash, phone, address, role);

    return this.findById(Number(info.lastInsertRowid));
  },

  findById(id) {
    const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
    return mapUser(row);
  },

  findByEmail(email) {
    const row = getDb()
      .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
      .get(email);
    return mapUser(row);
  },

  count() {
    return getDb().prepare('SELECT COUNT(*) AS count FROM users').get().count;
  },
};

module.exports = userRepository;
