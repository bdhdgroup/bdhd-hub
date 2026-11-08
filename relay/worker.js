// Cloudflare Worker relay for Phil's Hub -> Grok Bot routine webhook.
// Secrets (wrangler secret put): WEBHOOK_URL, WEBHOOK_KEY, RELAY_KEY
const ORIGINS = ['https://hub.bdhd.ae', 'https://bdhdgroup.github.io'];
export default {
  async fetch(req, env) {
    const o = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });
    let body; try { body = JSON.parse(await req.text()); } catch { return new Response('bad json', { status: 400, headers: cors }); }
    if (!body || body.relayKey !== env.RELAY_KEY) return new Response('forbidden', { status: 403, headers: cors });
    delete body.relayKey;
    const r = await fetch(env.WEBHOOK_URL, { method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.WEBHOOK_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return new Response(JSON.stringify({ upstream: r.status }), { status: r.ok ? 200 : 502, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
};
