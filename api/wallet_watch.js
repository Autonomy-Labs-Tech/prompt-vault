// Vercel serverless: Agent Wallet Watch — pay-per-call Base wallet monitor.
// Free tier: 1 call / day / IP for a single address. Paid tier (x402): deeper
// bounded token balances + transaction history + tx direction.
// Data sources: Blockscout keyless API (Base). No API key, no signup.
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const {
  parsePaymentHeader,
  verifyPayment,
} = require('./payment_verify');

const RECIPIENT = '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const CHAIN = { id: 8453, name: 'Base', shortName: 'base' };
const BLOCKSCOUT = 'https://base.blockscout.com/api/v2';
const BLOCKSCOUT_V1 = 'https://base.blockscout.com/api';
const DEFAULT_PROVIDER_TIMEOUT_MS = 10000;
const DEFAULT_MAX_PROVIDER_BODY_BYTES = 500000;
const MAX_PROVIDER_TIMEOUT_MS = 30000;
const MAX_PROVIDER_BODY_BYTES = 2000000;

const LIMITS = Object.freeze({
  watch: Object.freeze({ transactions: 10, tokenBalances: 20 }),
  'watch-pro': Object.freeze({ transactions: 100, tokenBalances: 200 }),
});

const PRODUCTS = {
  watch: {
    name: 'Wallet Watch snapshot (1 address)',
    priceUsdc: '1.00',
    note: 'Up to 20 ERC-20 token balances + up to 10 recent transactions for one Base address. Native coin balances are not included.',
  },
  'watch-pro': {
    name: 'Wallet Watch Pro snapshot (1 address)',
    priceUsdc: '5.00',
    note: 'Up to 200 ERC-20 token balances + up to 100 recent transactions + transaction direction labels. Native coin balances are not included.',
  },
};

function isAddress(a) {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

function boundedNumber(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum) return fallback;
  return Math.min(Math.floor(number), maximum);
}

function providerConfig() {
  return {
    timeoutMs: boundedNumber(
      process.env.WALLET_WATCH_PROVIDER_TIMEOUT_MS,
      DEFAULT_PROVIDER_TIMEOUT_MS,
      1,
      MAX_PROVIDER_TIMEOUT_MS,
    ),
    maxBodyBytes: boundedNumber(
      process.env.WALLET_WATCH_MAX_PROVIDER_BODY_BYTES ||
        process.env.WALLET_WATCH_PROVIDER_MAX_BYTES,
      DEFAULT_MAX_PROVIDER_BODY_BYTES,
      256,
      MAX_PROVIDER_BODY_BYTES,
    ),
    v2Base:
      process.env.WALLET_WATCH_BLOCKSCOUT_V2_URL ||
      process.env.WALLET_WATCH_PROVIDER_V2_URL ||
      BLOCKSCOUT,
    v1Base:
      process.env.WALLET_WATCH_BLOCKSCOUT_V1_URL ||
      process.env.WALLET_WATCH_PROVIDER_V1_URL ||
      BLOCKSCOUT_V1,
  };
}

function providerUrl(base, path) {
  const root = String(base || '').replace(/\/+$/, '');
  if (String(path).startsWith('?')) return root + path;
  return root + '/' + String(path).replace(/^\/+/, '');
}

function headerValue(headers, name) {
  if (!headers) return '';
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : String(value || '');
}

function retryAfterSeconds(headers) {
  const value = headerValue(headers, 'retry-after').trim();
  if (!/^\d+$/.test(value)) return null;
  return Math.min(Number(value), 86400);
}

function providerFailure(code, details = {}) {
  const statusCode = Number(details.statusCode) || 0;
  const providerLimited =
    Boolean(details.providerLimited) ||
    statusCode === 429 ||
    code === 'rate_limited' ||
    code === 'body_too_large' ||
    code === 'truncated';
  return {
    ok: false,
    code,
    statusCode,
    retryable: details.retryable !== false,
    unavailable: true,
    truncated: Boolean(details.truncated) || code === 'truncated',
    providerLimited,
    bytes: Number(details.bytes) || 0,
    retryAfter: details.retryAfter ?? null,
    contentType: details.contentType || '',
  };
}

function stopResponse(response) {
  // Resolve the provider result before stopping the stream. This ordering is
  // intentional: an oversized or timed-out provider response must never
  // destroy a socket without resolving the delivery request first.
  try {
    if (response && typeof response.resume === 'function') response.resume();
  } catch (e) {
    // The response may already be closed; the provider result is still final.
  }
  try {
    if (response && typeof response.destroy === 'function') response.destroy();
  } catch (e) {
    // The response may already be closed; the provider result is still final.
  }
}

function stopRequest(request) {
  try {
    if (request && typeof request.destroy === 'function') request.destroy();
  } catch (e) {
    // Request cleanup is best effort after the bounded result is settled.
  }
}

function bsGet(path, base = BLOCKSCOUT) {
  const config = providerConfig();
  const url = providerUrl(base, path);
  return new Promise((resolve) => {
    let settled = false;
    let request = null;
    let response = null;
    let timer = null;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    const timeout = () => {
      const result = providerFailure('timeout');
      // Settle first so request cleanup cannot strand the caller.
      finish(result);
      stopResponse(response);
      stopRequest(request);
    };

    timer = setTimeout(timeout, config.timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();

    try {
      const transport = new URL(url).protocol === 'http:' ? http : https;
      request = transport.get(
        url,
        {
          headers: { 'User-Agent': 'autonomy-wallet-watch/1.1' },
          timeout: config.timeoutMs,
        },
        (res) => {
          response = res;
          let bytes = 0;
          let ended = false;
          const chunks = [];
          const statusCode = Number(res.statusCode) || 0;
          const contentType = headerValue(res.headers, 'content-type');
          const retryAfter = retryAfterSeconds(res.headers);

          const readFailure = (code, details = {}) => {
            finish(
              providerFailure(code, {
                statusCode,
                contentType,
                retryAfter,
                bytes,
                ...details,
              }),
            );
          };

          // Attach stream error listeners before any early cleanup. Calling
          // destroy() on a response without a listener can otherwise surface
          // as an unhandled error in a serverless invocation.
          if (typeof res.on === 'function') {
            res.on('error', () => {
              if (!settled) readFailure('provider_read_error');
            });
            res.on('aborted', () => {
              if (!settled) readFailure('truncated', { truncated: true });
            });
            res.on('close', () => {
              if (!ended && !settled) readFailure('truncated', { truncated: true });
            });
          }

          // Error responses do not need a body. Classify them before applying
          // the success-body limit so an oversized 429 remains explicitly
          // rate-limited instead of being mislabeled as a generic truncation.
          if (statusCode === 429) {
            readFailure('rate_limited');
            stopResponse(res);
            return;
          }
          if (statusCode < 200 || statusCode >= 300) {
            readFailure('provider_http_error');
            stopResponse(res);
            return;
          }

          const advertisedLength = Number(headerValue(res.headers, 'content-length'));
          if (Number.isFinite(advertisedLength) && advertisedLength > config.maxBodyBytes) {
            readFailure('body_too_large', { truncated: true, providerLimited: true });
            stopResponse(res);
            return;
          }

          res.on('data', (chunk) => {
            if (settled) return;
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
            bytes += buffer.length;
            if (bytes > config.maxBodyBytes) {
              readFailure('body_too_large', { truncated: true, providerLimited: true });
              stopResponse(res);
              return;
            }
            chunks.push(buffer);
          });

          res.on('end', () => {
            if (settled) return;
            ended = true;
            if (
              Number.isFinite(advertisedLength) &&
              advertisedLength >= 0 &&
              bytes < advertisedLength
            ) {
              readFailure('truncated', { truncated: true });
              return;
            }
            if (statusCode < 200 || statusCode >= 300) {
              readFailure(statusCode === 429 ? 'rate_limited' : 'provider_http_error');
              return;
            }

            const body = Buffer.concat(chunks).toString('utf8');
            if (!body.trim()) {
              readFailure('malformed_response');
              return;
            }

            try {
              finish({
                ok: true,
                value: JSON.parse(body),
                statusCode,
                bytes,
                contentType,
                retryAfter,
                truncated: false,
                providerLimited: false,
              });
            } catch (e) {
              readFailure('malformed_response');
            }
          });
        },
      );

      if (request && typeof request.on === 'function') {
        request.on('error', () => {
          if (settled) return;
          finish(
            providerFailure(response ? 'truncated' : 'provider_request_error', {
              statusCode: response ? Number(response.statusCode) || 0 : 0,
              contentType: response ? headerValue(response.headers, 'content-type') : '',
              truncated: Boolean(response),
            }),
          );
        });
        request.on('timeout', timeout);
      }
      if (request && typeof request.setTimeout === 'function') {
        request.setTimeout(config.timeoutMs, timeout);
      }
    } catch (e) {
      finish(providerFailure('provider_request_error'));
    }
  });
}

function sourceSummary(source, normalized) {
  const usable = Boolean(normalized.usable);
  const partial = Boolean(normalized.partial);
  const summary = {
    status: usable ? (partial ? 'partial' : 'ok') : 'unavailable',
    http_status: source.statusCode || null,
    error: normalized.error || (source.ok ? null : source.code),
    retryable: Boolean(source.retryable),
    truncated: Boolean(source.truncated),
    provider_limited: Boolean(source.providerLimited || normalized.providerLimited),
    complete: usable && !partial,
  };
  if (normalized.limit != null) summary.limit = normalized.limit;
  if (Array.isArray(normalized.errors) && normalized.errors.length) {
    summary.errors = normalized.errors;
  }
  return summary;
}

function normalizeTransactions(source, address, limit) {
  if (!source.ok) {
    return { usable: false, partial: false, error: source.code, items: [], limit };
  }
  if (!source.value || typeof source.value !== 'object' || !Array.isArray(source.value.items)) {
    return {
      usable: false,
      partial: false,
      error: 'malformed_response',
      items: [],
      limit,
    };
  }

  let malformedItems = 0;
  const normalizedItems = [];
  for (const tx of source.value.items) {
    if (!tx || typeof tx !== 'object' || typeof tx.hash !== 'string' || !tx.hash) {
      malformedItems += 1;
      continue;
    }
    const from = tx.from && typeof tx.from.hash === 'string' ? tx.from.hash : null;
    const to = tx.to && typeof tx.to.hash === 'string' ? tx.to.hash : null;
    const fromLower = from ? from.toLowerCase() : null;
    const toLower = to ? to.toLowerCase() : null;
    const value = tx.value == null ? '0' : String(tx.value);
    const numericValue = Number(value);
    normalizedItems.push({
      hash: tx.hash,
      timestamp: tx.timestamp,
      from,
      to,
      direction:
        fromLower === address ? 'out' : toLower === address ? 'in' : 'self',
      value_eth: Number.isFinite(numericValue) ? String(numericValue / 1e18) : '0',
      status: tx.status,
    });
  }

  const providerPageLimited = source.value.next_page_params != null;
  const providerRecordLimited = source.value.items.length > limit;
  const errors = [];
  if (malformedItems > 0) errors.push('malformed_item');
  if (providerPageLimited) errors.push('provider_page_limited');
  if (providerRecordLimited) errors.push('provider_transaction_limit');
  return {
    usable: true,
    partial: errors.length > 0,
    providerLimited: providerPageLimited || providerRecordLimited,
    error:
      providerRecordLimited
        ? 'provider_transaction_limit'
        : providerPageLimited
          ? 'provider_page_limited'
          : malformedItems > 0
            ? 'malformed_item'
            : null,
    errors,
    limit,
    items: normalizedItems.slice(0, limit),
  };
}

function normalizeTokens(source, limit) {
  if (!source.ok) {
    return { usable: false, partial: false, error: source.code, items: [], limit };
  }
  if (
    !source.value ||
    typeof source.value !== 'object' ||
    !Array.isArray(source.value.result)
  ) {
    return {
      usable: false,
      partial: false,
      error: 'malformed_response',
      items: [],
      limit,
    };
  }

  let malformedItems = 0;
  const balances = [];
  for (const token of source.value.result) {
    if (
      !token ||
      typeof token !== 'object' ||
      token.value == null ||
      (typeof token.value !== 'string' && typeof token.value !== 'number')
    ) {
      malformedItems += 1;
      continue;
    }
    balances.push({
      contract: token.contractAddress || null,
      symbol: token.symbol || '???',
      name: token.name || null,
      decimals: Number(token.decimals) || 18,
      balance_raw: String(token.value),
    });
  }

  const providerTokenLimited = source.value.result.length > limit;
  const errors = [];
  if (malformedItems > 0) errors.push('malformed_item');
  if (providerTokenLimited) errors.push('provider_token_limit');
  return {
    usable: true,
    partial: errors.length > 0,
    providerLimited: providerTokenLimited,
    error: providerTokenLimited
      ? 'provider_token_limit'
      : malformedItems > 0
        ? 'malformed_item'
        : null,
    errors,
    limit,
    items: balances.slice(0, limit),
  };
}

function unavailableResult(txSource, tokenSource, txData, tokenData) {
  const sources = {
    transactions: sourceSummary(txSource, txData),
    token_balances: sourceSummary(tokenSource, tokenData),
  };
  const allSources = [txSource, tokenSource];
  const rateLimited = allSources.some(
    (source) => source.code === 'rate_limited' || source.statusCode === 429,
  );
  const truncated = allSources.some((source) => source.truncated);
  const firstReason = allSources.find((source) => source.code)?.code;
  return {
    ok: false,
    error: 'blockscout unavailable',
    code: rateLimited
      ? 'rate_limited'
      : truncated
        ? 'provider_response_truncated'
        : firstReason || 'provider_unavailable',
    provider: 'blockscout',
    retryable: true,
    unavailable: true,
    truncated,
    providerLimited: allSources.some((source) => source.providerLimited),
    sources,
    upstreamStatus: allSources.find((source) => source.statusCode)?.statusCode || null,
    retryAfter: allSources.find((source) => source.retryAfter != null)?.retryAfter ?? null,
  };
}

async function fetchWalletData(address, pro) {
  const normalizedAddress = String(address).toLowerCase();
  const config = providerConfig();
  const limits = pro ? LIMITS['watch-pro'] : LIMITS.watch;
  const [txSource, tokenSource] = await Promise.all([
    bsGet(`/addresses/${normalizedAddress}/transactions`, config.v2Base),
    bsGet(`?module=account&action=tokenlist&address=${normalizedAddress}`, config.v1Base),
  ]);

  const txData = normalizeTransactions(
    txSource,
    normalizedAddress,
    limits.transactions,
  );
  const tokenData = normalizeTokens(tokenSource, limits.tokenBalances);
  if (!txData.usable && !tokenData.usable) {
    return unavailableResult(txSource, tokenSource, txData, tokenData);
  }

  const partial =
    !txData.usable ||
    !tokenData.usable ||
    txData.partial ||
    tokenData.partial;
  const truncated =
    Boolean(txSource.truncated) || Boolean(tokenSource.truncated);
  const providerLimited =
    Boolean(txSource.providerLimited) ||
    Boolean(tokenSource.providerLimited) ||
    Boolean(txData.providerLimited) ||
    Boolean(tokenData.providerLimited);
  const data = {
    address: normalizedAddress,
    network: 'base',
    fetched_at_utc: new Date().toISOString(),
    transaction_count: txData.usable ? txData.items.length : null,
    transactions: txData.items,
    token_balances_count: tokenData.usable ? tokenData.items.length : null,
    token_balances: tokenData.items,
  };

  // Keep the historical payload unchanged for a complete, small response.
  // Add quality metadata only when at least one provider source is incomplete
  // so clients cannot mistake an empty fallback array for complete data.
  if (partial) {
    data.partial = true;
    data.complete = false;
    data.provider_status = 'partial';
    data.truncated = truncated;
    data.provider_limited = providerLimited;
    data.retryable =
      Boolean(txSource.retryable) || Boolean(tokenSource.retryable);
    data.transactions_known = txData.usable;
    data.transactions_complete = txData.usable && !txData.partial;
    data.token_balances_known = tokenData.usable;
    data.token_balances_complete = tokenData.usable && !tokenData.partial;
    data.transaction_limit = limits.transactions;
    data.token_balances_limit = limits.tokenBalances;
    data.sources = {
      transactions: sourceSummary(txSource, txData),
      token_balances: sourceSummary(tokenSource, tokenData),
    };
    data.provider_errors = Object.entries(data.sources)
      .filter(([, source]) => source.status !== 'ok')
      .map(([name, source]) => ({ source: name, ...source }));
  }

  return { ok: true, data, partial };
}

function sendProviderUnavailable(res, result) {
  const body = {
    error: 'wallet data unavailable',
    code: result.code || 'provider_unavailable',
    provider: 'blockscout',
    retryable: true,
    unavailable: true,
    partial: false,
    truncated: Boolean(result.truncated),
    provider_limited: Boolean(result.providerLimited),
    upstream_status: result.upstreamStatus || null,
  };
  if (result.retryAfter != null) body.retry_after_seconds = result.retryAfter;
  return res.status(503).json(body);
}

async function walletWatchHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-PAYMENT, PAYMENT-REQUIRED, X-402-Signature');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method not allowed' });

  const params = new URLSearchParams((req.url.split('?')[1] || ''));
  const product = params.get('product') || (req.body && req.body.product) || 'watch';
  const p = PRODUCTS[product];
  if (!p) return res.status(400).json({ error: 'unknown product; use ' + Object.keys(PRODUCTS).join(', ') });

  const address = (params.get('address') || (req.body && req.body.address) || '').trim().toLowerCase();
  if (!isAddress(address)) return res.status(400).json({ error: 'address required; pass ?address=0x...' });

  if (req.method === 'GET') {
    const requirement = {
      protocol: 'x402-exact-transfer-v1',
      network: 'eip155:8453',
      asset: USDC_BASE,
      payTo: RECIPIENT,
      amount: p.priceUsdc,
      requires: ['order', 'signature', 'txHash'],
    };
    res.setHeader('PAYMENT-REQUIRED', Buffer.from(JSON.stringify(requirement)).toString('base64'));
    return res.status(402).json({
      error: 'Payment Required',
      payment_details: {
        amount: Number(p.priceUsdc),
        currency: 'USDC',
        network: 'base',
        chainId: CHAIN.id,
        recipient: RECIPIENT,
        action: p.name,
        product,
        address_hint: address,
      },
      payment_protocol: requirement,
      how: `POST /api/wallet_watch?product=${product}&address=${address} with { order, signature, txHash } (EIP-712 signed order: nonce, signer, amount, currency, chainId) after sending ${p.priceUsdc} USDC on Base to ${RECIPIENT}.`,
    });
  }

  let paymentBody = req.body;
  if ((!paymentBody || !paymentBody.order) && (req.headers['x-payment'] || req.headers.payment)) {
    const headerPayment = parsePaymentHeader(req.headers['x-payment'] || req.headers.payment);
    paymentBody = headerPayment && typeof headerPayment === 'object'
      ? { ...(req.body && typeof req.body === 'object' ? req.body : {}), ...headerPayment }
      : req.body;
  }
  const order = paymentBody && paymentBody.order;
  const signature = req.headers['x-402-signature']
    || req.headers['x402-signature']
    || (paymentBody && paymentBody.signature);
  if (!order || !signature) return res.status(402).json({ error: 'payment_required', invoice: { chainId: CHAIN.id, currency: 'USDC', amount: p.priceUsdc, recipient: RECIPIENT, product } });

  if (!req._x402PaymentVerified) {
    const payment = await verifyPayment({
      order,
      signature,
      txHash: paymentBody.txHash || paymentBody.tx_hash,
      recipient: RECIPIENT,
      requiredUsdc: Number(p.priceUsdc),
    });
    if (!payment.ok) {
      return res.status(payment.status || 402).json({
        error: 'payment_not_verified_onchain',
        detail: payment.error,
        invoice: { chainId: CHAIN.id, currency: 'USDC', amount: p.priceUsdc, recipient: RECIPIENT, product },
      });
    }
  }

  let result;
  try {
    result = await fetchWalletData(address, product === 'watch-pro');
  } catch (e) {
    result = {
      ok: false,
      code: 'provider_unavailable',
      error: 'blockscout unavailable',
      provider: 'blockscout',
      retryable: true,
      unavailable: true,
    };
  }
  if (!result || !result.ok) return sendProviderUnavailable(res, result || {});

  const orderId = crypto.createHash('sha256').update(order.signer + order.nonce + address).digest('hex').slice(0, 32);
  const response = {
    ok: true,
    order_id: orderId,
    product: p.name,
    amount_usdc: p.priceUsdc,
    chain_id: CHAIN.id,
    token: 'USDC',
    received_at_utc: new Date().toISOString(),
    data: result.data,
  };
  if (result.partial) {
    response.partial = true;
    response.provider_status = 'partial';
  }
  return res.status(200).json(response);
}

module.exports = walletWatchHandler;
// These helpers are intentionally exposed as properties for bounded fixture
// tests and local delivery checks; the default export remains the Vercel
// `(req, res)` handler.
module.exports.fetchWalletData = fetchWalletData;
module.exports.bsGet = bsGet;
module.exports.PRODUCTS = PRODUCTS;
module.exports.LIMITS = LIMITS;
