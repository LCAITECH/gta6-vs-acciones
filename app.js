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

  const pad = { t: 36, r: 70, b: 70, l: 150 };
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
  const extrasUsd = model.dlcUsd + model.plusUsd;
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
  $("purchase-date").min = quotes[0].date;
  loadStateFromUrl();
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
  renderCompare(model);
  lastModel = model;
  saveStateToUrl();
  renderShare();
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


// ---------- Shared state in the URL ----------
const STATE_IDS = ["edition","store","custom-amount","custom-ccy","purchase-date","dlc","dlc-ccy","gtaplus-months","courtesy-month","iva","percepcion","iibb","fx-buy","fx-now","display-ccy","fund-rate"];
const SITE_URL = "https://gta6.lcaitech.com/";

// Compact keys for shared links; long keys still accepted (old links).
const SHORT = { edition: "e", store: "s", "custom-amount": "a", "custom-ccy": "c", "purchase-date": "d", dlc: "dl", "dlc-ccy": "dc", "gtaplus-months": "g", "courtesy-month": "cm", iva: "i", percepcion: "p", iibb: "ib", "fx-buy": "fb", "fx-now": "fn", "display-ccy": "v", "fund-rate": "f" };
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
  const diff = m.valueNowUsd - m.spendUsd;
  const pct = m.spendUsd ? (diff / m.spendUsd) * 100 : 0;
  const up = pct >= 0;
  const pctTxt = `${up ? "+" : "−"}${fmtAR.format(Math.abs(pct)).replace(/,00$/, "")}%`;
  const valTxt = `US$ ${Math.round(m.valueNowUsd).toLocaleString("es-AR")}`;
  const glTxt = `${up ? "ganarías" : "perderías"} US$ ${fmtAR.format(Math.abs(diff))}`;
  const c = lastCompare;
  const saveTxt = c && c.save > 0 ? `Pagándolo con la ${c.best.name} me ahorraba ${money(c.save, "ARS")} frente a la tarjeta del banco` : "";
  return { what, paid, withTax, pct, up, pctTxt, valTxt, glTxt, saveTxt, date: dmy(m.entry.date) };
}

function shareText() {
  const f = shareFacts();
  if (!f) return "";
  return `Compré ${f.what} por ${f.paid}. Si hubiera comprado acciones de Take-Two (TTWO), hoy valdrían ${f.valTxt} (${f.pctTxt}).${f.saveTxt ? " " + f.saveTxt + "." : ""} Calculá el tuyo:`;
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
    ctx.fillStyle = "#f6f0ea"; fit("Si hubiera comprado acciones de Take-Two Interactive (TTWO), hoy valdrían:", 500, 24, body, 690);
    ctx.fillText("Si hubiera comprado acciones de Take-Two Interactive (TTWO), hoy valdrían:", 80, 180);
    const col = f.up ? "#9ed39a" : "#ff8a9a";
    ctx.save(); ctx.shadowColor = f.up ? "#9ed39a" : "#f976b0"; ctx.shadowBlur = 30;
    ctx.fillStyle = f.up ? "#c8f5c3" : "#ffdf80"; ctx.font = `800 120px ${font}`;
    ctx.fillText(f.valTxt, 76, 290); ctx.restore();
    ctx.fillStyle = col; ctx.font = `700 40px ${font}`;
    ctx.fillText(`${f.pctTxt}  ·  ${f.glTxt.toUpperCase()}`, 80, 345);
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
