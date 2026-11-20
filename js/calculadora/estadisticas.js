// Tarjetas de resultado: cuánto gastaste y cuánto valdría hoy en TTWO y BTC.
import { assetMode } from "./activo.js";
import { $, fmtInt, money } from "./base.js";
import { toDisplay } from "./series.js";
function statCard(k, v, s, cls) {
  return `<div class="stat${cls ? " " + cls : ""}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
}

export function renderStats(model) {
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
