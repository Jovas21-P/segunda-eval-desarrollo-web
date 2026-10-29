(function () {
  'use strict';

  const { api, ui, session } = window.FoodExpress;

  const elements = {
    list: document.getElementById('orders-list'),
    filters: document.getElementById('order-filters'),
    summaryOrders: document.getElementById('summary-orders'),
    summaryActive: document.getElementById('summary-active'),
    summarySpent: document.getElementById('summary-spent'),
    locateBtn: document.getElementById('locate-btn'),
    estimateResult: document.getElementById('estimate-result'),
    estimateIcon: document.getElementById('estimate-icon'),
    estimateDescription: document.getElementById('estimate-description'),
    estimateTemp: document.getElementById('estimate-temp'),
    estimateEta: document.getElementById('estimate-eta'),
    estimateSource: document.getElementById('estimate-source'),
    estimateStatus: document.getElementById('estimate-status'),
  };

  const WEATHER_ICONS = {
    clear: '☀️',
    clouds: '⛅',
    rain: '🌧️',
    drizzle: '🌦️',
    thunderstorm: '⛈️',
    snow: '❄️',
    mist: '🌫️',
    fog: '🌫️',
    haze: '🌫️',
    smoke: '🌫️',
  };

  const ACTIVE_STATUSES = ['pending', 'pending_payment', 'confirmed', 'preparing', 'on_the_way'];

  const state = {
    orders: [],
    filter: 'all',
  };

  function filteredOrders() {
    if (state.filter === 'active') {
      return state.orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
    }
    if (state.filter === 'closed') {
      return state.orders.filter((order) => !ACTIVE_STATUSES.includes(order.status));
    }
    return state.orders;
  }

  function orderCard(order) {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const eta = order.etaMinutes ? `${order.etaMinutes} min` : 'No calculado';
    const weather = order.weather ? ` · ${ui.escapeHtml(order.weather)}` : '';

    const items = order.items
      .map(
        (item) => `
          <li class="flex items-center gap-3 py-2.5">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-lg">${ui.escapeHtml(
              item.image || '🍽️'
            )}</span>
            <span class="min-w-0 flex-1 truncate text-sm text-slate-300">${ui.escapeHtml(item.name)}</span>
            <span class="text-xs text-slate-500">×${item.quantity}</span>
            <span class="w-20 text-right text-sm font-medium text-white">${ui.money(
              item.lineTotalCents
            )}</span>
          </li>
        `
      )
      .join('');

    return `
      <article class="card overflow-hidden">
        <div class="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base font-semibold">Pedido #${order.id}</h3>
              ${ui.statusBadge(order.status)}
            </div>
            <p class="mt-1.5 text-xs text-slate-500">${ui.formatDate(order.createdAt)} · ${itemCount} artículo${
              itemCount === 1 ? '' : 's'
            }</p>
          </div>
          <div class="text-right">
            <p class="text-xl font-bold">${ui.money(order.totalCents)}</p>
            <p class="mt-0.5 text-[11px] text-slate-500">${ui.paymentLabel(
              order.paymentMethod,
              order.paymentStatus
            )}</p>
          </div>
        </div>

        <div class="p-5">
          <ul class="divide-y divide-white/5">${items}</ul>

          <div class="mt-4 grid gap-4 border-t border-white/10 pt-4 text-xs sm:grid-cols-2">
            <div>
              <p class="text-[10px] uppercase tracking-wider text-slate-500">Dirección de entrega</p>
              <p class="mt-1 leading-relaxed text-slate-300">${ui.escapeHtml(order.deliveryAddress)}</p>
              ${
                order.notes
                  ? `<p class="mt-2 text-slate-500">Nota: ${ui.escapeHtml(order.notes)}</p>`
                  : ''
              }
            </div>
            <div class="sm:text-right">
              <p class="text-[10px] uppercase tracking-wider text-slate-500">Entrega estimada</p>
              <p class="mt-1 text-slate-300">${eta}${weather}</p>
              <p class="mt-2 text-[11px] text-slate-500">
                Subtotal ${ui.money(order.subtotalCents)} · Envío ${
                  order.deliveryFeeCents === 0 ? 'gratis' : ui.money(order.deliveryFeeCents)
                }
              </p>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function render() {
    const orders = filteredOrders();

    if (orders.length === 0) {
      const emptyMessages = {
        all: 'Todavía no tienes pedidos. ¡Empieza con algo rico!',
        active: 'No tienes pedidos en curso en este momento.',
        closed: 'Aún no tienes pedidos finalizados.',
      };
      elements.list.innerHTML = `
        <div class="card p-10 text-center">
          <p class="text-5xl">${state.orders.length === 0 ? '🍽️' : '✅'}</p>
          <h3 class="mt-4 text-base font-semibold">${
            state.orders.length === 0 ? 'Tu historial está vacío' : 'Sin pedidos en este filtro'
          }</h3>
          <p class="mt-1 text-sm text-slate-400">${emptyMessages[state.filter]}</p>
          ${
            state.orders.length === 0
              ? '<a href="/menu.html" class="btn-primary mt-6">Explorar el menú</a>'
              : ''
          }
        </div>
      `;
      return;
    }

    elements.list.innerHTML = orders.map(orderCard).join('');
  }

  function renderSummary() {
    const total = state.orders.length;
    const active = state.orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length;
    const spent = state.orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.totalCents, 0);

    elements.summaryOrders.textContent = String(total);
    elements.summaryActive.textContent = String(active);
    elements.summarySpent.textContent = ui.money(spent);
  }

  function renderEstimate(data, label) {
    elements.estimateResult.classList.remove('hidden');
    elements.estimateIcon.textContent = WEATHER_ICONS[data.weather.code] || '🌡️';
    elements.estimateDescription.textContent =
      data.weather.description.charAt(0).toUpperCase() + data.weather.description.slice(1);
    elements.estimateTemp.textContent = `${Math.round(data.weather.temperatureC)}°C`;
    elements.estimateEta.textContent = `${data.etaMinutes} min`;
    elements.estimateSource.textContent =
      data.weather.source === 'openweathermap'
        ? 'OpenWeatherMap'
        : data.weather.source === 'simulated-fallback'
          ? 'Respaldo simulado'
          : 'Modo simulado';

    if (label) elements.estimateStatus.textContent = label;
  }

  async function fetchEstimate(lat, lon, label) {
    ui.setLoading(elements.locateBtn, true, 'Calculando...');
    try {
      const data = await api.get(`/delivery/estimate?lat=${lat}&lon=${lon}`);
      renderEstimate(data, label);
    } catch (error) {
      ui.toast(error.message, 'error');
    } finally {
      ui.setLoading(elements.locateBtn, false);
    }
  }

  function useFallbackLocation() {
    const lat = 19.4326;
    const lon = -99.1332;
    fetchEstimate(
      lat,
      lon,
      'Usando ubicación de referencia (CDMX). Concede permiso de ubicación para un cálculo exacto.'
    );
  }

  function bindEvents() {
    elements.filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      state.filter = button.dataset.filter;
      elements.filters.querySelectorAll('[data-filter]').forEach((chip) => {
        chip.classList.toggle('chip-active', chip === button);
      });
      render();
    });

    elements.locateBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        ui.toast('Tu navegador no permite obtener la ubicación', 'error');
        useFallbackLocation();
        return;
      }

      ui.setLoading(elements.locateBtn, true, 'Ubicando...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          ui.setLoading(elements.locateBtn, false);
          const lat = Number(position.coords.latitude.toFixed(4));
          const lon = Number(position.coords.longitude.toFixed(4));
          fetchEstimate(lat, lon, `Ubicación detectada: ${lat}, ${lon}`);
        },
        () => {
          ui.setLoading(elements.locateBtn, false);
          ui.toast('No pudimos obtener tu ubicación. Usaremos CDMX como referencia.', 'info');
          useFallbackLocation();
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    });
  }

  async function load() {
    try {
      const data = await api.get('/orders/user', { auth: true });
      state.orders = data.orders;
      renderSummary();
      render();
    } catch (error) {
      elements.list.innerHTML = `
        <div class="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          No pudimos cargar tus pedidos: ${ui.escapeHtml(error.message)}
        </div>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!session.requireAuth()) return;
    bindEvents();
    load();
  });
})();
