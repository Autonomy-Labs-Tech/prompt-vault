const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const net = require('net');

const MAX_BYTES = 300000;

function blockedIp(value) {
  const ip = String(value || '').toLowerCase();
  if (net.isIPv4(ip)) {
    const octets = ip.split('.').map(Number);
    const [a, b] = octets;
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 0 || b === 2 || b === 168))
      || (a === 198 && (b === 18 || b === 19 || b === 51))
      || (a === 203 && b === 0) || a >= 224;
  }
  if (!net.isIPv6(ip)) return true;
  if (ip.startsWith('::ffff:')) {
    const tail = ip.slice(7);
    if (net.isIPv4(tail)) return blockedIp(tail);
    const parts = tail.split(':');
    if (parts.length === 2 && parts.every((part) => /^[0-9a-f]{1,4}$/.test(part))) {
      const first = Number.parseInt(parts[0], 16);
      const second = Number.parseInt(parts[1], 16);
      return blockedIp([
        first >> 8, first & 255, second >> 8, second & 255,
      ].join('.'));
    }
    return true;
  }
  if (ip === '::' || ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd')
    || ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea')
    || ip.startsWith('feb') || /^fe[c-f]/.test(ip) || ip.startsWith('ff')) return true;
  return false;
}

async function resolvePublic(rawUrl, timeoutMs = 5000) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password
    || (parsed.port && parsed.port !== '443')) {
    throw new Error('only public HTTPS URLs are allowed');
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '');
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost')
    || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('private URL host blocked');
  }
  const addresses = net.isIP(hostname)
    ? [{ address: hostname }]
    : await Promise.race([
      dns.lookup(hostname, { all: true, verbatim: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DNS lookup timeout')), timeoutMs)),
    ]);
  if (!addresses.length || addresses.some((entry) => blockedIp(entry.address))) {
    throw new Error('URL host resolves to a private address');
  }
  return { parsed, address: addresses[0].address };
}

function publicGet(rawUrl, options = {}) {
  const timeoutMs = Math.min(Number(options.timeoutMs) || 8000, 15000);
  const maxBytes = Math.min(Number(options.maxBytes) || MAX_BYTES, MAX_BYTES);
  return resolvePublic(rawUrl, timeoutMs).then(({ parsed, address }) => new Promise((resolve) => {
    const client = parsed.protocol === 'https:' ? https : http;
    let request;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      resolve(result);
    };
    const deadline = setTimeout(() => {
      if (request) request.destroy(new Error('request deadline'));
      finish({ status: 0, ct: '', bytes: 0, body: '', err: 'request deadline' });
    }, timeoutMs);
    request = client.get({
      protocol: parsed.protocol,
      hostname: address,
      port: 443,
      path: parsed.pathname + parsed.search,
      headers: { Host: parsed.host, 'User-Agent': 'autonomy-labs-public-audit/1.0' },
      servername: parsed.hostname,
      lookup: (_hostname, _options, callback) => callback(null, address, net.isIP(address)),
      timeout: timeoutMs,
    }, (response) => {
      const chunks = [];
      let bytes = 0;
      response.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes <= maxBytes) chunks.push(chunk);
        else request.destroy();
      });
      response.on('end', () => finish({
        status: response.statusCode || 0,
        ct: response.headers['content-type'] || '',
        bytes,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
      response.on('error', () => finish({ status: 0, ct: '', bytes, body: '' }));
    });
    request.on('error', (error) => finish({ status: 0, ct: '', bytes: 0, body: '', err: error.message }));
    request.setTimeout(timeoutMs, () => request.destroy(new Error('request timeout')));
  }));
}

module.exports = { blockedIp, publicGet, resolvePublic };
