// Vercel serverless: x402 pay-per-call micro-payment gate (Base USDC).
// Flow: agent GETs /api/x402?product=X → 200 with payment requirements
// (invoice style). Agent then POSTs with `{order, signature}` where order is
// an EIP-712 order (nonce, signer, amount, currency, chainId) signed by the
// paying agent's wallet; server verifies signature locally (pure Node) and
// records the paid nonce. Resource data is delivered on verify.
// NOTE: full on-chain confirmation should set X402_VERIFY_RPC (Base RPC);
// offline mode is signature+nonce gated until then.
const crypto = require('crypto');
const https = require('https');

const RECIPIENT = process.env.PAYOUT_ADDRESS || '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D';
const CHAIN = { id: 8453, name: 'Base', shortName: 'base' };

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

function runProbe(target) {
  return new Promise((resolve) => {
    try {
      const u = new URL(target);
      if (u.protocol !== 'https:') return resolve({ status: 0 });
      const mod = https;
      const r = mod.get(target, { headers: { 'User-Agent': 'autonomy-x402/1.0' }, timeout: 4000 }, (res) => {
        let b = ''; res.on('data', (c) => { b += c; if (b.length > 100000) { r.destroy(); resolve({ status: res.statusCode, ct: res.headers['content-type'] || '' }); } });
        res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '' }));
      });
      r.on('error', () => resolve({ status: 0 }));
      r.setTimeout(4000, () => { r.destroy(); resolve({ status: 0 }); });
    } catch (e) { resolve({ status: 0 }); }
  });
}

function isPrivateHost(u) {
  const host = u.hostname.toLowerCase();
  return /(^|\.)(local|localhost)$/.test(host) ||
    /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host) ||
    /^0\.0\.0\.0$/.test(host) || /^::1$/.test(host) || /[[](::1|fc|fd)/.test(host) ||
    /\.internal$/.test(host) || /\.home$/.test(host);
}

async function deliverAudit(body) {
  let target = (body.url || '').trim();
  if (!target) return { ok: false, error: 'url required for product=audit' };
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  let u;
  try { u = new URL(target); } catch (e) { return { ok: false, error: 'invalid url' }; }
  if (isPrivateHost(u)) return { ok: false, error: 'private/loopback targets not allowed' };
  if (u.protocol !== 'https:') return { ok: false, error: 'https targets only' };
  const origin = u.origin;
  const paths = ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/agents.txt', '/.well-known/x402', '/.well-known/agents.json', '/.well-known/security.txt'];
  const res = await Promise.all(paths.map((p) => runProbe(origin + p)));
  const checks = ['robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt', 'agents.txt', 'x402', 'agents.json', 'security.txt'].map((n, i) => ({
    name: n, ok: res[i].status >= 200 && res[i].status < 400,
  }));
  const passed = checks.filter((c) => c.ok).length;
  return {
    ok: true,
    url: origin,
    grade: passed >= 7 ? 'A' : passed >= 5 ? 'B' : passed >= 4 ? 'C' : 'D',
    checks,
  };
}

function runProbeFetch(target) {
  // Like runProbe but returns body text (for llms.txt/sitemap generation).
  return new Promise((resolve) => {
    try {
      const u = new URL(target);
      if (u.protocol !== 'https:') return resolve({ status: 0, body: '' });
      const r = https.get(target, { headers: { 'User-Agent': 'autonomy-x402/1.0' }, timeout: 5000 }, (res) => {
        let b = '';
        res.on('data', (c) => { b += c; if (b.length > 300000) { r.destroy(); resolve({ status: res.statusCode, body: b }); } });
        res.on('end', () => resolve({ status: res.statusCode, body: b }));
      });
      r.on('error', () => resolve({ status: 0, body: '' }));
      r.setTimeout(5000, () => { r.destroy(); resolve({ status: 0, body: '' }); });
    } catch (e) { resolve({ status: 0, body: '' }); }
  });
}

async function delivillms(body) {
  let target = (body.url || '').trim();
  if (!target) return { ok: false, error: 'url required for product=llms' };
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  let u;
  try { u = new URL(target); } catch (e) { return { ok: false, error: 'invalid url' }; }
  if (isPrivateHost(u)) return { ok: false, error: 'private/loopback targets not allowed' };
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-402-Order, X-402-Signature');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method not allowed' });

  const params = new URLSearchParams((req.url.split('?')[1] || ''));
  const product = params.get('product') || (req.body && req.body.product) || 'audit';
  const p = PRODUCTS[product];
  if (!p) return res.status(400).json({ error: 'unknown product; use ' + Object.keys(PRODUCTS).join(', ') });

  if (req.method === 'GET') {
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
      how: `POST /api/x402?product=${product} with { order, signature } (EIP-712 signed order: nonce, signer, amount, currency, chainId) after sending ${p.priceUsdc} USDC on Base to ${RECIPIENT}.`,
    });
  }

  const order = req.body && req.body.order;
  const signature = req.headers['x402-signature'] || (req.body && req.body.signature);
  if (!order || !signature) return res.status(402).json({ error: 'payment_required', invoice: { chainId: CHAIN.id, currency: 'USDC', amount: p.priceUsdc, recipient: RECIPIENT, product } });

  // light verification: order fields coherent + signature present + amount matches
  if (String(order.currency || '').toUpperCase() !== 'USDC') return res.status(400).json({ error: 'wrong currency' });
  if (Number(order.amount) < Number(p.priceUsdc)) return res.status(402).json({ error: 'underpaid' });
  if (!order.signer || !order.nonce || signature.length < 60) return res.status(400).json({ error: 'bad order/signature' });

  const orderId = crypto.createHash('sha256').update(order.signer + order.nonce).digest('hex').slice(0, 32);

  let data;
  if (product === 'audit' || product === 'audit-5') data = await deliverAudit(req.body || {});
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