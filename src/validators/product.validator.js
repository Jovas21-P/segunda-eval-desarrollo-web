'use strict';

const { query } = require('express-validator');
const { sanitizeText } = require('../utils/sanitizeText');

const listProductsValidator = [
  query('category')
    .optional({ values: 'falsy' })
    .customSanitizer(sanitizeText)
    .isLength({ max: 50 })
    .withMessage('La categoría no es válida'),

  query('search')
    .optional({ values: 'falsy' })
    .customSanitizer(sanitizeText)
    .isLength({ max: 100 })
    .withMessage('El término de búsqueda no debe superar 100 caracteres'),

  query('limit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 100 })
    .withMessage('limit debe estar entre 1 y 100')
    .toInt(),
];

const deliveryEstimateValidator = [
  query('lat')
    .exists()
    .withMessage('lat es obligatorio')
    .isFloat({ min: -90, max: 90 })
    .withMessage('lat debe estar entre -90 y 90')
    .toFloat(),

  query('lon')
    .exists()
    .withMessage('lon es obligatorio')
    .isFloat({ min: -180, max: 180 })
    .withMessage('lon debe estar entre -180 y 180')
    .toFloat(),
];

module.exports = { listProductsValidator, deliveryEstimateValidator };
