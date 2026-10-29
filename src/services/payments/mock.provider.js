'use strict';

const { randomUUID } = require('node:crypto');

/**
 * Proveedor de pagos simulado. Permite probar el flujo completo sin claves
 * reales de Stripe: aprueba el pago de inmediato y devuelve una referencia.
 */
class MockPaymentProvider {
  constructor() {
    this.name = 'mock';
  }

  async createPayment({ amountCents, currency, description, metadata }) {
    return {
      provider: this.name,
      reference: `mock_pi_${randomUUID()}`,
      status: 'paid',
      currency,
      amountCents,
      description,
      metadata,
      clientSecret: null,
    };
  }
}

module.exports = MockPaymentProvider;
