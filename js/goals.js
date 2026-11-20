// Sistema de metas del Desafío Gordo Compu: plazo a la meta (aportes y supuesto TTWO) + escenarios.
import { $, G, builder } from "./metas/acceso.js";
import { estado } from "./metas/estado.js";
import { renderGoals } from "./metas/render.js";
import { fillItems } from "./metas/selector.js";
const DISCLAIMER = "No es asesoramiento financiero: puede salir bien o mal. La plata que no estás dispuesto a perder, dejala afuera. Los plazos y el supuesto de TTWO o de BTC son una simulación hipotética, no un pronóstico ni una recomendación de compra. El bitcoin es más volátil y puede caer mucho.";

function useArmado() {
  const type = $("m-type");
  if (type) type.value = "pc";
  fillItems();
  const item = $("m-item");
  if (item && [...item.options].some((o) => o.value === "armado" && !o.disabled)) item.value = "armado";
  renderGoals();
  const tab = document.querySelector('.d-subtabs [data-pane="metas"]');
  if (tab) tab.click();
}

function bind() {
  $("m-type")?.addEventListener("change", () => { fillItems(); renderGoals(); });
  $("m-item")?.addEventListener("change", renderGoals);
  ["m-initial", "m-monthly", "m-start"].forEach((id) => $(id)?.addEventListener("input", renderGoals));
  $("m-drop")?.addEventListener("input", renderGoals);
  $("m-ttwo")?.addEventListener("input", renderGoals);
  $("m-btc")?.addEventListener("input", renderGoals);
  $("m-asset")?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-asset]");
    if (!b) return;
    estado.asset = b.dataset.asset;
    renderGoals();
  });
  $("m-drop-chips")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-drop]");
    if (!b) return;
    $("m-drop").value = b.dataset.drop;
    renderGoals();
  });
  $("m-form")?.addEventListener("submit", (e) => e.preventDefault());
}

function init() {
  if (!$("m-form")) return;
  const start = () => {
    const b = builder();
    if (!b?.hw) return setTimeout(start, 50);
    if ($("m-disclaimer")) $("m-disclaimer").textContent = DISCLAIMER;
    // If the projection simulator already has a TTWO variation, inherit it once.
    const sim = $("s-slider");
    if (sim && $("m-ttwo") && $("m-ttwo").value === "0" && Number(sim.value) !== 0) {
      $("m-ttwo").value = sim.value;
    }
    fillItems();
    bind();
    renderGoals();
    const api = builder();
    if (api) {
      api.onBuildChange = () => {
        if ($("m-type")?.value === "pc") fillItems();
        if (!$("m-out")) return;
        if ($("m-type")?.value === "pc" && $("m-item")?.value === "armado") renderGoals();
      };
      api.useArmadoAsMetas = useArmado;
    }
    G()?.listeners?.push(renderGoals);
  };
  start();
}

window.__gtaRenderMetas = renderGoals;
window.__gtaUseArmadoAsMetas = useArmado;
init();
