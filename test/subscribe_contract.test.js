const test = require('node:test');
const assert = require('node:assert/strict');

const { hasAffirmativeConsent } = require('../api/subscribe')._private;

test('accepts only affirmative consent values', () => {
  assert.equal(hasAffirmativeConsent(true), true);
  assert.equal(hasAffirmativeConsent('true'), true);
  assert.equal(hasAffirmativeConsent('on'), true);
  assert.equal(hasAffirmativeConsent(false), false);
  assert.equal(hasAffirmativeConsent('false'), false);
  assert.equal(hasAffirmativeConsent(undefined), false);
  assert.equal(hasAffirmativeConsent('yes'), false);
});
