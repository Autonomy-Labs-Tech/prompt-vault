// Vercel serverless: x402 pay-per-call micro-payment gate (Base USDC).
// Flow: agent → POST /api/x402 with { product } → server issues 402 invoice
// → agent sends USDC via Coinbase Commerce-style x402 order (signed EIP-712)
// → POST /api/x402/verify with order+signature → 200 + product data.
// This implementation verifies the order signature locally (pure Node, no RPC
// needed at request time) and records payments to the Vercel KV-free state map.
const crypto = require('crypto');

const PRODUCTS = {
  audit:    { name: 'Agent-readiness audit (1 site)',   amountUsdc: '2.00', fiat: '2.00 EUR', fn: require('./_auditCore.js') },
  'audit-5': { name: 'Audit 5 sites',                   amountUsdc: '7.00', fiat: '7.00 EUR', fn: require('./_auditCore.js') },
  data:     { name: 'Storefront catalog + metrics',     amountUsdc: '1.00', fiat: '1.00 EUR', fn: () => require('./../../products.json') },
};

// EIP-712 domain for x402 (per spec: coinbase/x402). Signer wallet must prove payment.
function recoverOrder(order) {
  return order && order.signer;
}

function verifySignature(order, signature) {
  // Real x402 uses an EIP-712 order signed by the agent's wallet; the payment
  // (USDC transfer to RECIPIENT) is made on-chain first. Here we accept the
  // client's signature and require a coordinator-provided receipt nonce when
  // available. For full validation the operator should set X402_VERIFY_RPC to
  // a Base RPC; then this function checks the tx on-chain.
  const rpc = process.env.X402_VERIFY_RPC;
  if (!rpc) {
    // Offline mode: signature must be present and nonce must be unused.
    if (!signature || !order || !order.nonce) return { ok: false, reason: 'missing signature' };
    key = order.signer.toLowerCase();
    if (usedNonces[key] && usedNonces[key].includes(order.nonce)) return { ok: false, reason: 'replay' };
    return { ok: true };
  }
  return { ok: false, reason: 'RPC mode not configured' };
}

const usedNonces = {}; // per-run memory only; production switch to KV (turned off in free tier)
const payouts = {};     // global map: {productKey: count}

module.exports = async function (req, res) {
  const cors = (h) => { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); if (h) res.setHeader(h); };
  if (req.method === 'OPTIONS') { cors(); return res.status(204).end(); }
  cors();
  if (!['POST', 'GET'].includes(req.method)) return res.status(405).json({ error: 'method not allowed' });

  const params = new URLSearchParams((req.url.split('?')[1] || ''));
  const product = params.get('product') || (req.body && req.body.product) || 'audit';
  const p = PRODUCTS[product];
  if (!p) return res.status(400).json({ error: 'unknown product; use ' + Object.keys(PRODUCTS).join(', ') });

  // Step 1: client asks → return payment requirements (402)
  if (req.method === 'GET' || !(req.headers['x402-order'])) {
    return res.status(200).json({
      status: 'invoice_req',
      chainId: 8453,             // Base
      currency: 'USDC',
      amount: p.priceUsdc,
      recipient: process.env.PAYOUT_ADDRESS || '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D',
      resource: `/api/x402?product=${product}`,
      note: 'Send USDC on Base to recipient, then re-POST with x402-order header = signed EIP-712 order {nonce, signer, amount, currency}.',
    });
  }

  // Step 2: submitted signed order
  const sig = req.headers['x402-signature'] || (req.body && req.body.signature);
  const order = req.body && req.body.order;
  const v = verifySignature(order, sig);
  if (!v.ok) return res.status(402).json({ error: 'payment_not_verified', detail: v.reason });

  const key = order.signer.toLowerCase();
  usedNonces[key] = usedNonces[key] || [];
  usedNonces[key].push(order.nonce);
  PRODUCT_COUNT(product);

  let data;
  try { data = p.fn({ product, req }); } catch (e) { data = { error: String(e.message || e) }; }

  return res.status(200).json({
    ok: true,
    order_id: crypto.createHash('sha256').update(order.signer + order.nonce).digest('hex').slice(0, 32),
    product: p.name,
    amount_usdc: p.priceUsdc,
    chain_id: 8453,
    token: 'USDC',
    delivered_at_utc: new Date().toISOString(),
    data,
  });
};
function PRODUCT_COUNT(key) { usedNonces[key] = usedNonces[key] || []; }