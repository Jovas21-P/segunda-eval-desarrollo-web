'use strict';

const { createPaymentProvider } = require('../../src/services/payments/payment.factory');
const { mergeItems } = require('../../src/services/order.service');

describe('Payment Factory', () => {
  test('crea el proveedor mock y aprueba el pago', async () => {
    const provider = createPaymentProvider('mock');
    const payment = await provider.createPayment({
      amountCents: 15900,
      currency: 'mxn',
      description: 'Pedido de prueba',
      metadata: { orderId: '1' },
    });

    expect(provider.name).toBe('mock');
    expect(payment.provider).toBe('mock');
    expect(payment.status).toBe('paid');
    expect(payment.amountCents).toBe(15900);
    expect(payment.reference).toMatch(/^mock_pi_/);
  });

  test('rechaza proveedores desconocidos', () => {
    expect(() => createPaymentProvider('paypal-inexistente')).toThrow(
      /Proveedor de pago no soportado/
    );
  });

  test('Stripe falla de forma controlada si no hay clave configurada', async () => {
    const provider = createPaymentProvider('stripe');

    await expect(
      provider.createPayment({
        amountCents: 1000,
        currency: 'mxn',
        description: 'Sin clave',
        metadata: {},
      })
    ).rejects.toMatchObject({
      statusCode: 503,
      code: 'PAYMENT_PROVIDER_UNAVAILABLE',
    });
  });
});

describe('Order service helpers', () => {
  test('mergeItems agrupa productos repetidos', () => {
    expect(
      mergeItems([
        { productId: 3, quantity: 2 },
        { productId: '3', quantity: 4 },
        { productId: 5, quantity: 1 },
      ])
    ).toEqual([
      { productId: 3, quantity: 6 },
      { productId: 5, quantity: 1 },
    ]);
  });
});
