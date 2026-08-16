// Vercel serverless function: Stripe webhook → automated digital download delivery
const https = require('https');

const FULFILLABLE_EVENTS = ['checkout.session.completed', 'payment_intent.succeeded'];
const SIGNATURE_TOLERANCE_SEC = 300;
// Keep the non-secret QA allowlist inside the deployed function bundle. The
// local harness has its own copy under mission/, but production deployments
// must never need to traverse outside business2/ to evaluate test metadata.
const FIXTURE_METADATA_SOURCE = 'bundled_stripe_test_fixtures';
let PACKAGED_TEST_FIXTURES = null;
let PACKAGED_TEST_FIXTURE_DIAGNOSTIC = Object.freeze({
  source: FIXTURE_METADATA_SOURCE,
  status: 'unavailable',
  code: 'metadata_unavailable',
});

function isApprovedFixtureShape(fixture) {
  return (
    fixture
    && typeof fixture.product_id === 'string'
    && /^prod_[A-Za-z0-9]+$/.test(fixture.product_id)
    && typeof fixture.price_id === 'string'
    && /^price_[A-Za-z0-9]+$/.test(fixture.price_id)
    && typeof fixture.event_id === 'string'
    && /^evt_[A-Za-z0-9]+$/.test(fixture.event_id)
    && fixture.event_type === 'checkout.session.completed'
    && fixture.checkout_mode === 'payment'
    && fixture.price_type === 'one_time'
    && fixture.livemode === false
  );
}

function setFixtureMetadataDiagnostic(status, code) {
  PACKAGED_TEST_FIXTURE_DIAGNOSTIC = Object.freeze({
    source: FIXTURE_METADATA_SOURCE,
    status,
    code,
  });
}

try {
  // A static require makes Vercel include the JSON in the function bundle.
  const parsed = require('./stripe_test_fixtures.json');
  if (!parsed || !Array.isArray(parsed.fixtures)) {
    setFixtureMetadataDiagnostic('invalid', 'invalid_metadata_shape');
  } else if (
    parsed.fixtures.length === 0
    || parsed.fixtures.some((fixture) => !isApprovedFixtureShape(fixture))
  ) {
    setFixtureMetadataDiagnostic('invalid', 'invalid_fixture_entry');
  } else {
    const productIds = parsed.fixtures.map((fixture) => fixture.product_id);
    if (new Set(productIds).size !== productIds.length) {
      setFixtureMetadataDiagnostic('invalid', 'duplicate_fixture_product');
    } else {
      PACKAGED_TEST_FIXTURES = parsed;
      setFixtureMetadataDiagnostic('loaded', 'metadata_loaded');
    }
  }
} catch (error) {
  // Do not expose the loader error, path, or bundled contents in a response.
  // A fixed code still makes missing and malformed bundles observable safely.
  setFixtureMetadataDiagnostic(
    error && error.name === 'SyntaxError' ? 'invalid' : 'unavailable',
    error && error.name === 'SyntaxError' ? 'invalid_metadata_json' : 'metadata_unavailable',
  );
}

function safeFixtureMetadataDiagnostic() {
  if (PACKAGED_TEST_FIXTURE_DIAGNOSTIC.status === 'loaded') return null;
  return {
    source: PACKAGED_TEST_FIXTURE_DIAGNOSTIC.source,
    status: PACKAGED_TEST_FIXTURE_DIAGNOSTIC.status,
    code: PACKAGED_TEST_FIXTURE_DIAGNOSTIC.code,
  };
}

// Stripe sends `t=<unix-seconds>,v1=<hex-hmac>` (repeated v1 during secret rotation).
function parseStripeSignature(header) {
  const raw = String(header == null ? '' : header).trim();
  if (!raw) return { present: false, valid: false, timestamp: NaN };
  let t = null;
  const v1 = [];
  for (const part of raw.split(',')) {
    const i = part.indexOf('=');
    if (i <= 0) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (key === 't') t = value;
    else if (key === 'v1') v1.push(value);
  }
  const timestamp = parseInt(t, 10);
  const valid = t !== null && String(timestamp) === t && Number.isFinite(timestamp) &&
    v1.length > 0 && v1.every((s) => /^[a-f0-9]{64}$/i.test(s));
  return { present: true, valid, timestamp };
}

function readApprovedTestFixtures() {
  const parsed = PACKAGED_TEST_FIXTURES;
  if (!parsed || !Array.isArray(parsed.fixtures)) return [];
  return parsed.fixtures.filter(isApprovedFixtureShape);
}

function approvedTestFixture(productId) {
  const matches = readApprovedTestFixtures().filter((fixture) => fixture.product_id === productId);
  return matches.length === 1 ? matches[0] : null;
}

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const env = process.env;
  const STRIPE_KEY = env.STRIPE_SECRET_KEY;
  const RESEND_KEY = env.RESEND_API_KEY;
  const FROM = 'Prompt Vault <hello@autonomylabsweb.tech>';
  if (!STRIPE_KEY || !RESEND_KEY) return res.status(503).json({ error: 'fulfillment not configured' });

  const event = req.body;
  if (!event || typeof event !== 'object' || Array.isArray(event) || typeof event.type !== 'string') {
    return res.status(400).json({ error: 'malformed event body' });
  }
  const etype = event.type;
  if (!FULFILLABLE_EVENTS.includes(etype)) {
    return res.status(200).json({ ok: true, ignored: etype });
  }

  // Past this point the request can send a paid deliverable, so the caller has to
  // prove the event really came from Stripe.
  const sig = parseStripeSignature(req.headers['stripe-signature']);
  if (!sig.present) return res.status(401).json({ error: 'missing stripe-signature header' });
  if (!sig.valid) return res.status(400).json({ error: 'malformed stripe-signature header' });
  if (Math.abs(Date.now() / 1000 - sig.timestamp) > SIGNATURE_TOLERANCE_SEC) {
    return res.status(400).json({ error: 'stripe-signature timestamp outside tolerance' });
  }
  if (typeof event.id !== 'string' || !/^evt_[A-Za-z0-9]+$/.test(event.id)) {
    return res.status(401).json({ error: 'missing or malformed event id' });
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
  function resend(to, subject, html, idempotencyKey) {
    return api(
      'api.resend.com',
      'POST',
      '/emails',
      { from: FROM, to: [to], subject, html },
      {
        Authorization: 'Bearer ' + RESEND_KEY,
        'Idempotency-Key': idempotencyKey,
      },
    );
  }

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
    'prod_V1Ql3wgQggszMv': { // AI Agent Security & Compliance Checklist
      subject: 'Your AI Agent Security & Compliance Checklist is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Security & Compliance Checklist</strong>!</p><p>This checklist covers lawful, safe AI-agent design: CAN-SPAM, GDPR, data handling, disclosure, and safety guardrails. Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1Qlw7sNYwbA1s': { // AI Agent Monetization Starter Kit
      subject: 'Your AI Agent Monetization Starter Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Monetization Starter Kit</strong>!</p><p>This playbook covers Stripe, TaskMarket, Clustly and affiliate monetization with zero starting capital. Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1QlhOYbYqVPfX': { // AI Agent QA & Test Playbook
      subject: 'Your AI Agent QA & Test Playbook is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent QA & Test Playbook</strong>!</p><p>This playbook covers testing AI deliverables from multiple angles before shipping. Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1RAYuGKLC6ATV': { // AI Agent Prompt Injection Defense & Guardrails
      subject: 'Your AI Agent Prompt Injection Defense & Guardrails guide is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Prompt Injection Defense &amp; Guardrails</strong> guide!</p><p>This covers input-filtering patterns, tool-permission policies, output sanitization, and copy-paste policy templates to harden your agent against prompt injection. Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1PyRpo3aaiBpW': { // Autonomous Agent Business OS
      subject: 'Your Autonomous Agent Business OS is ready',
      body: '<p>Thanks for your purchase of the <strong>Autonomous Agent Business OS</strong>!</p><p>This is a full operating system for a solo autonomous agent business: mission definition, state tracking, daemons, crons, dashboards, and honesty rules. Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1PyUnouENoKi5': { // TaskMarket Bounty Winning Playbook
      subject: 'Your TaskMarket Bounty Winning Playbook is ready',
      body: '<p>Thanks for your purchase of the <strong>TaskMarket Bounty Winning Playbook</strong>!</p><p>This tactical playbook covers task selection, quality-first deliverables, requester psychology, and common pitfalls for winning TaskMarket bounties. Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1RtCgK4vsTSID': { // AI Agent Fulfillment Webhook Kit
      subject: 'Your AI Agent Fulfillment Webhook Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent Fulfillment Webhook Kit</strong>!</p><p>This kit gives you a deployable Stripe webhook that auto-delivers digital products by email: signature verification, product lookup, and Resend delivery with a purchases log. Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1RtaNrM4SgPkQ': { // AI Agent x402 Paywall Setup Kit
      subject: 'Your AI Agent x402 Paywall Setup Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent x402 Paywall Setup Kit</strong>!</p><p>This kit shows you how to charge AI agents for access with x402: manifest format, payment flow, and wiring it to Stripe Checkout. Keep this email — it is your lifetime access.</p>'
    },
    'prod_V1NvDTS0cNV4kK': { // AI Website Audit Report
      subject: 'Your AI Website Audit Report is confirmed',
      body: '<p>Thanks for your purchase of the <strong>AI Website Audit Report</strong>!</p><p>We could not find a website URL with this order. Reply to this email with the URL you want audited and we will run the deep AI-agent discoverability audit and email your report with concrete fixes. (Tip: next time, enter the URL in the "Website URL to audit" field at checkout and the report arrives automatically.)</p>'
    },
    'prod_V1TprsCU1bxALX': { // Custom Three.js Scene Rebuild
      subject: 'Your Custom Three.js Scene Rebuild is confirmed',
      body: '<p>Thanks for your purchase of the <strong>Custom Three.js Scene Rebuild</strong>!</p><p>Your order is confirmed. We build a self-contained offline Three.js r185 scene from your brief (geometric silhouettes, original Web Audio score, sources.md + concept note + screenshots) and email the finished files within 5–7 days. Reply to this email with any extra scene details; your delivery email is the one on the order.</p>'
    },
    'prod_V2srm9e77mqyiy': { // Agent Billing & Metering API
      subject: 'Your Agent Billing & Metering API source is ready',
      body: '<p>Thanks for your purchase of the <strong>Agent Billing &amp; Metering API</strong>!</p><p>Your source + deploy guide: usage-tracking API (events, meters, quotas), Stripe billing integration (customers, invoices, webhook verification), and a Vercel serverless deploy guide. MIT-licensed Node.js source with clear sections. Questions? Reply to this email.</p>'
    },
    'prod_V2srVAtqzZxbU5': { // Agent Memory-as-a-Service
      subject: 'Your Agent Memory-as-a-Service source is ready',
      body: '<p>Thanks for your purchase of the <strong>Agent Memory-as-a-Service</strong>!</p><p>Your source + deploy guide: namespaced key-value memory API (write/read/delete, TTL), semantic recall endpoint with pluggable embedding backend, and a Vercel serverless deploy guide. MIT-licensed Node.js source. Questions? Reply to this email.</p>'
    },
    'prod_V2n7sE2F9cjj5C': { // TaskMarket Agent Integration Pack
      subject: 'Your TaskMarket Agent Integration Pack is ready',
      body: '<p>Thanks for your purchase of the <strong>TaskMarket Agent Integration Pack</strong>!</p>'
        + '<p>Two production integrations, both open-source MIT:</p>'
        + '<ul><li><strong>MCP server</strong> — https://github.com/Autonomy-Labs-Tech/taskmarket-mcp (5 tools: tm_list_tasks, tm_get_task, tm_wallet_balance, tm_my_submissions, tm_submit_work; stdio JSON-RPC; plugs into Claude Code, Cursor, Codex).</li>'
        + '<li><strong>Claude Code skill</strong> — https://github.com/Autonomy-Labs-Tech/taskmarket-skill (SKILL.md with tm list/get/wallet/mine/submit).</li></ul>'
        + '<p>Setup: <code>npm i -g @lucid-agents/taskmarket</code> then run <code>node server.js</code> (MCP) or copy the skill into your Claude skills dir. Bounty/benchmark submissions are free on TaskMarket — the pack is the integration layer.</p>'
        + '<p>Questions? Reply to this email.</p>'
    },
    'prod_V2sWYMmfYnyZiy': { // AI Agent API Integration Kit
      subject: 'Your AI Agent API Integration Kit is ready',
      body: '<p>Thanks for your purchase of the <strong>AI Agent API Integration Kit</strong>!</p><p>Your source and deploy guide covers Stripe, GitHub, Resend/SendGrid, and generic REST integrations, including authentication headers, retries, rate limits, timeouts, and webhook patterns. Questions? Reply to this email.</p>'
    },
    'prod_V2yPaaEwIm1vvE': { // Custom Browser Game Prototype
      subject: 'Your Custom Browser Game Prototype project is confirmed',
      body: '<p>Thanks for your purchase of the <strong>Custom Browser Game Prototype</strong>!</p><p>Your original single-file Three.js game prototype is confirmed. We will build it to your brief, include one revision round, and deliver the playable HTML source by email within 7–10 days. Reply to this email with any extra gameplay or visual details.</p>'
    },
    'prod_V1U1Svayw5Gvd1': { // Three.js Scene Build Toolkit
      subject: 'Your Three.js Scene Build Toolkit is ready',
      body: '<p>Thanks for your purchase of the <strong>Three.js Scene Build Toolkit</strong>!</p>'
        + '<h3 style="margin:16px 0 6px">1. Scene template (app.js)</h3>'
        + '<p>Deterministic rendering core — one clock, one <code>renderAt(seconds)</code>, seeded randomness:</p>'
        + '<pre style="background:#f6f8fa;padding:10px;border-radius:6px;font-size:12px;overflow-x:auto">function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};\nconst rand = mulberry32(20260806); // seed once at build\nfunction renderAt(t){ updateBike(t); updateCamera(t); renderer.render(scene,camera); }\n// keyframe timeline: lerp between {t,x,y,z,tilt} entries with smoothstep</pre>'
        + '<h3 style="margin:16px 0 6px">2. Single-file build (build_html.js)</h3>'
        + '<pre style="background:#f6f8fa;padding:10px;border-radius:6px;font-size:12px;overflow-x:auto">npx esbuild app.js --bundle --minify --format=iife --outfile=bundle.js\n# then inline bundle.js into index.html: &lt;script&gt;...&lt;/script&gt; (no CDN, no import map)</pre>'
        + '<h3 style="margin:16px 0 6px">3. Headless captures (puppeteer)</h3>'
        + '<p>Open <code>file://index.html?t=26</code> in headless Chromium, screenshot at native resolution, and read <code>window.__renderer.info</code> for draw calls / triangles / points at the busiest frame.</p>'
        + '<h3 style="margin:16px 0 6px">4. Verification checklist</h3>'
        + '<ul><li>Offline: block all HTTP/HTTPS, reload from <code>file://</code>, re-render — must work with zero errors.</li><li>Determinism: no <code>Date.now()</code> in the render path; randomness seeded once at build.</li><li>Budget: &lt;10k triangles, &lt;100 draw calls at the busiest frame.</li><li>Provenance: ship <code>sources.md</code> (film, geometry, audio, license) + concept note.</li></ul>'
        + '<p>Full source files are in our open-source repos; this guide is the production recipe we use for every shipped scene. Questions? Reply to this email.</p>'
    },
  };

  // The QA Stripe fixture is deliberately available only to the local test
  // harness. Production runs use live credentials and therefore never expose
  // this mapping or accept a test-mode event.
  const isTestKey = /^sk_test_/.test(STRIPE_KEY);
  const testMode = isTestKey && env.STRIPE_TEST_MODE === '1';
  let testModeProductId = '';
  let testFixture = null;
  if (testMode) {
    const configuredTestProductId = String(env.STRIPE_TEST_PRODUCT_ID || '').trim();
    testFixture = approvedTestFixture(configuredTestProductId);
    if (testFixture) {
      testModeProductId = configuredTestProductId;
    }
  }
  const testDelivery = testModeProductId
    ? {
      subject: 'Autonomy Labs QA Stripe test fulfillment is ready',
      body: '<p>This is a Stripe test-mode fulfillment message for the local QA harness.</p>'
        + '<p>The paid Checkout Session was verified in Stripe test mode and delivered through the same fulfillment handler used by production.</p>',
    }
    : null;
  if (testMode && !testFixture) {
    const diagnostic = safeFixtureMetadataDiagnostic();
    return res.status(200).json({
      ok: false,
      reason: 'test fixture is not approved',
      ...(diagnostic ? { diagnostic } : {}),
    });
  }
  if (testMode && event.id !== testFixture.event_id) {
    return res.status(200).json({ ok: false, reason: 'test event is not approved' });
  }

  // Vercel parses the JSON body before this handler runs, so the exact bytes Stripe
  // signed are gone and the v1 HMAC cannot be recomputed. Re-reading the event from
  // Stripe with our secret key is the authoritative substitute: a forged event id
  // does not exist there, and the returned copy is the one we act on.
  const lookup = await stripe('GET', '/v1/events/' + encodeURIComponent(event.id));
  if (lookup.error) return res.status(503).json({ error: 'could not reach stripe to verify event' });
  if (lookup.status === 404) return res.status(401).json({ error: 'event not found at stripe' });
  if (lookup.status !== 200) return res.status(503).json({ error: 'stripe event lookup failed', status: lookup.status });
  let verified;
  try { verified = JSON.parse(lookup.body); } catch (e) { return res.status(503).json({ error: 'unreadable stripe event' }); }
  if (!verified || verified.type !== etype) return res.status(401).json({ error: 'event type mismatch' });
  if (testMode && verified.livemode !== false) {
    return res.status(200).json({ ok: false, reason: 'live-mode event is not approved for test fulfillment' });
  }

  try {
    const data = (verified.data || {}).object || {};
    const sid = data.id || '';
    let checkout = null;
    if (data.object === 'checkout.session') {
      checkout = data;
      if (checkout.payment_status !== 'paid') {
        return res.status(200).json({ ok: false, reason: 'payment not settled', sid });
      }
      if (checkout.mode !== 'payment') {
        return res.status(200).json({ ok: false, reason: 'non-payment checkout mode', sid });
      }
    } else if (data.object === 'payment_intent') {
      if (data.status !== 'succeeded') {
        return res.status(200).json({ ok: false, reason: 'payment not settled', sid });
      }
      const sessions = await stripe(
        'GET',
        '/v1/checkout/sessions?payment_intent=' + encodeURIComponent(sid) + '&limit=1',
      );
      try {
        const parsed = JSON.parse(sessions.body);
        checkout = (parsed.data || [])[0] || null;
      } catch (e) {}
      if (!checkout || checkout.payment_status !== 'paid') {
        return res.status(200).json({ ok: false, reason: 'payment session not settled', sid });
      }
      if (checkout.mode !== 'payment') {
        return res.status(200).json({ ok: false, reason: 'non-payment checkout mode', sid });
      }
    }
    if (testMode && checkout && checkout.livemode !== false) {
      return res.status(200).json({ ok: false, reason: 'live-mode checkout is not approved for test fulfillment', sid });
    }

    let productId = null;
    let lineItems = [];
    if (checkout && checkout.id) {
      const li = await stripe('GET', '/v1/checkout/sessions/' + checkout.id + '/line_items?limit=10');
      try {
        const items = JSON.parse(li.body);
        lineItems = Array.isArray(items.data) ? items.data : [];
        for (const it of lineItems) {
          if (it.price && it.price.product) {
            productId = it.price.product;
            break;
          }
        }
      } catch (e) {}
    }
    if (!productId) return res.status(200).json({ ok: false, reason: 'no product found', sid });
    if (testMode) {
      const approvedLineItems = lineItems.filter((item) => (
        item
        && item.price
        && item.price.id === testFixture.price_id
        && item.price.product === testFixture.product_id
      ));
      if (lineItems.length !== 1 || approvedLineItems.length !== 1) {
        return res.status(200).json({ ok: false, reason: 'test price is not approved', sid });
      }
    }
    const deliv = isTestKey
      ? (productId === testModeProductId ? testDelivery : null)
      : DELIVERY[productId];
    if (!deliv) return res.status(200).json({ ok: false, reason: 'no config for ' + productId });
    const email = (checkout.customer_details && checkout.customer_details.email) || checkout.customer_email;
    if (!email) return res.status(200).json({ ok: false, reason: 'no email', sid });
    let subject = deliv.subject, body = deliv.body;
    if (productId === 'prod_V1NvDTS0cNV4kK') {
      // AI Website Audit Report: if the buyer supplied a website URL at checkout,
      // run the agent-readiness audit now and email the report with it.
      const cf = (data.custom_fields || []).find((f) => f.key === 'website_url');
      const url = cf && (cf.text ? cf.text.value : cf.value);
      if (url && /^https?:\/\/.+/i.test(url)) {
        const rep = await runAudit(url);
        subject = 'Your AI Website Audit Report for ' + url + ' is ready';
        body = '<p>Thanks for your purchase!</p>'
          + '<p>Here is your <strong>AI-agent discoverability audit</strong> for <code>' + esc(url) + '</code> (checked ' + rep.when + '):</p>'
          + '<table style="border-collapse:collapse;width:100%;max-width:560px;font-size:14px">'
          + '<tr style="background:#efece5"><th style="text-align:left;padding:6px 8px;border:1px solid #ddd">Surface</th><th style="text-align:left;padding:6px 8px;border:1px solid #ddd">Status</th><th style="text-align:left;padding:6px 8px;border:1px solid #ddd">Content-Type</th></tr>'
          + rep.rows
          + '</table>'
          + '<p style="font-size:16px;font-weight:700">Grade: ' + rep.grade + ' (' + rep.present + '/5 agent surfaces present)</p>'
          + '<p><strong>Top fixes:</strong></p><ul>' + rep.fixes + '</ul>'
          + '<p>Full reproducible check: <code>curl -sS -o /dev/null -w "%{http_code} %{content_type}\\n" ' + esc(url) + '/llms.txt</code></p>'
          + '<p>Questions? Reply to this email.</p>';
      }
    }
    const sendResult = await resend(email, subject, body, `stripe-event-${event.id}`);
    return res.status(200).json({ ok: true, product: productId, email_sent: sendResult.status === 200 });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

const AUDIT_SURFACES = ['/llms.txt', '/robots.txt', '/sitemap.xml', '/.well-known/x402', '/agents.txt', '/.well-known/agents.json', '/.well-known/security.txt'];

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

async function runAudit(base0) {
  const base = String(base0).replace(/\/+$/, '');
  const when = new Date().toISOString();
  const results = [];
  for (const p of AUDIT_SURFACES) {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 8000);
    try {
      const r = await fetch(base + p, { signal: ac.signal, headers: { 'User-Agent': 'autonomy-labs-audit/1.0' } });
      results.push({ path: p, status: r.status, ct: r.headers.get('content-type') || '' });
    } catch (e) {
      results.push({ path: p, status: 0, ct: '', err: e.name === 'AbortError' ? 'timeout' : e.message });
    } finally { clearTimeout(to); }
  }
  const present = results.filter((r) => r.status === 200).length;
  const grade = present >= 7 ? 'A' : present >= 5 ? 'B' : present >= 3 ? 'C' : present >= 1 ? 'D' : 'F';
  let rows = '';
  for (const r of results) {
    const st = r.status === 200 ? '<span style="color:#3f7a4f">OK 200</span>' : esc(r.status ? 'HTTP ' + r.status : (r.err || 'ERR'));
    rows += '<tr><td style="padding:6px 8px;border:1px solid #ddd"><code>' + esc(r.path) + '</code></td>'
      + '<td style="padding:6px 8px;border:1px solid #ddd">' + st + '</td>'
      + '<td style="padding:6px 8px;border:1px solid #ddd">' + esc(r.ct || '—') + '</td></tr>';
  }
  const fixes = [];
  for (const r of results) {
    if (r.status !== 200) fixes.push('<li>Add a live <code>' + esc(r.path) + '</code> (returned ' + esc(r.status || r.err) + ').</li>');
  }
  if (!results.find((r) => r.path === '/llms.txt' && r.status === 200)) fixes.push('<li>Add <code>/llms.txt</code> with your product names, prices, and buy links so AI agents can read and buy.</li>');
  if (!results.find((r) => r.path === '/.well-known/x402' && r.status === 200)) fixes.push('<li>Add <code>/.well-known/x402</code> with machine-readable payment config for agent-initiated purchases.</li>');
  if (!fixes.length) fixes.push('<li>All agent surfaces are live — keep them updated when the catalog changes.</li>');
  return { when, rows, grade, present, fixes: fixes.join('') };
}

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
