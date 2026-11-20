// Secciones extra: La jodita (cost builder), Desafío Gordo Compu, Consola hoy vs esperar la PC, Encuesta.
import { $, G } from "./extras/acceso.js";
import { INITIAL_QS, capturarDefaults, extraState, restoreExtras } from "./extras/compartir.js";
import { renderConviene } from "./extras/conviene.js";
import { CONSOLES, DISCLAIMER, DISCLAIMER_SHORT, GOALS } from "./extras/datos.js";
import { renderDesafio, setBuildGoal } from "./extras/desafio.js";
import { renderPollButtons, startPollLive, vote } from "./extras/encuesta.js";
import { renderWait } from "./extras/espera.js";
import { ars } from "./extras/formato.js";
import { renderJodita, syncConsolePrice, syncJMembMonths } from "./extras/jodita.js";
import { applyCatalog } from "./extras/ofertas.js";
import { iniciarSimulador } from "./extras/simulador.js";
import { loadHardware } from "./catalog.js";

window.__gtaSetBuildGoal = setBuildGoal;

function renderAll() {
  renderJodita();
  renderDesafio();
  renderWait();
  G().refreshUrl();
}

function init() {
  const g = G();
  if (!g) return setTimeout(init, 50);
  $("j-console").innerHTML = Object.entries(CONSOLES).map(([k, c]) => `<option value="${k}">${c.label}${c.ars ? ` · ${ars(c.ars)}` : ""}</option>`).join("");
  $("j-console").value = "ps5-digital";
  $("d-goal").innerHTML = Object.entries(GOALS).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
  $("d-goal").value = "5070-msrp";
  $("j-memb-plan").innerHTML = Object.entries(g.MEMBERSHIPS).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join("");
  syncConsolePrice(true);
  syncJMembMonths();
  capturarDefaults();
  restoreExtras();
  syncConsolePrice(false);
  if (INITIAL_QS.has("jmm")) { syncJMembMonths(); $("j-memb-months").value = INITIAL_QS.get("jmm"); }
  else syncJMembMonths();
  $("j-memb-fields").hidden = !$("j-memb").checked;
  $("j-upgrade-fields").hidden = !$("j-upgrade").checked;
  $("d-disclaimer").textContent = DISCLAIMER;
  $("w-disclaimer").textContent = DISCLAIMER_SHORT + " Los escenarios son hipotéticos.";
  window.__gtaExtraState = extraState;

  $("j-console").addEventListener("change", () => { syncConsolePrice(true); renderAll(); });
  $("j-console-price").addEventListener("input", (e) => { e.target.dataset.edited = "1"; renderAll(); });
  $("j-upgrade-price").addEventListener("input", (e) => { e.target.dataset.edited = "1"; renderAll(); });
  $("j-upgrade").addEventListener("change", () => { $("j-upgrade-fields").hidden = !$("j-upgrade").checked; renderAll(); });
  $("j-memb").addEventListener("change", () => { $("j-memb-fields").hidden = !$("j-memb").checked; renderAll(); });
  $("j-memb-plan").addEventListener("change", () => { syncJMembMonths(); renderAll(); });
  $("j-gp-iva").addEventListener("change", (e) => g.setGpIva(e.target.checked));
  ["j-game", "j-game-format", "j-upgrade-ccy", "j-memb-months", "j-tv", "j-other", "d-goal", "d-goal-amount", "d-goal-ccy", "d-lump", "d-monthly", "d-start", "w-pcdate", "w-mode"]
    .forEach((id) => $(id).addEventListener("input", renderAll));
  ["j", "d"].forEach((p) => {
    const name = p === "j" ? "jodita" : "challenge";
    $(`${p}-share-x`).addEventListener("click", () => g.track(`share_${name}_x`));
    $(`${p}-share-wa`).addEventListener("click", () => g.track(`share_${name}_whatsapp`));
    $(`${p}-share-copy`).addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(e.target.dataset.url); g.toast("Link copiado"); } catch { g.toast("No se pudo copiar el link"); }
      g.track(`share_${name}_copy`);
    });
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-poll-root] .poll-btn");
    if (b) vote(b.dataset.opt);
  });
  renderPollButtons();
  startPollLive();

  g.listeners.push(() => { renderJodita(); renderDesafio(); renderWait(); renderConviene(); });
  const waitQuotes = () => (g.quotes && g.quotes.length ? (($("d-start").min = g.quotes[0].date), ($("d-start").max = g.quotes[g.quotes.length - 1].date), renderAll()) : setTimeout(waitQuotes, 100));
  waitQuotes();
}
// Los precios salen del catálogo único (data/hardware-prices.json). Si no carga a tiempo se usan las constantes
// de arriba (mismos valores, copia del catálogo) y la página funciona igual.
Promise.race([loadHardware(), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000))])
  .then(({ byId }) => applyCatalog(byId))
  .catch(() => { /* respaldo: constantes */ })
  .finally(() => { init(); iniciarSimulador(); }); // el simulador arranca con los selects de init() ya cargados
