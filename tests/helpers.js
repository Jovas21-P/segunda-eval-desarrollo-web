'use strict';

const request = require('supertest');
const { resetDatabase } = require('../src/config/database');

let counter = 0;

function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}.${Date.now()}.${counter}@foodexpress.test`;
}

async function registerUser(app, overrides = {}) {
  const payload = {
    name: 'Usuario Prueba',
    email: uniqueEmail(),
    password: 'Password123',
    ...overrides,
  };

  const response = await request(app).post('/api/v1/auth/register').send(payload);
  return { response, payload, ...(response.body.data || {}) };
}

async function loginAdmin(app) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@foodexpress.com', password: 'Admin123!' });
  return { response, ...(response.body.data || {}) };
}

async function getProducts(app) {
  const response = await request(app).get('/api/v1/products');
  return response.body.data.products;
}

function reset() {
  resetDatabase();
}

module.exports = {
  uniqueEmail,
  registerUser,
  loginAdmin,
  getProducts,
  reset,
};
