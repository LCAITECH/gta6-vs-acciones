// Recalcula el modelo y repinta todo: ticker, resultados, medios de pago, comparación, gráfico y notas.
import { assetMode } from "./activo.js";
import { $, fmtAR, fmtInt } from "./base.js";
import { computeSpend } from "./calculo.js";
import { renderCompare } from "./comparar.js";
import { renderShare } from "./compartir.js";
import { renderBreakdown } from "./desglose.js";
import { renderStats } from "./estadisticas.js";
import { estado } from "./estado.js";
import { drawChart } from "./grafico.js";
import { renderPay } from "./pago.js";
import { clockFromArt, closeAt, livePx, unionChartPoints } from "./series.js";
import { renderTicker } from "./ticker.js";
import { saveStateToUrl } from "./url-state.js";
export function update() {
  if (!estado.quotes.length && !estado.btcQuotes.length) return;
  const spend = computeSpend();
  const purchase = $("purchase-date").value || "2026-06-25";
  const entry = closeAt(estado.quotes, purchase);
  const btcEntry = closeAt(estado.btcQuotes, purchase);
  const lastClose = estado.quotes.length ? estado.quotes[estado.quotes.length - 1] : null;
  const lastBtc = estado.btcQuotes.length ? estado.btcQuotes[estado.btcQuotes.length - 1] : null;
  const livePrice = livePx(estado.quotes, estado.latestQuote);
  const btcLive = livePx(estado.btcQuotes, estado.latestBtc);
  const ttwoMissing = !entry || !entry.close;
  const btcMissing = !btcEntry || !btcEntry.close;
  const shares = !ttwoMissing ? spend.spendUsd / entry.close : 0;
  const btcShares = !btcMissing ? spend.spendUsd / btcEntry.close : 0;
  const valueNowUsd = shares && livePrice ? shares * livePrice : 0;
  const btcValueNowUsd = btcShares && btcLive ? btcShares * btcLive : 0;
  const ccy = $("display-ccy").value;
  const updated = clockFromArt(estado.latestQuote && estado.latestQuote.updatedAtArt);
  const updatedBtc = clockFromArt(estado.latestBtc && estado.latestBtc.updatedAtArt);
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
  estado.lastModel = model;
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
