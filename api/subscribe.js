'use strict';

// Vercel serverless function: store an opted-in email in Resend Contacts.
// Resend Contacts is used as the durable subscriber store because serverless
// function filesystems are ephemeral and must not be treated as a database.
const https = require('https');

const RESEND_HOST = 'api.resend.com';
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RESPONSE_BYTES = 1000000;

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

function requestResend(method, path, apiKey, body) {
  return new Promise((resolve) => {
    let payload = null;
    if (body !== undefined) payload = JSON.stringify(body);
    const headers = {
      Authorization: 'Bearer ' + apiKey,
      Accept: 'application/json',
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request({
      host: RESEND_HOST,
      method,
      path,
      headers,
      timeout: REQUEST_TIMEOUT_MS,
    }, (response) => {
      let responseBody = '';
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        responseBody += chunk;
        if (Buffer.byteLength(responseBody) > MAX_RESPONSE_BYTES) {
          finish({ status: 502, error: 'subscriber store response too large' });
          req.destroy();
        }
      });
      response.on('end', () => {
        let data = null;
        try { data = responseBody ? JSON.parse(responseBody) : null; } catch (e) {}
        finish({ status: response.statusCode || 502, data, body: responseBody });
      });
      response.on('error', (error) => finish({ status: 502, error: error.message }));
    });
    req.on('timeout', () => {
      req.destroy(new Error('subscriber store request timed out'));
    });
    req.on('error', (error) => resolve({ status: 502, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function bodyObject(req) {
  if (!req || req.body == null) return {};
  if (typeof req.body === 'object' && !Array.isArray(req.body)) return req.body;
  if (typeof req.body !== 'string') return {};
  const raw = req.body.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (e) {
    const params = new URLSearchParams(raw);
    return Object.fromEntries(params.entries());
  }
}

function normalizeEmail(value) {
  const email = String(value == null ? '' : value).trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
}

function hasAffirmativeConsent(value) {
  return value === true || value === 'true' || value === 'on';
}

module.exports = async function subscribe(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      subscriber_store: 'resend_contacts',
      configured: Boolean(apiKey),
    });
  }
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method not allowed' });

  const body = bodyObject(req);
  // Quietly acknowledge honeypot submissions without storing them.
  if (String(body.website || '').trim()) {
    return sendJson(res, 200, { ok: true, subscribed: true });
  }
  if (!hasAffirmativeConsent(body.consent)) {
    return sendJson(res, 400, { ok: false, error: 'affirmative email consent is required' });
  }
  const email = normalizeEmail(body.email);
  if (!email) return sendJson(res, 400, { ok: false, error: 'valid email is required' });
  if (!apiKey) return sendJson(res, 503, { ok: false, error: 'subscriber store not configured' });

  const contact = await requestResend(
    'POST',
    '/contacts',
    apiKey,
    {
      email,
      unsubscribed: false,
    },
  );
  // Resend Contacts is an idempotent upsert: new and existing contacts can
  // both return 2xx, so the response does not tell us whether this email was
  // already subscribed. Keep legacy 409 responses successful as well, but do
  // not expose an inferred already_subscribed flag.
  if ((contact.status >= 200 && contact.status < 300) || contact.status === 409) {
    return sendJson(res, 200, {
      ok: true,
      subscribed: true,
      subscriber_store: 'resend_contacts',
    });
  }
  const providerError = contact.data && (contact.data.message || contact.data.name);
  return sendJson(res, 502, {
    ok: false,
    error: 'could not save subscriber',
    provider_status: contact.status,
    provider_error: providerError ? String(providerError).slice(0, 160) : undefined,
  });
};

module.exports._private = { bodyObject, hasAffirmativeConsent, normalizeEmail };
