'use strict';

const { calculateTotals } = require('../../src/utils/pricing');

describe('calculateTotals', () => {
  test('suma los importes de las líneas del pedido', () => {
    const totals = calculateTotals(
      [
        { unitPriceCents: 8900, quantity: 2 },
        { unitPriceCents: 4500, quantity: 1 },
      ],
      { baseDeliveryFeeCents: 3500, freeFromCents: 30000 }
    );

    expect(totals).toEqual({
      subtotalCents: 22300,
      deliveryFeeCents: 3500,
      totalCents: 25800,
    });
  });

  test('aplica envío gratis cuando se alcanza el umbral', () => {
    const totals = calculateTotals(
      [{ unitPriceCents: 15900, quantity: 2 }],
      { baseDeliveryFeeCents: 3500, freeFromCents: 30000 }
    );

    expect(totals.subtotalCents).toBe(31800);
    expect(totals.deliveryFeeCents).toBe(0);
    expect(totals.totalCents).toBe(31800);
  });

  test('un pedido vacío no cobra envío', () => {
    expect(calculateTotals([])).toEqual({
      subtotalCents: 0,
      deliveryFeeCents: 0,
      totalCents: 0,
    });
  });
});
