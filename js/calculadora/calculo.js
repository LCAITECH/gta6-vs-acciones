// Cuentas del gasto: impuestos, precio de lista, DLC, GTA+ y membresía.
import { $ } from "./base.js";
import { GTAPLUS, membershipCost } from "./config.js";
import { estado } from "./estado.js";
function taxesFactor() {
  const iva = $("iva").checked ? 0.21 : 0;
  const perc = $("percepcion").checked ? 0.3 : 0;
  const iibb = Math.max(0, Number($("iibb").value) || 0) / 100;
  return { iva, perc, iibb, factor: 1 + iva + perc + iibb };
}

export function computeSpend() {
  const edition = $("edition").value;
  const store = $("store").value;
  const fxBuy = Math.max(1, Number($("fx-buy").value) || 1575);
  const fxNow = Math.max(1, Number($("fx-now").value) || 1575);
  const { factor } = taxesFactor();

  let listUsd = 0;
  let listArs = 0;
  let listCcy = "USD";
  let note = "";

  const amount = Math.max(0, Number($("custom-amount").value) || 0);
  const ccy = $("custom-ccy").value;
  if (ccy === "ARS") {
    listArs = amount;
    listUsd = amount / fxBuy;
    listCcy = "ARS";
  } else {
    listUsd = amount;
    listArs = amount * fxBuy;
  }
  if (estado.amountMode === "missing" && !amount) note = "Esta combinación no tiene precio publicado: cargá el monto que pagaste.";

  const taxedUsd = listUsd * factor;
  const taxedArs = listArs * factor;

  const dlc = Math.max(0, Number($("dlc").value) || 0);
  const dlcCcy = $("dlc-ccy").value;
  const dlcUsd = dlcCcy === "ARS" ? dlc / fxBuy : dlc;
  const dlcArs = dlcCcy === "ARS" ? dlc : dlc * fxBuy;
  const dlcTaxUsd = dlcUsd * factor;
  const dlcTaxArs = dlcArs * factor;

  const months = Math.max(0, Math.floor(Number($("gtaplus-months").value) || 0));
  let plusUsd = 0;
  let plusArs = 0;
  if (months > 0) {
    if (store === "xbox") {
      plusArs = months * GTAPLUS.xboxArs;
      plusUsd = plusArs / fxBuy;
    } else {
      plusUsd = months * GTAPLUS.psUsd;
      plusArs = plusUsd * fxBuy;
    }
  }
  const plusTaxUsd = plusUsd * factor;
  const plusTaxArs = plusArs * factor;

  let membUsd = 0;
  let membTaxUsd = 0;
  if ($("memb-on") && $("memb-on").checked) {
    const mc = membershipCost($("memb-plan").value, Number($("memb-months").value));
    if (mc) {
      membUsd = mc.ccy === "ARS" ? mc.amount / fxBuy : mc.amount;
      const isGp = mc.ccy === "ARS";
      const f = isGp && !estado.gpIva ? factor - ($("iva").checked ? 0.21 : 0) : factor;
      membTaxUsd = membUsd * f;
    }
  }
  const spendUsd = taxedUsd + dlcTaxUsd + plusTaxUsd + membTaxUsd;
  const spendArs = taxedArs + dlcTaxArs + plusTaxArs + membTaxUsd * fxBuy;

  return {
    edition,
    store,
    fxBuy,
    fxNow,
    factor,
    listUsd,
    listArs,
    listCcy,
    taxedUsd,
    taxedArs,
    dlcUsd,
    membUsd,
    plusUsd,
    spendUsd,
    spendArs,
    note,
    months,
  };
}
