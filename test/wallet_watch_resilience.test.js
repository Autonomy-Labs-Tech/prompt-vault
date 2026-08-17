const http = require('node:http');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const walletWatch = require('../api/wallet_watch');
const x402 = require('../api/x402');

const ADDRESS = '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D';
const TOKEN = '0x0000000000000000000000000000000000000001';
const ORIGINAL_ENV = {};
const ENV_KEYS = [
  'X402_OFFLINE',
  'X402_TEST_MODE',
  'NODE_ENV',
  'WALLET_WATCH_BLOCKSCOUT_V2_URL',
  'WALLET_WATCH_BLOCKSCOUT_V1_URL',
  'WALLET_WATCH_PROVIDER_V2_URL',
  'WALLET_WATCH_PROVIDER_V1_URL',
  'WALLET_WATCH_PROVIDER_TIMEOUT_MS',
  'WALLET_WATCH_MAX_PROVIDER_BODY_BYTES',
  'WALLET_WATCH_PROVIDER_MAX_BYTES',
];

for (const key of ENV_KEYS) ORIGINAL_ENV[key] = process.env[key];

function setProviderEnv(port, options = {}) {
  process.env.WALLET_WATCH_BLOCKSCOUT_V2_URL = `http://127.0.0.1:${port}/v2`;
  process.env.WALLET_WATCH_BLOCKSCOUT_V1_URL = `http://127.0.0.1:${port}/v1`;
  delete process.env.WALLET_WATCH_PROVIDER_V2_URL;
  delete process.env.WALLET_WATCH_PROVIDER_V1_URL;
  process.env.WALLET_WATCH_PROVIDER_TIMEOUT_MS = String(options.timeoutMs || 250);
  process.env.WALLET_WATCH_MAX_PROVIDER_BODY_BYTES = String(options.maxBodyBytes || 256);
  delete process.env.WALLET_WATCH_PROVIDER_MAX_BYTES;
}

function restoreProviderEnv() {
  for (const key of ENV_KEYS) {
    if (ORIGINAL_ENV[key] === undefined) delete process.env[key];
    else process.env[key] = ORIGINAL_ENV[key];
  }
}

function normalTransactions() {
  return {
    items: [
      {
        hash: '0xtransaction',
        timestamp: '2026-08-16T00:00:00Z',
        from: { hash: ADDRESS.toLowerCase() },
        to: { hash: TOKEN },
        value: '1000000000000000000',
        status: 'confirmed',
      },
    ],
    next_page_params: null,
  };
}

function fixtureTransactions(count, hasNextPage = false) {
  return {
    items: Array.from({ length: count }, (_, index) => ({
      hash: `0xtransaction-${index + 1}`,
      timestamp: `2026-08-16T00:${String(index % 60).padStart(2, '0')}:00Z`,
      from: { hash: ADDRESS.toLowerCase() },
      to: { hash: TOKEN },
      value: String((index + 1) * 1000000000000000),
      status: 'confirmed',
    })),
    next_page_params: hasNextPage ? { page: 2 } : null,
  };
}

function normalTokens() {
  return {
    status: '1',
    message: 'OK',
    result: [
      {
        contractAddress: TOKEN,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: '6',
        value: '42000000',
      },
    ],
  };
}

function fixtureTokens(count) {
  return {
    status: '1',
    message: 'OK',
    result: Array.from({ length: count }, (_, index) => ({
      contractAddress: `0x${String(index + 1).padStart(40, '0')}`,
      symbol: `T${index + 1}`,
      name: `Fixture Token ${index + 1}`,
      decimals: '18',
      value: String(index + 1),
    })),
  };
}

function startProvider(mode) {
  const server = http.createServer((req, res) => {
    const v2 = req.url.startsWith('/v2/');
    if (mode === 'timeout') return;

    if (mode === 'rate_limited') {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Retry-After', '3');
      return res.end('{"message":"too many requests"}');
    }

    if (mode === 'malformed') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      return res.end('<html>upstream error</html>');
    }

    if (mode === 'truncated') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.write(v2 ? '{"items":[' : '{"result":[');
      return setTimeout(() => res.destroy(), 10);
    }

    if (mode === 'watch_overflow' || mode === 'watch_pro_overflow') {
      const count = mode === 'watch_pro_overflow' ? 201 : 21;
      const transactions = mode === 'watch_pro_overflow' ? 101 : 11;
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify(
          v2
            ? fixtureTransactions(transactions, mode === 'watch_pro_overflow')
            : fixtureTokens(count),
        ),
      );
    }

    if (mode === 'oversized' || (mode === 'partial' && !v2)) {
      const body = JSON.stringify(v2 ? normalTransactions() : normalTokens()) + 'x'.repeat(500);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(body);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(v2 ? normalTransactions() : normalTokens()));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function startApp(handler) {
  const server = http.createServer((req, res) => {
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(body));
      return res;
    };

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      req.body = raw ? JSON.parse(raw) : undefined;
      Promise.resolve(handler(req, res)).catch((error) => {
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

function stopServer(server) {
  if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
  return new Promise((resolve) => server.close(() => resolve()));
}

function request(port, pathname, body, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify(body);
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method: 'POST',
        path: pathname,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
          });
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('app request timed out')));
    req.end(requestBody);
  });
}

function paidBody(product = 'watch') {
  return {
    product,
    address: ADDRESS,
    order: {
      currency: 'USDC',
      amount: product === 'watch-pro' ? '5.00' : '1.00',
      signer: ADDRESS,
      nonce: 'fixture-' + product,
    },
    signature: 'a'.repeat(64),
  };
}

async function withFixture(mode, handler, fn, options) {
  const provider = await startProvider(mode);
  const app = await startApp(handler);
  setProviderEnv(provider.port, options);
  process.env.NODE_ENV = 'test';
  process.env.X402_OFFLINE = 'true';
  process.env.X402_TEST_MODE = 'true';
  try {
    return await fn(app.port);
  } finally {
    restoreProviderEnv();
    await stopServer(app.server);
    await stopServer(provider.server);
  }
}

test('normal small provider responses preserve the documented wallet schema', async () => {
  await withFixture('normal', walletWatch, async (port) => {
    const response = await request(port, '/?product=watch&address=' + ADDRESS, paidBody());
    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.deepEqual(Object.keys(response.body.data).sort(), [
      'address',
      'fetched_at_utc',
      'network',
      'token_balances',
      'token_balances_count',
      'transaction_count',
      'transactions',
    ]);
    assert.equal(response.body.data.transaction_count, 1);
    assert.equal(response.body.data.token_balances_count, 1);
    assert.equal(response.body.data.transactions[0].direction, 'out');
    assert.equal(response.body.data.token_balances[0].balance_raw, '42000000');
  }, { maxBodyBytes: 4096 });
});

test('one limited provider source returns explicit partial metadata without fabricated data', async () => {
  await withFixture('partial', walletWatch, async (port) => {
    const response = await request(port, '/?product=watch&address=' + ADDRESS, paidBody());
    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.partial, true);
    assert.equal(response.body.provider_status, 'partial');
    assert.equal(response.body.data.partial, true);
    assert.equal(response.body.data.complete, false);
    assert.equal(response.body.data.token_balances_count, null);
    assert.deepEqual(response.body.data.token_balances, []);
    assert.equal(response.body.data.token_balances_known, false);
    assert.equal(response.body.data.token_balances_complete, false);
    assert.equal(response.body.data.provider_limited, true);
  }, { maxBodyBytes: 512 });
});

test('valid token and transaction overflow is capped and marked incomplete for each product', async () => {
  await withFixture('watch_overflow', walletWatch, async (port) => {
    const response = await request(port, '/?product=watch&address=' + ADDRESS, paidBody());
    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.partial, true);
    assert.equal(response.body.data.partial, true);
    assert.equal(response.body.data.complete, false);
    assert.equal(response.body.data.transactions.length, 10);
    assert.equal(response.body.data.transaction_count, 10);
    assert.equal(response.body.data.token_balances.length, 20);
    assert.equal(response.body.data.token_balances_count, 20);
    assert.equal(response.body.data.transaction_limit, 10);
    assert.equal(response.body.data.token_balances_limit, 20);
    assert.equal(response.body.data.transactions_complete, false);
    assert.equal(response.body.data.token_balances_complete, false);
    assert.equal(response.body.data.provider_limited, true);
    assert.equal(
      response.body.data.sources.transactions.error,
      'provider_transaction_limit',
    );
    assert.deepEqual(
      response.body.data.sources.transactions.errors,
      ['provider_transaction_limit'],
    );
    assert.equal(
      response.body.data.sources.token_balances.error,
      'provider_token_limit',
    );
  }, { maxBodyBytes: 1024 * 1024 });

  await withFixture('watch_pro_overflow', walletWatch, async (port) => {
    const response = await request(
      port,
      '/?product=watch-pro&address=' + ADDRESS,
      paidBody('watch-pro'),
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.partial, true);
    assert.equal(response.body.data.partial, true);
    assert.equal(response.body.data.complete, false);
    assert.equal(response.body.data.transactions.length, 100);
    assert.equal(response.body.data.transaction_count, 100);
    assert.equal(response.body.data.token_balances.length, 200);
    assert.equal(response.body.data.token_balances_count, 200);
    assert.equal(response.body.data.transaction_limit, 100);
    assert.equal(response.body.data.token_balances_limit, 200);
    assert.equal(response.body.data.transactions_complete, false);
    assert.equal(response.body.data.token_balances_complete, false);
    assert.equal(response.body.data.provider_limited, true);
    assert.equal(
      response.body.data.sources.transactions.error,
      'provider_transaction_limit',
    );
    assert.deepEqual(
      response.body.data.sources.transactions.errors,
      ['provider_page_limited', 'provider_transaction_limit'],
    );
    assert.equal(
      response.body.data.sources.token_balances.error,
      'provider_token_limit',
    );
  }, { maxBodyBytes: 1024 * 1024 });
});

test('Wallet Watch product copy documents bounded fields without promising ETH', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'wallet-watch.html'), 'utf8');
  const mcp = fs.readFileSync(path.join(__dirname, '..', 'api', 'mcp.js'), 'utf8');
  const llms = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8');
  for (const copy of [page, mcp, llms]) {
    assert.doesNotMatch(copy, /ETH balance/i);
    assert.doesNotMatch(copy, /full token list/i);
    assert.match(copy, /partial/i);
    assert.match(copy, /provider.?limited/i);
  }
  assert.match(page, /20 ERC-20 token balances/);
  assert.match(page, /100 recent transactions/);
  assert.match(mcp, /up to 200 ERC-20 token balances/);
  assert.match(llms, /token_balances_complete/);
});

test('oversized, truncated, malformed, rate-limited, and timed-out providers return bounded JSON', async () => {
  for (const mode of ['oversized', 'truncated', 'malformed', 'rate_limited', 'timeout']) {
    const started = Date.now();
    const response = await withFixture(
      mode,
      walletWatch,
      (port) => request(port, '/?product=watch&address=' + ADDRESS, paidBody(), 1200),
      { timeoutMs: 120, maxBodyBytes: 256 },
    );
    const elapsed = Date.now() - started;
    assert.ok(elapsed < 1000, `${mode} took ${elapsed}ms`);
    assert.equal(response.status, 503, `${mode} must be retryable JSON`);
    assert.equal(response.headers['content-type'].includes('application/json'), true);
    assert.equal(response.body.retryable, true);
    assert.equal(response.body.unavailable, true);
    assert.equal(typeof response.body.code, 'string');
    if (mode === 'rate_limited') assert.equal(response.body.code, 'rate_limited');
    if (mode === 'truncated') {
      assert.equal(response.body.truncated, true, JSON.stringify(response.body));
    }
  }
});

test('x402 wallet-watch delivery keeps the payment gate and uses the hardened result path', async () => {
  const originalOffline = process.env.X402_OFFLINE;
  await withFixture('normal', x402, async (port) => {
    process.env.X402_OFFLINE = 'true';
    process.env.X402_TEST_MODE = 'true';
    process.env.NODE_ENV = 'test';
    const response = await request(port, '/?product=watch-pro', paidBody('watch-pro'));
    assert.equal(response.status, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.product, 'Wallet Watch Pro snapshot (1 address)');
    assert.equal(response.body.data.transaction_count, 1);
  }, { maxBodyBytes: 4096 });

  await withFixture('rate_limited', x402, async (port) => {
    process.env.X402_OFFLINE = 'true';
    process.env.X402_TEST_MODE = 'true';
    process.env.NODE_ENV = 'test';
    const response = await request(port, '/?product=watch', paidBody());
    assert.equal(response.status, 503);
    assert.equal(response.body.code, 'rate_limited');
    assert.equal(response.body.retryable, true);
    assert.equal(response.body.unavailable, true);
  });
  if (originalOffline === undefined) delete process.env.X402_OFFLINE;
  else process.env.X402_OFFLINE = originalOffline;
});

test('x402 rejects paid-shaped requests without an on-chain transaction hash', async () => {
  const originalOffline = process.env.X402_OFFLINE;
  delete process.env.X402_OFFLINE;
  const app = await startApp(x402);
  const body = paidBody();
  body.order.amount = '2.00';
  const response = await request(
    app.port,
    '/?product=audit',
    body,
  );
  await stopServer(app.server);
  assert.equal(response.status, 402);
  assert.equal(response.body.error, 'payment_not_verified_onchain');
  assert.equal(response.body.detail, 'txHash required');
  if (originalOffline === undefined) delete process.env.X402_OFFLINE;
  else process.env.X402_OFFLINE = originalOffline;
});

test('direct wallet-watch POSTs also require on-chain payment evidence', async () => {
  const previous = {
    X402_OFFLINE: process.env.X402_OFFLINE,
    X402_TEST_MODE: process.env.X402_TEST_MODE,
    NODE_ENV: process.env.NODE_ENV,
  };
  delete process.env.X402_OFFLINE;
  delete process.env.X402_TEST_MODE;
  process.env.NODE_ENV = 'production';
  const app = await startApp(walletWatch);
  const response = await request(app.port, '/?product=watch&address=' + ADDRESS, paidBody());
  await stopServer(app.server);
  assert.equal(response.status, 402);
  assert.equal(response.body.error, 'payment_not_verified_onchain');
  assert.equal(response.body.detail, 'txHash required');
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
