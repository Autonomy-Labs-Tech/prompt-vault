const https = require('https');
const { verifyTypedData } = require('ethers');

const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913'.toLowerCase();
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const MAX_RESPONSE_BYTES = 500000;
const seenPayments = new Map();

function normalizedAddress(value) {
  const address = String(value || '').trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(address) ? address : '';
}

function offlinePaymentsAllowed() {
  return process.env.X402_OFFLINE === 'true'
    && process.env.X402_TEST_MODE === 'true'
    && process.env.NODE_ENV === 'test'
    && !process.env.VERCEL
    && !process.env.VERCEL_ENV;
}

function parsePaymentHeader(value) {
  try { return JSON.parse(String(value)); } catch {}
  try { return JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8')); }
  catch { return null; }
}

function verifyOrderSignature(order, signature, recipient) {
  const signer = normalizedAddress(order && order.signer);
  const verifyingContract = normalizedAddress(recipient);
  if (!signer || !verifyingContract || typeof signature !== 'string'
    || !/^0x[0-9a-fA-F]{130}$/.test(signature)) {
    return { ok: false, error: 'bad order/signature' };
  }
  try {
    const recovered = verifyTypedData(
      {
        name: 'Autonomy Labs x402',
        version: '1',
        chainId: 8453,
        verifyingContract,
      },
      {
        Payment: [
          { name: 'nonce', type: 'string' },
          { name: 'signer', type: 'address' },
          { name: 'amount', type: 'string' },
          { name: 'currency', type: 'string' },
          { name: 'chainId', type: 'uint256' },
        ],
      },
      {
        nonce: String(order.nonce),
        signer,
        amount: String(order.amount),
        currency: String(order.currency),
        chainId: Number(order.chainId),
      },
      signature,
    );
    return recovered.toLowerCase() === signer
      ? { ok: true }
      : { ok: false, error: 'signature signer mismatch' };
  } catch {
    return { ok: false, error: 'invalid order signature' };
  }
}

function reservePayment(txHash, signer, recipient) {
  const key = `${String(txHash).toLowerCase()}:${normalizedAddress(signer)}:${normalizedAddress(recipient)}`;
  const now = Date.now();
  for (const [entry, timestamp] of seenPayments) {
    if (now - timestamp > 24 * 60 * 60 * 1000) seenPayments.delete(entry);
  }
  if (seenPayments.has(key)) return { ok: false, error: 'payment already used' };
  seenPayments.set(key, now);
  return { ok: true };
}

function reserveDurablePayment(txHash, signer, recipient) {
  const endpoint = String(process.env.X402_REPLAY_STORE_URL || '');
  if (!/^https:\/\//i.test(endpoint)) {
    return Promise.resolve({ ok: false, error: 'durable replay store not configured' });
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    let parsed;
    try { parsed = new URL(endpoint); } catch { return finish({ ok: false, error: 'invalid replay store URL' }); }
    const payload = JSON.stringify({
      txHash: String(txHash).toLowerCase(),
      signer: normalizedAddress(signer),
      recipient: normalizedAddress(recipient),
    });
    const request = https.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(process.env.X402_REPLAY_STORE_TOKEN
          ? { Authorization: `Bearer ${process.env.X402_REPLAY_STORE_TOKEN}` }
          : {}),
      },
      timeout: 5000,
    }, (response) => {
      response.resume();
      response.on('end', () => {
        if (response.statusCode === 409) return finish({ ok: false, error: 'payment already used' });
        finish(response.statusCode >= 200 && response.statusCode < 300
          ? { ok: true }
          : { ok: false, error: 'durable replay store rejected payment' });
      });
    });
    request.on('error', () => finish({ ok: false, error: 'durable replay store unavailable' }));
    request.on('timeout', () => request.destroy(new Error('replay store timeout')));
    request.end(payload);
  });
}

async function verifyPayment({ order, signature, txHash, recipient, requiredUsdc }) {
  if (!order || String(order.currency || '').toUpperCase() !== 'USDC') {
    return { ok: false, status: 400, error: 'wrong currency' };
  }
  if (!Number.isFinite(Number(order.amount)) || Number(order.amount) < Number(requiredUsdc)) {
    return { ok: false, status: 402, error: 'underpaid' };
  }
  if (!normalizedAddress(order.signer) || !order.nonce) {
    return { ok: false, status: 400, error: 'bad order/signature' };
  }
  const offline = offlinePaymentsAllowed();
  if (!offline) {
    if (!/^0x[0-9a-fA-F]{64}$/.test(String(txHash || ''))) {
      return { ok: false, status: 402, error: 'txHash required' };
    }
    if (Number(order.chainId) !== 8453) return { ok: false, status: 400, error: 'wrong chain' };
    const signatureCheck = verifyOrderSignature(order, signature, recipient);
    if (!signatureCheck.ok) return { ok: false, status: 402, error: signatureCheck.error };
    const payment = await verifyUsdcTransfer(txHash, order.signer, recipient, requiredUsdc);
    if (!payment.ok) return { ok: false, status: 402, error: payment.error };
    const reservation = offlinePaymentsAllowed()
      ? reservePayment(txHash, order.signer, recipient)
      : await reserveDurablePayment(txHash, order.signer, recipient);
    if (!reservation.ok) return { ok: false, status: 409, error: reservation.error };
    return { ok: true, amount_usdc: payment.amount_usdc, offline: false };
  }
  return { ok: true, amount_usdc: Number(order.amount), offline: true };
}

function verifyUsdcTransfer(txHash, signer, recipient, requiredUsdc) {
  return new Promise((resolve) => {
    const hash = String(txHash || '').trim();
    const fromSigner = normalizedAddress(signer);
    const toRecipient = normalizedAddress(recipient);
    const required = Number(requiredUsdc);
    if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return resolve({ ok: false, error: 'bad txHash' });
    if (!fromSigner || !toRecipient || !Number.isFinite(required) || required <= 0) {
      return resolve({ ok: false, error: 'bad payment identity or amount' });
    }
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      resolve(result);
    };
    const deadline = setTimeout(() => {
      if (request) request.destroy(new Error('payment provider timeout'));
      finish({ ok: false, error: 'payment provider timeout' });
    }, 16000);
    const request = https.get(
      `https://base.blockscout.com/api/v2/transactions/${hash}`,
      { headers: { 'User-Agent': 'autonomy-x402/1.0' }, timeout: 15000 },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
          if (Buffer.byteLength(body) > MAX_RESPONSE_BYTES) {
            finish({ ok: false, error: 'payment provider response too large' });
            request.destroy();
          }
        });
        response.on('end', () => {
          if (settled) return;
          if (response.statusCode !== 200) return finish({ ok: false, error: 'payment provider status ' + response.statusCode });
          try {
            const transaction = JSON.parse(body);
            const from = normalizedAddress(transaction.from && transaction.from.hash);
            const transactionTo = normalizedAddress(transaction.to && transaction.to.hash);
            if (from !== fromSigner) return finish({ ok: false, error: 'tx not from signer' });
            if (!['ok', 'success'].includes(String(transaction.status || '').toLowerCase())) {
              return finish({ ok: false, error: 'tx not successful' });
            }
            const decoded = transaction.decoded_input || {};
            const parameters = Array.isArray(decoded.parameters) ? decoded.parameters : [];
            const recipientParam = parameters.find((item) => item && item.name === 'to');
            const valueParam = parameters.find((item) => item && ['value', 'amount'].includes(item.name));
            const method = String(decoded.method_call || decoded.method || '').toLowerCase();
            if (transactionTo === USDC_BASE && /^transfer(?:\(|$)/.test(method) && recipientParam && valueParam) {
              if (normalizedAddress(recipientParam.value) !== toRecipient) {
                return finish({ ok: false, error: 'transfer not to recipient' });
              }
              const amount = Number(BigInt(String(valueParam.value))) / 1e6;
              return finish(amount >= required
                ? { ok: true, amount_usdc: amount, method: decoded.method_call || 'USDC transfer' }
                : { ok: false, error: 'underpaid' });
            }
            for (const transfer of Array.isArray(transaction.token_transfers)
              ? transaction.token_transfers
              : []) {
              const transferFrom = normalizedAddress(transfer.from && transfer.from.hash);
              const transferTo = normalizedAddress(transfer.to && transfer.to.hash);
              const token = normalizedAddress(transfer.token && transfer.token.address);
              if (transferFrom !== fromSigner || transferTo !== toRecipient || token !== USDC_BASE) continue;
              const amount = Number(BigInt(String(transfer.total && transfer.total.value))) / 1e6;
              return finish(amount >= required
                ? { ok: true, amount_usdc: amount, method: 'token_transfers' }
                : { ok: false, error: 'underpaid' });
            }
            for (const log of Array.isArray(transaction.logs) ? transaction.logs : []) {
              const topics = Array.isArray(log.topics) ? log.topics : [];
              const address = normalizedAddress(log.address);
              if (address !== USDC_BASE || topics.length < 3 || topics[0] !== TRANSFER_TOPIC) continue;
              const logFrom = normalizedAddress('0x' + String(topics[1]).slice(-40));
              const logTo = normalizedAddress('0x' + String(topics[2]).slice(-40));
              if (logFrom !== fromSigner || logTo !== toRecipient) continue;
              const amount = Number(BigInt(String(log.data || '0x0'))) / 1e6;
              return finish(amount >= required
                ? { ok: true, amount_usdc: amount, method: 'ERC20 Transfer log' }
                : { ok: false, error: 'underpaid' });
            }
            return finish({ ok: false, error: 'no USDC transfer to recipient in tx' });
          } catch {
            return finish({ ok: false, error: 'invalid payment provider response' });
          }
        });
        response.on('error', () => finish({ ok: false, error: 'payment provider response error' }));
      },
    );
    request.on('error', () => finish({ ok: false, error: 'payment provider unavailable' }));
    request.setTimeout(15000, () => request.destroy());
  });
}

module.exports = {
  normalizedAddress,
  offlinePaymentsAllowed,
  parsePaymentHeader,
  reservePayment,
  reserveDurablePayment,
  verifyOrderSignature,
  verifyPayment,
  verifyUsdcTransfer,
};
