(function () {
  'use strict';

  const { api, session, ui } = window.FoodExpress;

  function showError(message) {
    const box = document.getElementById('form-error');
    if (!box) return;
    box.textContent = message;
    box.classList.remove('hidden');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    const box = document.getElementById('form-error');
    if (!box) return;
    box.classList.add('hidden');
    box.textContent = '';
  }

  function redirectTarget() {
    return ui.safeRedirect(ui.getQueryParam('redirect'), '/index.html');
  }

  function preserveRedirect() {
    const redirect = ui.getQueryParam('redirect');
    if (!redirect) return;

    document.querySelectorAll('[data-preserve-redirect]').forEach((link) => {
      const url = new URL(link.getAttribute('href'), window.location.origin);
      url.searchParams.set('redirect', redirect);
      link.setAttribute('href', `${url.pathname}${url.search}`);
    });
  }

  function bindPasswordToggles() {
    document.querySelectorAll('[data-toggle-password]').forEach((button) => {
      button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.textContent = show ? 'Ocultar' : 'Ver';
        button.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
      });
    });
  }

  function bindLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const fillDemo = document.getElementById('fill-demo');
    if (fillDemo) {
      fillDemo.addEventListener('click', () => {
        form.elements.email.value = 'admin@foodexpress.com';
        form.elements.password.value = 'Admin123!';
        form.elements.password.focus();
        ui.toast('Credenciales demo cargadas. Pulsa “Entrar”.', 'info');
      });
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideError();

      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;

      if (!email || !password) {
        showError('Escribe tu correo y contraseña.');
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      ui.setLoading(button, true, 'Entrando...');

      try {
        const data = await api.post('/auth/login', { email, password });
        session.setSession(data);
        ui.toast(`Bienvenido de nuevo, ${data.user.name.split(' ')[0]}`, 'success');
        window.location.href = redirectTarget();
      } catch (error) {
        showError(error.message);
      } finally {
        ui.setLoading(button, false);
      }
    });
  }

  function bindRegister() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      hideError();

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const phone = form.elements.phone.value.trim();
      const address = form.elements.address.value.trim();
      const password = form.elements.password.value;
      const confirmPassword = form.elements.confirmPassword.value;

      if (name.length < 2) {
        showError('Escribe tu nombre completo.');
        return;
      }
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        showError('La contraseña debe tener al menos 8 caracteres, una letra y un número.');
        return;
      }
      if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden.');
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      ui.setLoading(button, true, 'Creando cuenta...');

      try {
        const data = await api.post('/auth/register', {
          name,
          email,
          password,
          ...(phone ? { phone } : {}),
          ...(address ? { address } : {}),
        });

        session.setSession(data);
        ui.toast(`¡Bienvenido a FoodExpress, ${data.user.name.split(' ')[0]}!`, 'success');
        window.location.href = redirectTarget();
      } catch (error) {
        showError(error.message);
      } finally {
        ui.setLoading(button, false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    preserveRedirect();
    bindPasswordToggles();
    bindLogin();
    bindRegister();
  });
})();
