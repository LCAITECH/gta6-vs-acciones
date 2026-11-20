// Autocompletado del precio oficial según edición y tienda.
import { update } from "./actualizar.js";
import { $, fmtAR } from "./base.js";
import { PRICES } from "./config.js";
import { estado } from "./estado.js";
// ---------- Official price autofill ----------
const STORE_LABEL = { ps: "PlayStation Store AR", xbox: "Xbox Store AR", official: "la lista oficial de Take-Two" };
function officialPrice(edition, store) {
  const p = PRICES[edition];
  if (!p) return null;
  if (store === "xbox") return p.xboxArs ? { amount: p.xboxArs, ccy: "ARS" } : null;
  return p.usd ? { amount: p.usd, ccy: "USD" } : null;
}
function fmtPrice(o) {
  return o.ccy === "ARS" ? `ARS ${o.amount.toLocaleString("es-AR")}` : `US$ ${fmtAR.format(o.amount)}`;
}
export function renderPriceHint() {
  const off = officialPrice($("edition").value, $("store").value);
  const badge = $("amount-badge");
  const hint = $("price-hint");
  const where = STORE_LABEL[$("store").value];
  badge.className = "badge " + estado.amountMode;
  if (estado.amountMode === "official" && off) {
    badge.textContent = "Precio oficial";
    hint.innerHTML = `Precio oficial en ${where}: <strong>${fmtPrice(off)}</strong>. Autocompletado; podés editarlo.`;
  } else if (estado.amountMode === "custom") {
    badge.textContent = "Personalizado";
    hint.innerHTML = off
      ? `Monto editado a mano. Precio oficial en ${where}: ${fmtPrice(off)}. <button type="button" class="linkbtn" id="restore-price">Restaurar precio oficial</button>`
      : `Monto editado a mano. Esta combinación no tiene precio publicado.`;
  } else {
    badge.textContent = "Sin precio publicado";
    const why = $("edition").value === "xbox-upgrade" && $("store").value === "ps" ? " (en PlayStation Store figura como no disponible)" : "";
    hint.innerHTML = `No hay precio publicado para esta edición en ${where}${why}. Escribí el monto que pagaste.`;
  }
  const r = $("restore-price");
  if (r) r.addEventListener("click", () => { applyOfficialPrice(true); update(); });
}
export function applyOfficialPrice(flash) {
  const off = officialPrice($("edition").value, $("store").value);
  if (off) {
    $("custom-amount").value = off.amount;
    $("custom-ccy").value = off.ccy;
    estado.amountMode = "official";
  } else {
    $("custom-amount").value = "";
    $("custom-amount").placeholder = "Escribí el monto";
    $("custom-ccy").value = $("store").value === "xbox" ? "ARS" : "USD";
    estado.amountMode = "missing";
  }
  renderPriceHint();
  if (flash && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const row = $("custom-row");
    row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash");
  }
}
export function markCustom() {
  estado.amountMode = "custom";
  renderPriceHint();
}
