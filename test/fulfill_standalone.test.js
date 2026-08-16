'use strict';

const assert = require('node:assert/strict');
const EventEmitter = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const test = require('node:test');

const API_DIR = path.join(__dirname, '..', 'api');
const FIXTURE = require(path.join(API_DIR, 'stripe_test_fixtures.json')).fixtures[0];

function copyStandaloneApi({ includeFixture = false, fixtureContents } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fulfill-standalone-'));
  const apiDir = path.join(root, 'api');
  fs.mkdirSync(apiDir, { recursive: true });
  fs.copyFileSync(path.join(API_DIR, 'fulfill.js'), path.join(apiDir, 'fulfill.js'));
  if (fixtureContents !== undefined) {
    fs.writeFileSync(path.join(apiDir, 'stripe_test_fixtures.json'), fixtureContents);
  } else if (includeFixture) {
    fs.copyFileSync(
      path.join(API_DIR, 'stripe_test_fixtures.json'),
      path.join(apiDir, 'stripe_test_fixtures.json'),
    );
  }
  return { root, handlerPath: path.join(apiDir, 'fulfill.js') };
}

function mockStripeAndResend() {
  const originalRequest = https.request;
  const calls = [];
  https.request = (options, callback) => {
    calls.push(options);
    const request = new EventEmitter();
    request.write = () => {};
    request.destroy = () => {};
    request.end = () => {
      let statusCode = 200;
      let body = {};
      if (options.host === 'api.stripe.com' && options.path.startsWith('/v1/events/')) {
        const eventPath = '/v1/events/';
        const requestedEventId = decodeURIComponent(options.path.slice(eventPath.length));
        assert.equal(
          requestedEventId,
          FIXTURE.event_id,
          'standalone Stripe mock must receive the configured fixture event ID',
        );
        body = {
          id: requestedEventId,
          livemode: false,
          type: FIXTURE.event_type,
          data: {
            object: {
              id: 'cs_standalone',
              object: 'checkout.session',
              livemode: false,
              customer_details: { email: 'buyer@example.com' },
              mode: FIXTURE.checkout_mode,
              payment_status: 'paid',
            },
          },
        };
      } else if (options.host === 'api.stripe.com' && options.path.includes('/line_items')) {
        body = { data: [{ price: { id: FIXTURE.price_id, product: FIXTURE.product_id } }] };
      } else if (options.host === 'api.resend.com') {
        body = { id: 'email_standalone' };
      }
      process.nextTick(() => {
        const response = new EventEmitter();
        response.statusCode = statusCode;
        callback(response);
        process.nextTick(() => {
          response.emit('data', Buffer.from(JSON.stringify(body)));
          response.emit('end');
        });
      });
    };
    return request;
  };
  return {
    calls,
    restore() {
      https.request = originalRequest;
    },
  };
}

function invoke(handler, eventId = FIXTURE.event_id) {
  let statusCode = 200;
  let body;
  const response = {
    status(code) {
      statusCode = code;
      return response;
    },
    json(value) {
      body = value;
      return response;
    },
  };
  return Promise.resolve(handler({
    method: 'POST',
    body: { type: FIXTURE.event_type, id: eventId },
    headers: {
      'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=${'a'.repeat(64)}`,
    },
  }, response)).then(() => ({ statusCode, body }));
}

function withTestEnvironment(fn) {
  const keys = ['STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'STRIPE_TEST_MODE', 'STRIPE_TEST_PRODUCT_ID'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    STRIPE_SECRET_KEY: 'sk_test_standalone',
    RESEND_API_KEY: 're_standalone',
    STRIPE_TEST_MODE: '1',
    STRIPE_TEST_PRODUCT_ID: FIXTURE.product_id,
  });
  return Promise.resolve(fn()).finally(() => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
}

test('fulfill: packaged test metadata works from a standalone business2 bundle', async () => {
  const standalone = copyStandaloneApi({ includeFixture: true });
  const mock = mockStripeAndResend();
  try {
    await withTestEnvironment(async () => {
      const handler = require(standalone.handlerPath);
      const response = await invoke(handler);
      assert.deepEqual(response, {
        statusCode: 200,
        body: { ok: true, product: FIXTURE.product_id, email_sent: true },
      });
    });
    assert.equal(
      mock.calls.filter((call) => call.host === 'api.resend.com').length,
      1,
    );
  } finally {
    mock.restore();
    fs.rmSync(standalone.root, { recursive: true, force: true });
  }
});

test('fulfill: missing packaged metadata fails closed without network calls', async () => {
  const standalone = copyStandaloneApi();
  const mock = mockStripeAndResend();
  try {
    await withTestEnvironment(async () => {
      const handler = require(standalone.handlerPath);
      const response = await invoke(handler);
      assert.deepEqual(response, {
        statusCode: 200,
        body: {
          ok: false,
          reason: 'test fixture is not approved',
          diagnostic: {
            source: 'bundled_stripe_test_fixtures',
            status: 'unavailable',
            code: 'metadata_unavailable',
          },
        },
      });
    });
    assert.equal(mock.calls.length, 0);
  } finally {
    mock.restore();
    fs.rmSync(standalone.root, { recursive: true, force: true });
  }
});

test('fulfill: invalid packaged metadata fails closed with safe diagnostics', async () => {
  const standalone = copyStandaloneApi({
    fixtureContents: JSON.stringify({
      version: 1,
      fixtures: [{
        product_id: FIXTURE.product_id,
        price_id: FIXTURE.price_id,
        event_id: FIXTURE.event_id,
        event_type: 'not-a-checkout-event',
        checkout_mode: FIXTURE.checkout_mode,
        price_type: FIXTURE.price_type,
        livemode: FIXTURE.livemode,
        unexpected_field: 'must not be echoed',
      }],
    }),
  });
  const mock = mockStripeAndResend();
  try {
    await withTestEnvironment(async () => {
      const handler = require(standalone.handlerPath);
      const response = await invoke(handler);
      assert.deepEqual(response, {
        statusCode: 200,
        body: {
          ok: false,
          reason: 'test fixture is not approved',
          diagnostic: {
            source: 'bundled_stripe_test_fixtures',
            status: 'invalid',
            code: 'invalid_fixture_entry',
          },
        },
      });
      assert.doesNotMatch(JSON.stringify(response.body), /must not be echoed/);
    });
    assert.equal(mock.calls.length, 0);
  } finally {
    mock.restore();
    fs.rmSync(standalone.root, { recursive: true, force: true });
  }
});

test('fulfill: malformed packaged JSON fails closed without exposing loader details', async () => {
  const standalone = copyStandaloneApi({ fixtureContents: '{"fixtures":[' });
  const mock = mockStripeAndResend();
  try {
    await withTestEnvironment(async () => {
      const handler = require(standalone.handlerPath);
      const response = await invoke(handler);
      assert.deepEqual(response, {
        statusCode: 200,
        body: {
          ok: false,
          reason: 'test fixture is not approved',
          diagnostic: {
            source: 'bundled_stripe_test_fixtures',
            status: 'invalid',
            code: 'invalid_metadata_json',
          },
        },
      });
      assert.doesNotMatch(JSON.stringify(response.body), /SyntaxError|stripe_test_fixtures\.json/);
    });
    assert.equal(mock.calls.length, 0);
  } finally {
    mock.restore();
    fs.rmSync(standalone.root, { recursive: true, force: true });
  }
});
