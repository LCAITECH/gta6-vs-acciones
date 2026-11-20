// Catálogo único (data/hardware-prices.json) aplicado a las ofertas, y cuentas de mejores precios y cuotas.
// cuota = precio × tasa ÷ n. Se recalcula cada vez que cambia el precio de la oferta.
import { G } from "./acceso.js";
import { CONSOLES, GOALS, OFFERS, PLANS_DATE, precios } from "./datos.js";
import { ars, dayKey, dayOf, fmtArs2, posNum } from "./formato.js";
function refreshPlans(o) {
  (o.plans || []).forEach((p) => {
    if (p.baseCond == null) p.baseCond = p.cond;
    const total = o.price * (p.rate || 1);
    p.cuota = total / p.n;
    p.cond = p.rate > 1 ? `${p.baseCond} (total ARS ${fmtArs2.format(total)})` : p.baseCond;
  });
}
Object.values(OFFERS).flat().forEach(refreshPlans);

// Pisa las constantes con lo que dice el catálogo: un producto, un solo precio en toda la página.
export function applyCatalog(byId) {
  let latest = "";
  const seen = (it) => { if (dayKey(it.fetchedAtArt) > dayKey(latest)) latest = it.fetchedAtArt; };
  Object.values(CONSOLES).forEach((c) => {
    const it = c.item && byId[c.item];
    if (!it || !posNum(it.price)) return;
    c.ars = it.price;
    c.src = it.store || c.src;
    c.fetched = it.fetchedAtArt;
    c.stale = it.status === "stale";
    seen(it);
  });
  Object.values(OFFERS).flat().forEach((o) => {
    const it = o.item && byId[o.item];
    if (!it || !posNum(it.price)) return;
    o.price = it.price;
    o.fetched = it.fetchedAtArt;
    if (posNum(it.cashPrice)) o.cash = it.cashPrice;
    if (posNum(it.transferPrice)) o.transfer = it.transferPrice;
    refreshPlans(o);
  });
  Object.values(GOALS).forEach((g) => {
    const it = g.item && byId[g.item];
    if (!it || !posNum(it.price)) return;
    g.amount = it.price;
    g.label = `${it.label} · ${it.store} · ${ars(it.price)} (${dayOf(it.fetchedAtArt)})${it.status === "stale" ? " · último verificado" : ""}`;
    seen(it);
  });
  if (latest) precios.fecha = dayOf(latest);
}

export function bestOffer(key) {
  const offers = OFFERS[key] || [];
  let best = null;
  offers.forEach((o) => {
    const cashPrice = o.cash || o.price;
    if (!best || cashPrice < best.amount) best = { amount: cashPrice, how: o.cash ? `efectivo en ${o.store} (−20%)` : `precio de lista en ${o.store}`, offer: o };
  });
  const si = offers.flatMap((o) => o.plans.filter((p) => p.si).map((p) => ({ ...p, store: o.store, url: o.url, price: o.price }))).sort((a, b) => b.n - a.n)[0];
  return { best, si };
}

export function cuotasHtml(key) {
  const offers = OFFERS[key];
  if (!CONSOLES[key] || !CONSOLES[key].ars) return "";
  if (!offers) return `<div class="cuotas-box pending"><strong>Cuotas:</strong> pendiente de verificar. Mirá las condiciones de tu banco.</div>`;
  const fmt = (n) => `ARS ${G().fmtAR.format(n)}`;
  return `<div class="cuotas-box"><strong>Precio y cuotas por tienda</strong>:<ul>${offers.map((o) => `<li><strong>${o.store}</strong> <span class="fine-inline">(${dayOf(o.fetched) || PLANS_DATE})</span>: ${fmt(o.price)}${o.cash ? ` · efectivo ${fmt(o.cash)} · transferencia ${fmt(o.transfer)}` : ""}${o.plans.length ? "<br>" + o.plans.map((p) => `${p.n} cuotas ${p.si ? "sin interés" : "con interés"} de <strong>${fmt(p.cuota)}</strong> <span class="fine-inline">(${p.cond})</span>`).join("<br>") : ""}${o.note ? `<br><span class="fine-inline">${o.note}</span>` : ""} · <a href="${o.url}" target="_blank" rel="noopener noreferrer">ver</a></li>`).join("")}</ul><span class="fine">Las condiciones cambian según banco, tarjeta y día. Confirmá en el checkout. Las cuotas se calculan sobre el precio de hoy; las condiciones se relevaron el ${PLANS_DATE}.</span></div>`;
}

export function bestCuotaFor(consoleKey) {
  if (!consoleKey || consoleKey === "none" || consoleKey === "custom") return null;
  const { si, best } = bestOffer(consoleKey);
  if (!si) return null;
  return { n: si.n, cuota: si.cuota, store: si.store, cond: si.cond, price: si.price, cash: best ? best.amount : si.price };
}

export function convPrice(key) {
  const o = bestOffer(key);
  if (o && o.best) return { ars: o.best.amount, how: o.best.how };
  const c = CONSOLES[key];
  return c && c.ars ? { ars: c.ars, how: `precio de lista en ${c.src}` } : null;
}
