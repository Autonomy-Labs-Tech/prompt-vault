(function () {
  'use strict';

  function setStatus(form, message, state) {
    var status = form.parentElement && form.parentElement.querySelector('[data-email-status]');
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state || '';
  }

  document.querySelectorAll('[data-email-capture]').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var emailField = form.querySelector('input[name="email"]');
      var honeypot = form.querySelector('input[name="website"]');
      var button = form.querySelector('button[type="submit"]');
      var email = emailField ? emailField.value.trim() : '';
      if (!email) {
        setStatus(form, 'Enter your email address to continue.', 'error');
        if (emailField) emailField.focus();
        return;
      }

      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
      }
      setStatus(form, 'Saving your signup…', 'pending');
      try {
        var response = await fetch(form.getAttribute('action') || '/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email: email,
            website: honeypot ? honeypot.value : '',
            source: window.location.pathname,
          }),
        });
        var payload = await response.json().catch(function () { return {}; });
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || 'Could not save your signup.');
        }
        setStatus(form, 'You’re on the list. Thanks — we’ll send occasional practical AI tips.', 'success');
        form.reset();
      } catch (error) {
        setStatus(form, error.message || 'Could not save your signup. Please try again.', 'error');
      } finally {
        if (button) {
          button.disabled = false;
          button.removeAttribute('aria-busy');
        }
      }
    });
  });
}());
