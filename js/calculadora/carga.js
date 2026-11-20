// Carga de los datos estáticos (histórico y última cotización de TTWO y BTC, y tipos de cambio).
import { estado } from "./estado.js";
import { renderFxRates } from "./fx.js";
export async function cargarDatos() {
  const res = await fetch("data/ttwo-daily.json");
  if (!res.ok) throw new Error("No se pudo cargar el histórico de TTWO");
  const data = await res.json();
  estado.quotes = data.quotes;
  try {
    const liveRes = await fetch("data/ttwo-latest.json", { cache: "no-store" });
    if (liveRes.ok) estado.latestQuote = await liveRes.json();
  } catch (err) {
    estado.latestQuote = null;
  }
  try {
    const fxRes = await fetch("data/fx-ar.json", { cache: "no-store" });
    if (fxRes.ok) estado.fx = await fxRes.json();
  } catch (err) {
    estado.fx = null;
  }
  renderFxRates();
  try {
    const btcRes = await fetch("data/btc-daily.json");
    if (btcRes.ok) {
      const btcData = await btcRes.json();
      estado.btcQuotes = btcData.quotes || [];
    }
  } catch (err) {
    estado.btcQuotes = [];
  }
  try {
    const liveBtc = await fetch("data/btc-latest.json", { cache: "no-store" });
    if (liveBtc.ok) estado.latestBtc = await liveBtc.json();
  } catch (err) {
    estado.latestBtc = null;
  }
}
