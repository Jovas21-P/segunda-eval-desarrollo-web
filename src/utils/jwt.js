'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      issuer: env.jwtIssuer,
    }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { issuer: env.jwtIssuer });
}

module.exports = { signToken, verifyToken };
