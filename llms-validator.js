#!/usr/bin/env node
/*
 * llms-validator — free agent-readiness checker for any site.
 * Usage: node llms-validator.js https://example.com
 * Checks llms.txt, robots.txt, agents.txt, and /.well-known/x402 for
 * AI-agent discoverability. Prints a JSON report with a readiness score.
 * Zero dependencies, runs on Node 18+.
 */
const BASE = process.argv[2];
if (!BASE) { console.error('Usage: node llms-validator.js <base-url>'); process.exit(1); }
const base = BASE.replace(/\/+$/, '');
const checks = [
  ['llms.txt',          '/llms.txt'],
  ['llms-full.txt',     '/llms-full.txt'],
  ['robots.txt',        '/robots.txt'],
  ['agents.txt',        '/agents.txt'],
  ['sitemap.xml',       '/sitemap.xml'],
  ['x402 manifest',     '/.well-known/x402'],
];
const timeout = (ms, fn) => new Promise((res, rej) => { const t = setTimeout(()=>rej(new Error('timeout')), ms); fn().then(v=>{clearTimeout(t);res(v)}, e=>{clearTimeout(t);rej(e)}); });
async function get(p) {
  try {
    const r = await timeout(15000, () => fetch(base + p, { headers: { 'User-Agent': 'Mozilla/5.0 llms-validator' } }));
    const body = await r.text();
    return { status: r.status, ct: (r.headers.get('content-type')||'').split(';')[0], len: body.length, body };
  } catch (e) { return { status: 0, ct: '', len: 0, body: '', err: e.message }; }
}
function scoreReport(rows) {
  let score = 0, max = rows.length;
  for (const r of rows) { if (r.present) score++; }
  const grade = score === max ? 'A' : score >= max*0.66 ? 'B' : score >= max*0.33 ? 'C' : 'D';
  return { score, max, grade };
}
(async () => {
  const rows = [];
  for (const [name, p] of checks) {
    const res = await get(p);
    const present = res.status === 200 && res.len > 0;
    const hasBuyLink = present && (name === 'llms.txt' || name === 'llms-full.txt' || name === 'x402 manifest') ? /(buy\.stripe|stripe|price|checkout)/i.test(res.body) : present;
    rows.push({ check: name, path: p, status: res.status, present, machineReadable: hasBuyLink, size: res.len });
  }
  const s = scoreReport(rows);
  const out = {
    url: base,
    checkedAt: new Date().toISOString(),
    readiness: s,
    checks: rows,
    summary: s.grade === 'A' ? 'Fully agent-discoverable and (where applicable) machine-buyable.' :
             s.grade === 'B' ? 'Mostly agent-discoverable; a few gaps to close.' :
             s.grade === 'C' ? 'Partially agent-discoverable; several gaps.' : 'Not meaningfully agent-discoverable.'
  };
  console.log(JSON.stringify(out, null, 2));
})();
