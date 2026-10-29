'use strict';

const userRepository = require('../repositories/user.repository');
const { verifyToken } = require('../utils/jwt');
const { toPublicUser } = require('../utils/serializers');
const ApiError = require('../utils/ApiError');

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Middleware de autenticación: valida el JWT y vuelve a consultar al usuario
 * en la base de datos (permite revocar cuentas y reflejar cambios de rol).
 */
function authenticate(req, _res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return next(
      new ApiError('Debes iniciar sesión para realizar esta acción', 401, 'AUTH_REQUIRED')
    );
  }

  try {
    const payload = verifyToken(token);
    const user = userRepository.findById(Number(payload.sub));

    if (!user) {
      return next(new ApiError('La sesión ya no es válida', 401, 'AUTH_INVALID'));
    }

    req.user = toPublicUser(user);
    return next();
  } catch (error) {
    return next(
      new ApiError('Token inválido o expirado', 401, 'AUTH_INVALID_TOKEN')
    );
  }
}

/**
 * Middleware de autorización basado en roles.
 */
function authorize(...roles) {
  return function authorizeRole(req, _res, next) {
    if (!req.user) {
      return next(new ApiError('No autenticado', 401, 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('No tienes permisos para acceder a este recurso', 403, 'FORBIDDEN')
      );
    }

    return next();
  };
}

module.exports = { authenticate, authorize };
