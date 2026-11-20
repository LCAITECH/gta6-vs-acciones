// Tipos de cambio (DolarApi) y sus textos.
import { $, fmtInt } from "./base.js";
import { estado } from "./estado.js";
// Fallback = values Leandro saw 18/11/2026 ~10:03 ART (aggregator screenshot).
const FX_FALLBACK = { oficial: 1575, tarjeta: 2047.5, blue: 1605, bolsa: 1603.3, cripto: 1688.58 };

export function fxVenta(key) {
  const r = estado.fx && estado.fx.rates && estado.fx.rates[key];
  return r && typeof r.venta === "number" ? r.venta : FX_FALLBACK[key];
}

export function fxRate(key) {
  const r = estado.fx && estado.fx.rates && estado.fx.rates[key];
  return {
    venta: r && typeof r.venta === "number" ? r.venta : FX_FALLBACK[key],
    updatedAtArt: (r && r.updatedAtArt) || null,
    label: (r && r.label) || key,
  };
}

function shortArt(ts) {
  if (!ts) return "";
  const [date, time] = String(ts).split(/\s+/);
  const short = (date || "").replace(/\/\d{4}$/, "");
  return [short, time].filter(Boolean).join(" ");
}

export function mepStamp() {
  const m = fxRate("bolsa");
  if (!(m.venta > 0)) return "MEP";
  const when = shortArt(m.updatedAtArt);
  return `MEP $${fmtInt.format(m.venta)}${when ? ` del ${when}` : ""}`;
}

export function arsUsdMep(arsAmount, usdAmount) {
  const arsTxt = `ARS ${Math.round(Number(arsAmount) || 0).toLocaleString("es-AR")}`;
  const usdTxt = `US$ ${Math.round(Number(usdAmount) || 0).toLocaleString("es-AR")}`;
  return `${arsTxt} ≈ ${usdTxt} (${mepStamp()})`;
}

function fxRatesHtml() {
  const oficial = fxRate("oficial");
  const mep = fxRate("bolsa");
  const blue = fxRate("blue");
  const src = `<a href="https://dolarapi.com" target="_blank" rel="noopener noreferrer">DolarApi https://dolarapi.com</a>`;
  const bit = (info) => {
    const when = shortArt(info.updatedAtArt);
    return `${fmtInt.format(info.venta)}${when ? ` <span class="fx-when">(${when})</span>` : ""}`;
  };
  const snap = estado.fx && estado.fx.updatedAtArt ? estado.fx.updatedAtArt : null;
  if (!estado.fx) {
    return `Oficial BNA <strong>${fmtInt.format(FX_FALLBACK.oficial)}</strong> · MEP ${fmtInt.format(FX_FALLBACK.bolsa)} · Blue ${fmtInt.format(FX_FALLBACK.blue)}. Sin conexión a la fuente: valores de referencia del 18/11/2026 ~10:03 (hora Argentina).`;
  }
  return `Oficial BNA <strong>${bit(oficial)}</strong> · MEP <strong>${bit(mep)}</strong> · Blue ${bit(blue)}. Snapshot <strong>${snap}</strong> (hora Argentina). Fuente: ${src}.`;
}

export function renderFxRates() {
  const html = fxRatesHtml();
  document.querySelectorAll("[data-fx-rates]").forEach((el) => { el.innerHTML = html; });
  const el = $("fx-meta");
  if (!el) return;
  const oficial = fxRate("oficial");
  const tarjeta = fxRate("tarjeta");
  const blue = fxRate("blue");
  const mep = fxRate("bolsa");
  const cripto = fxRate("cripto");
  const src = `<a href="https://dolarapi.com" target="_blank" rel="noopener noreferrer">DolarApi https://dolarapi.com</a>`;
  const snap = estado.fx && estado.fx.updatedAtArt ? estado.fx.updatedAtArt : null;
  if (!estado.fx) {
    el.innerHTML = `Oficial BNA <strong>${fmtInt.format(FX_FALLBACK.oficial)}</strong> · Tarjeta ${fmtInt.format(FX_FALLBACK.tarjeta)} · Blue ${fmtInt.format(FX_FALLBACK.blue)} · MEP ${fmtInt.format(FX_FALLBACK.bolsa)} · Cripto <strong>${fmtInt.format(FX_FALLBACK.cripto)}</strong>. Sin conexión a la fuente: usamos valores de referencia del 18/11/2026.`;
    return;
  }
  el.innerHTML = `Oficial BNA <strong>${fmtInt.format(oficial.venta)}</strong> · Tarjeta ${fmtInt.format(tarjeta.venta)} · Blue ${fmtInt.format(blue.venta)} · MEP <strong>${fmtInt.format(mep.venta)}</strong> · Cripto <strong>${fmtInt.format(cripto.venta)}</strong>. Snapshot <strong>${snap}</strong> (hora Argentina). Fuente: ${src}.`;
}
