// Cuentas del Desafío Gordo Compu: meta en dólares, simulación de aportes con TTWO y tarjetas de escenarios.
// ================= DESAFÍO GORDO COMPU =================
import { $, G, num } from "./acceso.js";
import { GOALS, SCEN } from "./datos.js";
import { usd0 } from "./formato.js";
export function goalUsd(r) {
  const k = $("d-goal").value;
  const gdef = GOALS[k];
  const amount = k === "custom" ? num("d-goal-amount") : gdef.amount;
  const ccy = k === "custom" ? $("d-goal-ccy").value : gdef.ccy;
  return { usd: ccy === "ARS" ? amount / r.mep : amount, amount, ccy };
}

export function simulate(lump, monthly, startIso) {
  const g = G();
  const qs = g.quotes;
  if (!qs || !qs.length) return null;
  const last = qs[qs.length - 1].date;
  const live = g.latestQuote && typeof g.latestQuote.price === "number" ? g.latestQuote.price : qs[qs.length - 1].close;
  let units = 0, put = 0, n = 0;
  const start = new Date(startIso + "T12:00:00Z");
  if (lump) { const e = g.closeOnOrBefore(qs, startIso); units += lump / e.close; put += lump; }
  if (monthly) {
    for (let k = lump ? 1 : 0; k < 240; k++) {
      const d = new Date(start); d.setUTCMonth(d.getUTCMonth() + k);
      const iso = d.toISOString().slice(0, 10);
      if (iso > last) break;
      const e = g.closeOnOrBefore(qs, iso); units += monthly / e.close; put += monthly; n++;
    }
  }
  return { put, value: units * live, n };
}

export function scenarioCards(base, goal) {
  return SCEN.map((s) => {
    const v = base * s.m;
    const reach = goal ? (v / goal) * 100 : 0;
    const cls = s.m > 1 ? "up" : s.m < 1 ? "down" : "flat";
    return `<div class="scen ${cls}"><div class="k">${s.label}</div><div class="v">${usd0(v)}</div><div class="s">${goal ? (v >= goal ? "Llegás a la meta" : `${Math.round(reach)}% de la meta · faltan ${usd0(goal - v)}`) : ""}</div></div>`;
  }).join("");
}
