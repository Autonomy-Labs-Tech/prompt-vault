// Vercel serverless function: free AI-agent-readiness audit tool.
// Probes a site's agent-discoverability surfaces and returns a grade.
const { publicGet, resolvePublic } = require('./public_fetch');

module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  const q = req.url.split('?')[1] || '';
  const params = new URLSearchParams(q);
  let target = (params.get('url') || '').trim();
  if (!target) return res.status(400).json({ error: 'url param required' });
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  let origin;
  try {
    await resolvePublic(target);
    origin = new URL(target).origin;
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const deadline = Date.now() + 15000;
  const probe = async (url) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return { status: 0, ct: '', body: '' };
    return publicGet(url, { timeoutMs: Math.min(4000, remaining), maxBytes: 200000 })
      .catch(() => ({ status: 0, ct: '', body: '' }));
  };
  const probes = {
    robots:    await probe(origin + '/robots.txt'),
    sitemap:   await probe(origin + '/sitemap.xml'),
    llms:      await probe(origin + '/llms.txt'),
    llmsfull:  await probe(origin + '/llms-full.txt'),
    agents:    await probe(origin + '/agents.txt'),
    x402:      await probe(origin + '/.well-known/x402'),
    agentsjson: await probe(origin + '/.well-known/agents.json'),
    security:  await probe(origin + '/.well-known/security.txt')
  };

  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
  add('robots.txt', probes.robots.status >= 200 && probes.robots.status < 400, 'HTTP ' + probes.robots.status);
  add('sitemap.xml', probes.sitemap.status >= 200 && probes.sitemap.status < 400, 'HTTP ' + probes.sitemap.status);
  add('llms.txt', probes.llms.status >= 200 && probes.llms.status < 400 && probes.llms.body.includes('llms'), 'HTTP ' + probes.llms.status);
  add('llms-full.txt', probes.llmsfull.status >= 200 && probes.llmsfull.status < 400, 'HTTP ' + probes.llmsfull.status);
  add('agents.txt', probes.agents.status >= 200 && probes.agents.status < 400, 'HTTP ' + probes.agents.status);
  add('x402 (.well-known/x402)', probes.x402.status >= 200 && probes.x402.status < 400, 'HTTP ' + probes.x402.status);
  add('agents.json (.well-known/agents.json)', probes.agentsjson.status >= 200 && probes.agentsjson.status < 400, 'HTTP ' + probes.agentsjson.status);
  add('security.txt (.well-known/security.txt)', probes.security.status >= 200 && probes.security.status < 400, 'HTTP ' + probes.security.status);

  const passed = checks.filter((c) => c.ok).length;
  const grade = passed >= 7 ? 'A' : passed >= 5 ? 'B' : passed >= 3 ? 'C' : passed >= 1 ? 'D' : 'F';
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
