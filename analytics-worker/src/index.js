// Privacy-friendly analytics for gta6.lcaitech.com.
// Stores: event, path, referrer host, country (cf), device class, timestamp.
// Never stores IPs, user agents, cookies or any identifier.

const ALLOWED_ORIGINS = new Set([
  "https://gta6.lcaitech.com",
  "http://localhost:8765",
  "http://127.0.0.1:8765",
]);
const EVENTS = new Set([
  "pageview", "calc", "share", "share_download", "share_copy", "share_native",
  "share_x", "share_whatsapp", "click_bingx", "click_binance",
]);
const MAX_BODY = 1024;

function cors(origin) {
  const h = { "Vary": "Origin" };
  if (ALLOWED_ORIGINS.has(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors(origin) },
  });
}

function deviceClass(ua) {
  if (!ua) return "unknown";
  if (/bot|crawl|spider|slurp|preview|headless/i.test(ua)) return "bot";
  if (/ipad|tablet|kindle|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

function refHost(ref) {
  if (!ref) return null;
  try {
    const h = new URL(ref).hostname.toLowerCase();
    return h.slice(0, 100) || null;
  } catch { return null; }
}

function cleanPath(p) {
  if (typeof p !== "string") return "/";
  // Keep pathname only: drop query/hash (shared links carry calculator inputs).
  const path = p.split(/[?#]/)[0] || "/";
  return path.slice(0, 120);
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function collect(request, env, origin) {
  if (!ALLOWED_ORIGINS.has(origin)) return json({ error: "origin" }, 403, origin);
  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > MAX_BODY) return json({ error: "too large" }, 413, origin);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: "too large" }, 413, origin);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "bad json" }, 400, origin); }
  const event = String(body.e || "");
  if (!EVENTS.has(event)) return json({ error: "event" }, 400, origin);
  const device = deviceClass(request.headers.get("User-Agent"));
  if (device === "bot") return new Response(null, { status: 204, headers: cors(origin) });
  const now = Date.now();
  const country = (request.cf && request.cf.country) || request.headers.get("CF-IPCountry") || null;
  let ref = refHost(body.r);
  if (ref === "gta6.lcaitech.com") ref = null; // internal navigation
  await env.DB.prepare(
    "INSERT INTO events (ts, day, event, path, ref_host, country, device) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(now, new Date(now).toISOString().slice(0, 10), event, cleanPath(body.p), ref, country, device).run();
  return new Response(null, { status: 204, headers: cors(origin) });
}

async function stats(request, env, origin) {
  const auth = request.headers.get("Authorization") || "";
  const key = auth.startsWith("Bearer ") ? auth.slice(7) : new URL(request.url).searchParams.get("key");
  if (!env.STATS_KEY || !safeEqual(key || "", env.STATS_KEY)) return json({ error: "unauthorized" }, 401, origin);
  const day = (d) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
  const d7 = day(6), d30 = day(29);
  const q = (sql, ...args) => env.DB.prepare(sql).bind(...args).all().then((r) => r.results);
  const [total, last7, last30, daily, referrers, countries, devices] = await Promise.all([
    q("SELECT event, COUNT(*) n FROM events GROUP BY event ORDER BY n DESC"),
    q("SELECT event, COUNT(*) n FROM events WHERE day >= ? GROUP BY event ORDER BY n DESC", d7),
    q("SELECT event, COUNT(*) n FROM events WHERE day >= ? GROUP BY event ORDER BY n DESC", d30),
    q("SELECT day, SUM(event='pageview') pageviews, COUNT(*) events FROM events WHERE day >= ? GROUP BY day ORDER BY day", d30),
    q("SELECT ref_host host, COUNT(*) n FROM events WHERE event='pageview' AND ref_host IS NOT NULL AND day >= ? GROUP BY ref_host ORDER BY n DESC LIMIT 15", d30),
    q("SELECT country, COUNT(*) n FROM events WHERE event='pageview' AND country IS NOT NULL AND day >= ? GROUP BY country ORDER BY n DESC LIMIT 15", d30),
    q("SELECT device, COUNT(*) n FROM events WHERE event='pageview' AND day >= ? GROUP BY device ORDER BY n DESC", d30),
  ]);
  return json({ generatedAt: new Date().toISOString(), total, last7, last30, daily, referrers, countries, devices }, 200, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    try {
      if (url.pathname === "/e" && request.method === "POST") return await collect(request, env, origin);
      if (url.pathname === "/stats" && request.method === "GET") return await stats(request, env, origin);
      if (url.pathname === "/") return new Response("gta6-analytics: ok", { headers: { "Content-Type": "text/plain" } });
    } catch (err) {
      return json({ error: "server" }, 500, origin);
    }
    return json({ error: "not found" }, 404, origin);
  },
};
