// Costo de cada ítem según el medio de pago (tarjeta del banco, BingX, Binance) y valor de un ahorro en TTWO.
// ---- cost per item, by type ----
// type "digital": foreign digital service (game, PS Plus, Game Pass). Bank card: oficial + IVA (+IIBB), no 30% (RG 5677/2025).
// type "local": bought in Argentina in pesos (hardware, tele). IVA already included; no foreign-card taxes.
import { G } from "./acceso.js";
export function itemCosts(item, r) {
  const g = G();
  const bnCash = todayIso() <= g.BINANCE.cashbackUntil ? g.BINANCE.cashback : 0;
  const bxMul = 1 + g.BINGX.fee - g.BINGX.cashback;
  if (item.type === "digital") {
    const ivaHere = item.noIva ? 0 : r.iva;
    const usdBase = item.ccy === "USD" ? item.amount : item.amount / r.oficial;
    const bank = item.ccy === "USD" ? item.amount * r.oficial * (1 + ivaHere + r.iibb) : item.amount * (1 + ivaHere + r.iibb);
    const bingx = usdBase * bxMul * r.fund;
    const binance = usdBase * (1 + (g.binanceIva && !item.noIva ? 0.21 : 0) - bnCash) * r.fund;
    return { bank, bingx, binance };
  }
  // local ARS: the card network converts pesos to USD (we approximate at oficial), then you spend USDT bought at r.fund.
  const usdBase = item.amount / r.oficial;
  return { bank: item.amount, bingx: usdBase * bxMul * r.fund, binance: usdBase * (1 - bnCash) * r.fund };
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

export function ttwoValue(amountUsd, dateIso) {
  const g = G();
  const qs = g.quotes;
  if (!qs || !qs.length || !amountUsd) return null;
  const entry = g.closeOnOrBefore(qs, dateIso);
  const live = g.latestQuote && typeof g.latestQuote.price === "number" ? g.latestQuote.price : qs[qs.length - 1].close;
  const value = (amountUsd / entry.close) * live;
  return { entry, live, value, pct: (value / amountUsd - 1) * 100 };
}
