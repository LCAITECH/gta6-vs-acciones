// Tarjetas de medios de pago: tienda, BingX Card y Binance Card.
import { $, money } from "./base.js";
import { BINANCE, BINANCE_URL, BINGX, BINGX_URL } from "./config.js";
import { estado } from "./estado.js";
export function renderPay(model) {
  const listUsd = model.listUsd + model.dlcUsd + model.plusUsd;
  const storeUsd = model.spendUsd;
  const storeArs = model.spendArs;

  const bingxGross = listUsd * (1 + BINGX.fee);
  const bingxCashback = listUsd * BINGX.cashback;
  const bingxNet = bingxGross - bingxCashback;
  const bingxVsStore = storeUsd - bingxNet;

  const purchase = $("purchase-date").value || "2026-06-25";
  const binanceCashbackRate = purchase <= BINANCE.cashbackUntil ? BINANCE.cashback : 0;
  const binanceIvaAmt = estado.binanceIva ? listUsd * 0.21 : 0;
  const binanceCashback = listUsd * binanceCashbackRate;
  const binanceNet = listUsd + binanceIvaAmt - binanceCashback;
  const binanceVsStore = storeUsd - binanceNet;
  const cheapest = Math.min(storeUsd, bingxNet, binanceNet);

  $("pay-grid").innerHTML = `
    <article class="pay-card${storeUsd === cheapest ? " best" : ""}">
      <h3>En la tienda</h3>
      <div class="price">${money(storeUsd, "USD")}</div>
      <p class="muted">${money(storeArs, "ARS")} al tipo de cambio de compra que cargaste. Incluye los impuestos que tildaste (IVA, percepción, IIBB) sobre el precio de lista, DLC y GTA+ extra.</p>
      <p class="muted">En PlayStation Store y en el precio oficial la base está en USD. En Xbox, la base está en pesos y la pasamos a dólares con tu tipo de cambio.</p>
    </article>
    <article class="pay-card${bingxNet === cheapest ? " best" : ""}">
      <h3>BingX Card</h3>
      <div class="price">${money(bingxNet, "USD")}</div>
      <p>Neto estimado: lista ${money(listUsd, "USD")} + 1,5% de comisión − 2% de cashback = ${money(bingxNet, "USD")}.</p>
      <p class="muted">Según el dueño del sitio, al pagar desde Argentina no se suman impuestos argentinos, así que el precio de lista en USD queda en USD más la comisión. Según condiciones vigentes, verificá en la app. El tramo inicial de cashback oficial de BingX también es 2% (sube si gastás más en el mes).</p>
      <p class="muted">Frente a la tienda con los impuestos tildados: ${bingxVsStore >= 0 ? "ahorrás" : "sale"} ${money(Math.abs(bingxVsStore), "USD")} ${bingxVsStore >= 0 ? "" : "más"}.</p>
      <a class="cta" href="${BINGX_URL}" rel="noopener noreferrer sponsored" target="_blank">Págalo con la BingX card</a>
    </article>
    <article class="pay-card${binanceNet === cheapest ? " best" : ""}">
      <h3>Binance Card</h3>
      <div class="price">${money(binanceNet, "USD")}</div>
      <p>Neto estimado: lista ${money(listUsd, "USD")}${estado.binanceIva ? " + IVA 21%" : " sin IVA"} − ${binanceCashbackRate ? "3% de cashback" : "sin cashback"} = ${money(binanceNet, "USD")}.</p>
      <p class="muted">Dato informado por el dueño del sitio: 3% de cashback instantáneo hasta el 31/12/2026${purchase <= BINANCE.cashbackUntil ? "" : " (la fecha de compra es posterior, no lo sumamos)"} y no se aplica la percepción del 30% de Ganancias. IVA: sin confirmar. La comisión de la tarjeta no está publicada (no inventamos una). Según condiciones vigentes, verificá en la app.</p>
      <label class="check"><input type="checkbox" id="binance-iva"${estado.binanceIva ? " checked" : ""}> Sumar IVA 21% (sin confirmar; prendido por defecto, estimación conservadora)</label>
      <p class="muted">Frente a la tienda con los impuestos tildados: ${binanceVsStore >= 0 ? "ahorrás" : "sale"} ${money(Math.abs(binanceVsStore), "USD")}${binanceVsStore >= 0 ? "" : " más"}.</p>
      <a class="cta" href="${BINANCE_URL}" rel="noopener noreferrer sponsored" target="_blank">Págalo con la Binance Card</a>
      <p class="muted">El link es un referido general de registro en Binance, no un referido específico de la Card.</p>
    </article>`;
}
