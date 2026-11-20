// Tabla de valor a 1 semana, 1 mes, 3, 6 meses y 1 año de la compra.
import { assetMode } from "./activo.js";
import { $, dmy, fmtInt, money } from "./base.js";
import { estado } from "./estado.js";
import { addDaysIso, addMonthsIso, closeAt, lastAvailableDate, toDisplay } from "./series.js";
const HORIZONS = [
  { key: "1w", label: "1 semana", days: 7 },
  { key: "1m", label: "1 mes", months: 1 },
  { key: "3m", label: "3 meses", months: 3 },
  { key: "6m", label: "6 meses", months: 6 },
  { key: "1y", label: "1 año", months: 12 },
];

export function renderBreakdown(model) {
  const el = $("breakdown");
  if (!el) return;
  const ccy = $("display-ccy").value;
  const mode = assetMode();
  const purchase = $("purchase-date").value || "2026-06-25";
  const spent = ccy === "ARS" ? model.spendArs : model.spendUsd;
  const showT = mode !== "btc";
  const showB = mode !== "ttwo";
  const lastT = lastAvailableDate(estado.quotes, estado.latestQuote);
  const lastB = lastAvailableDate(estado.btcQuotes, estado.latestBtc);
  const rows = [];
  for (const h of HORIZONS) {
    const when = h.days ? addDaysIso(purchase, h.days) : addMonthsIso(purchase, h.months);
    const cells = [];
    let any = false;
    const cell = (list, live, shares, missingEntry, last) => {
      if (!showT && list === estado.quotes) return "";
      if (!showB && list === estado.btcQuotes) return "";
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
    const tCell = showT ? cell(estado.quotes, estado.latestQuote, model.shares, model.ttwoMissing, lastT) : "";
    const bCell = showB ? cell(estado.btcQuotes, estado.latestBtc, model.btcShares, model.btcMissing, lastB) : "";
    if (showT && tCell.includes("sin dato") && (!showB || bCell.includes("sin dato")) && !any) {
      // still list the row only if at least one asset has data; if both sin dato because horizon is future, skip
      const futureT = showT && (!lastT || when > lastT);
      const futureB = showB && (!lastB || when > lastB);
      if (futureT && futureB) continue;
      if (showT && !showB && futureT) continue;
      if (showB && !showT && futureB) continue;
    }
    // Skip a row only when every visible asset lacks a quote on/after the horizon.
    const usableT = showT && !model.ttwoMissing && lastT && when <= lastT && closeAt(estado.quotes, when);
    const usableB = showB && !model.btcMissing && lastB && when <= lastB && closeAt(estado.btcQuotes, when);
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
