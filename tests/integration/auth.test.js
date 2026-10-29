'use strict';

const request = require('supertest');
const createApp = require('../../src/app');
const { registerUser, loginAdmin, reset } = require('../helpers');

const app = createApp();

describe('API de autenticación', () => {
  beforeEach(reset);

  test('registra un usuario y devuelve un JWT sin exponer el hash', async () => {
    const { response, payload } = await registerUser(app);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toMatchObject({
      name: payload.name,
      email: payload.email,
      role: 'customer',
    });
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    expect(response.body.data.user).not.toHaveProperty('password_hash');
    expect(response.body.data.token.split('.')).toHaveLength(3);
  });

  test('rechaza un correo duplicado con 409', async () => {
    const { payload } = await registerUser(app);
    const response = await request(app).post('/api/v1/auth/register').send(payload);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_IN_USE');
  });

  test('valida los datos de registro', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'no-es-correo', password: '123' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(response.body.error.details)).toBe(true);
    const fields = response.body.error.details.map((detail) => detail.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  test('inicia sesión con credenciales válidas', async () => {
    const { payload } = await registerUser(app);
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(payload.email);
    expect(response.body.data.token).toEqual(expect.any(String));
  });

  test('rechaza credenciales incorrectas sin revelar si el correo existe', async () => {
    const { payload } = await registerUser(app);
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: 'WrongPassword123' });
    const unknownUser = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nadie@foodexpress.test', password: 'WrongPassword123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownUser.body.error.message);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('protege /auth/me con JWT', async () => {
    const { token, payload } = await registerUser(app);

    const authorized = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    const unauthorized = await request(app).get('/api/v1/auth/me');
    const invalid = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer token.invalido.aqui');

    expect(authorized.status).toBe(200);
    expect(authorized.body.data.user.email).toBe(payload.email);
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body.error.code).toBe('AUTH_REQUIRED');
    expect(invalid.status).toBe(401);
    expect(invalid.body.error.code).toBe('AUTH_INVALID_TOKEN');
  });

  test('permite iniciar sesión con el administrador semilla', async () => {
    const { response, user } = await loginAdmin(app);

    expect(response.status).toBe(200);
    expect(user.role).toBe('admin');
    expect(user.email).toBe('admin@foodexpress.com');
  });
});
