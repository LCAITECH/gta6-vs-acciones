// Simulador de proyección: aportes y variación de TTWO, BTC o mitad y mitad.
// ================= SIMULADOR DE PROYECCIÓN =================
import { $, G, num, rates } from "./acceso.js";
import { goalUsd } from "./desafio-calculo.js";
import { ars, usd, usd0 } from "./formato.js";
import { debounceTrack } from "./track.js";
let simMonths = 6;
let simInitDone = false;
let simAsset = "ttwo";
function livePrice() {
  const g = G();
  if (g.latestQuote && typeof g.latestQuote.price === "number") return g.latestQuote.price;
  return g.quotes && g.quotes.length ? g.quotes[g.quotes.length - 1].close : 0;
}
function liveBtc() {
  const g = G();
  if (g && g.latestBtc && typeof g.latestBtc.price === "number") return g.latestBtc.price;
  const q = g && g.btcQuotes;
  return q && q.length ? q[q.length - 1].close : 0;
}
function projectPath(initial, monthly, live, target, H) {
  if (!(live > 0)) return { shares: 0, value: 0 };
  let shares = initial / live;
  for (let k = 1; k <= H; k++) {
    const p = Math.max(0.01, live + ((target - live) * k) / H);
    shares += monthly / p;
  }
  return { shares, value: shares * Math.max(0.01, target) };
}
function clampSlider(pct) {
  return String(Math.max(-50, Math.min(200, Math.round(pct / 5) * 5)));
}
function syncSimAssetUi() {
  const half = simAsset === "half";
  const btcOnly = simAsset === "btc";
  if ($("s-target-label")) $("s-target-label").textContent = btcOnly ? "Precio BTC al final (US$)" : "Precio TTWO al final (US$)";
  if ($("s-slider-label")) {
    const name = btcOnly ? "BTC" : "TTWO";
    const strong = $("s-slider-val");
    $("s-slider-label").childNodes[0].textContent = `Variación de ${name}: `;
    if (strong && strong.parentNode !== $("s-slider-label")) $("s-slider-label").appendChild(strong);
  }
  if ($("s-target-btc-wrap")) $("s-target-btc-wrap").hidden = !half;
  if ($("s-btc-slider-block")) $("s-btc-slider-block").hidden = !half;
  document.querySelectorAll("#s-asset [data-asset]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.asset === simAsset ? "true" : "false");
  });
}
export function renderSim() {
  const g = G();
  if (!g || !g.model) return;
  const liveT = livePrice();
  const liveB = liveBtc();
  if (!simInitDone) {
    $("s-initial").value = (g.model.listUsd || 99.99).toFixed(2);
    if (liveT) $("s-target").value = liveT.toFixed(2);
    if (liveB && $("s-target-btc")) $("s-target-btc").value = liveB.toFixed(2);
    simInitDone = true;
  }
  syncSimAssetUi();
  const r = rates();
  const initial = num("s-initial"), monthly = num("s-monthly");
  const H = simMonths;
  const targetT = Math.max(0.01, Number($("s-target").value) || (simAsset === "btc" ? liveB : liveT) || 1);
  const targetB = Math.max(0.01, Number($("s-target-btc") && $("s-target-btc").value) || liveB || 1);
  let value = 0;
  let unitsLabel = "Acciones";
  let unitsTxt = "—";
  if (simAsset === "btc") {
    const path = projectPath(initial, monthly, liveB, targetT, H); // s-target holds BTC price in btc mode
    value = path.value;
    unitsLabel = "BTC";
    unitsTxt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 8, minimumFractionDigits: 4 }).format(path.shares);
    const pctTarget = liveB ? (targetT / liveB - 1) * 100 : 0;
    $("s-slider-val").textContent = `${pctTarget >= 0 ? "+" : "−"}${Math.abs(Math.round(pctTarget))}% (US$ ${g.fmtAR.format(targetT)})`;
  } else if (simAsset === "half") {
    const pT = projectPath(initial / 2, monthly / 2, liveT, targetT, H);
    const pB = projectPath(initial / 2, monthly / 2, liveB, targetB, H);
    value = pT.value + pB.value;
    unitsLabel = "Unidades";
    unitsTxt = `${g.fmtAR.format(pT.shares)} TTWO · ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 8, minimumFractionDigits: 4 }).format(pB.shares)} BTC`;
    const pctT = liveT ? (targetT / liveT - 1) * 100 : 0;
    const pctB = liveB ? (targetB / liveB - 1) * 100 : 0;
    $("s-slider-val").textContent = `${pctT >= 0 ? "+" : "−"}${Math.abs(Math.round(pctT))}% (US$ ${g.fmtAR.format(targetT)})`;
    if ($("s-slider-btc-val")) $("s-slider-btc-val").textContent = `${pctB >= 0 ? "+" : "−"}${Math.abs(Math.round(pctB))}% (US$ ${g.fmtAR.format(targetB)})`;
  } else {
    const path = projectPath(initial, monthly, liveT, targetT, H);
    value = path.value;
    unitsTxt = g.fmtAR.format(path.shares);
    const pctTarget = liveT ? (targetT / liveT - 1) * 100 : 0;
    $("s-slider-val").textContent = `${pctTarget >= 0 ? "+" : "−"}${Math.abs(Math.round(pctTarget))}% (US$ ${g.fmtAR.format(targetT)})`;
  }
  const put = initial + monthly * H;
  const diff = value - put;
  const pct = put ? (diff / put) * 100 : 0;
  const up = diff >= 0;
  const goal = goalUsd(r).usd;
  const end = new Date(($("s-start").value || "2026-11-18") + "T12:00:00Z"); end.setUTCMonth(end.getUTCMonth() + H);
  $("s-out").innerHTML = `
    <div class="sim-cell"><span>Total aportado</span><strong>${usd(put)}</strong></div>
    <div class="sim-cell"><span>${unitsLabel}</span><strong>${unitsTxt}</strong></div>
    <div class="sim-cell ${up ? "up" : "down"}"><span>Valor al ${g.dmy(end.toISOString().slice(0, 10))}</span><strong>${usd(value)}</strong><em>${ars(value * r.mep)}</em></div>
    <div class="sim-cell ${up ? "up" : "down"}"><span>${up ? "Ganancia" : "Pérdida"}</span><strong>${up ? "+" : "−"}${usd(Math.abs(diff)).replace("US$ ", "US$ ")}</strong><em>${up ? "+" : "−"}${g.fmtAR.format(Math.abs(pct))}%</em></div>
    <div class="sim-goal ${value >= goal ? "up" : "down"}">${value >= goal ? `Llegás a la meta de ${usd0(goal)}` : `Te faltan ${usd0(goal - value)} para la meta de ${usd0(goal)} (${Math.round((value / goal) * 100)}%)`}</div>`;
  debounceTrack("projection_calc");
}
function initSim() {
  ["s-initial", "s-monthly", "s-start"].forEach((id) => $(id).addEventListener("input", renderSim));
  const bindPair = (inputId, sliderId, liveFn) => {
    const inp = $(inputId);
    const sl = $(sliderId);
    if (!inp || !sl) return;
    inp.addEventListener("input", () => {
      const live = liveFn();
      const pct = live ? (Number(inp.value) / live - 1) * 100 : 0;
      sl.value = clampSlider(pct);
      renderSim();
    });
    sl.addEventListener("input", () => {
      inp.value = (liveFn() * (1 + Number(sl.value) / 100)).toFixed(2);
      renderSim();
    });
  };
  bindPair("s-target", "s-slider", () => (simAsset === "btc" ? liveBtc() : livePrice()));
  bindPair("s-target-btc", "s-slider-btc", liveBtc);
  const box = $("s-asset");
  if (box) {
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-asset]");
      if (!b) return;
      const next = b.dataset.asset;
      // When leaving BTC-only, s-target held a BTC price; restore TTWO live if switching away.
      if (simAsset === "btc" && next !== "btc") {
        const liveT = livePrice();
        if (liveT) $("s-target").value = (liveT * (1 + Number($("s-slider").value) / 100)).toFixed(2);
      }
      if (next === "btc") {
        const liveB = liveBtc();
        if (liveB) $("s-target").value = (liveB * (1 + Number($("s-slider").value) / 100)).toFixed(2);
      }
      if (next === "half" && $("s-target-btc") && !$("s-target-btc").value) {
        const liveB = liveBtc();
        if (liveB) $("s-target-btc").value = liveB.toFixed(2);
      }
      simAsset = next;
      syncSimAssetUi();
      renderSim();
    });
  }
  $("s-horizon").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]"); if (!b) return;
    simMonths = Number(b.dataset.m);
    $("s-horizon").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    renderSim();
  });
  $("sim").addEventListener("toggle", () => { if ($("sim").open) renderSim(); });
  G().listeners.push(renderSim);
  renderSim();
}
const waitSim = () => (G() && G().model ? initSim() : setTimeout(waitSim, 150));
export function iniciarSimulador() { waitSim(); }
