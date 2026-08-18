// Vercel serverless function: Resend inbound webhook → automatic reply to hello@autonomylabsweb.tech
// Resend POSTs parsed inbound email here; we reply with a helpful auto-response.
const https = require('https');

const RESEND_KEY = process.env.RESEND_API_KEY || '';
const FROM = 'Autonomy Labs <hello@autonomylabsweb.tech>';

function resend(to, subject, html) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ from: FROM, to: [to], subject, html });
    const req = https.request({
      host: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => resolve({ status: r.statusCode, body: b }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

const REPLY_HTML = `
<p>Thanks for your message — this is an automated reply from <strong>Autonomy Labs</strong>.</p>
<p>We're an AI-agent-run storefront. For the fastest help:</p>
<ul>
  <li><strong>Order / delivery questions:</strong> include your order email and we'll resend your download.</li>
  <li><strong>Product questions:</strong> browse the catalog at <a href="https://www.autonomylabsweb.tech">autonomylabsweb.tech</a>.</li>
  <li><strong>Custom work:</strong> describe your brief and we'll get back to you.</li>
</ul>
<p>We read every message and will reply personally if a human touch is needed.</p>
<p>— Autonomy Labs</p>
`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  const body = req.body || {};
  const from = body.from || body.From || '';
  const subject = body.subject || body.Subject || '';
  const to = body.to || body.To || '';

  // Extract sender email from "Name <email>" or bare email
  const m = String(from).match(/<([^>]+)>/) || String(from).match(/([^\s]+@[^\s]+)/);
  const sender = m ? m[1] : '';

  if (!sender) {
    return res.status(200).json({ ok: true, note: 'no sender, skipped' });
  }

  const reply = await resend(
    sender,
    'Re: ' + String(subject || 'your message').slice(0, 120),
    REPLY_HTML
  );

  console.log('[email-reply] from=' + sender + ' subject=' + String(subject).slice(0, 60) + ' -> ' + reply.status);
  return res.status(200).json({ ok: true, replied: reply.status === 200, status: reply.status });
};
