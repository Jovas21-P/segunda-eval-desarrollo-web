'use strict';

const userRepository = require('../repositories/user.repository');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { toPublicUser } = require('../utils/serializers');
const ApiError = require('../utils/ApiError');

async function register({ name, email, password, phone, address }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = userRepository.findByEmail(normalizedEmail);
  if (existing) {
    throw ApiError.conflict('Ya existe una cuenta con este correo electrónico', 'EMAIL_IN_USE');
  }

  const passwordHash = await hashPassword(password);
  const user = userRepository.create({
    name,
    email: normalizedEmail,
    passwordHash,
    phone: phone || null,
    address: address || null,
  });

  return {
    user: toPublicUser(user),
    token: signToken(user),
  };
}

async function login({ email, password }) {
  const user = userRepository.findByEmail(email.trim().toLowerCase());
  const passwordIsValid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordIsValid) {
    throw new ApiError('Correo o contraseña incorrectos', 401, 'INVALID_CREDENTIALS');
  }

  return {
    user: toPublicUser(user),
    token: signToken(user),
  };
}

function getProfile(userId) {
  const user = userRepository.findById(userId);
  if (!user) throw ApiError.notFound('Usuario no encontrado', 'USER_NOT_FOUND');
  return toPublicUser(user);
}

module.exports = { register, login, getProfile };
