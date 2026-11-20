// Comparación del precio con la tarjeta del banco contra las tarjetas cripto.
import { $, fmtAR, fmtInt, money } from "./base.js";
import { BINANCE, BINGX } from "./config.js";
import { estado } from "./estado.js";
import { fxVenta, renderFxRates } from "./fx.js";
export function renderCompare(model) {
  const fundKey = $("fund-rate").value;
  const oficial = fxVenta("oficial");
  const fund = fxVenta(fundKey);
  const iibb = Math.max(0, Number($("iibb").value) || 0) / 100;
  const store = model.store;
  // PSN, Microsoft and Rockstar are excluded from the 30% percepción (RG 5677/2025).
  const percApplies = false;
  const ivaBank = 0.21;

  const xboxArs = model.listCcy === "ARS";
  const extrasUsd = model.dlcUsd + model.plusUsd + (model.membUsd || 0);
  let bankArs;
  let usdEquiv;
  if (xboxArs) {
    const arsBase = model.listArs + extrasUsd * oficial;
    bankArs = arsBase * (1 + ivaBank + iibb);
    usdEquiv = arsBase / oficial;
  } else {
    usdEquiv = model.listUsd + extrasUsd;
    bankArs = usdEquiv * oficial * (1 + ivaBank + (percApplies ? 0.3 : 0) + iibb);
  }

  const purchase = $("purchase-date").value || "2026-06-25";
  const bxUsd = usdEquiv * (1 + BINGX.fee - BINGX.cashback);
  const bnCash = purchase <= BINANCE.cashbackUntil ? BINANCE.cashback : 0;
  const bnUsd = usdEquiv * (1 + (estado.binanceIva ? 0.21 : 0) - bnCash);
  const bxArs = bxUsd * fund;
  const bnArs = bnUsd * fund;

  const best = bxArs <= bnArs ? { name: "BingX Card", ars: bxArs, usd: bxUsd } : { name: "Binance Card", ars: bnArs, usd: bnUsd };
  const save = bankArs - best.ars;
  const savePct = bankArs ? (save / bankArs) * 100 : 0;
  const fundLabel = { cripto: "dólar cripto", bolsa: "dólar MEP", blue: "dólar blue", oficial: "dólar oficial" }[fundKey];

  renderFxRates();

  const pos = save > 0;
  estado.lastCompare = { save, savePct, best, fund, bankArs };
  $("savings").innerHTML = `
    <div class="savings-box ${pos ? "" : "neg"}">
      <div class="savings-inner">
        <div class="k">${pos ? `Ahorro pagando con ${best.name}` : "Con estos valores, la tarjeta cripto no ahorra"}</div>
        <div class="big">${pos ? "" : "−"}${money(Math.abs(save), "ARS")}</div>
        <div class="sub">≈ ${money(Math.abs(save) / fund, "USD")} · ${fmtInt.format(Math.abs(savePct))}% ${pos ? "menos" : "más"} que con tarjeta bancaria</div>
        <div class="fine">Tarjeta bancaria ${money(bankArs, "ARS")} vs ${best.name} ${money(best.ars, "ARS")} (fondeada a ${fundLabel} ${fmtAR.format(fund)}). Cashback y comisiones: dato informado por el dueño, según condiciones vigentes; verificá en la app.</div>
      </div>
    </div>`;

  const row = (name, ars, detail, cls = "") => `
    <article class="pay-card ${cls}">
      <h3>${name}</h3>
      <div class="price">${money(ars, "ARS")}</div>
      <p class="muted">${detail}</p>
    </article>`;
  const ivaTxt = `IVA 21%${iibb ? ` + IIBB ${fmtInt.format(iibb * 100)}%` : ""}`;
  $("compare-grid").innerHTML =
    row("Tarjeta bancaria", bankArs, xboxArs
      ? `Precio en pesos de Xbox Store + ${ivaTxt}. Sin percepción del 30%: Microsoft está excluida (RG 5677/2025).`
      : `US$ ${fmtAR.format(usdEquiv)} × oficial venta ${fmtAR.format(oficial)} + ${ivaTxt}. No usamos el dólar tarjeta (${fmtAR.format(fxVenta("tarjeta"))}) porque PSN, Microsoft y Rockstar están excluidas de la percepción del 30% (RG 5677/2025).`) +
    row("BingX Card", bxArs, `US$ ${fmtAR.format(usdEquiv)} + 1,5% comisión − 2% cashback = US$ ${fmtAR.format(bxUsd)} × ${fundLabel} ${fmtAR.format(fund)}. Sin impuestos argentinos (dato del dueño).`, best.name === "BingX Card" && pos ? "best" : "") +
    row("Binance Card", bnArs, `US$ ${fmtAR.format(usdEquiv)}${estado.binanceIva ? " + IVA 21% (sin confirmar)" : " sin IVA"} − ${bnCash ? "3% cashback" : "sin cashback"} = US$ ${fmtAR.format(bnUsd)} × ${fundLabel} ${fmtAR.format(fund)}. El IVA se prende/apaga en la tarjeta de arriba.`, best.name === "Binance Card" && pos ? "best" : "");

  $("compare-note").textContent = xboxArs
    ? "En Xbox Store el precio está en pesos: para la tarjeta cripto lo pasamos a USD al oficial venta (aproximación del tipo de cambio de la red de la tarjeta)."
    : "El ahorro sale de no pagar IVA (y IIBB) con la cripto; el dólar cripto es más caro que el oficial, así que con Binance e IVA prendido puede salir más caro.";
}
