'use strict';

const express = require('express');
const orderController = require('../controllers/order.controller');
const { createOrderValidator, orderIdValidator } = require('../validators/order.validator');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createOrderValidator, validate, orderController.create);
router.get('/user', orderController.history);
router.get('/', authorize('admin'), orderController.listAll);
router.get('/:id', orderIdValidator, validate, orderController.detail);

module.exports = router;
