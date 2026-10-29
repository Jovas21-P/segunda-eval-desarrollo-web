(function () {
  'use strict';

  const { api, ui, cart } = window.FoodExpress;

  const grid = document.getElementById('featured-grid');
  let products = [];

  function card(product) {
    return `
      <article class="group card overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-brand-500/30">
        <div class="relative grid h-36 place-items-center bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent text-5xl">
          <span class="transition duration-300 group-hover:scale-110">${ui.escapeHtml(product.image)}</span>
          <span class="badge absolute left-3 top-3 border-white/15 bg-ink-950/70 text-[10px] text-slate-300">${ui.escapeHtml(product.category)}</span>
        </div>
        <div class="p-5">
          <h3 class="text-sm font-semibold text-white">${ui.escapeHtml(product.name)}</h3>
          <p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">${ui.escapeHtml(product.description)}</p>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-base font-bold text-white">${ui.money(product.priceCents)}</span>
            <button type="button" data-add="${product.id}" class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300 transition hover:bg-brand-500 hover:text-white" aria-label="Agregar ${ui.escapeHtml(product.name)} al carrito">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function render() {
    const featured = products.filter((product) => product.featured).slice(0, 4);
    const selected = featured.length ? featured : products.slice(0, 4);
    grid.innerHTML = selected.map(card).join('');
  }

  async function load() {
    try {
      const data = await api.get('/products?limit=12');
      products = data.products;
      render();
    } catch (error) {
      grid.innerHTML = `
        <div class="col-span-full rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          No pudimos cargar el menú: ${ui.escapeHtml(error.message)}
        </div>
      `;
    }
  }

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add]');
    if (!button) return;
    const product = products.find((item) => item.id === Number(button.dataset.add));
    if (!product) return;
    try {
      cart.add(product, 1);
      ui.toast(`${product.name} se agregó al carrito`, 'success');
    } catch (error) {
      ui.toast(error.message, 'error');
    }
  });

  document.addEventListener('DOMContentLoaded', load);
})();
