(function () {
  'use strict';

  window.FoodExpress = window.FoodExpress || {};

  const STORAGE_KEY = 'foodexpress.cart.v1';

  function emit(items) {
    window.dispatchEvent(
      new CustomEvent('cart:updated', {
        detail: {
          items,
          count: items.reduce((sum, item) => sum + item.quantity, 0),
          subtotalCents: items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
        },
      })
    );
  }

  function read() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && Number.isInteger(Number(item.id)))
        .map((item) => ({
          id: Number(item.id),
          name: String(item.name || ''),
          priceCents: Number(item.priceCents || 0),
          image: String(item.image || '🍽️'),
          stock: Number(item.stock || 0),
          quantity: Math.max(1, Math.min(20, Number(item.quantity) || 1)),
        }));
    } catch {
      return [];
    }
  }

  function write(items) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    emit(items);
  }

  function items() {
    return read();
  }

  function add(product, quantity = 1) {
    const current = read();
    const id = Number(product.id);
    const existing = current.find((item) => item.id === id);
    const stock = Number(product.stock ?? existing?.stock ?? 99);
    const nextQuantity = (existing?.quantity || 0) + Number(quantity);

    if (nextQuantity > stock) {
      const error = new Error(`Solo quedan ${stock} unidades de ${product.name}`);
      error.code = 'INSUFFICIENT_STOCK';
      throw error;
    }

    if (existing) {
      existing.quantity = nextQuantity;
      existing.stock = stock;
    } else {
      current.push({
        id,
        name: String(product.name),
        priceCents: Number(product.priceCents),
        image: String(product.image || '🍽️'),
        stock,
        quantity: Number(quantity),
      });
    }

    write(current);
    return read();
  }

  function setQuantity(id, quantity) {
    const current = read();
    const item = current.find((entry) => entry.id === Number(id));
    if (!item) return current;

    if (quantity <= 0) {
      return remove(id);
    }

    item.quantity = Math.min(Number(quantity), item.stock || 20);
    write(current);
    return read();
  }

  function remove(id) {
    const next = read().filter((item) => item.id !== Number(id));
    write(next);
    return next;
  }

  function clear() {
    write([]);
  }

  function count() {
    return read().reduce((sum, item) => sum + item.quantity, 0);
  }

  function subtotalCents() {
    return read().reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  }

  window.FoodExpress.cart = {
    items,
    add,
    setQuantity,
    remove,
    clear,
    count,
    subtotalCents,
  };
})();
