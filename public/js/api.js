(function () {
  'use strict';

  window.FoodExpress = window.FoodExpress || {};

  const BASE_URL = '/api/v1';

  class ApiError extends Error {
    constructor(message, status, code, details) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.details = details;
    }
  }

  async function request(path, options = {}) {
    const { method = 'GET', body, auth = false, headers = {} } = options;
    const session = window.FoodExpress.session;
    const token = auth && session ? session.getToken() : null;

    let response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkError) {
      throw new ApiError(
        'No pudimos conectar con el servidor. Verifica tu conexión.',
        0,
        'NETWORK_ERROR'
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message = payload?.error?.message || `Error ${response.status}`;
      const code = payload?.error?.code || 'REQUEST_FAILED';

      if (response.status === 401 && auth && session) {
        session.clear();
        if (!window.location.pathname.endsWith('login.html')) {
          const current = `${window.location.pathname.split('/').pop() || 'index.html'}${window.location.search}`;
          window.location.href = `/login.html?redirect=${encodeURIComponent(current)}`;
        }
      }

      throw new ApiError(message, response.status, code, payload?.error?.details);
    }

    return payload ? payload.data : null;
  }

  const api = {
    request,
    get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body }),
    patch: (path, body, options = {}) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
  };

  window.FoodExpress.ApiError = ApiError;
  window.FoodExpress.api = api;
})();
