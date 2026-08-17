// Vercel serverless: minimal Streamable-HTTP MCP server exposing the site's
// x402 pay-per-call tools (audit, audit-5, data) for agent discovery.
// Tools describe how to pay: POST /api/x402?product=X with {order, signature}
// (EIP-712, Base USDC) then receive the deliverable.
const https = require('https');

const BASE = 'https://business2-lasse-tfa.vercel.app';

const TOOLS = [
  {
    name: 'agent_site_audit',
    description: 'Pay-per-call (x402): audit ONE public site for AI-agent readiness (robots.txt, sitemap, llms.txt, agents.txt, x402, security.txt) and get a grade A-D. Price 2.00 USDC on Base.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'absolute https URL of the site to audit' } },
      required: ['url'],
    },
  },
  {
    name: 'agent_site_audit_5',
    description: 'Pay-per-call: audit 5 public sites at once for AI-agent readiness. Price 7.00 USDC on Base.',
    inputSchema: {
      type: 'object',
      properties: { urls: { type: 'array', items: { type: 'string' }, description: '5 absolute https URLs' } },
      required: ['urls'],
    },
  },
  {
    name: 'storefront_catalog',
    description: 'Pay-per-call: storefront catalog + metrics payload (products list). Price 1.00 USDC on Base.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'generate_llms_txt',
    description: 'Pay-per-call (x402): generate a ready-to-ship llms.txt for ANY public site from its sitemap (40 pages max). Price 3.00 USDC on Base.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'absolute https URL of the site to generate llms.txt for' } },
      required: ['url'],
    },
  },
  {
    name: 'wallet_watch_snapshot',
    description: 'Pay-per-call (x402): Base wallet snapshot with up to 20 ERC-20 token balances and at most 10 recent transactions for one address. Native coin balances are not included. If the provider returns extra tokens or transaction pages/records, the response is partial and includes provider_limited, token_balances_complete or transactions_complete, and source/error metadata. Price 1.00 USDC on Base.',
    inputSchema: {
      type: 'object',
      properties: { address: { type: 'string', description: 'Base address to watch, e.g. 0x...' } },
      required: ['address'],
    },
  },
  {
    name: 'wallet_watch_pro',
    description: 'Pay-per-call (x402): Base wallet snapshot with up to 200 ERC-20 token balances and at most 100 recent transactions for one address. Native coin balances are not included. If the provider returns extra tokens or transaction pages/records, the response is partial and includes provider_limited, token_balances_complete or transactions_complete, and source/error metadata. Price 5.00 USDC on Base.',
    inputSchema: {
      type: 'object',
      properties: { address: { type: 'string', description: 'Base address to watch, e.g. 0x...' } },
      required: ['address'],
    },
  },
];

function jsonRpc(id, method, params) {
  return { jsonrpc: '2.0', id, method, params };
}

function sendJson(res, obj, sessionId) {
  const headers = { 'Content-Type': 'application/json' };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  res.writeHead(200, headers);
  res.end(JSON.stringify(obj));
}

module.exports = async function (req, res) {
  if (req.method === 'GET') {
    // Streamable-HTTP reserves GET for the server->client SSE stream, which this
    // server does not offer; any other GET is treated as a discovery request.
    const accept = String(req.headers.accept || '');
    if (accept.includes('text/event-stream')) {
      return res.status(405).json({ error: 'SSE stream not supported; POST JSON-RPC to this endpoint' });
    }
    return res.status(200).json({
      protocolVersion: '2025-03-26',
      transport: 'streamable-http',
      endpoint: BASE + '/api/mcp',
      usage: 'POST JSON-RPC 2.0 to this endpoint (initialize, tools/list, tools/call).',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'autonomy-x402-tools', version: '1.0.0' },
      tools: TOOLS,
    });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only (Streamable-HTTP MCP)' });
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 1000000) req.destroy(); });
  req.on('end', () => {
    let msg;
    try { msg = JSON.parse(body); } catch (e) { return sendJson(res, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } }); }
    const id = msg.id;
    if (msg.method === 'initialize') {
      return sendJson(res, {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2025-03-26',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'autonomy-x402-tools', version: '1.0.0' },
        },
      }, 'mcp-' + Date.now().toString(36));
    }
    if (msg.method === 'tools/list') return sendJson(res, { jsonrpc: '2.0', id, result: { tools: TOOLS } });
    if (msg.method === 'notifications/initialized') return res.writeHead(202).end();
    if (msg.method === 'ping') return sendJson(res, { jsonrpc: '2.0', id, result: {} });
    if (msg.method === 'tools/call') {
      const p = msg.params || {};
      const tool = TOOLS.find((t) => t.name === p.name);
      if (!tool) return sendJson(res, { jsonrpc: '2.0', id, error: { code: -32602, message: 'unknown tool: ' + p.name } });
      const args = p.arguments || {};
      const product = tool.name === 'agent_site_audit_5' ? 'audit-5' : tool.name === 'storefront_catalog' ? 'data' : tool.name === 'generate_llms_txt' ? 'llms' : tool.name === 'wallet_watch_snapshot' ? 'watch' : tool.name === 'wallet_watch_pro' ? 'watch-pro' : 'audit';
      return sendJson(res, { jsonrpc: '2.0', id, result: {
        content: [{
          type: 'text',
          text: `Tool "${p.name}" is pay-per-call via x402 (${tool.description.split('. Price')[0]}). ` +
            `To purchase: POST ${BASE}/api/x402?product=${product} with body { order, signature, txHash } where order is an ` +
            `EIP-712 order ({ nonce, signer, amount, currency:'USDC', chainId:8453 }) signed by your wallet and signature is ` +
            `delivered via the request body or the X-402-Signature header; txHash must identify the settled Base USDC ` +
            `transfer. The invoice (amount, recipient wallet) comes from GET ${BASE}/api/x402?product=${product}. ` +
            `On verified settled payment the API returns the deliverable data directly.`,
        }],
        isError: false,
      }});
    }
    return sendJson(res, { jsonrpc: '2.0', id, error: { code: -32601, message: 'method not found: ' + msg.method } });
  });
};