// Tarjetas de último dato de TTWO y BTC.
import { assetMode } from "./activo.js";
import { $, fmtAR, fmtInt } from "./base.js";
import { estado } from "./estado.js";
import { clockFromArt, livePx } from "./series.js";
function tickerCard(kind, list, live) {
  const last = list && list[list.length - 1];
  const price = livePx(list, live);
  const name = kind === "btc" ? "BTC" : "TTWO";
  if (price == null) {
    return `<article class="ticker${kind === "btc" ? " btc" : ""}"><div class="k">${name} último dato</div><div class="meta">No pudimos cargar la cotización. Reintentá más tarde.</div></article>`;
  }
  const ch = live && typeof live.change === "number" ? live.change : null;
  const pct = live && typeof live.changePercent === "number" ? live.changePercent : null;
  const up = (ch ?? 0) >= 0;
  const states = { REGULAR: "En el mercado", PRE: "Preapertura", POST: "After hours", CLOSED: "Mercado cerrado", "24/7": "Mercado 24/7" };
  const state = states[(live && live.marketState) || ""] || "Último dato";
  const updated = clockFromArt(live && live.updatedAtArt);
  const quoteArt = live && live.quoteTimeArt;
  const chLabel = ch == null ? "—" : `${up ? "+" : "−"}US$ ${fmtAR.format(Math.abs(ch))} (${up ? "+" : "−"}${fmtInt.format(Math.abs(pct || 0))}%)`;
  const src = kind === "btc"
    ? "Snapshot de Bitstamp (BTC/USD), no es un tick en vivo. Si falta el dato, usamos el último cierre diario."
    : "Snapshot de Yahoo Finance, no es un tick en vivo. Si falta el dato, usamos el último cierre.";
  return `
    <article class="ticker${kind === "btc" ? " btc" : ""}">
      <div class="k">${name} último dato</div>
      <div class="price">US$ ${fmtAR.format(price)}</div>
      <div class="chg ${up ? "up" : "down"}">${chLabel}</div>
      <div class="meta">${state}. Actualizado <strong>${updated || "—"}</strong> (hora Argentina)${quoteArt ? ` · dato de cotización: ${quoteArt}` : ""}. ${src}</div>
    </article>`;
}

export function renderTicker() {
  const el = $("ticker");
  if (!el) return;
  const mode = assetMode();
  const parts = [];
  if (mode !== "btc") parts.push(tickerCard("ttwo", estado.quotes, estado.latestQuote));
  if (mode !== "ttwo") parts.push(tickerCard("btc", estado.btcQuotes, estado.latestBtc));
  el.innerHTML = parts.join("") || "No pudimos cargar las cotizaciones. Reintentá más tarde.";
}
