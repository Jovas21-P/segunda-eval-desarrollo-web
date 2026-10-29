'use strict';

const bcrypt = require('bcryptjs');
const env = require('../config/env');

const PRODUCTS = [
  {
    name: 'Bruschetta Caprese',
    description: 'Pan artesanal tostado con tomate cherry, mozzarella fresca, albahaca y aceite de oliva.',
    category: 'Entradas',
    priceCents: 8900,
    image: '🍅',
    stock: 30,
    featured: 1,
  },
  {
    name: 'Alitas BBQ Ahumadas',
    description: 'Alitas crujientes bañadas en salsa BBQ de la casa, acompañadas de aderezo ranch.',
    category: 'Entradas',
    priceCents: 11900,
    image: '🍗',
    stock: 40,
    featured: 0,
  },
  {
    name: 'Nachos Supreme',
    description: 'Totopos de maíz con queso fundido, frijoles, pico de gallo, jalapeños y crema.',
    category: 'Entradas',
    priceCents: 10900,
    image: '🌮',
    stock: 35,
    featured: 0,
  },
  {
    name: 'Burger FoodExpress',
    description: 'Doble carne angus, queso cheddar, tocino, cebolla caramelizada y salsa secreta.',
    category: 'Platos fuertes',
    priceCents: 15900,
    image: '🍔',
    stock: 25,
    featured: 1,
  },
  {
    name: 'Pizza Pepperoni Artesanal',
    description: 'Masa madre, salsa de tomate San Marzano, mozzarella y pepperoni picante.',
    category: 'Platos fuertes',
    priceCents: 18900,
    image: '🍕',
    stock: 20,
    featured: 1,
  },
  {
    name: 'Pasta Alfredo con Pollo',
    description: 'Fettuccine en salsa Alfredo cremosa con pollo a la parrilla y parmesano.',
    category: 'Platos fuertes',
    priceCents: 14900,
    image: '🍝',
    stock: 22,
    featured: 0,
  },
  {
    name: 'Tacos al Pastor (3 pzas)',
    description: 'Tortillas de maíz con cerdo marinado, piña, cilantro, cebolla y salsa verde.',
    category: 'Platos fuertes',
    priceCents: 12900,
    image: '🌯',
    stock: 45,
    featured: 1,
  },
  {
    name: 'Salmón a la Parrilla',
    description: 'Filete de salmón con costra de hierbas, puré de papa y vegetales al vapor.',
    category: 'Platos fuertes',
    priceCents: 22900,
    image: '🐟',
    stock: 15,
    featured: 0,
  },
  {
    name: 'Cheesecake de Maracuyá',
    description: 'Base de galleta, crema de queso y coulis de maracuyá natural.',
    category: 'Postres',
    priceCents: 7900,
    image: '🍰',
    stock: 18,
    featured: 1,
  },
  {
    name: 'Brownie con Helado',
    description: 'Brownie tibio de chocolate belga con helado de vainilla y nuez tostada.',
    category: 'Postres',
    priceCents: 8500,
    image: '🍫',
    stock: 24,
    featured: 0,
  },
  {
    name: 'Limonada de Fresa',
    description: 'Bebida refrescante de fresa natural, limón y un toque de menta. 500 ml.',
    category: 'Bebidas',
    priceCents: 4500,
    image: '🍓',
    stock: 60,
    featured: 0,
  },
  {
    name: 'Cold Brew de la Casa',
    description: 'Café de especialidad extraído en frío durante 18 horas. 350 ml.',
    category: 'Bebidas',
    priceCents: 3900,
    image: '☕',
    stock: 50,
    featured: 0,
  },
  {
    name: 'Agua de Horchata',
    description: 'Horchata tradicional con arroz, canela y un toque de vainilla. 500 ml.',
    category: 'Bebidas',
    priceCents: 3500,
    image: '🥤',
    stock: 55,
    featured: 0,
  },
];

function seedProducts(db) {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get();
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO products (name, description, category, price_cents, image, stock, featured)
    VALUES (@name, @description, @category, @priceCents, @image, @stock, @featured)
  `);

  const insertAll = db.transaction((products) => {
    for (const product of products) insert.run(product);
  });

  insertAll(PRODUCTS);
}

function seedAdmin(db) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(env.admin.email);
  if (existing) return;

  const passwordHash = bcrypt.hashSync(env.admin.password, env.bcryptRounds);
  db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, 'admin')
  `).run(env.admin.name, env.admin.email, passwordHash);
}

function seed(db) {
  seedProducts(db);
  seedAdmin(db);
}

module.exports = { seed, seedProducts, seedAdmin, PRODUCTS };
