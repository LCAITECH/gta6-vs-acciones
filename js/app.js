// Calculadora de GTA VI: arranque. La lógica vive en js/calculadora/.
import { update } from "./calculadora/actualizar.js";
import { bindTracking } from "./calculadora/analitica.js";
import { $ } from "./calculadora/base.js";
import { cargarDatos } from "./calculadora/carga.js";
import { bindShare } from "./calculadora/compartir.js";
import { estado } from "./calculadora/estado.js";
import { bind } from "./calculadora/eventos.js";
import { syncMembMonths } from "./calculadora/membresia.js";
import { bindParallax } from "./calculadora/parallax.js";
import { applyOfficialPrice, renderPriceHint } from "./calculadora/precio-oficial.js";
import { loadStateFromUrl, urlAmountMode } from "./calculadora/url-state.js";
import "./calculadora/api.js";
async function boot() {
  await cargarDatos();
  const firsts = [];
  if (estado.quotes[0]) firsts.push(estado.quotes[0].date);
  if (estado.btcQuotes[0]) firsts.push(estado.btcQuotes[0].date);
  if (firsts.length) $("purchase-date").min = firsts.sort()[0];
  loadStateFromUrl();
  $("memb-fields").hidden = !$("memb-on").checked;
  syncMembMonths();
  if (urlAmountMode === "custom") { estado.amountMode = "custom"; renderPriceHint(); }
  else applyOfficialPrice(false);
  bind();
  bindShare();
  bindTracking();
  bindParallax();
  update();
}


boot().catch((err) => {
  $("stats").innerHTML = `<div class="stat"><div class="k">Error</div><div class="s">${err.message}</div></div>`;
});
