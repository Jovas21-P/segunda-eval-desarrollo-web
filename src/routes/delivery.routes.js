'use strict';

const express = require('express');
const deliveryController = require('../controllers/delivery.controller');
const { deliveryEstimateValidator } = require('../validators/product.validator');
const { validate } = require('../middlewares/validate.middleware');

const router = express.Router();

router.get('/estimate', deliveryEstimateValidator, validate, deliveryController.estimate);

module.exports = router;
