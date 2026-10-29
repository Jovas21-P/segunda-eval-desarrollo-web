'use strict';

const orderService = require('../services/order.service');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

const history = asyncHandler(async (req, res) => {
  const orders = orderService.listUserOrders(req.user.id);
  res.json({ success: true, data: { orders, total: orders.length } });
});

const detail = asyncHandler(async (req, res) => {
  const order = orderService.getOrderForUser(req.params.id, req.user);
  res.json({ success: true, data: { order } });
});

const listAll = asyncHandler(async (req, res) => {
  const orders = orderService.listAllOrders(Number(req.query.limit) || 100);
  res.json({ success: true, data: { orders, total: orders.length } });
});

module.exports = { create, history, detail, listAll };
