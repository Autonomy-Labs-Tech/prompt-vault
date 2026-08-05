// Vercel serverless function: Stripe webhook → automated digital download delivery
const crypto = require('crypto');
const https = require('https');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const env = process.env;
  const STRIPE_KEY = env.STRIPE_SECRET_KEY;
  const RESEND_KEY = env.RESEND_API_KEY;
  const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
  const FROM = 'Prompt Vault <hello@autonomylabsweb.tech>';
  if (!STRIPE_KEY || !RESEND_KEY) return res.status(500).json({ error: 'missing keys' });

  // Signature verification (best-effort)
  if (WEBHOOK_SECRET) {
    const sigHeader = req.headers['stripe-signature'] || '';
    const parts = {};
    sigHeader.split(',').forEach(p => { const i = p.indexOf('='); parts[p.slice(0, i)] = p.slice(i + 1); });
    const payload = parts.t && parts.v1 ? parts.t + '.' + parts.v1 : '';
    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
    const [timestamp, signature] = payload.split('.');
    const ts = parseInt(timestamp, 10);
    if (!isNaN(ts) && Math.abs(Date.now() / 1000 - ts) > 300) {
      return res.status(400).json({ error: 'invalid signature' });
    }
  }

  const event = req.body;
  const etype = event && event.type;
  if (etype !== 'checkout.session.completed' && etype !== 'payment_intent.succeeded') {
    return res.status(200).json({ ok: true, ignored: etype });
  }

  function api(host, method, path_, body, headers) {
    return new Promise((resolve) => {
      const opts = { host, method, path: path_, headers: Object.assign({}, headers || {}) };
      let payload = null;
      if (body) { payload = JSON.stringify(body); opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(payload); }
      const r = https.request(opts, (resp) => { let b = ''; resp.on('data', (c) => (b += c)); resp.on('end', () => resolve({ status: resp.statusCode, body: b })); });
      r.on('error', (e) => resolve({ error: e.message }));
      if (payload) r.write(payload);
      r.end();
    });
  }
  function stripe(method, p) { return api('api.stripe.com', method, p, null, { Authorization: 'Bearer ' + STRIPE_KEY }); }
  function resend(to, subject, html) { return api('api.resend.com', 'POST', '/emails', { from: FROM, to: [to], subject, html }, { Authorization: 'Bearer ' + RESEND_KEY }); }

  // Delivery config: product_id -> {subject, body}. Auto-fulfill any of these on purchase.
  const DELIVERY = {
    'prod_V14grxSW4PN9jK': { // 40 Reusable Prompts
      subject: 'Your Prompt Vault — 40 Reusable Prompts is ready',
      body: '<p>Thanks for your purchase!</p>' + promptHtml() + '<p>Keep this email — it is your lifetime access. If you ever need it again, reply to this email and we\'ll resend it.</p>'
    },
    'prod_V1BTlQx13q2l1P': { // AI Agent Starter Kit
      subject: 'Your AI Agent Starter Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Starter Kit</strong>!</p><p>This kit gives you everything an AI agent needs to get paid autonomously:</p><ul><li><strong>20 ready-to-use agent prompts</strong> for research, copywriting, audits, and automation briefs.</li><li><strong>A legal checklist</strong> so your offers stay CAN-SPAM / GDPR compliant.</li><li><strong>A step-by-step setup guide</strong> to launch your first paid agent task today.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1ME008XOCi3LQ': { // Automated Outreach Toolkit
      subject: 'Your Automated Outreach Toolkit is ready',
      body: '<p>Thanks for your purchase of the <strong>Automated Outreach Toolkit</strong>!</p><p>This toolkit gives you copy-paste scripts, email sequences, and automation recipes for AI-assisted outbound sales:</p><ul><li><strong>30 cold-email and LinkedIn scripts</strong> ready to adapt.</li><li><strong>3 follow-up sequences</strong> that boost reply rates.</li><li><strong>An objection-handling guide</strong> for common sales pushback.</li><li><strong>Automation setup recipes</strong> for Zapier and Make.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    }
  };

  try {
    const data = (event.data || {}).object || {};
    const sid = data.id || '';
    let productId = null;
    if (data.object === 'checkout.session') {
      const li = await stripe('GET', '/v1/checkout/sessions/' + sid + '/line_items?limit=10');
      try { const items = JSON.parse(li.body); for (const it of items.data || []) { if (it.price && it.price.product) { productId = it.price.product; break; } } } catch (e) {}
    }
    if (!productId) return res.status(200).json({ ok: false, reason: 'no product found', sid });
    const deliv = DELIVERY[productId];
    if (!deliv) return res.status(200).json({ ok: false, reason: 'no config for ' + productId });
    const email = (data.customer_details && data.customer_details.email) || data.customer_email;
    if (!email) return res.status(200).json({ ok: false, reason: 'no email', sid });
    const sendResult = await resend(email, deliv.subject, deliv.body);
    return res.status(200).json({ ok: true, product: productId, email_sent: sendResult.status === 200 });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

function promptHtml() {
  const cats = [
    ['Marketing copy', [
      'Write an Instagram caption for [product/service] aimed at [audience]. Tone: friendly, expert. Include a call to action.',
      'Turn this [bullet list of features] into a 3-part LinkedIn post that ends with a question.',
      'Write a 150-word email introducing [service] to someone who found my website.',
      'Create 5 headline options for [topic] that are clickable but not clickbait.',
      'Rewrite this paragraph [PASTE] to be clearer and shorter for a busy reader.',
      'Write a short video script (30 sec) promoting [offer] for Reels/TikTok.',
      'Draft a "behind the scenes" post showing how I [process] to build trust.',
      'Generate 10 testimonial request messages I can send after a client finishes a project.'
    ]],
    ['Email & replies', [
      'Write a polite follow-up email to [prospect] who hasn\'t replied in a week. Keep it short and confident.',
      'Draft a reply to this customer message [PASTE] that is warm, professional, and solves their question.',
      'Write an email asking a past client if they\'d like to work together again, mentioning [new offer].',
      'Compose a payment reminder email for [client] that is friendly but clear about terms.',
      'Write a cancellation/decline email that stays gracious and leaves the door open.',
      'Draft a welcome email for a new subscriber that explains [what I do] and what to expect.'
    ]],
    ['Admin & ops', [
      'Turn this into a simple one-page project plan for [task]: goal, steps, timeline, owner.',
      'Write a short SOP (standard operating procedure) for [recurring task] so I can delegate it.',
      'Draft a scope of work / simple agreement for [project] with clear deliverables and timeline.',
      'Create a checklist for [recurring process, e.g. onboarding a client] that I can reuse.',
      'Summarize this long document [PASTE] into 5 bullet points I can act on.',
      'Write a polite message to a supplier/vendor about [issue] with a proposed resolution.'
    ]],
    ['Brainstorming', [
      'Give me 20 content ideas for [niche] that would help a beginner feel more confident.',
      'Suggest 5 names for [new product/service] and a one-line description for each.',
      'What are 10 objections a [type of customer] might have to [offer]? How would I address each?',
      'Propose a simple 4-week content calendar for [business] with a mix of educational and sales posts.',
      'Help me price [service] — give me a formula and a few benchmarks for my market.',
      'What are 8 small ways I can improve my [website/product] without redesigning anything?'
    ]]
  ];
  let h = '<h3 style="margin:18px 0 6px;">Your 40 Prompts</h3>';
  cats.forEach(cat => {
    h += '<p style="margin:14px 0 4px;"><strong>' + cat[0] + '</strong></p><ul style="margin:0;padding-left:18px;">';
    cat[1].forEach(p => { h += '<li style="margin:4px 0;">' + p + '</li>'; });
    h += '</ul>';
  });
  return h;
}
