const test = require('node:test');
const assert = require('node:assert/strict');

const { Wallet } = require('ethers');
const {
  normalizedAddress,
  offlinePaymentsAllowed,
  reservePayment,
  verifyOrderSignature,
  verifyPayment,
  verifyUsdcTransfer,
} = require('../api/payment_verify');

test('normalizes only valid EVM addresses', () => {
  assert.equal(normalizedAddress('0x7e0190af0951485dFd08bE2FE19Fa638e94F426D'), '0x7e0190af0951485dfd08be2fe19fa638e94f426d');
  assert.equal(normalizedAddress('not-an-address'), '');
});

test('rejects malformed transaction hashes without network access', async () => {
  const result = await verifyUsdcTransfer('bad', '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D', '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D', 0.01);
  assert.deepEqual(result, { ok: false, error: 'bad txHash' });
});

test('verifies the EIP-712 order signer', async () => {
  const wallet = Wallet.createRandom();
  const order = {
    nonce: 'nonce-1',
    signer: wallet.address,
    amount: '2.00',
    currency: 'USDC',
    chainId: 8453,
  };
  const domain = {
    name: 'Autonomy Labs x402',
    version: '1',
    chainId: 8453,
    verifyingContract: '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D',
  };
  const types = {
    Payment: [
      { name: 'nonce', type: 'string' },
      { name: 'signer', type: 'address' },
      { name: 'amount', type: 'string' },
      { name: 'currency', type: 'string' },
      { name: 'chainId', type: 'uint256' },
    ],
  };
  const signature = await wallet.signTypedData(domain, types, order);
  assert.deepEqual(
    verifyOrderSignature(order, signature, domain.verifyingContract),
    { ok: true },
  );
  assert.equal(verifyOrderSignature({ ...order, amount: '3.00' }, signature, domain.verifyingContract).ok, false);
});

test('reserves a transaction proof against same-process replay', () => {
  const txHash = '0x' + 'a'.repeat(64);
  const signer = '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D';
  const recipient = signer;
  assert.deepEqual(reservePayment(txHash, signer, recipient), { ok: true });
  assert.deepEqual(reservePayment(txHash, signer, recipient), { ok: false, error: 'payment already used' });
});

test('production never enables the offline payment bypass', async () => {
  const previous = {
    X402_OFFLINE: process.env.X402_OFFLINE,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };
  process.env.X402_OFFLINE = 'true';
  process.env.NODE_ENV = 'production';
  delete process.env.VERCEL_ENV;
  try {
    assert.equal(offlinePaymentsAllowed(), false);
    const result = await verifyPayment({
      order: {
        nonce: 'production-fixture',
        signer: '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D',
        amount: '2.00',
        currency: 'USDC',
        chainId: 8453,
      },
      signature: 'not-a-signature',
      recipient: '0x7e0190af0951485dFd08bE2FE19Fa638e94F426D',
      requiredUsdc: 2,
    });
    assert.deepEqual(result, { ok: false, status: 402, error: 'txHash required' });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
