'use strict';

const { getDb } = require('../config/database');
const ApiError = require('../utils/ApiError');

function mapItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.product_name,
    image: row.product_image,
    unitPriceCents: row.unit_price_cents,
    quantity: row.quantity,
    lineTotalCents: row.line_total_cents,
  };
}

function mapOrder(row, items) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    subtotalCents: row.subtotal_cents,
    deliveryFeeCents: row.delivery_fee_cents,
    totalCents: row.total_cents,
    paymentMethod: row.payment_method,
    paymentProvider: row.payment_provider,
    paymentReference: row.payment_reference,
    paymentStatus: row.payment_status,
    deliveryAddress: row.delivery_address,
    notes: row.notes,
    etaMinutes: row.eta_minutes,
    weather: row.weather,
    location:
      row.latitude !== null && row.longitude !== null
        ? { lat: row.latitude, lon: row.longitude }
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.user_name
      ? { user: { id: row.user_id, name: row.user_name, email: row.user_email } }
      : {}),
    items,
  };
}

const orderRepository = {
  /**
   * Crea el pedido y descuenta stock dentro de una única transacción.
   * Si algún producto se queda sin existencias, toda la operación se revierte.
   */
  create(data) {
    const db = getDb();

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        user_id, status, subtotal_cents, delivery_fee_cents, total_cents,
        payment_method, payment_provider, payment_reference, payment_status,
        delivery_address, notes, eta_minutes, weather, latitude, longitude
      ) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_name, product_image,
        unit_price_cents, quantity, line_total_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const decrementStock = db.prepare(`
      UPDATE products
      SET stock = stock - ?
      WHERE id = ? AND active = 1 AND stock >= ?
    `);

    const transaction = db.transaction((payload) => {
      const info = insertOrder.run(
        payload.userId,
        payload.subtotalCents,
        payload.deliveryFeeCents,
        payload.totalCents,
        payload.paymentMethod,
        payload.paymentProvider ?? null,
        payload.paymentReference ?? null,
        payload.paymentStatus ?? 'pending',
        payload.deliveryAddress,
        payload.notes ?? null,
        payload.etaMinutes ?? null,
        payload.weather ?? null,
        payload.latitude ?? null,
        payload.longitude ?? null
      );

      const orderId = Number(info.lastInsertRowid);

      for (const item of payload.items) {
        const result = decrementStock.run(item.quantity, item.productId, item.quantity);
        if (result.changes === 0) {
          throw new ApiError(
            `Stock insuficiente para "${item.name}"`,
            409,
            'INSUFFICIENT_STOCK'
          );
        }

        insertItem.run(
          orderId,
          item.productId,
          item.name,
          item.image ?? null,
          item.unitPriceCents,
          item.quantity,
          item.lineTotalCents
        );
      }

      return orderId;
    });

    const orderId = transaction(data);
    return this.findById(orderId);
  },

  updatePayment(orderId, { status, paymentStatus, provider = null, reference = null }) {
    getDb()
      .prepare(
        `UPDATE orders
         SET status = ?, payment_status = ?, payment_provider = ?,
             payment_reference = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(status, paymentStatus, provider, reference, orderId);

    return this.findById(orderId);
  },

  /**
   * Cancela un pedido y devuelve las unidades reservadas al inventario.
   */
  cancel(orderId) {
    const db = getDb();
    const order = this.findById(orderId);
    if (!order) throw ApiError.notFound('Pedido no encontrado');
    if (order.status === 'cancelled') return order;

    const restoreStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');

    const transaction = db.transaction(() => {
      for (const item of order.items) {
        restoreStock.run(item.quantity, item.productId);
      }
      db.prepare(
        `UPDATE orders
         SET status = 'cancelled',
             payment_status = CASE WHEN payment_status = 'paid' THEN payment_status ELSE 'failed' END,
             updated_at = datetime('now')
         WHERE id = ?`
      ).run(orderId);
    });

    transaction();
    return this.findById(orderId);
  },

  findById(orderId) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!row) return null;
    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
      .all(orderId)
      .map(mapItem);
    return mapOrder(row, items);
  },

  findByUser(userId) {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
      .all(userId);
    const itemsStatement = db.prepare(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC'
    );
    return rows.map((row) => mapOrder(row, itemsStatement.all(row.id).map(mapItem)));
  },

  findAll({ limit = 100 } = {}) {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT o.*, u.name AS user_name, u.email AS user_email
         FROM orders o
         JOIN users u ON u.id = o.user_id
         ORDER BY o.id DESC
         LIMIT ?`
      )
      .all(limit);
    const itemsStatement = db.prepare(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC'
    );
    return rows.map((row) => mapOrder(row, itemsStatement.all(row.id).map(mapItem)));
  },
};

module.exports = { orderRepository, mapOrder, mapItem };
