'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const { reset } = require('../helpers');

const app = createApp();

describe('API de productos y servicios externos', () => {
  beforeEach(reset);

  test('lista el catálogo público con categorías', async () => {
    const response = await request(app).get('/api/v1/products');

    expect(response.status).toBe(200);
    expect(response.body.data.products).toHaveLength(13);
    expect(response.body.data.total).toBe(13);
    expect(response.body.data.categories).toEqual(
      expect.arrayContaining(['Entradas', 'Platos fuertes', 'Postres', 'Bebidas'])
    );
    expect(response.body.data.products[0]).not.toHaveProperty('active');
  });

  test('filtra por categoría', async () => {
    const response = await request(app).get('/api/v1/products').query({ category: 'Postres' });

    expect(response.status).toBe(200);
    expect(response.body.data.products).toHaveLength(2);
    response.body.data.products.forEach((product) => {
      expect(product.category).toBe('Postres');
    });
  });

  test('busca productos por nombre o descripción', async () => {
    const response = await request(app).get('/api/v1/products').query({ search: 'pizza' });

    expect(response.status).toBe(200);
    expect(response.body.data.products).toHaveLength(1);
    expect(response.body.data.products[0].name).toMatch(/Pizza/i);
  });

  test('obtiene el detalle de un producto y responde 404 si no existe', async () => {
    const detail = await request(app).get('/api/v1/products/1');
    const missing = await request(app).get('/api/v1/products/9999');

    expect(detail.status).toBe(200);
    expect(detail.body.data.product.id).toBe(1);
    expect(detail.body.data.product.priceCents).toBeGreaterThan(0);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  test('expone la configuración pública de entrega y pagos', async () => {
    const response = await request(app).get('/api/v1/config');

    expect(response.status).toBe(200);
    expect(response.body.data.payment.provider).toBe('mock');
    expect(response.body.data.delivery.baseFeeCents).toBe(3500);
    expect(response.body.data.delivery.freeFromCents).toBe(30000);
  });

  test('valida las coordenadas del cálculo de entrega', async () => {
    const invalid = await request(app).get('/api/v1/delivery/estimate');
    const valid = await request(app)
      .get('/api/v1/delivery/estimate')
      .query({ lat: 19.4326, lon: -99.1332 });

    expect(invalid.status).toBe(400);
    expect(valid.status).toBe(200);
    expect(valid.body.data.etaMinutes).toBeGreaterThanOrEqual(10);
    expect(valid.body.data.weather).toMatchObject({ source: 'simulated' });
    expect(valid.body.data.origin).toEqual({ lat: 19.4326, lon: -99.1332 });
  });
});
