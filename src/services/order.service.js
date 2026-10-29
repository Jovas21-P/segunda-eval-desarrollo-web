'use strict';

const env = require('../config/env');
const { orderRepository } = require('../repositories/order.repository');
const { productRepository } = require('../repositories/product.repository');
const { calculateTotals } = require('../utils/pricing');
const { createPaymentProvider } = require('./payments/payment.factory');
const weatherService = require('./weather.service');
const ApiError = require('../utils/ApiError');

function mergeItems(items) {
  const merged = new Map();
  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }
  return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

function buildLineItems(items) {
  const products = productRepository.findByIds(items.map((item) => item.productId));
  const productMap = new Map(products.map((product) => [product.id, product]));

  return items.map(({ productId, quantity }) => {
    const product = productMap.get(productId);
    if (!product) {
      throw ApiError.notFound(
        `El producto con id ${productId} no existe o no está disponible`,
        'PRODUCT_NOT_FOUND'
      );
    }

    if (product.stock < quantity) {
      throw ApiError.conflict(
        `Stock insuficiente para "${product.name}" (disponibles: ${product.stock})`,
        'INSUFFICIENT_STOCK'
      );
    }

    return {
      productId,
      name: product.name,
      image: product.image,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
    };
  });
}

async function createOrder(userId, payload) {
  const items = mergeItems(payload.items);
  const lineItems = buildLineItems(items);

  const totals = calculateTotals(lineItems, {
    baseDeliveryFeeCents: env.delivery.baseFeeCents,
    freeFromCents: env.delivery.freeFromCents,
  });

  let estimate = { etaMinutes: env.delivery.baseEtaMinutes, weather: null };
  if (payload.location) {
    estimate = await weatherService.getDeliveryEstimate(payload.location);
  }

  const weatherLabel = estimate.weather
    ? `${estimate.weather.description} · ${Math.round(estimate.weather.temperatureC)}°C`
    : null;

  const order = orderRepository.create({
    userId,
    items: lineItems,
    ...totals,
    paymentMethod: payload.paymentMethod,
    deliveryAddress: payload.deliveryAddress,
    notes: payload.notes || null,
    etaMinutes: estimate.etaMinutes,
    weather: weatherLabel,
    latitude: payload.location?.lat ?? null,
    longitude: payload.location?.lon ?? null,
  });

  if (payload.paymentMethod === 'cash') {
    const confirmed = orderRepository.updatePayment(order.id, {
      status: 'confirmed',
      paymentStatus: 'pending',
      provider: 'cash',
      reference: null,
    });
    return {
      order: confirmed,
      payment: { provider: 'cash', reference: null, status: 'pending', clientSecret: null },
    };
  }

  const provider = createPaymentProvider(env.paymentProvider);

  try {
    const payment = await provider.createPayment({
      amountCents: totals.totalCents,
      currency: env.stripeCurrency,
      description: `Pedido FoodExpress #${order.id}`,
      metadata: { orderId: String(order.id), userId: String(userId) },
    });

    if (payment.status === 'failed') {
      orderRepository.cancel(order.id);
      throw new ApiError('El pago fue rechazado por la pasarela', 402, 'PAYMENT_FAILED');
    }

    const updated = orderRepository.updatePayment(order.id, {
      status: payment.status === 'paid' ? 'confirmed' : 'pending_payment',
      paymentStatus: payment.status,
      provider: payment.provider,
      reference: payment.reference,
    });

    return { order: updated, payment };
  } catch (error) {
    // Si la pasarela falla, se cancela el pedido y se devuelve el stock.
    const current = orderRepository.findById(order.id);
    if (current && current.status !== 'cancelled') {
      orderRepository.cancel(order.id);
    }
    throw error instanceof ApiError
      ? error
      : new ApiError(
          'No se pudo procesar el pago. Intenta nuevamente.',
          502,
          'PAYMENT_FAILED'
        );
  }
}

function listUserOrders(userId) {
  return orderRepository.findByUser(userId);
}

function getOrderForUser(orderId, user) {
  const order = orderRepository.findById(Number(orderId));
  if (!order) throw ApiError.notFound('Pedido no encontrado', 'ORDER_NOT_FOUND');

  const isOwner = order.userId === user.id;
  if (!isOwner && user.role !== 'admin') {
    // Se responde 404 para no filtrar la existencia de pedidos de otros usuarios.
    throw ApiError.notFound('Pedido no encontrado', 'ORDER_NOT_FOUND');
  }

  return order;
}

function listAllOrders(limit = 100) {
  return orderRepository.findAll({ limit });
}

module.exports = {
  createOrder,
  listUserOrders,
  getOrderForUser,
  listAllOrders,
  mergeItems,
  buildLineItems,
};
