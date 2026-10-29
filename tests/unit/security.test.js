'use strict';

const { hashPassword, verifyPassword } = require('../../src/utils/password');
const { sanitizeText } = require('../../src/utils/sanitizeText');
const { signToken, verifyToken } = require('../../src/utils/jwt');

describe('Utilidades de seguridad', () => {
  test('bcrypt genera un hash distinto a la contraseña original', async () => {
    const password = 'Password123';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword('OtraClave123', hash)).resolves.toBe(false);
  });

  test('sanitizeText elimina etiquetas HTML y caracteres de control', () => {
    expect(sanitizeText('<script>alert("xss")</script> Hamburguesa')).toBe(
      'alert("xss") Hamburguesa'
    );
    expect(sanitizeText('  Calle   5 & 10  ')).toBe('Calle 5 & 10');
    expect(sanitizeText('<b>hola</b>\u0000 mundo')).toBe('hola mundo');
    expect(sanitizeText(123)).toBe(123);
  });

  test('el JWT firmado se puede verificar y contiene el rol', () => {
    const token = signToken({ id: 7, email: 'test@foodexpress.test', role: 'customer' });
    const payload = verifyToken(token);

    expect(payload.sub).toBe('7');
    expect(payload.role).toBe('customer');
    expect(payload.email).toBe('test@foodexpress.test');
  });
});
