'use strict';

const { getDb } = require('../config/database');

function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    priceCents: row.price_cents,
    image: row.image,
    stock: row.stock,
    featured: Boolean(row.featured),
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

const productRepository = {
  /**
   * Consulta parametrizada: los valores del usuario nunca se concatenan
   * dentro del SQL (prevención de inyección SQL).
   */
  findAll({ category = null, search = null, limit = 100 } = {}) {
    const filters = ['active = 1'];
    const params = [];

    if (category) {
      filters.push('category = ?');
      params.push(category);
    }

    if (search) {
      filters.push('(name LIKE ? OR description LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const sql = `
      SELECT * FROM products
      WHERE ${filters.join(' AND ')}
      ORDER BY featured DESC, category ASC, name ASC
      LIMIT ?
    `;
    params.push(limit);

    return getDb().prepare(sql).all(...params).map(mapProduct);
  },

  findById(id) {
    const row = getDb().prepare('SELECT * FROM products WHERE id = ?').get(id);
    return mapProduct(row);
  },

  findByIds(ids) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = getDb()
      .prepare(`SELECT * FROM products WHERE active = 1 AND id IN (${placeholders})`)
      .all(...ids);
    return rows.map(mapProduct);
  },

  categories() {
    return getDb()
      .prepare('SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category ASC')
      .all()
      .map((row) => row.category);
  },

  count() {
    return getDb().prepare('SELECT COUNT(*) AS count FROM products').get().count;
  },
};

module.exports = { productRepository, mapProduct };
