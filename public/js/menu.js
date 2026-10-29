(function () {
  'use strict';

  const { api, ui, cart, session } = window.FoodExpress;

  const elements = {
    grid: document.getElementById('product-grid'),
    empty: document.getElementById('empty-menu'),
    filters: document.getElementById('category-filters'),
    search: document.getElementById('search-input'),
    cartPanel: document.getElementById('cart-panel'),
    cartItems: document.getElementById('cart-items'),
    cartFooter: document.getElementById('cart-footer'),
    cartCount: document.getElementById('cart-count-pill'),
    cartSummary: document.getElementById('cart-summary'),
    subtotal: document.getElementById('cart-subtotal'),
    delivery: document.getElementById('cart-delivery'),
    total: document.getElementById('cart-total'),
    freeNote: document.getElementById('free-delivery-note'),
    form: document.getElementById('checkout-form'),
    address: document.getElementById('delivery-address'),
    notes: document.getElementById('order-notes'),
    checkoutBtn: document.getElementById('checkout-btn'),
    checkoutError: document.getElementById('checkout-error'),
    locateBtn: document.getElementById('locate-btn'),
    locationStatus: document.getElementById('location-status'),
    overlay: document.getElementById('cart-overlay'),
    openCart: document.getElementById('open-cart'),
    closeCart: document.getElementById('close-cart'),
    mobileCount: document.getElementById('mobile-cart-count'),
    mobileTotal: document.getElementById('mobile-cart-total'),
    successDialog: document.getElementById('success-dialog'),
    successOrder: document.getElementById('success-order'),
    successTotal: document.getElementById('success-total'),
    successEta: document.getElementById('success-eta'),
    successStatus: document.getElementById('success-status'),
    successSubtitle: document.getElementById('success-subtitle'),
    successClose: document.getElementById('success-close'),
  };

  const state = {
    products: [],
    categories: [],
    category: 'Todos',
    search: '',
    config: {
      delivery: { baseFeeCents: 3500, freeFromCents: 30000, baseEtaMinutes: 25 },
      payment: { provider: 'mock', stripeEnabled: false },
    },
    location: null,
  };

  function filteredProducts() {
    const term = state.search.trim().toLowerCase();
    return state.products.filter((product) => {
      const matchesCategory =
        state.category === 'Todos' || product.category === state.category;
      const matchesSearch =
        !term ||
        `${product.name} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(term);
      return matchesCategory && matchesSearch;
    });
  }

  function renderCategories() {
    const all = ['Todos', ...state.categories];
    elements.filters.innerHTML = all
      .map(
        (category) => `
          <button type="button" data-category="${ui.escapeHtml(category)}"
            class="chip snap-start ${state.category === category ? 'chip-active' : ''}">
            ${ui.escapeHtml(category)}
          </button>
        `
      )
      .join('');
  }

  function productCard(product) {
    const outOfStock = product.stock <= 0;
    const lowStock = product.stock > 0 && product.stock <= 5;

    return `
      <article class="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-brand-500/30">
        <div class="relative grid h-40 place-items-center bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent">
          <span class="text-6xl transition duration-300 group-hover:scale-110">${ui.escapeHtml(product.image)}</span>
          <span class="badge absolute left-3 top-3 border-white/15 bg-ink-950/70 text-[10px] text-slate-300">${ui.escapeHtml(product.category)}</span>
          ${
            outOfStock
              ? '<span class="badge absolute right-3 top-3 border-rose-400/30 bg-rose-500/15 text-[10px] text-rose-300">Agotado</span>'
              : lowStock
                ? `<span class="badge absolute right-3 top-3 border-amber-400/30 bg-amber-400/10 text-[10px] text-amber-300">Quedan ${product.stock}</span>`
                : ''
          }
        </div>

        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-start justify-between gap-3">
            <h3 class="text-sm font-semibold leading-snug text-white">${ui.escapeHtml(product.name)}</h3>
            <span class="shrink-0 text-sm font-bold text-brand-300">${ui.money(product.priceCents)}</span>
          </div>
          <p class="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">${ui.escapeHtml(product.description)}</p>

          <div class="mt-auto flex items-center justify-between gap-3 pt-4">
            <span class="text-[11px] text-slate-500">${product.stock} disponibles</span>
            <button type="button" data-add="${product.id}" ${outOfStock ? 'disabled' : ''}
              class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/15 px-3 py-2 text-xs font-semibold text-brand-300 transition hover:bg-brand-500 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500">
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" d="M12 5v14M5 12h14" />
              </svg>
              ${outOfStock ? 'Agotado' : 'Agregar'}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderProducts() {
    const products = filteredProducts();
    elements.grid.innerHTML = products.map(productCard).join('');
    elements.empty.classList.toggle('hidden', products.length > 0);
  }

  function cartTotals() {
    const items = cart.items();
    const subtotal = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
    const freeFrom = state.config.delivery.freeFromCents;
    const fee = items.length === 0 || subtotal >= freeFrom ? 0 : state.config.delivery.baseFeeCents;
    return { items, subtotal, fee, total: subtotal + fee, freeFrom };
  }

  function cartItemTemplate(item) {
    return `
      <div class="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <span class="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white/5 text-2xl">${ui.escapeHtml(
          item.image
        )}</span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-white">${ui.escapeHtml(item.name)}</p>
          <p class="mt-0.5 text-[11px] text-slate-400">${ui.money(item.priceCents)} c/u</p>
          <div class="mt-2 flex items-center justify-between gap-2">
            <div class="inline-flex items-center overflow-hidden rounded-lg border border-white/10">
              <button type="button" data-action="dec" data-id="${item.id}" class="grid h-7 w-7 place-items-center text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Quitar una unidad de ${ui.escapeHtml(
                item.name
              )}">−</button>
              <span class="w-8 text-center text-xs font-semibold">${item.quantity}</span>
              <button type="button" data-action="inc" data-id="${item.id}" class="grid h-7 w-7 place-items-center text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Agregar una unidad de ${ui.escapeHtml(
                item.name
              )}">+</button>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-white">${ui.money(
                item.priceCents * item.quantity
              )}</span>
              <button type="button" data-action="remove" data-id="${item.id}" class="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300" aria-label="Eliminar ${ui.escapeHtml(
                item.name
              )}">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0 1 15.916 21.75H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCart() {
    const { items, subtotal, fee, total, freeFrom } = cartTotals();
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    elements.cartCount.textContent = String(count);
    elements.cartSummary.textContent =
      count === 0 ? 'Agrega platillos para comenzar.' : `${count} artículo${count === 1 ? '' : 's'} en tu pedido`;
    elements.mobileCount.textContent = String(count);
    elements.mobileTotal.textContent = ui.money(total);

    if (items.length === 0) {
      elements.cartItems.innerHTML = `
        <div class="grid h-full place-items-center text-center">
          <div>
            <p class="text-4xl">🛒</p>
            <p class="mt-3 text-sm font-medium text-slate-300">Tu carrito está vacío</p>
            <p class="mt-1 text-xs text-slate-500">Explora el menú y agrega tu primer platillo.</p>
          </div>
        </div>
      `;
      elements.cartFooter.classList.add('hidden');
      elements.openCart.classList.add('hidden');
      ui.updateCartBadge();
      return;
    }

    elements.cartItems.innerHTML = items.map(cartItemTemplate).join('');
    elements.cartFooter.classList.remove('hidden');
    elements.openCart.classList.remove('hidden');

    elements.subtotal.textContent = ui.money(subtotal);
    elements.delivery.textContent = fee === 0 ? 'Gratis' : ui.money(fee);
    elements.total.textContent = ui.money(total);
    elements.checkoutBtn.textContent = `Confirmar pedido · ${ui.money(total)}`;

    if (subtotal < freeFrom) {
      elements.freeNote.textContent = `Te faltan ${ui.money(freeFrom - subtotal)} para el envío gratis.`;
      elements.freeNote.className = 'mt-2 text-[11px] text-amber-300';
    } else {
      elements.freeNote.textContent = '🎉 Envío gratis aplicado a tu pedido.';
      elements.freeNote.className = 'mt-2 text-[11px] text-emerald-300';
    }

    ui.updateCartBadge();
  }

  function openCart() {
    elements.cartPanel.classList.remove('translate-x-full');
    elements.overlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
  }

  function closeCart() {
    elements.cartPanel.classList.add('translate-x-full');
    elements.overlay.classList.add('hidden');
    document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
  }

  function showCheckoutError(message) {
    elements.checkoutError.textContent = message;
    elements.checkoutError.classList.remove('hidden');
  }

  function hideCheckoutError() {
    elements.checkoutError.classList.add('hidden');
    elements.checkoutError.textContent = '';
  }

  function showSuccess(order, payment) {
    elements.successOrder.textContent = `#${order.id}`;
    elements.successTotal.textContent = ui.money(order.totalCents);
    elements.successEta.textContent = order.etaMinutes ? `${order.etaMinutes} min` : '—';
    elements.successStatus.innerHTML = ui.statusBadge(order.status);

    if (payment?.provider === 'cash') {
      elements.successSubtitle.textContent =
        'Pedido confirmado. Pagarás en efectivo cuando llegue tu entrega.';
    } else if (order.paymentStatus === 'paid') {
      elements.successSubtitle.textContent = 'Pago aprobado. Tu comida ya está en preparación.';
    } else {
      elements.successSubtitle.textContent = 'Pedido registrado. El pago quedó pendiente.';
    }

    if (typeof elements.successDialog.showModal === 'function') {
      elements.successDialog.showModal();
    } else {
      ui.toast(`Pedido #${order.id} confirmado`, 'success');
    }
  }

  function prefillAddress() {
    const user = session.getUser();
    if (user?.address && !elements.address.value) {
      elements.address.value = user.address;
    }
  }

  function bindEvents() {
    elements.filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      state.category = button.dataset.category;
      renderCategories();
      renderProducts();
    });

    elements.search.addEventListener('input', () => {
      state.search = elements.search.value;
      renderProducts();
    });

    elements.grid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-add]');
      if (!button || button.disabled) return;
      const product = state.products.find((item) => item.id === Number(button.dataset.add));
      if (!product) return;

      try {
        cart.add(product, 1);
        ui.toast(`${product.name} agregado al carrito`, 'success');
      } catch (error) {
        ui.toast(error.message, 'error');
      }
    });

    elements.cartItems.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;

      const id = Number(button.dataset.id);
      const item = cart.items().find((entry) => entry.id === id);
      if (!item) return;

      if (button.dataset.action === 'inc') {
        if (item.quantity >= item.stock) {
          ui.toast(`Solo hay ${item.stock} unidades disponibles`, 'info');
          return;
        }
        cart.setQuantity(id, item.quantity + 1);
      }

      if (button.dataset.action === 'dec') {
        cart.setQuantity(id, item.quantity - 1);
      }

      if (button.dataset.action === 'remove') {
        cart.remove(id);
        ui.toast(`${item.name} eliminado del carrito`, 'info');
      }
    });

    window.addEventListener('cart:updated', renderCart);

    elements.openCart.addEventListener('click', openCart);
    elements.closeCart.addEventListener('click', closeCart);
    elements.overlay.addEventListener('click', closeCart);

    elements.locateBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        ui.toast('Tu navegador no permite obtener la ubicación', 'error');
        return;
      }

      ui.setLoading(elements.locateBtn, true, 'Obteniendo ubicación...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = Number(position.coords.latitude.toFixed(4));
          const lon = Number(position.coords.longitude.toFixed(4));
          state.location = { lat, lon };
          elements.locationStatus.textContent = 'Ubicación detectada. Calculando tiempo de entrega...';

          try {
            const estimate = await api.get(`/delivery/estimate?lat=${lat}&lon=${lon}`);
            elements.locationStatus.textContent = `${estimate.etaMinutes} min estimados · ${
              estimate.weather.description
            } · ${Math.round(estimate.weather.temperatureC)}°C (${lat}, ${lon})`;
          } catch (error) {
            elements.locationStatus.textContent = `Ubicación detectada (${lat}, ${lon}). No se pudo consultar el clima.`;
          } finally {
            ui.setLoading(elements.locateBtn, false);
          }
        },
        () => {
          ui.setLoading(elements.locateBtn, false);
          ui.toast('No pudimos obtener tu ubicación. Puedes pedir sin ella.', 'error');
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    });

    elements.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideCheckoutError();

      if (!session.isAuthenticated()) {
        ui.toast('Inicia sesión para confirmar tu pedido', 'info');
        window.setTimeout(() => {
          window.location.href = '/login.html?redirect=menu.html';
        }, 700);
        return;
      }

      const items = cart.items();
      if (items.length === 0) {
        showCheckoutError('Tu carrito está vacío.');
        return;
      }

      const address = elements.address.value.trim();
      if (address.length < 10) {
        showCheckoutError('Escribe una dirección de entrega de al menos 10 caracteres.');
        elements.address.focus();
        return;
      }

      const paymentMethod =
        elements.form.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';

      const payload = {
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
        deliveryAddress: address,
        paymentMethod,
        notes: elements.notes.value.trim() || undefined,
        ...(state.location ? { location: state.location } : {}),
      };

      ui.setLoading(elements.checkoutBtn, true, 'Procesando pago...');

      try {
        const result = await api.post('/orders', payload, { auth: true });
        cart.clear();
        closeCart();
        elements.notes.value = '';
        showSuccess(result.order, result.payment);
      } catch (error) {
        showCheckoutError(error.message);
        ui.toast(error.message, 'error');
      } finally {
        ui.setLoading(elements.checkoutBtn, false);
        renderCart();
      }
    });

    elements.successClose.addEventListener('click', () => elements.successDialog.close());
    elements.successDialog.addEventListener('click', (event) => {
      if (event.target === elements.successDialog) elements.successDialog.close();
    });

    if (window.location.hash === '#cart') {
      openCart();
    }
  }

  async function init() {
    bindEvents();
    prefillAddress();
    renderCart();

    try {
      const [catalog, config] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/config'),
      ]);

      state.products = catalog.products;
      state.categories = catalog.categories;
      if (config?.delivery) state.config = config;

      renderCategories();
      renderProducts();
      prefillAddress();
    } catch (error) {
      elements.grid.innerHTML = `
        <div class="col-span-full rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          No pudimos cargar el menú: ${ui.escapeHtml(error.message)}
        </div>
      `;
      ui.toast(error.message, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
