(function () {
  'use strict';

  function setStatus(form, message, state) {
    var status = form.parentElement && form.parentElement.querySelector('[data-email-status]');
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state || '';
  }

  function ensureConsentControl(form) {
    var existing = form.querySelector('input[name="consent"]');
    if (existing) return existing;
    var label = document.createElement('label');
    label.className = 'consent-control';
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'consent';
    checkbox.required = true;
    var link = document.createElement('a');
    link.href = form.getAttribute('action') && form.getAttribute('action').indexOf('../') === 0
      ? '../privacy.html'
      : 'privacy.html';
    link.textContent = 'privacy policy';
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' I agree to receive occasional AI tips and product updates; see our '));
    label.appendChild(link);
    form.insertBefore(label, form.querySelector('button[type="submit"]'));
    return checkbox;
  }

  document.querySelectorAll('[data-email-capture]').forEach(function (form) {
    var consent = ensureConsentControl(form);
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
      if (!consent.checked) {
        setStatus(form, 'Please tick the consent box to join the free list.', 'error');
        consent.focus();
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
            consent: true,
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
