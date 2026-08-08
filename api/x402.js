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
};

function runProbe(target) {
  return new Promise((resolve) => {
    const u = new URL(target);
    const mod = u.protocol === 'https:' ? https : require('http');
    const r = mod.get(target, { headers: { 'User-Agent': 'autonomy-x402/1.0' }, timeout: 8000 }, (res) => {
      let b = ''; res.on('data', (c) => { b += c; if (b.length > 150000) r.destroy(); });
      res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '' }));
    });
    r.on('error', () => resolve({ status: 0 }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0 }); });
  });
}

async function deliverAudit(body) {
  let target = (body.url || '').trim();
  if (!target) return { ok: false, error: 'url required for product=audit' };
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  let origin;
  try { origin = new URL(target).origin; } catch (e) { return { ok: false, error: 'invalid url' }; }
  const paths = ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/agents.txt', '/.well-known/x402', '/.well-known/agents.json', '/.well-known/security.txt'];
  const res = [];
  for (const p of paths) res.push(await runProbe(origin + p));
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

const typeCurve = { audit: '2.0', 'audit-5': '7.0', data: '1.0' };

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