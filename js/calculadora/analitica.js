// Analítica sin cookies (Worker propio de Cloudflare + D1).
// ---------- Cookieless analytics (own Cloudflare Worker + D1) ----------
// Sends only: event name, pathname (no query), referrer. No cookies, no IDs.
const ANALYTICS_URL = "https://gta6-analytics.lcaitech.workers.dev/e";
const TRACK_HOSTS = new Set(["gta6.lcaitech.com", "localhost", "127.0.0.1"]);
export function track(name) {
  try {
    if (!TRACK_HOSTS.has(location.hostname)) return;
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
    const e = name.replace(/-/g, "_").replace(/^cta_/, "click_").replace(/^share_whatsapp$/, "share_whatsapp");
    const body = JSON.stringify({ e, p: location.pathname, r: document.referrer || "" });
    const blob = new Blob([body], { type: "text/plain" });
    if (!(navigator.sendBeacon && navigator.sendBeacon(ANALYTICS_URL, blob))) {
      fetch(ANALYTICS_URL, { method: "POST", body, keepalive: true, mode: "cors" }).catch(() => {});
    }
  } catch { /* no-op */ }
}

let calcTimer = null;
let calcSent = 0;
function trackCalc() {
  clearTimeout(calcTimer);
  calcTimer = setTimeout(() => {
    if (Date.now() - calcSent < 60000) return;
    calcSent = Date.now();
    track("calc");
  }, 2500);
}

export function bindTracking() {
  track("pageview");
  document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", trackCalc));
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a.cta");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.includes("bingx.com")) track("cta-bingx");
    else if (href.includes("binance.com")) track("cta-binance");
  });
}
