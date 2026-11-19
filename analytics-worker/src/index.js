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
  "view_calculadora", "view_jodita", "view_conviene", "view_ttwo", "view_desafio", "view_encuesta", "view_fuentes",
  "poll_vote", "challenge_calc", "projection_calc", "cost_builder_calc", "wait_calc",
  "build_pc", "case3d_interact", "compare_view",
  "share_challenge_x", "share_challenge_whatsapp", "share_challenge_copy",
  "share_jodita_x", "share_jodita_whatsapp", "share_jodita_copy",
]);
const POLLS = { "pc-o-consola": ["consola", "pc", "acciones", "ambas", "tengo-todo"] };
// Light, in-memory (per isolate) burst limiter. Keys are never stored.
const recent = new Map();
function burstLimited(key, max = 5, windowMs = 60000) {
  const now = Date.now();
  const arr = (recent.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  recent.set(key, arr);
  if (recent.size > 5000) recent.clear();
  return arr.length > max;
}
// Client key for rate limiting. IPv4 as is; IPv6 grouped by /64 (one home/device network), expanding "::"
// first so "2001:db8::1" and "2001:db8:0:0:0:0:0:2" land in the same bucket. Never stored.
function ipKey(ip) {
  if (!ip.includes(":") || ip.includes(".")) return ip; // IPv4 (or IPv4-mapped): use as is
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const groups = ip.includes("::") ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t] : h;
  return groups.slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, "")).join(":");
}

// True when this client is over its limit. Uses the native Rate Limiting binding when present
// (shared across isolates), the in-memory burst limiter otherwise. No IP header -> not limited.
async function limited(request, limiter, prefix, max) {
  const ip = ipKey(request.headers.get("CF-Connecting-IP") || "");
  if (!ip) return false;
  if (limiter) {
    const { success } = await limiter.limit({ key: prefix + ":" + ip });
    return !success;
  }
  return burstLimited(prefix + ":" + ip, max);
}

const MAX_BODY = 1024;
const EVENT_BURST = 30; // events per client per minute (a normal visit sends a handful)

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
  // The Origin check only stops browsers on other sites: curl can send any Origin header. This per-client
  // limit is what keeps scripts from flooding D1 (shared with the poll and the stats) with fake events.
  if (await limited(request, env.EVENT_LIMITER, "e", EVENT_BURST)) return json({ error: "slow down" }, 429, origin);
  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > MAX_BODY) return json({ error: "too large" }, 413, origin);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: "too large" }, 413, origin);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "bad json" }, 400, origin); }
  if (!body || typeof body !== "object") return json({ error: "bad json" }, 400, origin);
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

async function pollVote(request, env, origin) {
  if (!ALLOWED_ORIGINS.has(origin)) return json({ error: "origin" }, 403, origin);
  const text = await request.text();
  if (text.length > 256) return json({ error: "too large" }, 413, origin);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "bad json" }, 400, origin); }
  if (!body || typeof body !== "object") return json({ error: "bad json" }, 400, origin);
  const poll = String(body.poll || "");
  const option = String(body.option || "");
  if (!POLLS[poll] || !POLLS[poll].includes(option)) return json({ error: "option" }, 400, origin);
  if (deviceClass(request.headers.get("User-Agent")) === "bot") return json({ error: "bot" }, 403, origin);
  if (await limited(request, env.POLL_LIMITER, "poll", 5)) return json({ error: "slow down" }, 429, origin);
  const now = Date.now();
  const country = (request.cf && request.cf.country) || null;
  await env.DB.prepare("INSERT INTO poll_votes (poll, option, ts, day, country) VALUES (?, ?, ?, ?, ?)")
    .bind(poll, option, now, new Date(now).toISOString().slice(0, 10), country).run();
  return pollResults(env, origin, poll);
}

async function pollResults(env, origin, poll) {
  if (!POLLS[poll]) return json({ error: "poll" }, 404, origin);
  const rows = (await env.DB.prepare("SELECT option, COUNT(*) n FROM poll_votes WHERE poll = ? GROUP BY option").bind(poll).all()).results;
  const counts = Object.fromEntries(POLLS[poll].map((o) => [o, 0]));
  rows.forEach((r) => { if (r.option in counts) counts[r.option] = r.n; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return new Response(JSON.stringify({ poll, total, counts }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=15", ...cors(origin) },
  });
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
  const poll = await q("SELECT option, COUNT(*) n FROM poll_votes GROUP BY option ORDER BY n DESC");
  return json({ generatedAt: new Date().toISOString(), total, last7, last30, daily, referrers, countries, devices, poll }, 200, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    try {
      if (url.pathname === "/e" && request.method === "POST") return await collect(request, env, origin);
      if (url.pathname === "/poll" && request.method === "POST") return await pollVote(request, env, origin);
      if (url.pathname === "/poll/results" && request.method === "GET") return await pollResults(env, origin, url.searchParams.get("poll") || "pc-o-consola");
      if (url.pathname === "/stats" && request.method === "GET") return await stats(request, env, origin);
      if (url.pathname === "/") return new Response("gta6-analytics: ok", { headers: { "Content-Type": "text/plain" } });
    } catch (err) {
      return json({ error: "server" }, 500, origin);
    }
    return json({ error: "not found" }, 404, origin);
  },
};
