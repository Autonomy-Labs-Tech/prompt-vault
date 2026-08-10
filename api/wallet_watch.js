// Vercel serverless: Agent Wallet Watch — pay-per-call Base wallet monitor.
// Free tier: 1 call / day / IP for a single address. Paid tier (x402): deeper
// history + all token balances + tx direction.
// Data sources: Blockscout keyless API (Base). No API key, no signup.
const https = require('https');
const crypto = require('crypto');

const RECIPIENT = process.env.PAYOUT_ADDRESS || '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D';
const CHAIN = { id: 8453, name: 'Base', shortName: 'base' };
const BLOCKSCOUT = 'https://base.blockscout.com/api/v2';
const BLOCKSCOUT_V1 = 'https://base.blockscout.com/api';

const PRODUCTS = {
  watch: {
    name: 'Wallet Watch snapshot (1 address)',
    priceUsdc: '1.00',
    note: 'Current ETH/USDC/ERC-20 balances + last 10 transactions for one Base address.',
  },
  'watch-pro': {
    name: 'Wallet Watch Pro snapshot (1 address)',
    priceUsdc: '5.00',
    note: 'Full token balances + last 100 transactions + transaction direction labels.',
  },
};

function isAddress(a) {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

function bsGet(path, base = BLOCKSCOUT) {
  return new Promise((resolve) => {
    const url = base + path;
    https.get(url, { headers: { 'User-Agent': 'autonomy-wallet-watch/1.0' }, timeout: 10000 }, (res) => {
      let b = '';
      res.on('data', (c) => { b += c; if (b.length > 500000) { res.destroy(); resolve(null); } });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(b)); } catch (e) { resolve(null); }
        } else { resolve(null); }
      });
    }).on('error', () => resolve(null)).setTimeout(10000, function () { this.destroy(); resolve(null); });
  });
}

async function fetchWalletData(address, pro) {
  const [txs, tokenV1] = await Promise.all([
    bsGet(`/addresses/${address}/transactions`),
    bsGet(`?module=account&action=tokenlist&address=${address}`, BLOCKSCOUT_V1),
  ]);

  const txList = (txs && txs.items) ? txs.items : [];
  const tokenList = (tokenV1 && tokenV1.result && Array.isArray(tokenV1.result)) ? tokenV1.result.slice(0, pro ? 200 : 20) : [];

  const balances = tokenList.map((t) => ({
    contract: t.contractAddress || null,
    symbol: t.symbol || '???',
    name: t.name || null,
    decimals: Number(t.decimals) || 18,
    balance_raw: t.value || '0',
  }));

  const transactions = txList.map((tx) => {
    const from = tx.from && tx.from.hash ? tx.from.hash : null;
    const to = tx.to && tx.to.hash ? tx.to.hash : null;
    const direction = from === address.toLowerCase() ? 'out' : to === address.toLowerCase() ? 'in' : 'self';
    return {
      hash: tx.hash,
      timestamp: tx.timestamp,
      from,
      to,
      direction,
      value_eth: tx.value ? String(tx.value / 1e18) : '0',
      status: tx.status,
    };
  });

  return {
    address: address.toLowerCase(),
    network: 'base',
    fetched_at_utc: new Date().toISOString(),
    transaction_count: transactions.length,
    transactions,
    token_balances_count: balances.length,
    token_balances: balances,
  };
}

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-402-Order, X-402-Signature');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'method not allowed' });

  const params = new URLSearchParams((req.url.split('?')[1] || ''));
  const product = params.get('product') || (req.body && req.body.product) || 'watch';
  const p = PRODUCTS[product];
  if (!p) return res.status(400).json({ error: 'unknown product; use ' + Object.keys(PRODUCTS).join(', ') });

  const address = (params.get('address') || (req.body && req.body.address) || '').trim().toLowerCase();
  if (!isAddress(address)) return res.status(400).json({ error: 'address required; pass ?address=0x...' });

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
        address_hint: address,
      },
      how: `POST /api/wallet_watch?product=${product}&address=${address} with { order, signature } (EIP-712 signed order: nonce, signer, amount, currency, chainId) after sending ${p.priceUsdc} USDC on Base to ${RECIPIENT}.`,
    });
  }

  const order = req.body && req.body.order;
  const signature = req.headers['x402-signature'] || (req.body && req.body.signature);
  if (!order || !signature) return res.status(402).json({ error: 'payment_required', invoice: { chainId: CHAIN.id, currency: 'USDC', amount: p.priceUsdc, recipient: RECIPIENT, product } });

  if (String(order.currency || '').toUpperCase() !== 'USDC') return res.status(400).json({ error: 'wrong currency' });
  if (Number(order.amount) < Number(p.priceUsdc)) return res.status(402).json({ error: 'underpaid' });
  if (!order.signer || !order.nonce || signature.length < 60) return res.status(400).json({ error: 'bad order/signature' });

  const pro = product === 'watch-pro';
  const data = await fetchWalletData(address, pro);
  if (!data) return res.status(502).json({ error: 'blockscout unavailable' });

  const orderId = crypto.createHash('sha256').update(order.signer + order.nonce + address).digest('hex').slice(0, 32);
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
