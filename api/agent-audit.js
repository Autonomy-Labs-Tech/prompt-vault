// Vercel serverless: Circle x402-compatible AI Agent Readiness Audit
// Returns 402 Payment Required when unpaid, serves audit when paid.
// Price: $0.01 USDC on Base. Payout to our wallet.
// Listed on Circle Agent Marketplace.

const https = require('https');
const http = require('http');
const crypto = require('crypto');

const SELLER_ADDRESS = '0xd580ed58342aa489BDD6DCA11e57E2FB9a00438E';
const PRICE_USDC = '10000'; // $0.01 in 6-decimal USDC base units
const CHAIN_ID = 8453; // Base
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const SURFACES = ['/llms.txt', '/robots.txt', '/sitemap.xml', '/.well-known/x402', '/agents.txt'];

function fetchPath(base, p) {
  return new Promise((resolve) => {
    const mod = base.startsWith('https') ? https : http;
    const req = mod.get(base + p, {
      headers: { 'User-Agent': 'agent-readiness-audit/1.0' },
      timeout: 8000,
    }, (res) => {
      let bytes = 0;
      res.on('data', (d) => { bytes += d.length; });
      res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', bytes }));
    });
    req.on('error', (e) => resolve({ status: 0, ct: '', bytes: 0, err: e.message }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ status: 0, ct: '', bytes: 0, err: 'timeout' }); });
  });
}

async function runAudit(targetUrl) {
  const base = targetUrl.replace(/\/$/, '');
  const results = [];
  for (const p of SURFACES) results.push({ path: p, ...(await fetchPath(base, p)) });
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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-PAYMENT, PAYMENT-REQUIRED');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const targetUrl = req.query.url || req.query.target || (req.body && req.body.url);

  // Check for payment
  const paymentHeader = req.headers['x-payment'] || req.headers['payment'];
  const paymentRequiredHeader = req.headers['payment-required'];

  if (!paymentHeader && !paymentRequiredHeader) {
    // Return 402 with payment requirements
    res.status(402);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-PAYMENT', JSON.stringify({
      accepts: [{
        scheme: 'gateway',
        network: '8453', // Base
        asset: USDC_BASE,
        amount: PRICE_USDC,
        payTo: SELLER_ADDRESS,
        description: 'AI Agent Readiness Audit — per-site report',
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

  // If payment is present, verify and serve
  // For now, we accept any payment header (full verification requires Circle Gateway SDK)
  // In production, use @circle-fin/x402-batching middleware for proper settlement
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter. Usage: /api/agent-audit?url=https://example.com' });
  }

  try {
    const result = await runAudit(targetUrl);
    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};