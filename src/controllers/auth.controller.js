'use strict';

const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  res.status(201).json({ success: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.json({ success: true, data });
});

function me(req, res) {
  res.json({ success: true, data: { user: authService.getProfile(req.user.id) } });
}

module.exports = { register, login, me };
