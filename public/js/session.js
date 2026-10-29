(function () {
  'use strict';

  window.FoodExpress = window.FoodExpress || {};

  const TOKEN_KEY = 'foodexpress.token';
  const USER_KEY = 'foodexpress.user';

  function getToken() {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  function getUser() {
    try {
      const raw = window.localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession({ token, user }) {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function updateUser(user) {
    if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clear() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }

  function isAuthenticated() {
    return Boolean(getToken());
  }

  /**
   * Protege una página privada. Devuelve false y redirige al login cuando
   * no hay sesión, conservando la página de destino.
   */
  function requireAuth() {
    if (isAuthenticated()) return true;

    const current = `${window.location.pathname.split('/').pop() || 'index.html'}${window.location.search}`;
    window.location.replace(`/login.html?redirect=${encodeURIComponent(current)}`);
    return false;
  }

  function firstName() {
    const user = getUser();
    return user?.name ? user.name.split(' ')[0] : '';
  }

  window.FoodExpress.session = {
    getToken,
    getUser,
    setSession,
    updateUser,
    clear,
    isAuthenticated,
    requireAuth,
    firstName,
  };
})();
