'use strict';

const { body, param } = require('express-validator');
const { sanitizeText } = require('../utils/sanitizeText');

const createOrderValidator = [
  body('items')
    .isArray({ min: 1, max: 30 })
    .withMessage('El pedido debe incluir entre 1 y 30 productos'),

  body('items.*.productId')
    .exists()
    .withMessage('Cada producto debe incluir productId')
    .isInt({ min: 1 })
    .withMessage('productId debe ser un entero positivo')
    .toInt(),

  body('items.*.quantity')
    .exists()
    .withMessage('Cada producto debe incluir quantity')
    .isInt({ min: 1, max: 20 })
    .withMessage('La cantidad por producto debe estar entre 1 y 20')
    .toInt(),

  body('deliveryAddress')
    .customSanitizer(sanitizeText)
    .isLength({ min: 10, max: 250 })
    .withMessage('La dirección de entrega debe tener entre 10 y 250 caracteres'),

  body('paymentMethod')
    .isIn(['card', 'cash'])
    .withMessage('El método de pago debe ser "card" o "cash"'),

  body('notes')
    .optional({ values: 'falsy' })
    .customSanitizer(sanitizeText)
    .isLength({ max: 300 })
    .withMessage('Las notas no deben superar 300 caracteres'),

  body('location')
    .optional({ values: 'falsy' })
    .custom((value) => {
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('La ubicación debe ser un objeto con latitud y longitud');
      }
      const { lat, lon } = value;
      if (typeof lat !== 'number' || typeof lon !== 'number') {
        throw new Error('La ubicación debe incluir lat y lon numéricos');
      }
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Las coordenadas de la ubicación están fuera de rango');
      }
      return true;
    }),
];

const orderIdValidator = [param('id').isInt({ min: 1 }).withMessage('id inválido').toInt()];

module.exports = { createOrderValidator, orderIdValidator };
