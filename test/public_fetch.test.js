const test = require('node:test');
const assert = require('node:assert/strict');

const { blockedIp, publicGet, resolvePublic } = require('../api/public_fetch');

test('public fetch rejects private and non-HTTPS targets', async () => {
  await assert.rejects(resolvePublic('http://127.0.0.1:8080/'), /only public HTTPS URLs/);
  await assert.rejects(resolvePublic('https://127.0.0.1/'), /private address/);
  await assert.rejects(publicGet('https://127.0.0.1/', { timeoutMs: 50 }), /private address/);
});

test('public fetch blocks IPv4-mapped private IPv6 addresses', () => {
  assert.equal(blockedIp('::ffff:7f00:1'), true);
  assert.equal(blockedIp('::ffff:c0a8:101'), true);
});
