'use strict';

/**
 * Calcula los importes del pedido en el servidor. Nunca se confía en los
 * precios enviados por el cliente: solo se usan los de la base de datos.
 */
function calculateTotals(items, { baseDeliveryFeeCents = 3500, freeFromCents = 30000 } = {}) {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );

  const deliveryFeeCents =
    subtotalCents === 0 || subtotalCents >= freeFromCents ? 0 : baseDeliveryFeeCents;

  return {
    subtotalCents,
    deliveryFeeCents,
    totalCents: subtotalCents + deliveryFeeCents,
  };
}

module.exports = { calculateTotals };
