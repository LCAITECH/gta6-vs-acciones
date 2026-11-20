// Gráfico interactivo de cierres diarios de TTWO (canvas, sin librerías).
const $ = (id) => document.getElementById(id);
const RANGES = { "1M": 30, "3M": 91, "6M": 182, "1A": 365, MAX: null };
let rangeKey = "6M";
let seriesMode = "ttwo"; // ttwo | btc | pct
let points = [];
let hover = -1;
let ro = null;

function dmy(iso) {
  const g = window.__gta;
  if (g && g.dmy) return g.dmy(iso);
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function money(n) {
  const g = window.__gta;
  const x = Number(n);
  return g && g.fmtAR ? `US$ ${g.fmtAR.format(x)}` : `US$ ${x.toFixed(2)}`;
}
function appendLive(qs, live) {
  if (!live || typeof live.price !== "number") return qs;
  const d = live.asOfDate || (live.quoteTimeUtc || "").slice(0, 10);
  if (!d) return qs;
  if (!qs.length || d > qs[qs.length - 1].date) qs.push({ date: d, close: live.price, live: true });
  else if (d === qs[qs.length - 1].date) qs[qs.length - 1] = { date: d, close: live.price, live: true };
  return qs;
}
function assetSeries(kind) {
  const g = window.__gta;
  if (!g) return [];
  const list = kind === "btc" ? g.btcQuotes : g.quotes;
  const live = kind === "btc" ? g.latestBtc : g.latestQuote;
  if (!list || !list.length) return [];
  return appendLive(list.map((q) => ({ date: q.date, close: q.close })), live);
}
function closeOnOrBefore(list, iso) {
  if (!list || !list.length) return null;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].date <= iso) return list[i];
  }
  return null;
}
function series() {
  if (seriesMode !== "pct") return assetSeries(seriesMode === "btc" ? "btc" : "ttwo");
  const t = assetSeries("ttwo");
  const b = assetSeries("btc");
  const dates = new Set();
  t.forEach((q) => dates.add(q.date));
  b.forEach((q) => dates.add(q.date));
  const start = (t[0] && b[0]) ? (t[0].date > b[0].date ? t[0].date : b[0].date) : (t[0] || b[0] || {}).date;
  const days = [...dates].sort().filter((d) => !start || d >= start);
  if (!days.length) return [];
  // Normalize both to 0% at the first date of the visible set later (inRange + rebase).
  return days.map((date) => {
    const tq = closeOnOrBefore(t, date);
    const bq = closeOnOrBefore(b, date);
    return { date, ttwo: tq ? tq.close : null, btc: bq ? bq.close : null, close: tq ? tq.close : (bq ? bq.close : null) };
  });
}
function rebasePct(data) {
  if (!data.length) return data;
  let t0 = null;
  let b0 = null;
  for (const p of data) {
    if (t0 == null && p.ttwo != null) t0 = p.ttwo;
    if (b0 == null && p.btc != null) b0 = p.btc;
    if (t0 != null && b0 != null) break;
  }
  return data.map((p) => ({
    ...p,
    ttwoPct: t0 && p.ttwo != null ? ((p.ttwo / t0) - 1) * 100 : null,
    btcPct: b0 && p.btc != null ? ((p.btc / b0) - 1) * 100 : null,
  }));
}
function inRange(all) {
  if (!all.length) return [];
  const days = RANGES[rangeKey];
  if (!days) return all;
  const last = new Date(all[all.length - 1].date + "T12:00:00Z");
  const from = new Date(last);
  from.setUTCDate(from.getUTCDate() - days);
  const iso = from.toISOString().slice(0, 10);
  const sliced = all.filter((p) => p.date >= iso);
  const out = sliced.length >= 2 ? sliced : all.slice(-2);
  return seriesMode === "pct" ? rebasePct(out) : out;
}
function sizeCanvas(canvas) {
  const wrap = canvas.parentElement;
  const cssW = Math.max(280, wrap.clientWidth);
  const cssH = Math.max(200, wrap.clientHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: cssW, h: cssH };
}
function yValues(p) {
  if (seriesMode === "pct") return [p.ttwoPct, p.btcPct].filter((v) => v != null);
  return [p.close].filter((v) => v != null);
}
function layout(w, h, data) {
  const pad = { t: 22, r: 22, b: 36, l: 58 };
  const vals = data.flatMap(yValues);
  const min0 = Math.min(...vals);
  const max0 = Math.max(...vals);
  const padY = (max0 - min0) * 0.12 || max0 * 0.05 || 1;
  const min = min0 - padY;
  const max = max0 + padY;
  const x = (i) => pad.l + (i / Math.max(data.length - 1, 1)) * (w - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  return { pad, min, max, x, y };
}
function draw() {
  const canvas = $("ttwo-chart");
  if (!canvas) return;
  const data = points;
  const { ctx, w, h } = sizeCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  if (data.length < 2) return;
  const { pad, min, max, x, y } = layout(w, h, data);

  ctx.font = "12px Figtree, sans-serif";
  ctx.fillStyle = "#9b90b0";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(seriesMode === "pct" ? "%" : "US$", 8, pad.t - 4);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const grid = 4;
  const fmtTick = (v) => {
    if (seriesMode === "pct") return `${v >= 0 ? "" : "−"}${Math.abs(v).toFixed(1)}%`;
    return window.__gta && window.__gta.fmtAR ? window.__gta.fmtAR.format(v) : v.toFixed(2);
  };
  for (let i = 0; i <= grid; i += 1) {
    const v = min + ((max - min) * i) / grid;
    const yy = y(v);
    ctx.strokeStyle = "#ffffff10";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, yy);
    ctx.lineTo(w - pad.r, yy);
    ctx.stroke();
    ctx.fillText(fmtTick(v), pad.l - 8, yy);
  }
  ctx.textBaseline = "top";
  const ticks = [0, Math.round((data.length - 1) / 2), data.length - 1];
  ticks.forEach((i) => {
    ctx.textAlign = i === 0 ? "left" : i === data.length - 1 ? "right" : "center";
    ctx.fillText(dmy(data[i].date), x(i), h - pad.b + 8);
  });

  const valOf = (p, key) => (seriesMode === "pct" ? p[key === "btc" ? "btcPct" : "ttwoPct"] : p.close);
  const strokeLine = (key, color, fillColors, width) => {
    const pts = data.map((p, i) => {
      const v = valOf(p, key);
      return v == null ? null : [x(i), y(v)];
    });
    const first = pts.findIndex(Boolean);
    const lastI = pts.reduce((a, pt, i) => (pt ? i : a), -1);
    if (first < 0) return;
    if (fillColors) {
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
      const fill = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
      fillColors.forEach((c, i) => fill.addColorStop(i / (fillColors.length - 1), c));
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let started = false;
    pts.forEach((pt) => {
      if (!pt) return;
      if (!started) { ctx.moveTo(pt[0], pt[1]); started = true; }
      else ctx.lineTo(pt[0], pt[1]);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  if (seriesMode === "pct") {
    strokeLine("ttwo", "#f976b0", ["rgba(249,118,176,0.22)", "rgba(249,118,176,0.02)"], 2.2);
    strokeLine("btc", "#3ef0d4", null, 2.2);
  } else if (seriesMode === "btc") {
    strokeLine("btc", "#3ef0d4", ["rgba(62,240,212,0.32)", "rgba(62,240,212,0.02)"], 2.2);
  } else {
    strokeLine("ttwo", "#f976b0", ["rgba(249,118,176,0.35)", "rgba(155,137,245,0.12)", "rgba(255,223,128,0.02)"], 2.2);
    const stroke2 = ctx.createLinearGradient(pad.l, 0, w - pad.r, 0);
    stroke2.addColorStop(0, "#ffdf80");
    stroke2.addColorStop(0.5, "#f976b0");
    stroke2.addColorStop(1, "#9b89f5");
    ctx.strokeStyle = stroke2;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    data.forEach((p, i) => (i ? ctx.lineTo(x(i), y(p.close)) : ctx.moveTo(x(i), y(p.close))));
    ctx.stroke();
  }

  const idx = hover >= 0 ? hover : data.length - 1;
  const p = data[idx];
  const px = x(idx);
  ctx.strokeStyle = "rgba(255,223,128,0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(px, pad.t);
  ctx.lineTo(px, h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);
  const dot = (key, color) => {
    const v = valOf(p, key);
    if (v == null) return;
    const py = y(v);
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fillStyle = color === "#3ef0d4" ? "rgba(62,240,212,0.25)" : "rgba(249,118,176,0.25)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#140c16";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  };
  if (seriesMode === "pct") { dot("ttwo", "#f976b0"); dot("btc", "#3ef0d4"); }
  else if (seriesMode === "btc") { dot("btc", "#3ef0d4"); }
  else { dot("ttwo", "#ffdf80"); }

  const fmtPct = (v) => v == null ? "—" : `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;
  let html = `<strong>${dmy(p.date)}</strong>`;
  if (seriesMode === "pct") {
    html += ` · <span class="${(p.ttwoPct || 0) >= 0 ? "up" : "down"}">TTWO ${fmtPct(p.ttwoPct)}</span>`;
    html += ` · <span class="${(p.btcPct || 0) >= 0 ? "up" : "down"}">BTC ${fmtPct(p.btcPct)}</span> desde el inicio del rango`;
  } else {
    const first = data[0].close;
    const chg = p.close - first;
    const pct = first ? (chg / first) * 100 : 0;
    const sign = chg >= 0 ? "+" : "−";
    html += ` · <span class="${chg >= 0 ? "up" : "down"}">${money(p.close)}</span> · ${sign}${money(Math.abs(chg)).replace("US$ ", "")} (${sign}${Math.abs(pct).toFixed(2)}%) en el rango`;
  }
  $("ttwo-readout").innerHTML = html;
}

function nearest(ev) {
  const canvas = $("ttwo-chart");
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const data = points;
  if (data.length < 2) return;
  const { pad, x } = layout(w, h, data);
  const px = ev.clientX - rect.left;
  let best = 0;
  let dist = Infinity;
  for (let i = 0; i < data.length; i += 1) {
    const d = Math.abs(x(i) - px);
    if (d < dist) { dist = d; best = i; }
  }
  hover = best;
  draw();
}
function applyRange(key) {
  if (!RANGES.hasOwnProperty(key)) return;
  rangeKey = key;
  $("ttwo-range").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.r === key ? "true" : "false"));
  points = inRange(series());
  hover = points.length - 1;
  draw();
  const all = series();
  const g = window.__gta;
  const liveT = g && g.latestQuote;
  const liveB = g && g.latestBtc;
  const bits = [];
  if (seriesMode === "pct") {
    const a = points[0];
    const b = points[points.length - 1];
    bits.push(`Comparación normalizada al primer día del rango (${a ? dmy(a.date) : "—"} a ${b ? dmy(b.date) : "—"}).`);
  } else if (seriesMode === "btc") {
    bits.push(`Snapshot de cierres diarios de BTC/USD (${all[0] ? dmy(all[0].date) : "—"} a ${all.length ? dmy(all[all.length - 1].date) : "—"}). Fuente: Bitstamp.`);
  } else {
    bits.push(`Snapshot de cierres diarios de TTWO (${all[0] ? dmy(all[0].date) : "—"} a ${all.length ? dmy(all[all.length - 1].date) : "—"}).`);
  }
  bits.push("No es un tick en vivo ni una recomendación de inversión. El bitcoin puede caer mucho.");
  if (seriesMode !== "btc" && liveT && liveT.updatedAtArt) bits.push(`TTWO: ${liveT.updatedAtArt} (hora Argentina).`);
  if (seriesMode !== "ttwo" && liveB && liveB.updatedAtArt) bits.push(`BTC: ${liveB.updatedAtArt} (hora Argentina).`);
  $("ttwo-note").textContent = bits.join(" ");
}
function initChart() {
  const canvas = $("ttwo-chart");
  if (!canvas || canvas.dataset.ready) return;
  canvas.dataset.ready = "1";
  $("ttwo-range").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-r]");
    if (b) applyRange(b.dataset.r);
  });
  const assetBox = $("ttwo-asset");
  if (assetBox) {
    assetBox.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-series]");
      if (!b) return;
      seriesMode = b.dataset.series;
      assetBox.querySelectorAll("[data-series]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      applyRange(rangeKey);
    });
  }
  const move = (e) => { if (e.pointerType === "touch") e.preventDefault(); nearest(e); };
  canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); nearest(e); });
  canvas.addEventListener("pointermove", move, { passive: false });
  canvas.addEventListener("pointerup", (e) => { try { canvas.releasePointerCapture(e.pointerId); } catch {} });
  canvas.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") { hover = points.length - 1; draw(); } });
  const fromTouch = (e) => {
    const t = e.touches[0] || e.changedTouches[0];
    if (!t) return;
    nearest({ clientX: t.clientX, clientY: t.clientY });
  };
  canvas.addEventListener("touchstart", (e) => { e.preventDefault(); fromTouch(e); }, { passive: false });
  canvas.addEventListener("touchmove", (e) => { e.preventDefault(); fromTouch(e); }, { passive: false });
  canvas.addEventListener("keydown", (e) => {
    if (!points.length) return;
    if (e.key === "ArrowLeft") { hover = Math.max(0, (hover < 0 ? points.length - 1 : hover) - 1); draw(); }
    if (e.key === "ArrowRight") { hover = Math.min(points.length - 1, (hover < 0 ? 0 : hover) + 1); draw(); }
  });
  canvas.setAttribute("tabindex", "0");
  ro = new ResizeObserver(() => draw());
  ro.observe(canvas.parentElement);
  window.addEventListener("gta:view", (e) => { if (e.detail === "ttwo") requestAnimationFrame(() => applyRange(rangeKey)); });
  applyRange(rangeKey);
}
const wait = () => {
  const g = window.__gta;
  if (g && ((g.quotes && g.quotes.length) || (g.btcQuotes && g.btcQuotes.length))) initChart();
  else setTimeout(wait, 150);
};
wait();
