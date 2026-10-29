'use strict';

const express = require('express');
const productController = require('../controllers/product.controller');
const { listProductsValidator } = require('../validators/product.validator');
const { validate } = require('../middlewares/validate.middleware');

const router = express.Router();

router.get('/', listProductsValidator, validate, productController.list);
router.get('/categories', productController.categories);
router.get('/:id', productController.detail);

module.exports = router;
