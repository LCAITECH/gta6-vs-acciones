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

  if (edition === "custom") {
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
  } else if (edition === "xbox-upgrade") {
    if (store !== "xbox") {
      note = "La mejora a Ultimate solo tenía precio publicado en Xbox Store Argentina (ARS 28.691). En PlayStation Store figuraba como no disponible. La cuenta usa el precio de Xbox.";
    }
    listArs = PRICES["xbox-upgrade"].xboxArs;
    listUsd = listArs / fxBuy;
    listCcy = "ARS";
  } else if (store === "xbox") {
    listArs = PRICES[edition].xboxArs;
    listUsd = listArs / fxBuy;
    listCcy = "ARS";
  } else {
    listUsd = PRICES[edition].usd;
    listArs = listUsd * fxBuy;
    listCcy = "USD";
  }

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

  const spendUsd = taxedUsd + dlcTaxUsd + plusTaxUsd;
  const spendArs = taxedArs + dlcTaxArs + plusTaxArs;

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

function renderTicker() {
  const el = $("ticker");
  if (!el) return;
  const last = quotes[quotes.length - 1];
  const q = latestQuote;
  const price = q && typeof q.price === "number" ? q.price : last && last.close;
  if (price == null) {
    el.textContent = "No pudimos cargar la cotización de TTWO. Reintentá más tarde.";
    return;
  }
  const ch = q && typeof q.change === "number" ? q.change : null;
  const pct = q && typeof q.changePercent === "number" ? q.changePercent : null;
  const up = (ch ?? 0) >= 0;
  const states = { REGULAR: "En el mercado", PRE: "Preapertura", POST: "After hours", CLOSED: "Mercado cerrado" };
  const state = states[(q && q.marketState) || ""] || "Último dato";
  const updated = clockFromArt(q && q.updatedAtArt);
  const quoteArt = q && q.quoteTimeArt;
  const chLabel = ch == null ? "—" : `${up ? "+" : "−"}US$ ${fmtAR.format(Math.abs(ch))} (${up ? "+" : "−"}${fmtInt.format(Math.abs(pct || 0))}%)`;
  el.innerHTML = `
    <div class="k">TTWO ahora</div>
    <div class="price">US$ ${fmtAR.format(price)}</div>
    <div class="chg ${up ? "up" : "down"}">${chLabel}</div>
    <div class="meta">${state}. Actualizado <strong>${updated || "—"}</strong> (hora Argentina)${quoteArt ? ` · dato de cotización: ${quoteArt}` : ""}. Snapshot de Yahoo Finance, no es un tick en vivo. Si falta el dato, usamos el último cierre.</div>`;
}

function renderStats(model) {
  const el = $("stats");
  const ccy = $("display-ccy").value;
  const spent = ccy === "ARS" ? model.spendArs : model.spendUsd;
  const now = ccy === "ARS" ? model.valueNowUsd * model.fxNow : model.valueNowUsd;
  const diff = now - spent;
  const pct = spent ? (diff / spent) * 100 : 0;
  const cls = diff >= 0 ? "up" : "down";
  const verb = diff >= 0 ? "arriba" : "abajo";
  el.innerHTML = `
    <div class="stat">
      <div class="k">Gastaste en el juego</div>
      <div class="v">${money(spent, ccy)}</div>
      <div class="s">${model.sharesLabel}</div>
    </div>
    <div class="stat ${cls}">
      <div class="k">Hoy en TTWO</div>
      <div class="v">${money(now, ccy)}</div>
      <div class="s">${model.priceLabel}</div>
    </div>
    <div class="stat ${cls}">
      <div class="k">Diferencia</div>
      <div class="v">${diff >= 0 ? "+" : "−"}${money(Math.abs(diff), ccy)}</div>
      <div class="s">${verb} un ${fmtInt.format(Math.abs(pct))}%</div>
    </div>`;
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

  const pad = { t: 36, r: 40, b: 70, l: 110 };
  const vals = points.flatMap((p) => [p.spent, p.invested]);
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
  ctx.fillStyle = "#8e85a3";
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

    const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
    grad.addColorStop(0, "#f976b055");
    grad.addColorStop(1, "#f976b000");
    ctx.beginPath();
    visible.forEach((p, i) => {
      const xx = x(i);
      const yy = y(p.invested);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });
    ctx.lineTo(x(visible.length - 1), h - pad.b);
    ctx.lineTo(x(0), h - pad.b);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = "#f976b0";
    ctx.lineWidth = 10;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = "#f976b0";
    ctx.shadowBlur = 28;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    visible.forEach((p, i) => {
      const xx = x(i);
      const yy = y(p.invested);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 5;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    visible.forEach((p, i) => {
      const xx = x(i);
      const yy = y(p.invested);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });
    ctx.stroke();
    ctx.restore();

    const lastPt = visible[visible.length - 1];
    ctx.save();
    ctx.shadowColor = "#f976b0";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#f976b0";
    ctx.beginPath();
    ctx.arc(x(visible.length - 1), y(lastPt.invested), 8, 0, Math.PI * 2);
    ctx.fill();
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

let quotes = [];
let latestQuote = null;
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
  $("purchase-date").min = quotes[0].date;
  bind();
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
    $("custom-row").hidden = $("edition").value !== "custom";
    if ($("edition").value === "xbox-upgrade") $("store").value = "xbox";
    update();
  });
  [
    "store",
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
  ].forEach((id) => $(id).addEventListener("input", update));
  $("courtesy-month").addEventListener("change", update);
  $("pay-grid").addEventListener("change", (event) => {
    if (event.target && event.target.id === "binance-iva") {
      binanceIva = event.target.checked;
      update();
    }
  });
}

function update() {
  if (!quotes.length) return;
  const spend = computeSpend();
  const purchase = $("purchase-date").value || "2026-06-25";
  const entry = closeOnOrBefore(quotes, purchase);
  const lastClose = quotes[quotes.length - 1];
  const livePrice = latestQuote && typeof latestQuote.price === "number" ? latestQuote.price : lastClose.close;
  const shares = entry.close ? spend.spendUsd / entry.close : 0;
  const valueNowUsd = shares * livePrice;
  const ccy = $("display-ccy").value;
  const updated = clockFromArt(latestQuote && latestQuote.updatedAtArt);
  const model = {
    ...spend,
    entry,
    lastClose,
    livePrice,
    shares,
    valueNowUsd,
    sharesLabel: `${fmtInt.format(shares)} acciones a US$ ${fmtAR.format(entry.close)} el ${entry.date}`,
    priceLabel: `TTWO US$ ${fmtAR.format(livePrice)}${updated ? ` · actualizado ${updated} (hora Argentina)` : ""}`,
  };
  renderTicker();
  renderStats(model);
  renderPay(model);
  const startForSeries = purchase < entry.date ? entry.date : purchase;
  const pts = seriesFrom(quotes, startForSeries, shares, spend.spendUsd, spend.fxNow, ccy, latestQuote);
  drawChart(pts, ccy);
  const bits = [];
  if (spend.note) bits.push(spend.note);
  bits.push(`Histórico diario hasta ${lastClose.date}. La valuación de hoy usa la última cotización disponible (US$ ${fmtAR.format(livePrice)}). No es un tick en vivo.`);
  if (purchase > lastClose.date) {
    bits.push("La fecha de compra es posterior al último cierre del snapshot: usamos ese cierre como entrada y todavía no hay recorrido posterior.");
  }
  if (ccy === "ARS") {
    bits.push("En pesos, la línea de TTWO se convierte con el tipo de cambio de hoy que cargaste (no hay una serie histórica de dólar en este MVP).");
  }
  $("chart-note").textContent = bits.join(" ");
}

boot().catch((err) => {
  $("stats").innerHTML = `<div class="stat"><div class="k">Error</div><div class="s">${err.message}</div></div>`;
});
