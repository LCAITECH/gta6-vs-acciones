// Consola hoy vs esperar la PC (y modo Black Friday).
// ================= CONSOLA HOY VS ESPERAR =================
import { $, G, rates } from "./acceso.js";
import { itemCosts, ttwoValue } from "./costos.js";
import { CONSOLES, OFFERS, precios } from "./datos.js";
import { goalUsd, scenarioCards } from "./desafio-calculo.js";
import { ars, usd0 } from "./formato.js";
import { joditaResult } from "./jodita.js";
import { bestOffer } from "./ofertas.js";
import { debounceTrack } from "./track.js";
function renderBlackFriday() {
  const g = G();
  const r = rates();
  const m = g.model;
  let gameBest = 0, gameHow = "";
  if (m) {
    const extrasUsd = m.dlcUsd + m.plusUsd;
    const item = m.listCcy === "ARS" ? { type: "digital", ccy: "ARS", amount: m.listArs + extrasUsd * r.oficial } : { type: "digital", ccy: "USD", amount: m.listUsd + extrasUsd };
    const c = itemCosts(item, r);
    [gameHow, gameBest] = [["tarjeta del banco", c.bank], ["BingX Card", c.bingx], ["Binance Card", c.binance]].sort((a, b) => a[1] - b[1])[0];
  }
  const rows = Object.keys(OFFERS).map((k) => ({ k, ...bestOffer(k) })).filter((x) => x.best).sort((a, b) => a.best.amount - b.best.amount);
  const cheapest = rows[0];
  const fmt = (n) => `ARS ${g.fmtAR.format(n)}`;
  $("w-out").innerHTML = `
    <div class="results">
      <div class="stat up"><div class="k">Lo más barato verificado hoy</div><div class="v">${ars(cheapest.best.amount + gameBest)}</div><div class="s">${CONSOLES[cheapest.k].label} ${fmt(cheapest.best.amount)} (${cheapest.best.how}) + GTA VI ${fmt(gameBest)} con ${gameHow}</div></div>
    </div>
    <div class="panel table-wrap"><p class="swipe-hint">Deslizá la tabla →</p><table class="j-table"><thead><tr><th>Consola</th><th class="n">Mejor precio de contado</th><th class="n">Mejor cuota sin interés</th><th class="n">+ juego (total)</th></tr></thead><tbody>
      ${rows.map((x) => `<tr><td>${CONSOLES[x.k].label}<span class="tag">${x.best.how}</span></td><td class="n">${fmt(x.best.amount)}</td><td class="n">${x.si ? `${x.si.n} × ${fmt(x.si.cuota)}<span class="tag">${x.si.store}, ${x.si.cond}${x.si.price && x.si.price !== x.best.amount ? ` · sobre ${fmt(x.si.price)}` : ""}</span>` : "—"}</td><td class="n">${ars(x.best.amount + gameBest)}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="warn">Precio de hoy (${precios.fecha}) como referencia: puede cambiar para el 27–30/11. No inventamos descuentos de Black Friday; si aparece una oferta real, cargala en La jodita. El juego digital no tiene cuotas (PS Store cobra un pago en USD + IVA; Game Pass es mensual).</p>`;
  $("w-scen-lead").textContent = "";
  $("w-scen").innerHTML = "";
}

export function renderWait() {
  const g = G();
  if (!g || !joditaResult) return;
  const bf = $("w-mode").value === "bf";
  $("w-pc-fields").hidden = bf;
  if (bf) { renderBlackFriday(); return; }
  const r = rates();
  const nowArs = joditaResult.best.save > 0 ? joditaResult.best.mix : joditaResult.bank;
  const nowUsd = nowArs / r.mep;
  const pcDate = $("w-pcdate").value || "2027-06-30";
  const months = Math.max(0, Math.round((new Date(pcDate) - new Date()) / (30.44 * 86400000)));
  const goal = goalUsd(r).usd;
  if (!nowArs) { $("w-out").innerHTML = `<p class="muted">Armá tu jodita arriba (consola, juego…) para comparar.</p>`; $("w-scen").innerHTML = ""; return; }
  const back = ttwoValue(nowUsd, "2026-06-25");
  $("w-out").innerHTML = `
    <div class="results">
      <div class="stat"><div class="k">Jugar ya en consola</div><div class="v">${usd0(nowUsd)}</div><div class="s">${ars(nowArs)} (tu jodita con el mejor medio de pago)</div></div>
      <div class="stat"><div class="k">Esperar la PC</div><div class="v">${months} meses</div><div class="s">Hasta el ${g.dmy(pcDate)}, fecha que elegiste: no hay fecha oficial de PC (lo de 2027 es rumor).</div></div>
      ${back ? `<div class="stat ${back.pct >= 0 ? "up" : "down"}"><div class="k">Si esa plata iba a TTWO el 25/06/2026</div><div class="v">${usd0(back.value)}</div><div class="s">Dato real hasta hoy (${back.pct >= 0 ? "+" : "−"}${g.fmtAR.format(Math.abs(back.pct))}%)</div></div>` : ""}
    </div>`;
  $("w-scen-lead").textContent = `Si en vez de la consola guardás ${usd0(nowUsd)} en TTWO hasta tu fecha de PC, escenarios hipotéticos frente a tu meta de ${usd0(goal)}:`;
  $("w-scen").innerHTML = scenarioCards(nowUsd, goal);
  debounceTrack("wait_calc");
}
