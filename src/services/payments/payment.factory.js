'use strict';

const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const MockPaymentProvider = require('./mock.provider');
const StripePaymentProvider = require('./stripe.provider');

const providers = {
  mock: MockPaymentProvider,
  stripe: StripePaymentProvider,
};

/**
 * Factory Pattern: el servicio de pedidos pide un proveedor por nombre y
 * desconoce los detalles de implementación de cada pasarela.
 */
function createPaymentProvider(name = env.paymentProvider) {
  const Provider = providers[name];
  if (!Provider) {
    throw new ApiError(
      `Proveedor de pago no soportado: "${name}". Valores válidos: ${Object.keys(providers).join(', ')}`,
      400,
      'UNSUPPORTED_PAYMENT_PROVIDER'
    );
  }
  return new Provider();
}

module.exports = { createPaymentProvider, providers };
