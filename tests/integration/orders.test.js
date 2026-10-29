'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const { registerUser, loginAdmin, getProducts, reset } = require('../helpers');

const app = createApp();

const ADDRESS = 'Av. Reforma 123, Col. Centro, CDMX';

async function getProductByName(name) {
  const products = await getProducts(app);
  return products.find((product) => product.name === name);
}

function placeOrder(token, payload) {
  return request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

describe('API de pedidos', () => {
  beforeEach(reset);

  test('crea un pedido pagado con tarjeta, calcula totales y descuenta stock', async () => {
    const { token } = await registerUser(app);
    const product = await getProductByName('Bruschetta Caprese');

    const response = await placeOrder(token, {
      items: [
        { productId: product.id, quantity: 1 },
        { productId: product.id, quantity: 1 },
      ],
      deliveryAddress: ADDRESS,
      paymentMethod: 'card',
      location: { lat: 19.4326, lon: -99.1332 },
    });

    expect(response.status).toBe(201);
    expect(response.body.data.payment).toMatchObject({ provider: 'mock', status: 'paid' });

    const { order } = response.body.data;
    expect(order.status).toBe('confirmed');
    expect(order.paymentStatus).toBe('paid');
    expect(order.paymentProvider).toBe('mock');
    expect(order.paymentReference).toMatch(/^mock_pi_/);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({ quantity: 2, unitPriceCents: 8900 });
    expect(order.subtotalCents).toBe(17800);
    expect(order.deliveryFeeCents).toBe(3500);
    expect(order.totalCents).toBe(21300);
    expect(order.etaMinutes).toBeGreaterThanOrEqual(10);
    expect(order.weather).toContain('°C');

    const after = await getProductByName('Bruschetta Caprese');
    expect(after.stock).toBe(product.stock - 2);
  });

  test('aplica envío gratis al superar el umbral', async () => {
    const { token } = await registerUser(app);
    const product = await getProductByName('Burger FoodExpress');

    const response = await placeOrder(token, {
      items: [{ productId: product.id, quantity: 2 }],
      deliveryAddress: ADDRESS,
      paymentMethod: 'card',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.order.subtotalCents).toBe(31800);
    expect(response.body.data.order.deliveryFeeCents).toBe(0);
    expect(response.body.data.order.totalCents).toBe(31800);
  });

  test('registra pago en efectivo como pendiente', async () => {
    const { token } = await registerUser(app);
    const product = await getProductByName('Agua de Horchata');

    const response = await placeOrder(token, {
      items: [{ productId: product.id, quantity: 1 }],
      deliveryAddress: ADDRESS,
      paymentMethod: 'cash',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.order.status).toBe('confirmed');
    expect(response.body.data.order.paymentStatus).toBe('pending');
    expect(response.body.data.order.paymentProvider).toBe('cash');
    expect(response.body.data.payment.status).toBe('pending');
  });

  test('rechaza pedidos sin JWT', async () => {
    const product = await getProductByName('Nachos Supreme');
    const response = await request(app).post('/api/v1/orders').send({
      items: [{ productId: product.id, quantity: 1 }],
      deliveryAddress: ADDRESS,
      paymentMethod: 'card',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
  });

  test('rechaza stock insuficiente y no modifica el inventario', async () => {
    const { token } = await registerUser(app);
    const product = await getProductByName('Salmón a la Parrilla');

    const response = await placeOrder(token, {
      items: [{ productId: product.id, quantity: 20 }],
      deliveryAddress: ADDRESS,
      paymentMethod: 'card',
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');

    const after = await getProductByName('Salmón a la Parrilla');
    expect(after.stock).toBe(product.stock);

    const history = await request(app)
      .get('/api/v1/orders/user')
      .set('Authorization', `Bearer ${token}`);
    expect(history.body.data.orders).toHaveLength(0);
  });

  test('valida el cuerpo del pedido', async () => {
    const { token } = await registerUser(app);
    const product = await getProductByName('Brownie con Helado');

    const shortAddress = await placeOrder(token, {
      items: [{ productId: product.id, quantity: 1 }],
      deliveryAddress: 'Casa',
      paymentMethod: 'card',
    });
    const emptyItems = await placeOrder(token, {
      items: [],
      deliveryAddress: ADDRESS,
      paymentMethod: 'card',
    });
    const badQuantity = await placeOrder(token, {
      items: [{ productId: product.id, quantity: 0 }],
      deliveryAddress: ADDRESS,
      paymentMethod: 'card',
    });

    expect(shortAddress.status).toBe(400);
    expect(emptyItems.status).toBe(400);
    expect(badQuantity.status).toBe(400);
    expect(shortAddress.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('devuelve el historial del usuario autenticado', async () => {
    const { token } = await registerUser(app);
    const product = await getProductByName('Cold Brew de la Casa');

    const created = await placeOrder(token, {
      items: [{ productId: product.id, quantity: 2 }],
      deliveryAddress: ADDRESS,
      paymentMethod: 'card',
    });

    const response = await request(app)
      .get('/api/v1/orders/user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(1);
    expect(response.body.data.orders[0].id).toBe(created.body.data.order.id);
    expect(response.body.data.orders[0].items).toHaveLength(1);
  });

  test('impide que un usuario vea el pedido de otro', async () => {
    const owner = await registerUser(app);
    const stranger = await registerUser(app, { email: 'stranger@foodexpress.test' });
    const product = await getProductByName('Cheesecake de Maracuyá');

    const created = await placeOrder(owner.token, {
      items: [{ productId: product.id, quantity: 1 }],
      deliveryAddress: ADDRESS,
      paymentMethod: 'card',
    });
    const orderId = created.body.data.order.id;

    const own = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${owner.token}`);
    const forbidden = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${stranger.token}`);

    expect(own.status).toBe(200);
    expect(forbidden.status).toBe(404);
    expect(forbidden.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  test('reserva el listado global de pedidos para administradores', async () => {
    const customer = await registerUser(app);
    const product = await getProductByName('Pasta Alfredo con Pollo');
    await placeOrder(customer.token, {
      items: [{ productId: product.id, quantity: 1 }],
      deliveryAddress: ADDRESS,
      paymentMethod: 'card',
    });

    const forbidden = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${customer.token}`);

    const admin = await loginAdmin(app);
    const allowed = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.orders).toHaveLength(1);
    expect(allowed.body.data.orders[0].user.email).toBe(customer.payload.email);
  });
});
