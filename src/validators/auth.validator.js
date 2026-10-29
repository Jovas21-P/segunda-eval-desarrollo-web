'use strict';

const { body } = require('express-validator');
const { sanitizeText } = require('../utils/sanitizeText');

const registerValidator = [
  body('name')
    .customSanitizer(sanitizeText)
    .isLength({ min: 2, max: 80 })
    .withMessage('El nombre debe tener entre 2 y 80 caracteres'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('El correo electrónico no es válido')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('La contraseña debe ser texto')
    .isLength({ min: 8, max: 72 })
    .withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[A-Za-z]/)
    .withMessage('La contraseña debe incluir al menos una letra')
    .matches(/\d/)
    .withMessage('La contraseña debe incluir al menos un número'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('El teléfono no debe superar 20 caracteres')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('El teléfono contiene caracteres no válidos'),

  body('address')
    .optional({ values: 'falsy' })
    .customSanitizer(sanitizeText)
    .isLength({ max: 200 })
    .withMessage('La dirección no debe superar 200 caracteres'),
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('El correo electrónico no es válido')
    .normalizeEmail(),

  body('password')
    .isString()
    .withMessage('La contraseña es obligatoria')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
];

module.exports = { registerValidator, loginValidator };
