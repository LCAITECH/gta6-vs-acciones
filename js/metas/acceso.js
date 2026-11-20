// Acceso al DOM y a lo que exponen los otros módulos (window.__gta y window.__gtaBuilder).
export const $ = (id) => document.getElementById(id);
export const G = () => window.__gta;
export function num(id) { return Math.max(0, Number($(id)?.value) || 0); }

export function builder() { return window.__gtaBuilder; }

export function livePrice() {
  const b = builder();
  if (b?.ttwo) {
    const p = b.ttwo();
    if (p) return p;
  }
  const g = G();
  if (g?.latestQuote && typeof g.latestQuote.price === "number") return g.latestQuote.price;
  const q = g?.quotes;
  return q && q.length ? q[q.length - 1].close : 0;
}
export function liveBtc() {
  const g = G();
  if (g?.latestBtc && typeof g.latestBtc.price === "number") return g.latestBtc.price;
  const q = g?.btcQuotes;
  return q && q.length ? q[q.length - 1].close : 0;
}
