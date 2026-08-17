// Vercel serverless: Circle x402-compatible AI Agent Readiness Audit
// Returns 402 Payment Required when unpaid, serves audit when paid.
// Price: $0.01 USDC on Base. Payout to our wallet.
// Listed on Circle Agent Marketplace.

const {
  parsePaymentHeader,
  verifyPayment,
} = require('./payment_verify');
const { publicGet, resolvePublic } = require('./public_fetch');

const SELLER_ADDRESS = '0xd580ed58342aa489BDD6DCA11e57E2FB9a00438E';
const PRICE_USDC = '0.01'; // Human-readable USDC amount used by every payment envelope.
const CHAIN_ID = 8453; // Base
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const SURFACES = ['/llms.txt', '/robots.txt', '/sitemap.xml', '/.well-known/x402', '/agents.txt'];

// Node's res.setHeader() throws ERR_INVALID_CHAR for any code point above U+00FF,
// so JSON destined for a header must have its non-ASCII escaped (still valid JSON).
function headerSafeJson(obj) {
  return JSON.stringify(obj).replace(/[\u007f-\uffff]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}

async function runAudit(targetUrl) {
  const base = targetUrl.replace(/\/$/, '');
  const results = [];
  const deadline = Date.now() + 15000;
  for (const p of SURFACES) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      results.push({ path: p, status: 0, ct: '', bytes: 0, err: 'audit deadline' });
      continue;
    }
    const result = await publicGet(base + p, { timeoutMs: Math.min(4000, remaining), maxBytes: 100000 })
      .catch((error) => ({ status: 0, ct: '', bytes: 0, err: error.message }));
    results.push({ path: p, status: result.status, ct: result.ct, bytes: result.bytes, ...(result.err ? { err: result.err } : {}) });
  }
  const present = results.filter((r) => r.status === 200).length;
  const grade = present >= 5 ? 'A' : present >= 4 ? 'B' : present >= 3 ? 'C' : present >= 2 ? 'D' : 'F';
  const now = new Date().toISOString();

  let md = `# Agent-Readiness Audit: ${base}\n\nChecked at: ${now}\n\n`;
  md += '| Surface | Status | Content-Type | Bytes |\n|---|---|---|---|\n';
  for (const r of results) {
    md += `| ${r.path} | ${r.status || 'ERR'} | ${r.ct || (r.err || '')} | ${r.bytes} |\n`;
  }
  md += `\nGrade: ${grade} (${present}/5 agent surfaces present)\n\n`;
  md += '### Recommended fixes\n';
  const fixes = [];
  for (const r of results) {
    if (r.status !== 200) fixes.push(`- Add a live \`${r.path}\` (returned ${r.status || r.err}).`);
  }
  if (!results.find((r) => r.path === '/llms.txt' && r.status === 200)) fixes.push('- Add /llms.txt with product names, prices, and buy links.');
  if (!results.find((r) => r.path === '/.well-known/x402' && r.status === 200)) fixes.push('- Add /.well-known/x402 with machine-readable payment config.');
  md += fixes.length ? fixes.join('\n') + '\n' : '- All agent surfaces are live. Keep them updated.\n';

  return {
    url: base,
    grade,
    present,
    total: 5,
    surfaces: results,
    report: md,
    timestamp: now,
  };
}

module.exports = async function (req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-PAYMENT, PAYMENT-REQUIRED, X-402-Signature');
    if (req.method === 'OPTIONS') return res.status(204).end();

    const query = req.query || Object.fromEntries(new URLSearchParams((req.url || '').split('?')[1] || ''));
    const targetUrl = query.url || query.target || (req.body && req.body.url);

    // Check for payment
    const paymentHeader = req.headers['x-payment'] || req.headers.payment;

    if (!paymentHeader) {
      // Return 402 with payment requirements
      res.status(402);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('PAYMENT-REQUIRED', Buffer.from(JSON.stringify({
        protocol: 'x402-exact-transfer-v1',
        network: 'eip155:8453',
        asset: USDC_BASE,
        amount: PRICE_USDC,
        payTo: SELLER_ADDRESS,
        requires: ['order', 'signature', 'txHash'],
      })).toString('base64'));
      res.setHeader('X-PAYMENT', headerSafeJson({
        accepts: [{
          scheme: 'gateway',
          network: '8453', // Base
          asset: USDC_BASE,
          amount: PRICE_USDC,
          payTo: SELLER_ADDRESS,
          description: 'AI Agent Readiness Audit - per-site report',
        }],
      }));
      return res.json({
        error: 'Payment Required',
        status: 402,
        price: '$0.01 USDC on Base',
        description: 'Audit any website for AI-agent discoverability (llms.txt, robots.txt, sitemap.xml, x402, agents.txt). Returns a graded Markdown report with concrete fixes.',
        accepts: [{
          scheme: 'gateway',
          network: '8453',
          asset: USDC_BASE,
          amount: PRICE_USDC,
          payTo: SELLER_ADDRESS,
        }],
        usage: 'GET /api/agent-audit?url=https://example.com with X-PAYMENT header',
      });
    }

    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter. Usage: /api/agent-audit?url=https://example.com' });
    }
    try { await resolvePublic(String(targetUrl)); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    let payment = parsePaymentHeader(paymentHeader);
    if (!payment) {
      return res.status(402).json({ error: 'payment_not_verified_onchain', detail: 'X-PAYMENT must be JSON' });
    }
    const verified = await verifyPayment({
      order: payment.order || payment,
      signature: payment.signature,
      txHash: payment.txHash || payment.tx_hash,
      recipient: SELLER_ADDRESS,
      requiredUsdc: Number(PRICE_USDC),
    });
    if (!verified.ok) {
      return res.status(verified.status || 402).json({ error: 'payment_not_verified_onchain', detail: verified.error });
    }

    const result = await runAudit(targetUrl);
    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    return res.json(result);
  } catch (e) {
    if (res.headersSent) return res.end();
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: String((e && e.message) || e) }));
  }
};