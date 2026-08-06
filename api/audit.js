// Vercel serverless function: free AI-agent-readiness audit tool.
// Probes a site's agent-discoverability surfaces and returns a grade.
const https = require('https');
const http = require('http');

function probe(url, timeoutMs = 9000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'autonomy-audit-bot/1.0' }, timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; if (body.length > 200000) req.destroy(); });
      res.on('end', () => resolve({ status: res.statusCode, ct: res.headers['content-type'] || '', body }));
    });
    req.on('error', () => resolve({ status: 0, ct: '', body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ct: '', body: '' }); });
  });
}

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  const q = req.url.split('?')[1] || '';
  const params = new URLSearchParams(q);
  let target = (params.get('url') || '').trim();
  if (!target) return res.status(400).json({ error: 'url param required' });
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  let origin;
  try { origin = new URL(target).origin; } catch (e) { return res.status(400).json({ error: 'invalid url' }); }

  const probes = {
    robots:   await probe(origin + '/robots.txt'),
    sitemap:  await probe(origin + '/sitemap.xml'),
    llms:     await probe(origin + '/llms.txt'),
    llmsfull: await probe(origin + '/llms-full.txt'),
    agents:   await probe(origin + '/agents.txt'),
    x402:     await probe(origin + '/.well-known/x402')
  };

  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
  add('robots.txt', probes.robots.status >= 200 && probes.robots.status < 400, 'HTTP ' + probes.robots.status);
  add('sitemap.xml', probes.sitemap.status >= 200 && probes.sitemap.status < 400, 'HTTP ' + probes.sitemap.status);
  add('llms.txt', probes.llms.status >= 200 && probes.llms.status < 400 && probes.llms.body.includes('llms'), 'HTTP ' + probes.llms.status);
  add('llms-full.txt', probes.llmsfull.status >= 200 && probes.llmsfull.status < 400, 'HTTP ' + probes.llmsfull.status);
  add('agents.txt', probes.agents.status >= 200 && probes.agents.status < 400, 'HTTP ' + probes.agents.status);
  add('x402 (.well-known/x402)', probes.x402.status >= 200 && probes.x402.status < 400, 'HTTP ' + probes.x402.status);

  const passed = checks.filter((c) => c.ok).length;
  const grade = passed >= 5 ? 'A' : passed >= 3 ? 'B' : passed >= 1 ? 'C' : 'D';
  const score = Math.round((passed / checks.length) * 100);

  return res.status(200).json({
    url: origin,
    checked_at_utc: new Date().toISOString(),
    grade,
    score,
    checks,
    summary: `${passed}/${checks.length} agent-readiness surfaces detected on ${origin}.`
  });
};
