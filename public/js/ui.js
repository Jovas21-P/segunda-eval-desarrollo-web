(function () {
  'use strict';

  window.FoodExpress = window.FoodExpress || {};

  const ICONS = {
    cart: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/></svg>',
    user: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a8.25 8.25 0 0 1 15 0"/></svg>',
    menu: '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/></svg>',
    logout:
      '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H5.25"/></svg>',
    arrow: '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>',
    check:
      '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>',
  };

  const NAV_ITEMS = [
    { key: 'home', href: '/index.html', label: 'Inicio' },
    { key: 'menu', href: '/menu.html', label: 'Menú' },
    { key: 'orders', href: '/orders.html', label: 'Mis pedidos' },
  ];

  const STATUS_MAP = {
    pending: {
      label: 'Pendiente',
      classes: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    },
    pending_payment: {
      label: 'Pago pendiente',
      classes: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    },
    confirmed: {
      label: 'Confirmado',
      classes: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
    },
    preparing: {
      label: 'En preparación',
      classes: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-300',
    },
    on_the_way: {
      label: 'En camino',
      classes: 'border-brand-400/30 bg-brand-400/10 text-brand-300',
    },
    delivered: {
      label: 'Entregado',
      classes: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    },
    cancelled: {
      label: 'Cancelado',
      classes: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
    },
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function money(cents) {
    const amount = Number(cents || 0) / 100;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  function parseServerDate(value) {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
      return new Date(`${value.replace(' ', 'T')}Z`);
    }
    return new Date(value);
  }

  function formatDate(value, options = {}) {
    const date = parseServerDate(value);
    if (!date || Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
      ...options,
    }).format(date);
  }

  function initials(name) {
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  function statusBadge(status) {
    const info = STATUS_MAP[status] || {
      label: status || 'Desconocido',
      classes: 'border-white/15 bg-white/5 text-slate-300',
    };
    return `<span class="badge ${info.classes}">${escapeHtml(info.label)}</span>`;
  }

  function paymentLabel(method, status) {
    const methodLabels = { card: 'Tarjeta', cash: 'Efectivo' };
    const statusLabels = { paid: 'pagado', pending: 'pendiente', failed: 'fallido' };
    const methodLabel = methodLabels[method] || method || '—';
    const statusLabel = statusLabels[status] || status || '';
    return `${methodLabel} · ${statusLabel}`;
  }

  function ensureToastRoot() {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      root.className =
        'pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6';
      root.setAttribute('aria-live', 'polite');
      document.body.appendChild(root);
    }
    return root;
  }

  function toast(message, type = 'info') {
    const root = ensureToastRoot();
    const styles = {
      success: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
      error: 'border-rose-400/30 bg-rose-500/15 text-rose-100',
      info: 'border-sky-400/30 bg-sky-500/15 text-sky-100',
    };
    const icons = { success: '✓', error: '!', info: 'i' };

    const item = document.createElement('div');
    item.className = `pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-card backdrop-blur-xl ${
      styles[type] || styles.info
    }`;
    item.innerHTML = `<span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 text-[11px] font-bold">${
      icons[type] || icons.info
    }</span><span class="leading-relaxed"></span>`;
    item.querySelector('span:last-child').textContent = message;
    root.appendChild(item);

    window.setTimeout(() => {
      item.style.transition = 'opacity .25s ease, transform .25s ease';
      item.style.opacity = '0';
      item.style.transform = 'translateY(8px)';
      window.setTimeout(() => item.remove(), 260);
    }, 4200);
  }

  function setLoading(button, loading, text = 'Procesando...') {
    if (!button) return;
    if (loading) {
      if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span><span>${escapeHtml(
        text
      )}</span>`;
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
    }
  }

  function headerTemplate(active, user) {
    const desktopLinks = NAV_ITEMS.map(
      (item) =>
        `<a href="${item.href}" class="nav-link ${active === item.key ? 'nav-link-active' : ''}">${
          item.label
        }</a>`
    ).join('');

    const mobileLinks = NAV_ITEMS.map(
      (item) =>
        `<a href="${item.href}" class="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium ${
          active === item.key ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'
        }"><span>${item.label}</span><span class="text-slate-500">›</span></a>`
    ).join('');

    const authDesktop = user
      ? `<span class="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 sm:flex">
           <span class="grid h-7 w-7 place-items-center rounded-full bg-brand-500/20 text-[11px] font-bold text-brand-300">${escapeHtml(
             initials(user.name)
           )}</span>
           <span class="max-w-[8rem] truncate text-xs font-medium text-slate-300">${escapeHtml(
             user.name.split(' ')[0]
           )}</span>
         </span>
         <button type="button" data-logout class="btn-ghost hidden sm:inline-flex" title="Cerrar sesión">${ICONS.logout}<span class="hidden lg:inline">Salir</span></button>`
      : `<a href="/login.html" class="btn-ghost hidden sm:inline-flex">Ingresar</a>
         <a href="/register.html" class="btn-primary !px-4 !py-2 hidden sm:inline-flex">Crear cuenta</a>`;

    const authMobile = user
      ? `<div class="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
           <span class="flex items-center gap-2 text-sm text-slate-300"><span class="grid h-7 w-7 place-items-center rounded-full bg-brand-500/20 text-[11px] font-bold text-brand-300">${escapeHtml(
             initials(user.name)
           )}</span>${escapeHtml(user.name.split(' ')[0])}</span>
           <button type="button" data-logout class="btn-ghost !text-rose-300">${ICONS.logout} Salir</button>
         </div>`
      : `<div class="mt-3 grid grid-cols-2 gap-2">
           <a href="/login.html" class="btn-secondary !py-2.5">Ingresar</a>
           <a href="/register.html" class="btn-primary !py-2.5">Crear cuenta</a>
         </div>`;

    return `
      <header class="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
        <div class="container-page flex h-16 items-center justify-between gap-3">
          <a href="/index.html" class="group flex items-center gap-2.5" aria-label="FoodExpress, ir al inicio">
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg shadow-glow transition group-hover:scale-105">🍔</span>
            <span class="text-base font-bold tracking-tight">Food<span class="text-brand-400">Express</span></span>
          </a>

          <nav class="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            ${desktopLinks}
          </nav>

          <div class="flex items-center gap-1.5 sm:gap-2">
            <a href="/menu.html" class="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/5 hover:text-white" aria-label="Ver carrito">
              ${ICONS.cart}
              <span data-cart-count class="absolute -right-0.5 -top-0.5 hidden min-w-[18px] rounded-full bg-brand-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">0</span>
            </a>
            ${authDesktop}
            <button type="button" data-mobile-toggle class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/5 hover:text-white md:hidden" aria-label="Abrir menú" aria-expanded="false">
              ${ICONS.menu}
            </button>
          </div>
        </div>

        <div data-mobile-menu class="hidden border-t border-white/10 bg-ink-950/95 px-5 pb-4 pt-2 md:hidden">
          <nav class="space-y-1" aria-label="Navegación móvil">${mobileLinks}</nav>
          ${authMobile}
        </div>
      </header>
    `;
  }

  function footerTemplate() {
    return `
      <footer class="mt-24 border-t border-white/10 bg-ink-950/60">
        <div class="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div class="sm:col-span-2 lg:col-span-1">
            <a href="/index.html" class="flex items-center gap-2.5">
              <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg">🍔</span>
              <span class="text-base font-bold tracking-tight">Food<span class="text-brand-400">Express</span></span>
            </a>
            <p class="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">Comida recién preparada, entregada con seguimiento en tiempo real y pagos seguros.</p>
            <p class="mt-4 text-xs text-slate-600">Hecho para la Segunda Evaluación de Desarrollo Web.</p>
          </div>

          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Plataforma</h3>
            <ul class="mt-4 space-y-2 text-sm text-slate-400">
              <li><a href="/menu.html" class="transition hover:text-white">Menú completo</a></li>
              <li><a href="/orders.html" class="transition hover:text-white">Mis pedidos</a></li>
              <li><a href="/register.html" class="transition hover:text-white">Crear cuenta</a></li>
              <li><a href="/login.html" class="transition hover:text-white">Iniciar sesión</a></li>
            </ul>
          </div>

          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">API REST</h3>
            <ul class="mt-4 space-y-2 text-sm text-slate-400">
              <li><a href="/api/v1/health" class="transition hover:text-white">Estado del servicio</a></li>
              <li><a href="/api/v1/products" class="transition hover:text-white">Catálogo público</a></li>
              <li><a href="/api/v1/orders/user" class="transition hover:text-white">Historial (JWT)</a></li>
              <li><a href="/api/v1/delivery/estimate?lat=19.43&lon=-99.13" class="transition hover:text-white">Clima y ETA</a></li>
            </ul>
          </div>

          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Seguridad</h3>
            <ul class="mt-4 space-y-2 text-sm text-slate-400">
              <li>JWT + bcrypt</li>
              <li>Helmet + CORS</li>
              <li>Rate limiting</li>
              <li>Consultas parametrizadas</li>
            </ul>
          </div>
        </div>

        <div class="border-t border-white/5">
          <div class="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-500 sm:flex-row">
            <p>© <span data-year></span> FoodExpress. Todos los derechos reservados.</p>
            <p class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>Node.js</span><span class="text-slate-700">•</span>
              <span>Express</span><span class="text-slate-700">•</span>
              <span>SQLite</span><span class="text-slate-700">•</span>
              <span>JWT</span><span class="text-slate-700">•</span>
              <span>Tailwind CSS</span>
            </p>
          </div>
        </div>
      </footer>
    `;
  }

  function updateCartBadge() {
    const cart = window.FoodExpress.cart;
    const count = cart ? cart.count() : 0;
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(count);
      badge.classList.toggle('hidden', count === 0);
    });
  }

  function bindHeader(header) {
    const toggle = header.querySelector('[data-mobile-toggle]');
    const panel = header.querySelector('[data-mobile-menu]');

    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        const isOpen = !panel.classList.contains('hidden');
        panel.classList.toggle('hidden', isOpen);
        toggle.setAttribute('aria-expanded', String(!isOpen));
      });
    }

    header.querySelectorAll('[data-logout]').forEach((button) => {
      button.addEventListener('click', () => {
        window.FoodExpress.session.clear();
        window.location.href = '/index.html';
      });
    });
  }

  function initLayout() {
    const active = document.body.dataset.page || '';
    const user = window.FoodExpress.session.getUser();
    const header = document.getElementById('app-header');
    const footer = document.getElementById('app-footer');

    if (header) {
      header.innerHTML = headerTemplate(active, user);
      bindHeader(header);
    }

    if (footer) {
      footer.innerHTML = footerTemplate();
    }

    document.querySelectorAll('[data-year]').forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });

    updateCartBadge();
    window.addEventListener('cart:updated', updateCartBadge);
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function safeRedirect(value, fallback = '/index.html') {
    if (!value) return fallback;
    if (value.startsWith('//')) return fallback;
    if (value.startsWith('/')) return value;
    if (!value.includes('://') && !/^[a-z]+:/i.test(value)) {
      return `/${value.replace(/^\.?\//, '')}`;
    }
    return fallback;
  }

  window.FoodExpress.ui = {
    ICONS,
    escapeHtml,
    money,
    formatDate,
    parseServerDate,
    initials,
    statusBadge,
    paymentLabel,
    toast,
    setLoading,
    updateCartBadge,
    getQueryParam,
    safeRedirect,
  };

  document.addEventListener('DOMContentLoaded', initLayout);
})();
