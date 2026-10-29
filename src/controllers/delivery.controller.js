'use strict';

const weatherService = require('../services/weather.service');
const asyncHandler = require('../utils/asyncHandler');

const estimate = asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;
  const data = await weatherService.getDeliveryEstimate({ lat, lon });
  res.json({ success: true, data });
});

module.exports = { estimate };
