const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const x402Manifest = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', '.well-known', 'x402'),
  'utf8',
));

test('x402 manifest declares every implemented product', () => {
  const routes = new Set(x402Manifest.payable_endpoints.map((entry) => {
    const match = String(entry.route).match(/product=([^&\s]+)/);
    return match && match[1];
  }));
  for (const product of ['audit', 'audit-5', 'data', 'llms', 'watch', 'watch-pro']) {
    assert.equal(routes.has(product), true, `manifest missing ${product}`);
  }
});

test('audit-5 rejects requests that do not provide exactly five sites', async () => {
  const { deliverAudit } = require('../api/x402');
  const result = await deliverAudit({ urls: ['https://example.com'] }, 5);
  assert.deepEqual(result, { ok: false, error: 'exactly 5 urls required' });
  const tooMany = await deliverAudit({ urls: Array.from({ length: 6 }, () => 'https://example.com') }, 5);
  assert.deepEqual(tooMany, { ok: false, error: 'exactly 5 urls required' });
});
