'use strict';

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function toPublicProduct(product) {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    priceCents: product.priceCents,
    image: product.image,
    stock: product.stock,
    featured: product.featured,
  };
}

module.exports = { toPublicUser, toPublicProduct };
