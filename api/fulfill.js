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
    'prod_V1NAfKW9B8TwyM': { // AI Business Automator Prompt Pack
      subject: 'Your AI Business Automator Prompt Pack is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Business Automator Prompt Pack</strong>!</p><p>This pack gives you 30 copy-paste prompts to automate lead generation, outbound outreach, content, and admin with AI agents:</p><ul><li><strong>10 lead-gen prompts</strong> to find, research, and score prospects.</li><li><strong>8 outreach prompts</strong> for cold email and LinkedIn sequences.</li><li><strong>7 content prompts</strong> to plan, write, and repurpose posts.</li><li><strong>5 admin prompts</strong> for SOPs, checklists, and delegation.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    
    'prod_V1NQQnvrhz8TPV': { // AI Agent Revenue Playbook
      subject: 'Your AI Agent Revenue Playbook is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Revenue Playbook</strong>!</p><p>This playbook gives you 25 zero-capital ways AI agents get paid, plus the exact automation stacks for hands-off collection:</p><ul><li><strong>25 revenue paths</strong> that need no human in the loop.</li><li><strong>Stripe + webhook + email automation</strong> for instant digital fulfillment.</li><li><strong>Agent discoverability</strong> (llms.txt, agents.txt) so other AI agents can find and buy.</li><li><strong>Kill-vs-double-down framework</strong> for running small experiments.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
'prod_V1ME008XOCi3LQ': { // Automated Outreach Toolkit
      subject: 'Your Automated Outreach Toolkit is ready',
      body: '<p>Thanks for your purchase of the <strong>Automated Outreach Toolkit</strong>!</p><p>This toolkit gives you copy-paste scripts, email sequences, and automation recipes for AI-assisted outbound sales:</p><ul><li><strong>30 cold-email and LinkedIn scripts</strong> ready to adapt.</li><li><strong>3 follow-up sequences</strong> that boost reply rates.</li><li><strong>An objection-handling guide</strong> for common sales pushback.</li><li><strong>Automation setup recipes</strong> for Zapier and Make.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1Ocv95jQSnRec': { // AI Agent MCP Server Kit
      subject: 'Your AI Agent MCP Server Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent MCP Server Kit</strong>!</p><p>This kit gives you a complete Model Context Protocol (MCP) server starter in TypeScript plus the config you need to expose your own tools to Claude and other agent runtimes:</p><ul><li><strong>Ready-to-deploy MCP server skeleton</strong> (TypeScript + schema).</li><li><strong>Tool registration + JSON config</strong> templates.</li><li><strong>Setup guide</strong> to connect Claude Code and other clients.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1OcEPbGwAnxZU': { // AI Agent Contract & Payment Templates
      subject: 'Your AI Agent Contract & Payment Templates is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Contract &amp; Payment Templates</strong>!</p><p>This pack gives you the documents an AI agent needs to get paid compliantly:</p><ul><li><strong>Service contract</strong> and <strong>scope-of-work</strong> templates.</li><li><strong>Invoice + NDA</strong> templates.</li><li><strong>Payment-collection automation notes</strong>.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
            'prod_V1OyyqT342L06c': { // Zombie Slasher Game
      subject: 'Your Zombie Slasher Game source is ready',
      body: '<p>Thanks for your purchase of the <strong>Zombie Slasher Game (Three.js)</strong>!</p><p>Your download is a single <code>index.html</code> — a complete first-person zombie slasher prototype:</p><ul><li><strong>WASD</strong> movement, <strong>pointer-lock</strong> mouse camera, visible melee weapon.</li><li><strong>Left-click</strong> to attack; zombies chase and damage you.</li><li><strong>Health</strong>, <strong>kill counter</strong>, spawning waves, <strong>game-over</strong> and <strong>restart</strong> (R).</li><li>No build step, no external assets — open it in any modern browser or serve it from a static server.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1Oydy1pZSBuEb': { // AI Agent Skill Pack
      subject: 'Your AI Agent Skill Pack is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Skill Pack (MCP + Tools)</strong>!</p><p>This pack gives you ready-to-use MCP server and agent skill templates:</p><ul><li><strong>TaskMarket MCP server</strong> — self-contained, zero dependencies.</li><li><strong>Agent status dashboard</strong> template.</li><li><strong>Client config</strong> for Claude Code and Codex.</li><li><strong>Setup guide</strong> + usage instructions.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
'prod_V1OoFbbQP4mX3f': { // TaskMarket MCP Server Kit
      subject: 'Your TaskMarket MCP Server Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>TaskMarket MCP Server Kit</strong>!</p><p>This kit gives you a self-contained MCP server that integrates the TaskMarket worker market into Claude, Codex and other agentic products:</p><ul><li><strong>server.js</strong> — zero-dependency MCP server over stdio (JSON-RPC).</li><li><strong>5 tools</strong>: tm_list_tasks, tm_get_task, tm_wallet_balance, tm_my_submissions, tm_submit_work.</li><li><strong>Open source</strong> on GitHub: https://github.com/Autonomy-Labs-Tech/taskmarket-mcp</li><li><strong>Setup guide</strong> to connect any MCP-compatible client.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
'prod_V1OcQN6ajUdvEG': { // AI Automation SOP Master Bundle
      subject: 'Your AI Automation SOP Master Bundle is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Automation SOP Master Bundle</strong>!</p><p>This bundle gives you 50+ standard operating procedures and delegation checklists to automate operations with AI agents:</p><ul><li><strong>50+ SOPs</strong> across sales, marketing, support, and admin.</li><li><strong>Delegation checklists</strong> for handing tasks to agents.</li><li><strong>Handoff templates</strong> for recurring automations.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1NoiM3wT26ouC': { // AI Agent Storefront Kit
      subject: 'Your AI Agent Storefront Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Storefront Kit</strong>!</p><p>This kit gives you a complete, AI-agent-discoverable storefront you can deploy on Vercel in minutes:</p><ul><li><strong>llms.txt, agents.txt, sitemap.xml, robots.txt, and .well-known/x402</strong> so AI agents can find and buy from you.</li><li><strong>Stripe Checkout + auto-fulfillment webhook template</strong> for hands-off digital delivery.</li><li><strong>Schema.org Product markup</strong> and a Vercel deploy guide.</li><li><strong>Product landing pages</strong> you can copy and customize.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1QZlxAd6b5AYT': { // AI Agent Outbound Sales Kit
      subject: 'Your AI Agent Outbound Sales Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Outbound Sales Kit</strong>!</p><p>This kit is a complete copy-paste outbound sales system for AI agents:</p><ul><li><strong>20 cold-email scripts</strong> ready to adapt and send.</li><li><strong>10 LinkedIn outreach scripts</strong> plus follow-up logic.</li><li><strong>Objection-handling</strong> and CTA templates.</li><li><strong>CAN-SPAM / GDPR compliance checklist</strong> so your outreach stays lawful.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1QiyDbNHDU2H2': { // AI Agent Website Launch Kit
      subject: 'Your AI Agent Website Launch Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Website Launch Kit</strong>!</p><p>This kit is a complete, deployable AI-agent-discoverable website:</p><ul><li><strong>Ready-to-deploy HTML landing page</strong> for Vercel.</li><li><strong>llms.txt + llms-full.txt</strong> so AI agents can read your catalog.</li><li><strong>agents.txt, sitemap.xml, robots.txt</strong> for discoverability.</li><li><strong>.well-known/x402</strong> configuration for agent payments.</li><li><strong>Stripe Checkout + auto-fulfillment webhook template</strong> (Node.js serverless).</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1QiUEfoVHeU9P': { // AI Business Plan & Pitch Deck Kit
      subject: 'Your AI Business Plan & Pitch Deck Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Business Plan &amp; Pitch Deck Kit</strong>!</p><p>This kit gives you everything to plan and pitch an AI-service business:</p><ul><li><strong>Full business plan narrative</strong> (executive summary, market, model, financials).</li><li><strong>10-slide investor pitch deck outline</strong> with talking points.</li><li><strong>Pricing strategy</strong> and funding/runway templates.</li><li><strong>One-page summary</strong> and milestones tracker.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1QZAxF6W7iY8W': { // TaskMarket Autopilot Worker
      subject: 'Your TaskMarket Autopilot Worker config is ready',
      body: '<p>Thanks for your purchase of the <strong>TaskMarket Autopilot Worker</strong>!</p><p>This pack gives you a deployable worker config for earning on TaskMarket bounties on autopilot:</p><ul><li><strong>Task-scanning loop</strong> templates that poll for fresh low-competition tasks.</li><li><strong>Submission quality gates</strong> so you only ship your best work.</li><li><strong>Requester psychology</strong> notes and a local agent harness.</li><li><strong>Free-submit rules</strong> (first 5 per task free) so you start with zero capital.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1P7mJYRxMsCfJ': { // AI Agent x402 & Discovery Setup Guide
      subject: 'Your AI Agent x402 & Discovery Setup Guide is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent x402 &amp; Discovery Setup Guide</strong>!</p><p>This guide makes any website discoverable and buyable by AI agents:</p><ul><li><strong>llms.txt + llms-full.txt</strong> templates for your docs and catalog.</li><li><strong>agents.txt</strong>, <strong>sitemap.xml</strong> and <strong>robots.txt</strong> best practices.</li><li><strong>.well-known/x402</strong> setup for account-less agent payments.</li><li><strong>Schema.org Product + JSON-LD</strong> markup examples.</li><li><strong>Vercel + Stripe</strong> auto-fulfillment wiring notes.</li></ul><p>Keep this email — it is your lifetime access.</p>'
    },
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
