/**
 * Kanca İnşaat public site Worker.
 *
 * Two jobs:
 *   1. POST /api/notify — e-mails the admin when something happens on the site
 *      (bayi başvurusu, sipariş, teklif). The page calls this right after the
 *      Firestore write; see src/notify.ts.
 *   2. Everything else — serve the Vite build in ./dist through the ASSETS
 *      binding (wrangler.jsonc runs this script first for every request).
 *
 * Secrets/vars, set with `npx wrangler secret put <NAME>` or in the dashboard
 * under Workers → kanca-insaat → Settings → Variables:
 *   RESEND_API_KEY   Resend API key — https://resend.com, 3.000 mail/ay free.
 *   MAIL_TO          Recipient(s), comma separated.
 *   MAIL_FROM        Verified sender, e.g. "Kanca İnşaat <bildirim@ornek.com>".
 *                    Before a domain is verified in Resend, use
 *                    "onboarding@resend.dev" — Resend then only delivers to the
 *                    account owner's own address, which is enough here.
 *   ADMIN_URL        Optional. Admin panel base URL, used to build deep links.
 *   ALLOWED_ORIGINS  Optional. Comma separated origin allowlist. Unset = any.
 *
 * Without RESEND_API_KEY/MAIL_TO the endpoint answers 503 and the site simply
 * carries on — the in-panel notification is written either way.
 */

// Fallback subject prefixes, used when the caller sends no title.
const EVENT_LABELS = {
  dealer: 'Yeni bayi başvurusu',
  order: 'Yeni sipariş',
  quote: 'Yeni teklif talebi',
};

const MAX_TITLE = 120;
const MAX_BODY = 2000;
const MAX_LINK = 300;

// Best-effort flood guard. Isolates are short-lived and per-datacenter, so this
// is not a real rate limiter — it just keeps a naive script from emptying the
// Resend quota in one go. Add a Cloudflare WAF rate-limit rule on /api/notify
// if this ever gets abused for real.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const fresh = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  fresh.push(now);
  hits.set(ip, fresh);
  // Keep the map from growing without bound across a long-lived isolate.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every(t => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return fresh.length > RATE_MAX;
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowList = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const allowed = allowList.length === 0 || allowList.includes(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

const escapeHtml = s =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Strips control characters so nothing can smuggle newlines into the subject.
const clean = (value, max) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

function buildHtml(notice, adminUrl) {
  const rows = notice.body
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `<p style="margin:0 0 6px;font-size:14px;color:#333">${escapeHtml(line)}</p>`)
    .join('');
  const link = notice.link && adminUrl ? adminUrl.replace(/\/$/, '') + notice.link : '';
  const button = link
    ? `<p style="margin:20px 0 0"><a href="${escapeHtml(link)}" style="background:#c8102e;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px;display:inline-block">Panelde Aç</a></p>`
    : '';
  return `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:520px">
  <h2 style="font-size:17px;margin:0 0 14px;color:#111">${escapeHtml(notice.title)}</h2>
  ${rows}
  ${button}
  <p style="margin:24px 0 0;font-size:12px;color:#888">Kanca İnşaat — otomatik bildirim</p>
</div>`;
}

async function handleNotify(request, env) {
  const cors = corsHeaders(request, env);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);
  if (cors['Access-Control-Allow-Origin'] === 'null') return json({ error: 'origin_not_allowed' }, 403, cors);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (rateLimited(ip)) return json({ error: 'rate_limited' }, 429, cors);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400, cors);
  }

  const type = clean(payload?.type, 20);
  if (!EVENT_LABELS[type]) return json({ error: 'invalid_type' }, 400, cors);

  const notice = {
    type,
    title: clean(payload?.title, MAX_TITLE) || EVENT_LABELS[type],
    body: typeof payload?.body === 'string' ? payload.body.slice(0, MAX_BODY) : '',
    link: clean(payload?.link, MAX_LINK).startsWith('/') ? clean(payload?.link, MAX_LINK) : '',
  };

  if (!env.RESEND_API_KEY || !env.MAIL_TO) {
    return json({ error: 'mail_not_configured' }, 503, cors);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM || 'Kanca İnşaat <onboarding@resend.dev>',
      to: env.MAIL_TO.split(',').map(s => s.trim()).filter(Boolean),
      subject: notice.title,
      html: buildHtml(notice, env.ADMIN_URL || ''),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('resend failed', res.status, detail);
    return json({ error: 'mail_failed', status: res.status }, 502, cors);
  }

  return json({ ok: true }, 200, cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/notify') return handleNotify(request, env);
    return env.ASSETS.fetch(request);
  },
};
