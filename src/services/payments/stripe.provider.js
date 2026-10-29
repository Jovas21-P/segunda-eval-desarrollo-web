'use strict';

const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

const STRIPE_API_URL = 'https://api.stripe.com/v1/payment_intents';

function mapStripeStatus(stripeStatus) {
  if (stripeStatus === 'succeeded') return 'paid';
  if (stripeStatus === 'canceled') return 'failed';
  return 'pending';
}

/**
 * Integración con Stripe Payment Intents mediante la API REST oficial.
 * Si no hay clave configurada se lanza un error controlado y el pedido
 * se cancela, devolviendo el stock reservado.
 */
class StripePaymentProvider {
  constructor() {
    this.name = 'stripe';
  }

  async createPayment({ amountCents, currency, description, metadata }) {
    if (!env.stripeSecretKey) {
      throw new ApiError(
        'Stripe no está configurado. Define STRIPE_SECRET_KEY o usa PAYMENT_PROVIDER=mock.',
        503,
        'PAYMENT_PROVIDER_UNAVAILABLE'
      );
    }

    const body = new URLSearchParams({
      amount: String(amountCents),
      currency,
      description,
      'automatic_payment_methods[enabled]': 'true',
    });

    for (const [key, value] of Object.entries(metadata || {})) {
      body.append(`metadata[${key}]`, String(value));
    }

    let response;
    try {
      response = await fetch(STRIPE_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': `foodexpress-order-${metadata?.orderId || Date.now()}`,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new ApiError(
        'No fue posible contactar a la pasarela de pagos',
        502,
        'PAYMENT_GATEWAY_ERROR'
      );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'La pasarela de pagos rechazó la operación',
        502,
        'PAYMENT_REJECTED'
      );
    }

    return {
      provider: this.name,
      reference: data.id,
      status: mapStripeStatus(data.status),
      rawStatus: data.status,
      clientSecret: data.client_secret || null,
      amountCents,
      currency,
    };
  }
}

module.exports = StripePaymentProvider;
