const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const starter = fs.readFileSync(path.join(root, 'starter-kit.html'), 'utf8');
const agents = fs.readFileSync(path.join(root, 'agents.txt'), 'utf8');
const products = JSON.parse(fs.readFileSync(path.join(root, 'products.json'), 'utf8'));

test('homepage distinguishes instant downloads from made-to-order services', () => {
  assert.match(index, /Instant downloads \+ made-to-order services/);
  assert.match(index, /Digital products are delivered instantly/);
  const card = (href) => {
    const start = index.indexOf(`<h3><a href="${href}">`);
    const end = index.indexOf('<div class="offer">', start + 1);
    return index.slice(start, end === -1 ? undefined : end);
  };
  assert.match(card('threejs-scene-rebuild.html'), /Custom Three\.js Scene Rebuild[\s\S]*?Made to order · typical delivery 5–7 days/);
  assert.match(card('custom-game-prototype.html'), /Custom Browser Game Prototype[\s\S]*?Made to order · typical delivery 7–10 days/);
  assert.doesNotMatch(index, /All 33 products are delivered instantly/);
});

test('starter-kit page states concrete deliverables above the checkout CTA', () => {
  const inside = starter.slice(starter.indexOf("What's inside"), starter.indexOf('Payment via Stripe'));
  for (const expected of [
    '20 ready-to-use prompts',
    'CAN-SPAM/GDPR legal checklist',
    'Step-by-step setup guide',
    'Instant digital download and lifetime access',
  ]) assert.match(inside, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('catalog metadata identifies service delivery windows and has no stale tunnel', () => {
  assert.match(products.payment, /made-to-order services follow the delivery window/);
  for (const [identifier, delivery] of [
    ['threejs-scene-rebuild', '5–7 days'],
    ['custom-game-prototype', '7–10 days'],
  ]) {
    const product = products.itemListElement.find((item) => item.identifier === identifier);
    assert.equal(product.delivery.includes(delivery), true);
  }
  assert.doesNotMatch(agents, /trycloudflare\.com/);
});
