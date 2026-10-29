'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Convierte los errores de express-validator en una respuesta 400 uniforme.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return next(new ApiError('Los datos enviados no son válidos', 400, 'VALIDATION_ERROR', details));
}

module.exports = { validate };
