const test = require('node:test');
const assert = require('node:assert/strict');

const { publicGet, resolvePublic } = require('../api/public_fetch');

test('public fetch rejects private and non-HTTPS targets', async () => {
  await assert.rejects(resolvePublic('http://127.0.0.1:8080/'), /only public HTTPS URLs/);
  await assert.rejects(resolvePublic('https://127.0.0.1/'), /private address/);
  await assert.rejects(publicGet('https://127.0.0.1/', { timeoutMs: 50 }), /private address/);
});
