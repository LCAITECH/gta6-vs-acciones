const BINGX_URL =
  "https://bingx.com/act/general/1998331776/?ref=NZP9WN&source=agent_partner&ch=bingx_featuredevents_main_link";
const BINANCE_URL =
  "https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=es-LA&ref=GRO_28502_9GVXD&utm_source=referral_entrance";

const PRICES = {
  standard: { usd: 79.99, xboxArs: 113299, label: "Estándar" },
  ultimate: { usd: 99.99, xboxArs: 141990, label: "Ultimate" },
  "xbox-upgrade": { usd: null, xboxArs: 28691, label: "Mejora a Ultimate (Xbox)" },
};

const GTAPLUS = { psUsd: 7.99, xboxArs: 6670 };
// Memberships (pre-tax), relevadas 18/11/2026. PS Plus AR en USD por período; Game Pass AR en ARS por mes.
const MEMBERSHIPS = {
  "ps-essential": { label: "PS Plus Essential", ccy: "USD", periods: { 1: 8.99, 3: 22.99, 12: 64.99 } },
  "ps-extra": { label: "PS Plus Extra", ccy: "USD", periods: { 1: 13.49, 3: 37.99, 12: 107.99 } },
  "ps-deluxe": { label: "PS Plus Deluxe", ccy: "USD", periods: { 1: 15.99, 3: 43.99, 12: 124.99 } },
  "gp-essential": { label: "Game Pass Essential", ccy: "ARS", monthly: 8999 },
  "gp-premium": { label: "Game Pass Premium", ccy: "ARS", monthly: 11999 },
  "gp-ultimate": { label: "Game Pass Ultimate", ccy: "ARS", monthly: 18999 },
  "pc-gp": { label: "PC Game Pass", ccy: "ARS", monthly: 13999 },
};
let gpIva = true; // Game Pass AR: IVA incluido sin confirmar -> sumamos IVA por defecto (conservador)
function membershipCost(plan, months) {
  const m = MEMBERSHIPS[plan];
  if (!m || !months) return null;
  if (m.ccy === "USD") {
    const p = m.periods[months];
    if (p != null) return { amount: p, ccy: "USD", label: `${m.label} ${months} ${months === 1 ? "mes" : "meses"}` };
    const p1 = m.periods[1];
    return { amount: p1 * months, ccy: "USD", label: `${m.label} ${months} × 1 mes` };
  }
  return { amount: m.monthly * months, ccy: "ARS", label: `${m.label} ${months} ${months === 1 ? "mes" : "meses"}` };
}
const BINGX = { fee: 0.015, cashback: 0.02 };
const BINANCE = { cashback: 0.03, cashbackUntil: "2026-12-31" };

let binanceIva = true;

const fmtAR = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const fmtInt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

const $ = (id) => document.getElementById(id);

function money(amount, ccy) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const sign = ccy === "ARS" ? "ARS " : "US$ ";
  return sign + fmtAR.format(n);
}

function taxesFactor() {
  const iva = $("iva").checked ? 0.21 : 0;
  const perc = $("percepcion").checked ? 0.3 : 0;
  const iibb = Math.max(0, Number($("iibb").value) || 0) / 100;
  return { iva, perc, iibb, factor: 1 + iva + perc + iibb };
}

function closeOnOrBefore(quotes, iso) {
  for (let i = quotes.length - 1; i >= 0; i -= 1) {
    if (quotes[i].date <= iso) return quotes[i];
  }
  return quotes[0];
}

function closeAt(list, iso) {
  if (!list || !list.length || !iso) return null;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].date <= iso) return list[i];
  }
  return null;
}

let currentAsset = "both";
const ASSET_SHORT = { ttwo: "t", btc: "b", both: "2" };
function assetMode() { return currentAsset; }
function setAsset(mode, silent) {
  if (!["ttwo", "btc", "both"].includes(mode)) return;
  currentAsset = mode;
  const box = $("asset-toggle");
  if (box) {
    box.querySelectorAll("[data-asset]").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.asset === mode ? "true" : "false");
    });
  }
  if (!silent) update();
}

function addDaysIso(iso, days) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days));
  return dt.toISOString().slice(0, 10);
}
function addMonthsIso(iso, months) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1 + months, d || 1));
  return dt.toISOString().slice(0, 10);
}
function lastAvailableDate(list, live) {
  const d1 = list && list.length ? list[list.length - 1].date : null;
  const d2 = live && live.asOfDate;
  if (d2 && (!d1 || d2 > d1)) return d2;
  return d1;
}
function livePx(list, live) {
  if (live && typeof live.price === "number") return live.price;
  return list && list.length ? list[list.length - 1].close : null;
}
function toDisplay(usd, ccy, fxNow) {
  return ccy === "ARS" ? usd * fxNow : usd;
}
const HORIZONS = [
  { key: "1w", label: "1 semana", days: 7 },
  { key: "1m", label: "1 mes", months: 1 },
  { key: "3m", label: "3 meses", months: 3 },
  { key: "6m", label: "6 meses", months: 6 },
  { key: "1y", label: "1 año", months: 12 },
];

function computeSpend() {
  const edition = $("edition").value;
  const store = $("store").value;
  const fxBuy = Math.max(1, Number($("fx-buy").value) || 1575);
  const fxNow = Math.max(1, Number($("fx-now").value) || 1575);
  const { factor } = taxesFactor();

  let listUsd = 0;
  let listArs = 0;
  let listCcy = "USD";
  let note = "";

  const amount = Math.max(0, Number($("custom-amount").value) || 0);
  const ccy = $("custom-ccy").value;
  if (ccy === "ARS") {
    listArs = amount;
    listUsd = amount / fxBuy;
    listCcy = "ARS";
  } else {
    listUsd = amount;
    listArs = amount * fxBuy;
  }
  if (amountMode === "missing" && !amount) note = "Esta combinación no tiene precio publicado: cargá el monto que pagaste.";

  const taxedUsd = listUsd * factor;
  const taxedArs = listArs * factor;

  const dlc = Math.max(0, Number($("dlc").value) || 0);
  const dlcCcy = $("dlc-ccy").value;
  const dlcUsd = dlcCcy === "ARS" ? dlc / fxBuy : dlc;
  const dlcArs = dlcCcy === "ARS" ? dlc : dlc * fxBuy;
  const dlcTaxUsd = dlcUsd * factor;
  const dlcTaxArs = dlcArs * factor;

  const months = Math.max(0, Math.floor(Number($("gtaplus-months").value) || 0));
  let plusUsd = 0;
  let plusArs = 0;
  if (months > 0) {
    if (store === "xbox") {
      plusArs = months * GTAPLUS.xboxArs;
      plusUsd = plusArs / fxBuy;
    } else {
      plusUsd = months * GTAPLUS.psUsd;
      plusArs = plusUsd * fxBuy;
    }
  }
  const plusTaxUsd = plusUsd * factor;
  const plusTaxArs = plusArs * factor;

  let membUsd = 0;
  let membTaxUsd = 0;
  if ($("memb-on") && $("memb-on").checked) {
    const mc = membershipCost($("memb-plan").value, Number($("memb-months").value));
    if (mc) {
      membUsd = mc.ccy === "ARS" ? mc.amount / fxBuy : mc.amount;
      const isGp = mc.ccy === "ARS";
      const f = isGp && !gpIva ? factor - ($("iva").checked ? 0.21 : 0) : factor;
      membTaxUsd = membUsd * f;
    }
  }
  const spendUsd = taxedUsd + dlcTaxUsd + plusTaxUsd + membTaxUsd;
  const spendArs = taxedArs + dlcTaxArs + plusTaxArs + membTaxUsd * fxBuy;

  return {
    edition,
    store,
    fxBuy,
    fxNow,
    factor,
    listUsd,
    listArs,
    listCcy,
    taxedUsd,
    taxedArs,
    dlcUsd,
    membUsd,
    plusUsd,
    spendUsd,
    spendArs,
    note,
    months,
  };
}

function seriesFrom(quotes, startDate, shares, spendUsd, fxNow, displayCcy, live) {
  const pts = quotes.filter((q) => q.date >= startDate).map((q) => ({ date: q.date, close: q.close }));
  if (pts.length === 0) {
    const last = closeOnOrBefore(quotes, startDate) || quotes[quotes.length - 1];
    pts.push({ date: last.date, close: last.close });
  }
  if (live && typeof live.price === "number" && live.asOfDate) {
    const last = pts[pts.length - 1];
    if (live.asOfDate > last.date) {
      pts.push({ date: live.asOfDate, close: live.price });
    } else if (live.asOfDate === last.date && live.price !== last.close) {
      last.close = live.price;
    }
  }
  return pts.map((q) => {
    const invUsd = shares * q.close;
    return {
      date: q.date,
      spent: displayCcy === "ARS" ? spendUsd * fxNow : spendUsd,
      invested: displayCcy === "ARS" ? invUsd * fxNow : invUsd,
      close: q.close,
    };
  });
}

function clockFromArt(stamp) {
  if (!stamp || !stamp.includes(" ")) return "";
  return stamp.split(" ")[1];
}

function tickerCard(kind, list, live) {
  const last = list && list[list.length - 1];
  const price = livePx(list, live);
  const name = kind === "btc" ? "BTC" : "TTWO";
  if (price == null) {
    return `<article class="ticker${kind === "btc" ? " btc" : ""}"><div class="k">${name} ahora</div><div class="meta">No pudimos cargar la cotización. Reintentá más tarde.</div></article>`;
  }
  const ch = live && typeof live.change === "number" ? live.change : null;
  const pct = live && typeof live.changePercent === "number" ? live.changePercent : null;
  const up = (ch ?? 0) >= 0;
  const states = { REGULAR: "En el mercado", PRE: "Preapertura", POST: "After hours", CLOSED: "Mercado cerrado", "24/7": "Mercado 24/7" };
  const state = states[(live && live.marketState) || ""] || "Último dato";
  const updated = clockFromArt(live && live.updatedAtArt);
  const quoteArt = live && live.quoteTimeArt;
  const chLabel = ch == null ? "—" : `${up ? "+" : "−"}US$ ${fmtAR.format(Math.abs(ch))} (${up ? "+" : "−"}${fmtInt.format(Math.abs(pct || 0))}%)`;
  const src = kind === "btc"
    ? "Snapshot de Bitstamp (BTC/USD), no es un tick en vivo. Si falta el dato, usamos el último cierre diario."
    : "Snapshot de Yahoo Finance, no es un tick en vivo. Si falta el dato, usamos el último cierre.";
  return `
    <article class="ticker${kind === "btc" ? " btc" : ""}">
      <div class="k">${name} ahora</div>
      <div class="price">US$ ${fmtAR.format(price)}</div>
      <div class="chg ${up ? "up" : "down"}">${chLabel}</div>
      <div class="meta">${state}. Actualizado <strong>${updated || "—"}</strong> (hora Argentina)${quoteArt ? ` · dato de cotización: ${quoteArt}` : ""}. ${src}</div>
    </article>`;
}

function renderTicker() {
  const el = $("ticker");
  if (!el) return;
  const mode = assetMode();
  const parts = [];
  if (mode !== "btc") parts.push(tickerCard("ttwo", quotes, latestQuote));
  if (mode !== "ttwo") parts.push(tickerCard("btc", btcQuotes, latestBtc));
  el.innerHTML = parts.join("") || "No pudimos cargar las cotizaciones. Reintentá más tarde.";
}

function statCard(k, v, s, cls) {
  return `<div class="stat${cls ? " " + cls : ""}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
}

function renderStats(model) {
  const el = $("stats");
  const ccy = $("display-ccy").value;
  const spent = ccy === "ARS" ? model.spendArs : model.spendUsd;
  const mode = assetMode();
  const cards = [statCard("Gastaste en el juego", money(spent, ccy), mode === "both" ? "La misma plata, en cada activo por separado" : (mode === "btc" ? model.btcSharesLabel : model.sharesLabel))];
  const addAsset = (label, valueUsd, sub, missing) => {
    if (missing) {
      cards.push(statCard(label, "Sin dato", sub || "No hay cotización para esa fecha de compra"));
      return;
    }
    const now = toDisplay(valueUsd, ccy, model.fxNow);
    const diff = now - spent;
    const pct = spent ? (diff / spent) * 100 : 0;
    const cls = diff >= 0 ? "up" : "down";
    const verb = diff >= 0 ? "arriba" : "abajo";
    cards.push(statCard(label, money(now, ccy), `${sub} · ${verb} un ${fmtInt.format(Math.abs(pct))}%`, cls));
  };
  if (mode !== "btc") addAsset("Hoy en TTWO", model.valueNowUsd, model.priceLabel, model.ttwoMissing);
  if (mode !== "ttwo") addAsset("Hoy en BTC", model.btcValueNowUsd, model.btcPriceLabel, model.btcMissing);
  if (mode !== "both") {
    const valueUsd = mode === "btc" ? model.btcValueNowUsd : model.valueNowUsd;
    const missing = mode === "btc" ? model.btcMissing : model.ttwoMissing;
    if (!missing) {
      const now = toDisplay(valueUsd, ccy, model.fxNow);
      const diff = now - spent;
      const pct = spent ? (diff / spent) * 100 : 0;
      const cls = diff >= 0 ? "up" : "down";
      const verb = diff >= 0 ? "arriba" : "abajo";
      cards.push(statCard("Diferencia", `${diff >= 0 ? "+" : "−"}${money(Math.abs(diff), ccy)}`, `${verb} un ${fmtInt.format(Math.abs(pct))}%`, cls));
    }
  }
  el.classList.toggle("cols-2", mode === "both");
  el.innerHTML = cards.join("");
}

function renderBreakdown(model) {
  const el = $("breakdown");
  if (!el) return;
  const ccy = $("display-ccy").value;
  const mode = assetMode();
  const purchase = $("purchase-date").value || "2026-06-25";
  const spent = ccy === "ARS" ? model.spendArs : model.spendUsd;
  const showT = mode !== "btc";
  const showB = mode !== "ttwo";
  const lastT = lastAvailableDate(quotes, latestQuote);
  const lastB = lastAvailableDate(btcQuotes, latestBtc);
  const rows = [];
  for (const h of HORIZONS) {
    const when = h.days ? addDaysIso(purchase, h.days) : addMonthsIso(purchase, h.months);
    const cells = [];
    let any = false;
    const cell = (list, live, shares, missingEntry, last) => {
      if (!showT && list === quotes) return "";
      if (!showB && list === btcQuotes) return "";
      if (missingEntry || !shares || !last || when > last) return `<td class="muted">sin dato</td>`;
      const q = closeAt(list, when);
      const px = (live && live.asOfDate === when && typeof live.price === "number") ? live.price : (q && q.close);
      if (px == null) return `<td class="muted">sin dato</td>`;
      any = true;
      const val = toDisplay(shares * px, ccy, model.fxNow);
      const diff = val - spent;
      const pct = spent ? (diff / spent) * 100 : 0;
      const cls = diff >= 0 ? "up" : "down";
      return `<td class="${cls}">${money(val, ccy)}<small>${diff >= 0 ? "+" : "−"}${fmtInt.format(Math.abs(pct))}%</small></td>`;
    };
    const tCell = showT ? cell(quotes, latestQuote, model.shares, model.ttwoMissing, lastT) : "";
    const bCell = showB ? cell(btcQuotes, latestBtc, model.btcShares, model.btcMissing, lastB) : "";
    if (showT && tCell.includes("sin dato") && (!showB || bCell.includes("sin dato")) && !any) {
      // still list the row only if at least one asset has data; if both sin dato because horizon is future, skip
      const futureT = showT && (!lastT || when > lastT);
      const futureB = showB && (!lastB || when > lastB);
      if (futureT && futureB) continue;
      if (showT && !showB && futureT) continue;
      if (showB && !showT && futureB) continue;
    }
    // Skip a row only when every visible asset lacks a quote on/after the horizon.
    const usableT = showT && !model.ttwoMissing && lastT && when <= lastT && closeAt(quotes, when);
    const usableB = showB && !model.btcMissing && lastB && when <= lastB && closeAt(btcQuotes, when);
    if (!usableT && !usableB) continue;
    rows.push(`<tr><th scope="row">${h.label}<span class="muted"> ${dmy(when)}</span></th>${tCell}${bCell}</tr>`);
  }
  if (!rows.length) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  const head = `<tr><th>Con el paso del tiempo</th>${showT ? "<th>TTWO</th>" : ""}${showB ? "<th>BTC</th>" : ""}</tr>`;
  el.hidden = false;
  el.innerHTML = `<table><thead>${head}</thead><tbody>${rows.join("")}</tbody></table>
    <p class="hint">Valor de esa misma plata a 1 semana, 1 mes, 3, 6 meses y 1 año después de la compra, cuando hay dato. Si el horizonte todavía no llegó o no hay cierre, no se muestra.</p>`;
}

function renderPay(model) {
  const listUsd = model.listUsd + model.dlcUsd + model.plusUsd;
  const storeUsd = model.spendUsd;
  const storeArs = model.spendArs;

  const bingxGross = listUsd * (1 + BINGX.fee);
  const bingxCashback = listUsd * BINGX.cashback;
  const bingxNet = bingxGross - bingxCashback;
  const bingxVsStore = storeUsd - bingxNet;

  const purchase = $("purchase-date").value || "2026-06-25";
  const binanceCashbackRate = purchase <= BINANCE.cashbackUntil ? BINANCE.cashback : 0;
  const binanceIvaAmt = binanceIva ? listUsd * 0.21 : 0;
  const binanceCashback = listUsd * binanceCashbackRate;
  const binanceNet = listUsd + binanceIvaAmt - binanceCashback;
  const binanceVsStore = storeUsd - binanceNet;
  const cheapest = Math.min(storeUsd, bingxNet, binanceNet);

  $("pay-grid").innerHTML = `
    <article class="pay-card${storeUsd === cheapest ? " best" : ""}">
      <h3>En la tienda</h3>
      <div class="price">${money(storeUsd, "USD")}</div>
      <p class="muted">${money(storeArs, "ARS")} al tipo de cambio de compra que cargaste. Incluye los impuestos que tildaste (IVA, percepción, IIBB) sobre el precio de lista, DLC y GTA+ extra.</p>
      <p class="muted">En PlayStation Store y en el precio oficial la base está en USD. En Xbox, la base está en pesos y la pasamos a dólares con tu tipo de cambio.</p>
    </article>
    <article class="pay-card${bingxNet === cheapest ? " best" : ""}">
      <h3>BingX Card</h3>
      <div class="price">${money(bingxNet, "USD")}</div>
      <p>Neto estimado: lista ${money(listUsd, "USD")} + 1,5% de comisión − 2% de cashback = ${money(bingxNet, "USD")}.</p>
      <p class="muted">Según el dueño del sitio, al pagar desde Argentina no se suman impuestos argentinos, así que el precio de lista en USD queda en USD más la comisión. Según condiciones vigentes, verificá en la app. El tramo inicial de cashback oficial de BingX también es 2% (sube si gastás más en el mes).</p>
      <p class="muted">Frente a la tienda con los impuestos tildados: ${bingxVsStore >= 0 ? "ahorrás" : "sale"} ${money(Math.abs(bingxVsStore), "USD")} ${bingxVsStore >= 0 ? "" : "más"}.</p>
      <a class="cta" href="${BINGX_URL}" rel="noopener noreferrer sponsored" target="_blank">Págalo con la BingX card</a>
    </article>
    <article class="pay-card${binanceNet === cheapest ? " best" : ""}">
      <h3>Binance Card</h3>
      <div class="price">${money(binanceNet, "USD")}</div>
      <p>Neto estimado: lista ${money(listUsd, "USD")}${binanceIva ? " + IVA 21%" : " sin IVA"} − ${binanceCashbackRate ? "3% de cashback" : "sin cashback"} = ${money(binanceNet, "USD")}.</p>
      <p class="muted">Dato informado por el dueño del sitio: 3% de cashback instantáneo hasta el 31/12/2026${purchase <= BINANCE.cashbackUntil ? "" : " (la fecha de compra es posterior, no lo sumamos)"} y no se aplica la percepción del 30% de Ganancias. IVA: sin confirmar. La comisión de la tarjeta no está publicada (no inventamos una). Según condiciones vigentes, verificá en la app.</p>
      <label class="check"><input type="checkbox" id="binance-iva"${binanceIva ? " checked" : ""}> Sumar IVA 21% (sin confirmar; prendido por defecto, estimación conservadora)</label>
      <p class="muted">Frente a la tienda con los impuestos tildados: ${binanceVsStore >= 0 ? "ahorrás" : "sale"} ${money(Math.abs(binanceVsStore), "USD")}${binanceVsStore >= 0 ? "" : " más"}.</p>
      <a class="cta" href="${BINANCE_URL}" rel="noopener noreferrer sponsored" target="_blank">Págalo con la Binance Card</a>
      <p class="muted">El link es un referido general de registro en Binance, no un referido específico de la Card.</p>
    </article>`;
}

function drawChart(points, ccy) {
  const canvas = $("chart");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (!points.length) return;

  const pad = { t: 36, r: 70, b: 70, l: 150 };
  const vals = points.flatMap((p) => [p.spent, p.invested, p.btc].filter((v) => v != null));
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  const padY = (max - min) * 0.12 || max * 0.08 || 1;
  min -= padY;
  max += padY;

  const x = (i) => pad.l + (i / Math.max(points.length - 1, 1)) * (w - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);

  ctx.strokeStyle = "#f976b022";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, h - pad.b);
  ctx.lineTo(w - pad.r, h - pad.b);
  ctx.stroke();

  const gridCount = 4;
  ctx.font = "22px Figtree, sans-serif";
  ctx.fillStyle = "#efe8f6";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 8;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= gridCount; i += 1) {
    const v = min + ((max - min) * i) / gridCount;
    const yy = y(v);
    ctx.strokeStyle = "#ffffff0f";
    ctx.beginPath();
    ctx.moveTo(pad.l, yy);
    ctx.lineTo(w - pad.r, yy);
    ctx.stroke();
    ctx.fillText(money(v, ccy), pad.l - 12, yy);
  }

  const first = points[0].date;
  const last = points[points.length - 1].date;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(first, x(0), h - pad.b + 16);
  ctx.fillText(last, x(points.length - 1), h - pad.b + 16);
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduce ? 0 : 1100;
  const start = performance.now();

  const render = (frac) => {
    ctx.clearRect(pad.l + 1, pad.t - 1, w - pad.l - pad.r, h - pad.t - pad.b + 1);
    for (let i = 0; i <= gridCount; i += 1) {
      const v = min + ((max - min) * i) / gridCount;
      const yy = y(v);
      ctx.strokeStyle = "#ffffff0f";
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(w - pad.r, yy);
      ctx.stroke();
    }

    const n = Math.max(1, Math.floor(1 + (points.length - 1) * frac));
    const visible = points.slice(0, n);

    ctx.save();
    ctx.strokeStyle = "#ffdf80";
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 10]);
    ctx.shadowColor = "#ffdf80";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    visible.forEach((p, i) => {
      const xx = x(i);
      const yy = y(p.spent);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    const hasTtwo = visible.some((p) => p.invested != null);
    const hasBtc = visible.some((p) => p.btc != null);
    const strokeKey = (key, color, width, alpha, fillFrom) => {
      const pts = visible.map((p, i) => (p[key] != null ? [x(i), y(p[key])] : null));
      const first = pts.findIndex(Boolean);
      const lastI = pts.map((v, i) => (v ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
      if (first < 0) return;
      if (fillFrom) {
        const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
        grad.addColorStop(0, fillFrom);
        grad.addColorStop(1, "#00000000");
        ctx.beginPath();
        let started = false;
        pts.forEach((pt) => {
          if (!pt) return;
          if (!started) { ctx.moveTo(pt[0], pt[1]); started = true; }
          else ctx.lineTo(pt[0], pt[1]);
        });
        ctx.lineTo(pts[lastI][0], h - pad.b);
        ctx.lineTo(pts[first][0], h - pad.b);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      let started = false;
      pts.forEach((pt) => {
        if (!pt) return;
        if (!started) { ctx.moveTo(pt[0], pt[1]); started = true; }
        else ctx.lineTo(pt[0], pt[1]);
      });
      ctx.stroke();
      ctx.restore();
    };
    if (hasTtwo) {
      strokeKey("invested", "#f976b0", 10, 0.55, "#f976b055");
      strokeKey("invested", "#f976b0", 5, 1, null);
    }
    if (hasBtc) {
      strokeKey("btc", "#3ef0d4", 8, 0.55, hasTtwo ? null : "#3ef0d455");
      strokeKey("btc", "#3ef0d4", 4.5, 1, null);
    }

    const lastPt = visible[visible.length - 1];
    ctx.save();
    if (lastPt.invested != null) {
      ctx.shadowColor = "#f976b0";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#f976b0";
      ctx.beginPath();
      ctx.arc(x(visible.length - 1), y(lastPt.invested), 8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (lastPt.btc != null) {
      ctx.shadowColor = "#3ef0d4";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#3ef0d4";
      ctx.beginPath();
      ctx.arc(x(visible.length - 1), y(lastPt.btc), 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowColor = "#ffdf80";
    ctx.fillStyle = "#ffdf80";
    ctx.beginPath();
    ctx.arc(x(visible.length - 1), y(lastPt.spent), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  if (chartFrame) cancelAnimationFrame(chartFrame);
  if (!duration) {
    render(1);
    return;
  }
  const tick = (now) => {
    const frac = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - frac) ** 3;
    render(eased);
    if (frac < 1) chartFrame = requestAnimationFrame(tick);
  };
  chartFrame = requestAnimationFrame(tick);
}

// Fallback = values Leandro saw 18/11/2026 ~10:03 ART (aggregator screenshot).
const FX_FALLBACK = { oficial: 1575, tarjeta: 2047.5, blue: 1605, bolsa: 1603.3, cripto: 1688.58 };

function fxVenta(key) {
  const r = fx && fx.rates && fx.rates[key];
  return r && typeof r.venta === "number" ? r.venta : FX_FALLBACK[key];
}

function renderCompare(model) {
  const fundKey = $("fund-rate").value;
  const oficial = fxVenta("oficial");
  const fund = fxVenta(fundKey);
  const iibb = Math.max(0, Number($("iibb").value) || 0) / 100;
  const store = model.store;
  // PSN, Microsoft and Rockstar are excluded from the 30% percepción (RG 5677/2025).
  const percApplies = false;
  const ivaBank = 0.21;

  const xboxArs = model.listCcy === "ARS";
  const extrasUsd = model.dlcUsd + model.plusUsd + (model.membUsd || 0);
  let bankArs;
  let usdEquiv;
  if (xboxArs) {
    const arsBase = model.listArs + extrasUsd * oficial;
    bankArs = arsBase * (1 + ivaBank + iibb);
    usdEquiv = arsBase / oficial;
  } else {
    usdEquiv = model.listUsd + extrasUsd;
    bankArs = usdEquiv * oficial * (1 + ivaBank + (percApplies ? 0.3 : 0) + iibb);
  }

  const purchase = $("purchase-date").value || "2026-06-25";
  const bxUsd = usdEquiv * (1 + BINGX.fee - BINGX.cashback);
  const bnCash = purchase <= BINANCE.cashbackUntil ? BINANCE.cashback : 0;
  const bnUsd = usdEquiv * (1 + (binanceIva ? 0.21 : 0) - bnCash);
  const bxArs = bxUsd * fund;
  const bnArs = bnUsd * fund;

  const best = bxArs <= bnArs ? { name: "BingX Card", ars: bxArs, usd: bxUsd } : { name: "Binance Card", ars: bnArs, usd: bnUsd };
  const save = bankArs - best.ars;
  const savePct = bankArs ? (save / bankArs) * 100 : 0;
  const fundLabel = { cripto: "dólar cripto", bolsa: "dólar MEP", blue: "dólar blue", oficial: "dólar oficial" }[fundKey];

  const updated = fx && fx.updatedAtArt ? fx.updatedAtArt.split(" ")[1] : null;
  $("fx-meta").innerHTML = `Oficial venta <strong>${fmtAR.format(oficial)}</strong> · Tarjeta ${fmtAR.format(fxVenta("tarjeta"))} · Blue ${fmtAR.format(fxVenta("blue"))} · MEP ${fmtAR.format(fxVenta("bolsa"))} · Cripto <strong>${fmtAR.format(fxVenta("cripto"))}</strong>. ${updated ? `Actualizado <strong>${updated}</strong> (hora Argentina). Fuente: <a href="https://dolarapi.com" target="_blank" rel="noopener noreferrer">DolarApi https://dolarapi.com</a>.` : "Sin conexión a la fuente: usamos valores de referencia del 18/11/2026."}`;

  const pos = save > 0;
  lastCompare = { save, savePct, best, fund, bankArs };
  $("savings").innerHTML = `
    <div class="savings-box ${pos ? "" : "neg"}">
      <div class="savings-inner">
        <div class="k">${pos ? `Ahorro pagando con ${best.name}` : "Con estos valores, la tarjeta cripto no ahorra"}</div>
        <div class="big">${pos ? "" : "−"}${money(Math.abs(save), "ARS")}</div>
        <div class="sub">≈ ${money(Math.abs(save) / fund, "USD")} · ${fmtInt.format(Math.abs(savePct))}% ${pos ? "menos" : "más"} que con tarjeta bancaria</div>
        <div class="fine">Tarjeta bancaria ${money(bankArs, "ARS")} vs ${best.name} ${money(best.ars, "ARS")} (fondeada a ${fundLabel} ${fmtAR.format(fund)}). Cashback y comisiones: dato informado por el dueño, según condiciones vigentes; verificá en la app.</div>
      </div>
    </div>`;

  const row = (name, ars, detail, cls = "") => `
    <article class="pay-card ${cls}">
      <h3>${name}</h3>
      <div class="price">${money(ars, "ARS")}</div>
      <p class="muted">${detail}</p>
    </article>`;
  const ivaTxt = `IVA 21%${iibb ? ` + IIBB ${fmtInt.format(iibb * 100)}%` : ""}`;
  $("compare-grid").innerHTML =
    row("Tarjeta bancaria", bankArs, xboxArs
      ? `Precio en pesos de Xbox Store + ${ivaTxt}. Sin percepción del 30%: Microsoft está excluida (RG 5677/2025).`
      : `US$ ${fmtAR.format(usdEquiv)} × oficial venta ${fmtAR.format(oficial)} + ${ivaTxt}. No usamos el dólar tarjeta (${fmtAR.format(fxVenta("tarjeta"))}) porque PSN, Microsoft y Rockstar están excluidas de la percepción del 30% (RG 5677/2025).`) +
    row("BingX Card", bxArs, `US$ ${fmtAR.format(usdEquiv)} + 1,5% comisión − 2% cashback = US$ ${fmtAR.format(bxUsd)} × ${fundLabel} ${fmtAR.format(fund)}. Sin impuestos argentinos (dato del dueño).`, best.name === "BingX Card" && pos ? "best" : "") +
    row("Binance Card", bnArs, `US$ ${fmtAR.format(usdEquiv)}${binanceIva ? " + IVA 21% (sin confirmar)" : " sin IVA"} − ${bnCash ? "3% cashback" : "sin cashback"} = US$ ${fmtAR.format(bnUsd)} × ${fundLabel} ${fmtAR.format(fund)}. El IVA se prende/apaga en la tarjeta de arriba.`, best.name === "Binance Card" && pos ? "best" : "");

  $("compare-note").textContent = xboxArs
    ? "En Xbox Store el precio está en pesos: para la tarjeta cripto lo pasamos a USD al oficial venta (aproximación del tipo de cambio de la red de la tarjeta)."
    : "El ahorro sale de no pagar IVA (y IIBB) con la cripto; el dólar cripto es más caro que el oficial, así que con Binance e IVA prendido puede salir más caro.";
}

let quotes = [];
let latestQuote = null;
let btcQuotes = [];
let latestBtc = null;
let fx = null;
let lastCompare = null;
let amountMode = "official"; // official | custom | missing
let lastModel = null;
let chartFrame = 0;

async function boot() {
  const res = await fetch("data/ttwo-daily.json");
  if (!res.ok) throw new Error("No se pudo cargar el histórico de TTWO");
  const data = await res.json();
  quotes = data.quotes;
  try {
    const liveRes = await fetch("data/ttwo-latest.json", { cache: "no-store" });
    if (liveRes.ok) latestQuote = await liveRes.json();
  } catch (err) {
    latestQuote = null;
  }
  try {
    const fxRes = await fetch("data/fx-ar.json", { cache: "no-store" });
    if (fxRes.ok) fx = await fxRes.json();
  } catch (err) {
    fx = null;
  }
  try {
    const btcRes = await fetch("data/btc-daily.json");
    if (btcRes.ok) {
      const btcData = await btcRes.json();
      btcQuotes = btcData.quotes || [];
    }
  } catch (err) {
    btcQuotes = [];
  }
  try {
    const liveBtc = await fetch("data/btc-latest.json", { cache: "no-store" });
    if (liveBtc.ok) latestBtc = await liveBtc.json();
  } catch (err) {
    latestBtc = null;
  }
  const firsts = [];
  if (quotes[0]) firsts.push(quotes[0].date);
  if (btcQuotes[0]) firsts.push(btcQuotes[0].date);
  if (firsts.length) $("purchase-date").min = firsts.sort()[0];
  loadStateFromUrl();
  $("memb-fields").hidden = !$("memb-on").checked;
  syncMembMonths();
  if (urlAmountMode === "custom") { amountMode = "custom"; renderPriceHint(); }
  else applyOfficialPrice(false);
  bind();
  bindShare();
  bindTracking();
  bindParallax();
  update();
}

function bindParallax() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const sun = document.querySelector(".sun-wrap");
  const reflect = document.querySelector(".sun-reflect");
  const left = document.querySelector(".palm-left");
  const right = document.querySelector(".palm-right");
  if (!sun) return;
  let px = 0;
  let py = 0;
  const apply = () => {
    const scroll = window.scrollY || 0;
    sun.style.transform = `translate(calc(-50% + ${px * 12}px), ${scroll * 0.08 + py * 8}px)`;
    if (reflect) reflect.style.transform = `translate(calc(-50% + ${px * 10}px), ${py * 6}px) scaleY(-1)`;
    if (left) left.style.transform = `translate(${px * -16}px, ${scroll * 0.04}px)`;
    if (right) right.style.transform = `scaleX(-1) rotate(-4deg) translate(${px * -16}px, ${scroll * 0.03}px)`;
  };
  window.addEventListener("scroll", apply, { passive: true });
  window.addEventListener("pointermove", (event) => {
    px = event.clientX / window.innerWidth - 0.5;
    py = event.clientY / window.innerHeight - 0.5;
    apply();
  }, { passive: true });
  apply();
}

function bind() {
  $("edition").addEventListener("change", () => {
    if ($("edition").value === "xbox-upgrade") $("store").value = "xbox";
    applyOfficialPrice(true);
    update();
  });
  $("store").addEventListener("change", () => {
    applyOfficialPrice(true);
    update();
  });
  $("custom-amount").addEventListener("input", markCustom);
  $("custom-ccy").addEventListener("change", () => { markCustom(); update(); });
  [
    "custom-amount",
    "custom-ccy",
    "purchase-date",
    "dlc",
    "dlc-ccy",
    "gtaplus-months",
    "courtesy-month",
    "iva",
    "percepcion",
    "iibb",
    "fx-buy",
    "fx-now",
    "display-ccy",
    "fund-rate",
    "memb-on",
    "memb-plan",
    "memb-months",
  ].forEach((id) => $(id).addEventListener("input", update));
  $("memb-on").addEventListener("change", () => { $("memb-fields").hidden = !$("memb-on").checked; update(); });
  $("memb-plan").addEventListener("change", () => { syncMembMonths(); update(); });
  $("courtesy-month").addEventListener("change", update);
  const assets = $("asset-toggle");
  if (assets) {
    assets.addEventListener("click", (event) => {
      const b = event.target.closest("button[data-asset]");
      if (b) setAsset(b.dataset.asset);
    });
  }
  $("pay-grid").addEventListener("change", (event) => {
    if (event.target && event.target.id === "binance-iva") {
      binanceIva = event.target.checked;
      update();
    }
  });
}

function unionChartPoints(purchase, spendUsd, fxNow, ccy, sharesT, sharesB, showT, showB) {
  const dates = new Set();
  const pushDates = (list, live) => {
    if (!list) return;
    for (const q of list) if (q.date >= purchase) dates.add(q.date);
    const d = live && live.asOfDate;
    if (d && d >= purchase) dates.add(d);
  };
  if (showT) pushDates(quotes, latestQuote);
  if (showB) pushDates(btcQuotes, latestBtc);
  const spent = toDisplay(spendUsd, ccy, fxNow);
  const days = [...dates].sort();
  if (!days.length) {
    return [{ date: purchase, spent, invested: null, btc: null }];
  }
  const liveClose = (list, live, day) => {
    if (live && live.asOfDate === day && typeof live.price === "number") return live.price;
    const q = closeAt(list, day);
    return q ? q.close : null;
  };
  return days.map((day) => {
    const t = showT && sharesT ? liveClose(quotes, latestQuote, day) : null;
    const b = showB && sharesB ? liveClose(btcQuotes, latestBtc, day) : null;
    return {
      date: day,
      spent,
      invested: t != null ? toDisplay(sharesT * t, ccy, fxNow) : null,
      btc: b != null ? toDisplay(sharesB * b, ccy, fxNow) : null,
      close: t,
    };
  });
}

function update() {
  if (!quotes.length && !btcQuotes.length) return;
  const spend = computeSpend();
  const purchase = $("purchase-date").value || "2026-06-25";
  const entry = closeAt(quotes, purchase);
  const btcEntry = closeAt(btcQuotes, purchase);
  const lastClose = quotes.length ? quotes[quotes.length - 1] : null;
  const lastBtc = btcQuotes.length ? btcQuotes[btcQuotes.length - 1] : null;
  const livePrice = livePx(quotes, latestQuote);
  const btcLive = livePx(btcQuotes, latestBtc);
  const ttwoMissing = !entry || !entry.close;
  const btcMissing = !btcEntry || !btcEntry.close;
  const shares = !ttwoMissing ? spend.spendUsd / entry.close : 0;
  const btcShares = !btcMissing ? spend.spendUsd / btcEntry.close : 0;
  const valueNowUsd = shares && livePrice ? shares * livePrice : 0;
  const btcValueNowUsd = btcShares && btcLive ? btcShares * btcLive : 0;
  const ccy = $("display-ccy").value;
  const updated = clockFromArt(latestQuote && latestQuote.updatedAtArt);
  const updatedBtc = clockFromArt(latestBtc && latestBtc.updatedAtArt);
  const mode = assetMode();
  const model = {
    ...spend,
    entry: entry || { date: purchase, close: null },
    btcEntry: btcEntry || { date: purchase, close: null },
    lastClose,
    lastBtc,
    livePrice,
    btcLive,
    shares,
    btcShares,
    valueNowUsd,
    btcValueNowUsd,
    ttwoMissing,
    btcMissing,
    asset: mode,
    sharesLabel: ttwoMissing ? "Sin dato de TTWO en esa fecha" : `${fmtInt.format(shares)} acciones a US$ ${fmtAR.format(entry.close)} el ${entry.date}`,
    btcSharesLabel: btcMissing ? "Sin dato de BTC en esa fecha" : `${fmtInt.format(btcShares)} BTC a US$ ${fmtAR.format(btcEntry.close)} el ${btcEntry.date}`,
    priceLabel: livePrice == null ? "Sin cotización de TTWO" : `TTWO US$ ${fmtAR.format(livePrice)}${updated ? ` · actualizado ${updated} (hora Argentina)` : ""}`,
    btcPriceLabel: btcLive == null ? "Sin cotización de BTC" : `BTC US$ ${fmtAR.format(btcLive)}${updatedBtc ? ` · actualizado ${updatedBtc} (hora Argentina)` : ""}`,
  };
  renderTicker();
  renderStats(model);
  renderBreakdown(model);
  renderPay(model);
  renderCompare(model);
  lastModel = model;
  saveStateToUrl();
  renderShare();
  (window.__gta ? window.__gta.listeners : []).forEach((fn) => { try { fn(model); } catch (e) { console.error(e); } });
  const showT = mode !== "btc" && !ttwoMissing;
  const showB = mode !== "ttwo" && !btcMissing;
  const startT = entry ? (purchase < entry.date ? entry.date : purchase) : purchase;
  const startB = btcEntry ? (purchase < btcEntry.date ? btcEntry.date : purchase) : purchase;
  const start = showT && showB ? (startT < startB ? startT : startB) : showT ? startT : startB;
  const pts = unionChartPoints(start, spend.spendUsd, spend.fxNow, ccy, showT ? shares : 0, showB ? btcShares : 0, showT, showB);
  drawChart(pts, ccy);
  const legT = $("leg-ttwo");
  const legB = $("leg-btc");
  if (legT) legT.hidden = mode === "btc";
  if (legB) legB.hidden = mode === "ttwo";
  const bits = [];
  if (spend.note) bits.push(spend.note);
  if (lastClose && mode !== "btc") bits.push(`TTWO: histórico diario hasta ${lastClose.date}. Última cotización US$ ${fmtAR.format(livePrice)}.`);
  if (lastBtc && mode !== "ttwo") bits.push(`BTC: histórico diario hasta ${lastBtc.date} (Bitstamp BTC/USD). Última cotización US$ ${fmtAR.format(btcLive)}.`);
  bits.push("Snapshots estáticos, no son un tick en vivo. El bitcoin es más volátil y puede caer mucho.");
  if (lastClose && purchase > lastClose.date && mode !== "btc") {
    bits.push("La fecha de compra es posterior al último cierre de TTWO del snapshot: usamos ese cierre como entrada y todavía no hay recorrido posterior.");
  }
  if (lastBtc && purchase > lastBtc.date && mode !== "ttwo") {
    bits.push("La fecha de compra es posterior al último cierre de BTC del snapshot.");
  }
  if (ccy === "ARS") {
    bits.push("En pesos, las líneas se convierten con el tipo de cambio de hoy que cargaste (no hay una serie histórica de dólar en este MVP).");
  }
  $("chart-note").textContent = bits.join(" ");
}

boot().catch((err) => {
  $("stats").innerHTML = `<div class="stat"><div class="k">Error</div><div class="s">${err.message}</div></div>`;
});


// ---------- Shared state in the URL ----------
const STATE_IDS = ["edition","store","custom-amount","custom-ccy","purchase-date","dlc","dlc-ccy","gtaplus-months","courtesy-month","iva","percepcion","iibb","fx-buy","fx-now","display-ccy","fund-rate","memb-on","memb-plan","memb-months"];
const SITE_URL = "https://gta6.lcaitech.com/";

// Compact keys for shared links; long keys still accepted (old links).
const SHORT = { edition: "e", store: "s", "custom-amount": "a", "custom-ccy": "c", "purchase-date": "d", dlc: "dl", "dlc-ccy": "dc", "gtaplus-months": "g", "courtesy-month": "cm", iva: "i", percepcion: "p", iibb: "ib", "fx-buy": "fb", "fx-now": "fn", "display-ccy": "v", "fund-rate": "f", "memb-on": "mo", "memb-plan": "mp", "memb-months": "mm" };
const VAL_SHORT = { edition: { standard: "s", ultimate: "u", "xbox-upgrade": "x" }, store: { ps: "ps", xbox: "xb", official: "of" } };
const MODE_SHORT = { official: "o", custom: "c", missing: "n" };
let DEFAULTS = null;
function fieldValue(el) { return el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value; }
function captureDefaults() {
  DEFAULTS = {};
  STATE_IDS.forEach((id) => { const el = $(id); if (el) DEFAULTS[id] = fieldValue(el); });
}

function saveStateToUrl() {
  if (!DEFAULTS) captureDefaults();
  const q = new URLSearchParams();
  STATE_IDS.forEach((id) => {
    const el = $(id);
    if (!el) return;
    if ((id === "custom-amount" || id === "custom-ccy") && amountMode !== "custom") return;
    const v = fieldValue(el);
    if (v === DEFAULTS[id] && id !== "edition" && id !== "store") return;
    if ((id === "edition" || id === "store") && v === DEFAULTS[id]) return;
    q.set(SHORT[id], (VAL_SHORT[id] && VAL_SHORT[id][v]) || v);
  });
  if (!binanceIva) q.set("bi", "0");
  if (!gpIva) q.set("gi", "0");
  if (currentAsset !== "both") q.set("as", ASSET_SHORT[currentAsset]);
  if (window.__gtaExtraState) window.__gtaExtraState(q);
  if (amountMode === "custom") q.set("m", "c");
  const qs = q.toString();
  history.replaceState(null, "", `${location.pathname}${qs ? "?" + qs : ""}${location.hash}`);
}

let urlAmountMode = null;
function loadStateFromUrl() {
  captureDefaults();
  const q = new URLSearchParams(location.search);
  const legacyCustom = q.get("edition") === "custom";
  if (![...q.keys()].length) return;
  STATE_IDS.forEach((id) => {
    const el = $(id);
    if (!el) return;
    let v = q.has(SHORT[id]) ? q.get(SHORT[id]) : q.get(id);
    if (v == null) return;
    if (VAL_SHORT[id]) {
      const back = Object.entries(VAL_SHORT[id]).find(([, s]) => s === v);
      if (back) v = back[0];
    }
    if (id === "edition" && v === "custom") v = "ultimate";
    if (el.type === "checkbox") el.checked = v === "1";
    else if (el.tagName === "SELECT") { if ([...el.options].some((o) => o.value === v)) el.value = v; }
    else el.value = v.slice(0, 32);
  });
  const as = q.get("as");
  if (as === "t") setAsset("ttwo", true);
  else if (as === "b") setAsset("btc", true);
  else if (as === "2") setAsset("both", true);
  if (q.get("gi") === "0") gpIva = false;
  const bi = q.get("bi") ?? q.get("binance-iva");
  if (bi != null) binanceIva = bi === "1";
  const m = q.get("m");
  const mode = m ? Object.keys(MODE_SHORT).find((k) => MODE_SHORT[k] === m) : q.get("amount-mode");
  urlAmountMode = mode || (legacyCustom ? "custom" : null);
}

function shareUrl() {
  return SITE_URL + location.search;
}

// ---------- Share card ----------
function dmy(iso) {
  const [y, m, d] = String(iso).split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function shareFacts() {
  const m = lastModel;
  if (!m) return null;
  const ed = { standard: "Estándar", ultimate: "Ultimate", "xbox-upgrade": "mejora a Ultimate" }[$("edition").value] || "";
  const hasDlc = m.dlcUsd > 0;
  const what = `GTA VI ${ed}${hasDlc ? " + DLC" : ""}`;
  const paid = m.listCcy === "ARS"
    ? `ARS ${Math.round(m.listArs + m.dlcUsd * m.fxBuy).toLocaleString("es-AR")}`
    : `US$ ${fmtAR.format(m.listUsd + m.dlcUsd)}`;
  const withTax = `US$ ${fmtAR.format(m.spendUsd)}`;
  const pack = (valueUsd, missing) => {
    if (missing || valueUsd == null) return null;
    const diff = valueUsd - m.spendUsd;
    const pct = m.spendUsd ? (diff / m.spendUsd) * 100 : 0;
    const up = pct >= 0;
    return {
      up,
      pct,
      pctTxt: `${up ? "+" : "−"}${fmtAR.format(Math.abs(pct)).replace(/,00$/, "")}%`,
      valTxt: `US$ ${Math.round(valueUsd).toLocaleString("es-AR")}`,
      glTxt: `${up ? "ganarías" : "perderías"} US$ ${fmtAR.format(Math.abs(diff))}`,
    };
  };
  const ttwo = pack(m.valueNowUsd, m.ttwoMissing);
  const btc = pack(m.btcValueNowUsd, m.btcMissing);
  const mode = m.asset || "ttwo";
  const primary = mode === "btc" ? btc : ttwo;
  const c = lastCompare;
  const saveTxt = c && c.save > 0 ? `Pagándolo con la ${c.best.name} me ahorraba ${money(c.save, "ARS")} frente a la tarjeta del banco` : "";
  return {
    what, paid, withTax, saveTxt, date: dmy((m.entry && m.entry.date) || $("purchase-date").value),
    mode, ttwo, btc,
    pct: primary ? primary.pct : 0,
    up: primary ? primary.up : true,
    pctTxt: primary ? primary.pctTxt : "—",
    valTxt: primary ? primary.valTxt : "—",
    glTxt: primary ? primary.glTxt : "",
  };
}

function shareText() {
  const f = shareFacts();
  if (!f) return "";
  let mid;
  if (f.mode === "both") {
    const t = f.ttwo ? `en TTWO hoy valdrían ${f.ttwo.valTxt} (${f.ttwo.pctTxt})` : "en TTWO no hay dato";
    const b = f.btc ? `en BTC, ${f.btc.valTxt} (${f.btc.pctTxt})` : "en BTC no hay dato";
    mid = `Si hubiera puesto esa plata ${t}. ${b[0].toUpperCase()}${b.slice(1)}.`;
  } else if (f.mode === "btc" && f.btc) {
    mid = `Si hubiera comprado bitcoin (BTC), hoy valdrían ${f.btc.valTxt} (${f.btc.pctTxt}).`;
  } else {
    mid = `Si hubiera comprado acciones de Take-Two (TTWO), hoy valdrían ${f.valTxt} (${f.pctTxt}).`;
  }
  return `Compré ${f.what} por ${f.paid}. ${mid}${f.saveTxt ? " " + f.saveTxt + "." : ""} Calculá el tuyo:`;
}

let logoImg = null;
function loadLogo() {
  if (logoImg) return Promise.resolve(logoImg);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { logoImg = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = "assets/vi-logo.png";
  });
}

async function drawShareCard(canvas) {
  const W = 1200, H = 675;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const f = shareFacts();
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1a0b2e"); sky.addColorStop(0.45, "#7a2a6b"); sky.addColorStop(0.7, "#f4717c"); sky.addColorStop(1, "#ffb36b");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // sun with stripes
  const sx = 930, sy = 470, sr = 210;
  const sun = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
  sun.addColorStop(0, "#ffe9a0"); sun.addColorStop(1, "#f976b0");
  ctx.save(); ctx.shadowColor = "#ffdf80"; ctx.shadowBlur = 80;
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fillStyle = sun; ctx.fill(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = "#c2457e";
  for (let i = 0; i < 7; i++) ctx.fillRect(sx - sr, sy + 20 + i * 26, sr * 2, 4 + i * 2);
  ctx.restore();
  // ocean
  const sea = ctx.createLinearGradient(0, 560, 0, H);
  sea.addColorStop(0, "#3b1a5a"); sea.addColorStop(1, "#0d0820");
  ctx.fillStyle = sea; ctx.fillRect(0, 560, W, H - 560);
  ctx.strokeStyle = "#f976b055"; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 575 + i * 18); ctx.lineTo(W, 575 + i * 18); ctx.stroke(); }
  // dark panel for readability
  ctx.fillStyle = "rgba(8,5,16,0.78)";
  roundRect(ctx, 40, 40, 760, 595, 28); ctx.fill();
  ctx.strokeStyle = "#f976b0"; ctx.lineWidth = 3; ctx.shadowColor = "#f976b0"; ctx.shadowBlur = 24;
  roundRect(ctx, 40, 40, 760, 595, 28); ctx.stroke(); ctx.shadowBlur = 0;
  // logo
  const logo = await loadLogo();
  if (logo) { ctx.save(); ctx.shadowColor = "#f976b0"; ctx.shadowBlur = 40; ctx.drawImage(logo, 840, 60, 300, 300 * logo.height / logo.width); ctx.restore(); }
  const font = '"Big Shoulders Display", "Arial Narrow", Impact, sans-serif';
  ctx.textBaseline = "alphabetic";
  const fit = (txt, weight, size, fam, maxW) => {
    let s = size;
    do { ctx.font = `${weight} ${s}px ${fam}`; s -= 2; } while (ctx.measureText(txt).width > maxW && s > 14);
  };
  const body = "Figtree, system-ui, sans-serif";
  if (f) {
    const head = `Compré ${f.what} por ${f.paid}`;
    ctx.fillStyle = "#ffdf80"; ctx.save(); ctx.shadowColor = "#f976b0"; ctx.shadowBlur = 14;
    fit(head.toUpperCase(), 800, 44, font, 690); ctx.fillText(head.toUpperCase(), 80, 105); ctx.restore();
    ctx.fillStyle = "#d4cbe0"; ctx.font = `500 19px ${body}`;
    ctx.fillText(`el ${f.date} · ${f.withTax} con impuestos`, 80, 136);
    const line = f.mode === "btc"
      ? "Si hubiera comprado bitcoin (BTC), hoy valdrían:"
      : f.mode === "both"
        ? "Si hubiera puesto esa plata en TTWO o en BTC, hoy valdrían:"
        : "Si hubiera comprado acciones de Take-Two Interactive (TTWO), hoy valdrían:";
    ctx.fillStyle = "#f6f0ea"; fit(line, 500, 24, body, 690);
    ctx.fillText(line, 80, 180);
    if (f.mode === "both" && (f.ttwo || f.btc)) {
      const drawCol = (x0, pack, name, accent) => {
        if (!pack) {
          ctx.fillStyle = "#d4cbe0"; ctx.font = `700 28px ${font}`;
          ctx.fillText(`${name}: sin dato`, x0, 280);
          return;
        }
        const col = pack.up ? "#9ed39a" : "#ff8a9a";
        ctx.fillStyle = accent; ctx.font = `700 22px ${font}`;
        ctx.fillText(name, x0, 220);
        ctx.save(); ctx.shadowColor = pack.up ? "#9ed39a" : accent; ctx.shadowBlur = 22;
        ctx.fillStyle = pack.up ? "#c8f5c3" : "#ffdf80"; ctx.font = `800 64px ${font}`;
        ctx.fillText(pack.valTxt, x0, 290); ctx.restore();
        ctx.fillStyle = col; ctx.font = `700 26px ${font}`;
        ctx.fillText(`${pack.pctTxt}  ·  ${pack.glTxt.toUpperCase()}`, x0, 330);
      };
      drawCol(80, f.ttwo, "TTWO", "#f976b0");
      drawCol(430, f.btc, "BTC", "#3ef0d4");
    } else {
      const col = f.up ? "#9ed39a" : "#ff8a9a";
      ctx.save(); ctx.shadowColor = f.up ? "#9ed39a" : "#f976b0"; ctx.shadowBlur = 30;
      ctx.fillStyle = f.up ? "#c8f5c3" : "#ffdf80"; ctx.font = `800 120px ${font}`;
      ctx.fillText(f.valTxt, 76, 290); ctx.restore();
      ctx.fillStyle = col; ctx.font = `700 40px ${font}`;
      ctx.fillText(`${f.pctTxt}  ·  ${f.glTxt.toUpperCase()}`, 80, 345);
    }
  }
  if (f && f.saveTxt && lastCompare) {
    ctx.fillStyle = "rgba(255,223,128,0.12)"; roundRect(ctx, 70, 392, 700, 140, 20); ctx.fill();
    ctx.strokeStyle = "#ffdf80"; ctx.lineWidth = 2; roundRect(ctx, 70, 392, 700, 140, 20); ctx.stroke();
    ctx.fillStyle = "#ffdf80"; ctx.font = `700 26px ${font}`;
    ctx.fillText(`AHORRO CON ${lastCompare.best.name.toUpperCase()}`, 95, 430);
    ctx.fillStyle = "#fff"; ctx.font = `800 58px ${font}`;
    ctx.fillText(`${money(lastCompare.save, "ARS")}`, 95, 492);
    ctx.fillStyle = "#e8dfef"; ctx.font = `500 22px Figtree, system-ui, sans-serif`;
    ctx.fillText(`${fmtAR.format(lastCompare.savePct)}% menos que con tarjeta bancaria`, 95, 520);
  }
  ctx.fillStyle = "#99ccff"; ctx.font = `600 24px Figtree, system-ui, sans-serif`;
  ctx.fillText(SITE_URL.replace("https://", ""), 80, 590);
  ctx.fillStyle = "#d4cbe0"; ctx.font = `400 16px Figtree, system-ui, sans-serif`;
  ctx.fillText("Educativo, no es consejo financiero. Sin afiliación con Rockstar/Take-Two.", 80, 616);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

let shareTimer = null;
function renderShare() {
  const canvas = $("share-canvas");
  if (!canvas) return;
  clearTimeout(shareTimer);
  shareTimer = setTimeout(() => drawShareCard(canvas), 150);
  const text = shareText();
  const url = shareUrl();
  $("share-x").href = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  $("share-wa").href = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
}

function canvasBlob() {
  return new Promise((resolve) => $("share-canvas").toBlob(resolve, "image/png"));
}

function bindShare() {
  $("share-download").addEventListener("click", async () => {
    await drawShareCard($("share-canvas"));
    const blob = await canvasBlob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "mi-gta6-vs-ttwo.png"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    track("share-download");
  });
  $("share-copy").addEventListener("click", async () => {
    let ok = true;
    try { await navigator.clipboard.writeText(shareUrl()); }
    catch {
      try {
        const ta = document.createElement("textarea"); ta.value = shareUrl(); document.body.appendChild(ta);
        ta.select(); ok = document.execCommand("copy"); ta.remove();
      } catch { ok = false; }
    }
    toast(ok ? "Link copiado" : "No se pudo copiar el link");
    track("share-copy");
  });
  const nativeBtn = $("share-native");
  if (navigator.share) {
    nativeBtn.hidden = false;
    nativeBtn.addEventListener("click", async () => {
      await drawShareCard($("share-canvas"));
      const blob = await canvasBlob();
      const file = new File([blob], "mi-gta6-vs-ttwo.png", { type: "image/png" });
      const data = { title: "GTA 6 vs acciones", text: shareText(), url: shareUrl() };
      if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
      try { await navigator.share(data); track("share-native"); } catch { /* cancelled */ }
    });
  }
  $("share-x").addEventListener("click", () => track("share-x"));
  $("share-wa").addEventListener("click", () => track("share-whatsapp"));
}

// ---------- Cookieless analytics (own Cloudflare Worker + D1) ----------
// Sends only: event name, pathname (no query), referrer. No cookies, no IDs.
const ANALYTICS_URL = "https://gta6-analytics.lcaitech.workers.dev/e";
const TRACK_HOSTS = new Set(["gta6.lcaitech.com", "localhost", "127.0.0.1"]);
function track(name) {
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

function bindTracking() {
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


// ---------- Official price autofill ----------
const STORE_LABEL = { ps: "PlayStation Store AR", xbox: "Xbox Store AR", official: "la lista oficial de Take-Two" };
function officialPrice(edition, store) {
  const p = PRICES[edition];
  if (!p) return null;
  if (store === "xbox") return p.xboxArs ? { amount: p.xboxArs, ccy: "ARS" } : null;
  return p.usd ? { amount: p.usd, ccy: "USD" } : null;
}
function fmtPrice(o) {
  return o.ccy === "ARS" ? `ARS ${o.amount.toLocaleString("es-AR")}` : `US$ ${fmtAR.format(o.amount)}`;
}
function renderPriceHint() {
  const off = officialPrice($("edition").value, $("store").value);
  const badge = $("amount-badge");
  const hint = $("price-hint");
  const where = STORE_LABEL[$("store").value];
  badge.className = "badge " + amountMode;
  if (amountMode === "official" && off) {
    badge.textContent = "Precio oficial";
    hint.innerHTML = `Precio oficial en ${where}: <strong>${fmtPrice(off)}</strong>. Autocompletado; podés editarlo.`;
  } else if (amountMode === "custom") {
    badge.textContent = "Personalizado";
    hint.innerHTML = off
      ? `Monto editado a mano. Precio oficial en ${where}: ${fmtPrice(off)}. <button type="button" class="linkbtn" id="restore-price">Restaurar precio oficial</button>`
      : `Monto editado a mano. Esta combinación no tiene precio publicado.`;
  } else {
    badge.textContent = "Sin precio publicado";
    const why = $("edition").value === "xbox-upgrade" && $("store").value === "ps" ? " (en PlayStation Store figura como no disponible)" : "";
    hint.innerHTML = `No hay precio publicado para esta edición en ${where}${why}. Escribí el monto que pagaste.`;
  }
  const r = $("restore-price");
  if (r) r.addEventListener("click", () => { applyOfficialPrice(true); update(); });
}
function applyOfficialPrice(flash) {
  const off = officialPrice($("edition").value, $("store").value);
  if (off) {
    $("custom-amount").value = off.amount;
    $("custom-ccy").value = off.ccy;
    amountMode = "official";
  } else {
    $("custom-amount").value = "";
    $("custom-amount").placeholder = "Escribí el monto";
    $("custom-ccy").value = $("store").value === "xbox" ? "ARS" : "USD";
    amountMode = "missing";
  }
  renderPriceHint();
  if (flash && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const row = $("custom-row");
    row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash");
  }
}
function markCustom() {
  amountMode = "custom";
  renderPriceHint();
}

let toastTimer = null;
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function syncMembMonths() {
  const plan = $("memb-plan").value;
  const sel = $("memb-months");
  const ps = MEMBERSHIPS[plan] && MEMBERSHIPS[plan].ccy === "USD";
  const opts = ps ? [1, 3, 12] : [1, 2, 3, 6, 12];
  const cur = Number(sel.value) || 1;
  sel.innerHTML = opts.map((n) => `<option value="${n}"${n === cur ? " selected" : ""}>${n} ${n === 1 ? "mes" : "meses"}</option>`).join("");
  if (!opts.includes(cur)) sel.value = "1";
  const mc = membershipCost(plan, Number(sel.value));
  $("memb-hint").textContent = mc
    ? `${mc.label}: ${mc.ccy === "USD" ? "US$ " + fmtAR.format(mc.amount) : "ARS " + mc.amount.toLocaleString("es-AR")} sin impuestos.${mc.ccy === "ARS" ? (gpIva ? " Sumamos IVA (sin confirmar si el precio lo incluye)." : " Sin sumar IVA.") : ""} Para la campaña de GTA VI no hace falta: es para un jugador y no está en el catálogo.`
    : "";
}

// ---------- API for extras.js ----------
window.__gta = {
  get model() { return lastModel; },
  get quotes() { return quotes; },
  get latestQuote() { return latestQuote; },
  get btcQuotes() { return btcQuotes; },
  get latestBtc() { return latestBtc; },
  get asset() { return currentAsset; },
  get compare() { return lastCompare; },
  get binanceIva() { return binanceIva; },
  get gpIva() { return gpIva; },
  setGpIva(v) { gpIva = !!v; syncMembMonths(); update(); },
  fxVenta, money, fmtAR, fmtInt, track, closeOnOrBefore, membershipCost, toast, dmy,
  MEMBERSHIPS, BINGX, BINANCE, PRICES,
  listeners: [],
  refreshUrl() { saveStateToUrl(); },
};
