// Eventos de los controles de la calculadora.
import { fijarActivo } from "./activo.js";
import { update } from "./actualizar.js";
import { $ } from "./base.js";
import { estado } from "./estado.js";
import { syncMembMonths } from "./membresia.js";
import { applyOfficialPrice, markCustom } from "./precio-oficial.js";
export function bind() {
  $("edition").addEventListener("change", () => {
    if ($("edition").value === "xbox-upgrade") $("store").value = "xbox";
    applyOfficialPrice(true);
    update();
  });
  $("store").addEventListener("change", () => {
    applyOfficialPrice(true);
    update();
  });
  $("custom-amount").addEventListener("input", markCustom);
  $("custom-ccy").addEventListener("change", () => { markCustom(); update(); });
  [
    "custom-amount",
    "custom-ccy",
    "purchase-date",
    "dlc",
    "dlc-ccy",
    "gtaplus-months",
    "courtesy-month",
    "iva",
    "percepcion",
    "iibb",
    "fx-buy",
    "fx-now",
    "display-ccy",
    "fund-rate",
    "memb-on",
    "memb-plan",
    "memb-months",
  ].forEach((id) => $(id).addEventListener("input", update));
  $("memb-on").addEventListener("change", () => { $("memb-fields").hidden = !$("memb-on").checked; update(); });
  $("memb-plan").addEventListener("change", () => { syncMembMonths(); update(); });
  $("courtesy-month").addEventListener("change", update);
  const assets = $("asset-toggle");
  if (assets) {
    assets.addEventListener("click", (event) => {
      const b = event.target.closest("button[data-asset]");
      if (b && fijarActivo(b.dataset.asset)) update();
    });
  }
  $("pay-grid").addEventListener("change", (event) => {
    if (event.target && event.target.id === "binance-iva") {
      estado.binanceIva = event.target.checked;
      update();
    }
  });
}
