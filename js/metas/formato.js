// Formatos y textos de las metas (montos, fechas, etiquetas de plazo y celdas de escenarios).
import { G } from "./acceso.js";
import { addMonths } from "./calculo.js";
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export function ars(n) { return `ARS ${Math.round(n).toLocaleString("es-AR")}`; }
export function usd(n) {
  const fmt = G()?.fmtAR;
  const v = Number(n) || 0;
  return fmt ? `US$ ${fmt.format(v)}` : `US$ ${v.toFixed(2)}`;
}

function usd0(n) {
  return `US$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`;
}

export function mepStamp() {
  return G()?.mepStamp?.() || "MEP";
}

function fmtDate(iso) {
  const g = G();
  if (g?.dmy) return g.dmy(iso);
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function assumeName(asset, long) {
  if (asset === "btc") return long ? "Con el supuesto de BTC" : "Con BTC";
  if (asset === "half") return long ? "Con el supuesto (mitad y mitad)" : "Mitad y mitad";
  return long ? "Con el supuesto de TTWO" : "Con TTWO";
}

export function moneyLines(value, put, goalUsd, mep, reachedMonth) {
  const gain = value - put;
  const gainPct = put > 0 ? (gain / put) * 100 : 0;
  const reach = goalUsd > 0 ? (value / goalUsd) * 100 : 0;
  const missing = Math.max(0, goalUsd - value);
  const arsBit = mep ? ` ≈ ${ars(value * mep)}` : "";
  const when = reachedMonth === null ? "A 24 meses" : (reachedMonth === 0 ? "Hoy" : "En ese momento");
  const sign = gain >= 0 ? "+" : "−";
  const gainLbl = gain >= 0 ? "Ganancia" : "Pérdida";
  const gainTxt = `${gainLbl} ${usd(Math.abs(gain))} (${sign}${Math.abs(gainPct).toLocaleString("es-AR", { maximumFractionDigits: 0 })}%)`;
  const metaTxt = reachedMonth === null
    ? `${Math.round(reach)}% de la meta · faltan ${usd(missing)}`
    : `${Math.round(Math.min(100, reach))}% de la meta`;
  return `<p class="m-money">${when}: <strong>${usd(value)}</strong>${arsBit}</p><p class="m-money">${gainTxt} · ${metaTxt}</p>`;
}

export function scenCell(months, value, goalUsd, start, ttwoOnly) {
  if (ttwoOnly) return "—";
  if (months === null) {
    const reach = goalUsd > 0 ? (value / goalUsd) * 100 : 0;
    const missing = Math.max(0, goalUsd - value);
    return `${usd0(value)} · ${Math.round(reach)}% · faltan ${usd0(missing)}`;
  }
  return `${reachLabel(months, start)} · ${usd0(value)}`;
}

export function reachLabel(m, start) {
  if (m === null) return "no llega en 24 meses";
  if (m === 0) return "ya la alcanzás";
  const when = fmtDate(addMonths(start, m));
  return `${m} mes${m === 1 ? "" : "es"} · ${when}`;
}
