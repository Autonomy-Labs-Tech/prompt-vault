// Vercel serverless: x402 pay-per-call micro-payment gate (Base USDC).
// Flow: agent GETs /api/x402?product=X → 402 with payment requirements.
// Agent then POSTs `{order, signature, txHash}`. Production verifies the
// EIP-712 order and matching Base USDC transfer before delivering data.
const crypto = require('crypto');
const walletWatch = require('./wallet_watch');
const {
  parsePaymentHeader,
  verifyPayment,
} = require('./payment_verify');
const { publicGet } = require('./public_fetch');

const RECIPIENT = '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D';
const CHAIN = { id: 8453, name: 'Base', shortName: 'base' };
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const PRODUCTS = {
  audit: {
    name: 'Agent-readiness audit (1 site)',
    priceUsdc: '2.00',
    note: 'full readiness probe, grade + summary of any public site',
  },
  'audit-5': { name: 'Audit 5 sites', priceUsdc: '7.00' },
  data:     { name: 'Storefront catalog + metrics payload', priceUsdc: '1.00' },
  llms:     { name: 'llms.txt generator (1 site)', priceUsdc: '3.00' },
  watch:    { name: 'Wallet Watch snapshot (1 Base address)', priceUsdc: '1.00' },
  'watch-pro': { name: 'Wallet Watch Pro snapshot (1 Base address)', priceUsdc: '5.00' },
};

function runProbe(target, timeoutMs = 4000) {
  return publicGet(target, { timeoutMs: Math.max(1, Math.min(timeoutMs, 4000)), maxBytes: 100000 })
    .catch(() => ({ status: 0, ct: '', bytes: 0 }));
}

async function deliverAudit(body, maxSites = 1) {
  const requested = maxSites > 1 ? body.urls : [body.url];
  if (!Array.isArray(requested) || requested.length !== maxSites) {
    return { ok: false, error: `exactly ${maxSites} url${maxSites === 1 ? '' : 's'} required` };
  }
  const targets = requested.map((value) => String(value || '').trim()).filter(Boolean);
  if (targets.length !== maxSites) return { ok: false, error: `exactly ${maxSites} url${maxSites === 1 ? '' : 's'} required` };
  const deadline = Date.now() + 15000;
  const audits = [];
  for (let target of targets) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return { ok: false, error: 'audit deadline exceeded' };
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
    let u;
    try { u = new URL(target); } catch (e) { return { ok: false, error: 'invalid url' }; }
    if (u.protocol !== 'https:') return { ok: false, error: 'https targets only' };
    const origin = u.origin;
    const paths = ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/agents.txt', '/.well-known/x402', '/.well-known/agents.json', '/.well-known/security.txt'];
    const res = await Promise.all(paths.map((p) => runProbe(origin + p, deadline - Date.now())));
    const checks = ['robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt', 'agents.txt', 'x402', 'agents.json', 'security.txt'].map((n, i) => ({
      name: n, ok: res[i].status >= 200 && res[i].status < 400,
    }));
    const passed = checks.filter((c) => c.ok).length;
    audits.push({
      url: origin,
      grade: passed >= 7 ? 'A' : passed >= 5 ? 'B' : passed >= 4 ? 'C' : 'D',
      checks,
    });
  }
  return { ok: true, audits, ...(maxSites === 1 ? audits[0] : { count: audits.length }) };
}

function runProbeFetch(target) {
  // Like runProbe but returns body text (for llms.txt/sitemap generation).
  return publicGet(target, { timeoutMs: 5000, maxBytes: 300000 })
    .catch(() => ({ status: 0, body: '' }));
}

async function delivillms(body) {
  let target = (body.url || '').trim();
  if (!target) return { ok: false, error: 'url required for product=llms' };
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  let u;
  try { u = new URL(target); } catch (e) { return { ok: false, error: 'invalid url' }; }
  if (u.protocol !== 'https:') return { ok: false, error: 'https targets only' };
  const origin = u.origin;

  const sitemap = await runProbeFetch(origin + '/sitemap.xml');
  const links = [];
  if (sitemap.status >= 200 && sitemap.status < 400 && sitemap.body) {
    const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
    let m; while ((m = re.exec(sitemap.body)) && links.length < 40) links.push(m[1]);
  }
  const title = u.hostname.replace(/^www\./, '');
  const lines = [
    '# ' + title,
    '',
    '> ' + title + ' — agent-friendly site summary. See /llms.txt, /robots.txt, /sitemap.xml.',
    '',
  ];
  lines.push('## Pages');
  if (links.length) {
    for (const l of links.slice(0, 40)) lines.push('- [' + l.replace(/^https?:\/\//, '') + '](' + l + '): page on ' + title);
  } else {
    lines.push('- [/](' + origin + '/): home page of ' + title);
    lines.push('> Note: no <loc> entries found in ' + origin + '/sitemap.xml — add URLs above as your content grows.');
  }
  const llmsContent = lines.join('\n') + '\n';
  return { ok: true, url: origin, llms_txt: llmsContent, sitemap_found: links.length > 0 };
}

function deliverData() {
  try {
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync(require('path').join(process.cwd(), 'products.json'), 'utf8'));
    const items = p.itemListElement || p.products || [];
    return { ok: true, catalog_count: items.length, products: items.slice(0, 50) };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

const typeCurve = { audit: '2.0', 'audit-5': '7.0', data: '1.0', llms: '3.0' };

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-PAYMENT, PAYMENT-REQUIRED, X-402-Signature');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method not allowed' });

  const params = new URLSearchParams((req.url.split('?')[1] || ''));
  const product = params.get('product') || (req.body && req.body.product) || 'audit';
  const p = PRODUCTS[product];
  if (!p) return res.status(400).json({ error: 'unknown product; use ' + Object.keys(PRODUCTS).join(', ') });

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
      },
      payment_protocol: requirement,
      how: `POST /api/x402?product=${product} with { order, signature, txHash } (EIP-712 signed order: nonce, signer, amount, currency, chainId) after sending ${p.priceUsdc} USDC on Base to ${RECIPIENT}.`,
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

  const txHash = String((paymentBody && (paymentBody.txHash || paymentBody.tx_hash)) || '');
  const payment = await verifyPayment({
    order,
    signature,
    txHash,
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

  const orderId = crypto.createHash('sha256').update(order.signer + order.nonce).digest('hex').slice(0, 32);

  // Wallet Watch has its own delivery implementation (including the
  // Blockscout payload schema). Keep x402 as the payment gate, then hand the
  // already-validated request to that handler instead of returning a generic
  // 422 for an advertised product.
  if (product === 'watch' || product === 'watch-pro') {
    req._x402PaymentVerified = true;
    return walletWatch(req, res);
  }

  let data;
  if (product === 'audit' || product === 'audit-5') {
    data = await deliverAudit(paymentBody || {}, product === 'audit-5' ? 5 : 1);
  }
  else if (product === 'llms') data = await delivillms(req.body || {});
  else if (product === 'data') data = deliverData();
  if (!data || !data.ok) return res.status(422).json({ error: data && data.error ? data.error : 'delivery failed' });

  return res.status(200).json({
    ok: true,
    order_id: orderId,
    product: p.name,
    amount_usdc: p.priceUsdc,
    chain_id: CHAIN.id,
    token: 'USDC',
    received_at_utc: new Date().toISOString(),
    data,
  });
};

module.exports.deliverAudit = deliverAudit;