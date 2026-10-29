'use strict';

const { productRepository } = require('../repositories/product.repository');
const { toPublicProduct } = require('../utils/serializers');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const list = asyncHandler(async (req, res) => {
  const { category, search, limit } = req.query;

  const products = productRepository.findAll({
    category: category || null,
    search: search || null,
    limit: limit || 100,
  });

  res.json({
    success: true,
    data: {
      products: products.map(toPublicProduct),
      total: products.length,
      categories: productRepository.categories(),
    },
  });
});

const categories = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { categories: productRepository.categories() } });
});

const detail = asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId < 1) {
    throw ApiError.badRequest('El id del producto no es válido', 'INVALID_PRODUCT_ID');
  }

  const product = productRepository.findById(productId);
  if (!product || !product.active) {
    throw ApiError.notFound('Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }

  res.json({ success: true, data: { product: toPublicProduct(product) } });
});

module.exports = { list, categories, detail };
