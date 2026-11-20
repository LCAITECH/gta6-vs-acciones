// Selector de meses de la membresía y su texto de ayuda.
import { $, fmtAR } from "./base.js";
import { MEMBERSHIPS, membershipCost } from "./config.js";
import { estado } from "./estado.js";
export function syncMembMonths() {
  const plan = $("memb-plan").value;
  const sel = $("memb-months");
  const ps = MEMBERSHIPS[plan] && MEMBERSHIPS[plan].ccy === "USD";
  const opts = ps ? [1, 3, 12] : [1, 2, 3, 6, 12];
  const cur = Number(sel.value) || 1;
  sel.innerHTML = opts.map((n) => `<option value="${n}"${n === cur ? " selected" : ""}>${n} ${n === 1 ? "mes" : "meses"}</option>`).join("");
  if (!opts.includes(cur)) sel.value = "1";
  const mc = membershipCost(plan, Number(sel.value));
  $("memb-hint").textContent = mc
    ? `${mc.label}: ${mc.ccy === "USD" ? "US$ " + fmtAR.format(mc.amount) : "ARS " + mc.amount.toLocaleString("es-AR")} sin impuestos.${mc.ccy === "ARS" ? (estado.gpIva ? " Sumamos IVA (sin confirmar si el precio lo incluye)." : " Sin sumar IVA.") : ""} Para la campaña de GTA VI no hace falta: es para un jugador y no está en el catálogo.`
    : "";
}
