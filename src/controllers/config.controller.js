'use strict';

const env = require('../config/env');

function getConfig(_req, res) {
  res.json({
    success: true,
    data: {
      currency: env.stripeCurrency.toUpperCase(),
      delivery: {
        baseFeeCents: env.delivery.baseFeeCents,
        freeFromCents: env.delivery.freeFromCents,
        baseEtaMinutes: env.delivery.baseEtaMinutes,
      },
      payment: {
        provider: env.paymentProvider,
        stripeEnabled: Boolean(env.stripeSecretKey),
      },
      weather: {
        openWeatherEnabled: Boolean(env.openWeatherApiKey),
      },
    },
  });
}

module.exports = { getConfig };
