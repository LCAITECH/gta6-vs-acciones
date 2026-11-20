// Render de la vista Metas: plazo a la meta, barra de avance y tabla de escenarios.
import { $, liveBtc, livePrice, num } from "./acceso.js";
import { MAX_M, assumeMonths, assumeValueAt, cashMonths, cashValueAt, scenarioDeltas } from "./calculo.js";
import { estado } from "./estado.js";
import { ars, assumeName, esc, mepStamp, moneyLines, reachLabel, scenCell, usd } from "./formato.js";
import { currentGoal } from "./objetivo.js";
import { itemInfo, syncMetaAssetUi } from "./selector.js";
export function renderGoals() {
  const drop = Number($("m-drop")?.value || 0);
  const ttwoPct = Number($("m-ttwo")?.value || 0);
  const btcPct = Number($("m-btc")?.value || 0);
  syncMetaAssetUi();
  if ($("m-drop-val")) $("m-drop-val").textContent = `${drop}%`;
  if ($("m-ttwo-val")) {
    $("m-ttwo-val").textContent = `${ttwoPct > 0 ? "+" : ttwoPct < 0 ? "−" : ""}${Math.abs(ttwoPct)}%`;
  }
  if ($("m-btc-val")) {
    $("m-btc-val").textContent = `${btcPct > 0 ? "+" : btcPct < 0 ? "−" : ""}${Math.abs(btcPct)}%`;
  }
  document.querySelectorAll("#m-drop-chips [data-drop]").forEach((b) => {
    b.setAttribute("aria-pressed", Number(b.dataset.drop) === drop ? "true" : "false");
  });
  const goal = currentGoal();
  itemInfo(goal);
  const out = $("m-out");
  if (!out) return;
  if (!goal || goal.error || !goal.arsN) {
    out.innerHTML = `<p class="muted">${goal?.error ? esc(goal.error) : "Elegí un objetivo del catálogo para calcular el plazo."}</p>`;
    return;
  }
  if (goal.usdN == null) {
    out.innerHTML = `<p class="muted">Falta la cotización MEP para pasar el precio a dólares.</p>`;
    return;
  }
  const initial = num("m-initial");
  const monthly = num("m-monthly");
  const start = $("m-start")?.value || "2026-11-18";
  const live = livePrice();
  const liveB = liveBtc();
  const target = live * (1 + (estado.asset === "btc" ? btcPct : ttwoPct) / 100);
  const targetT = live * (1 + ttwoPct / 100);
  const targetB = liveB * (1 + (estado.asset === "btc" ? ttwoPct : btcPct) / 100);
  const base = goal.usdN;
  const dropped = base * (1 - drop / 100);

  const tgtB = estado.asset === "btc" ? (liveB * (1 + ttwoPct / 100)) : targetB;
  const cash = cashMonths(initial, monthly, base);
  const withT = assumeMonths(estado.asset, initial, monthly, base, live, targetT, liveB, tgtB);
  const cashK = cash === null ? MAX_M : cash;
  const assumeK = withT === null ? MAX_M : withT;
  const cashVal = cashValueAt(initial, monthly, cashK);
  const cashPut = cashVal;
  const assumeVal = assumeValueAt(estado.asset, initial, monthly, live, targetT, liveB, tgtB, assumeK);
  const assumePut = cashValueAt(initial, monthly, assumeK);
  const pctNow = base > 0 ? Math.max(0, Math.min(100, (initial / base) * 100)) : 0;
  const reached = cash === 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const win = reached
    ? `<div class="m-win${reduced ? " static" : ""}" role="status"><strong>Llegaste a la meta, te la podés comprar</strong></div>`
    : "";

  const bar = `<div class="m-progress"><div class="m-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pctNow)}"><div style="width:${pctNow}%"></div></div><p class="muted">Llevás ${usd(initial)} de ${usd(base)} (${Math.round(pctNow)}%).</p></div>`;

  const ttwoD = scenarioDeltas(ttwoPct);
  const btcD = scenarioDeltas(estado.asset === "half" ? btcPct : ttwoPct);
  const curT = estado.asset === "btc" ? live : targetT;
  const curB = tgtB;

  function rowBoth(label, init, mon, goalUsd, tT, tB) {
    const c = cashMonths(init, mon, goalUsd);
    const a = assumeMonths(estado.asset, init, mon, goalUsd, live, tT, liveB, tB);
    return {
      k: label,
      cash: c,
      ttwo: a,
      cashVal: cashValueAt(init, mon, c === null ? MAX_M : c),
      ttwoVal: assumeValueAt(estado.asset, init, mon, live, tT, liveB, tB, a === null ? MAX_M : a),
    };
  }
  function rowAssume(label, init, mon, goalUsd, tT, tB) {
    const a = assumeMonths(estado.asset, init, mon, goalUsd, live, tT, liveB, tB);
    return {
      k: label,
      cash: null,
      ttwo: a,
      ttwoOnly: true,
      ttwoVal: assumeValueAt(estado.asset, init, mon, live, tT, liveB, tB, a === null ? MAX_M : a),
    };
  }

  const rows = [
    rowBoth("Aporte mensual ×2", initial, monthly * 2, base, curT, curB),
    rowBoth("Aporte mensual ×3", initial, monthly * 3, base, curT, curB),
    rowBoth(`Precio del componente −${drop}% (${usd(dropped)})`, initial, monthly, dropped, curT, curB),
  ];
  if (estado.asset === "half") {
    rows.push(
      rowAssume(`TTWO +${ttwoD.up}%`, initial, monthly, base, live * (1 + ttwoD.up / 100), liveB),
      rowAssume(`TTWO −${ttwoD.down}%`, initial, monthly, base, live * (1 - ttwoD.down / 100), liveB),
      rowAssume(`BTC +${btcD.up}%`, initial, monthly, base, live, liveB * (1 + btcD.up / 100)),
      rowAssume(`BTC −${btcD.down}%`, initial, monthly, base, live, liveB * (1 - btcD.down / 100)),
    );
  } else if (estado.asset === "btc") {
    rows.push(
      rowAssume(`BTC +${btcD.up}%`, initial, monthly, base, curT, liveB * (1 + btcD.up / 100)),
      rowAssume(`BTC −${btcD.down}%`, initial, monthly, base, curT, liveB * (1 - btcD.down / 100)),
    );
  } else {
    rows.push(
      rowAssume(`TTWO +${ttwoD.up}%`, initial, monthly, base, live * (1 + ttwoD.up / 100), curB),
      rowAssume(`TTWO −${ttwoD.down}%`, initial, monthly, base, live * (1 - ttwoD.down / 100), curB),
    );
  }
  const assumeCol = assumeName(estado.asset, false);

  const scen = rows.map((r) => `<tr>
      <th scope="row">${esc(r.k)}</th>
      <td data-label="Solo aportes">${scenCell(r.cash, r.cashVal, r.k.startsWith("Precio") ? dropped : base, start, r.ttwoOnly)}</td>
      <td data-label="${esc(assumeCol)}">${scenCell(r.ttwo, r.ttwoVal, r.k.startsWith("Precio") ? dropped : base, start, false)}</td>
    </tr>`).join("");

  let ttwoNote = "Sin precio del activo: solo se muestran los aportes.";
  if (estado.asset === "half" && live && liveB) {
    ttwoNote = `Supuesto mitad y mitad: TTWO ${ttwoPct >= 0 ? "+" : "−"}${Math.abs(ttwoPct)}% (de ${usd(live)} a ${usd(targetT)}) y BTC ${btcPct >= 0 ? "+" : "−"}${Math.abs(btcPct)}% (de ${usd(liveB)} a ${usd(targetB)}) a 24 meses.`;
  } else if (estado.asset === "btc" && liveB) {
    const tgt = liveB * (1 + ttwoPct / 100);
    ttwoNote = `Supuesto de BTC: ${ttwoPct >= 0 ? "+" : "−"}${Math.abs(ttwoPct)}% (de ${usd(liveB)} a ${usd(tgt)} a 24 meses).`;
  } else if (live) {
    ttwoNote = `Supuesto de TTWO: ${ttwoPct >= 0 ? "+" : "−"}${Math.abs(ttwoPct)}% (de ${usd(live)} a ${usd(targetT)} a 24 meses).`;
  }

  out.innerHTML = `
    ${win}
    <div class="m-head">
      <div class="k">Meta</div>
      <div class="v">${usd(base)}</div>
      <div class="s">${ars(goal.arsN)} (${mepStamp()}) · ${esc(goal.label)}</div>
    </div>
    ${bar}
    <div class="m-reach">
      <div class="m-cell"><span>Solo con aportes</span><strong class="${cash === null ? "down" : "up"}">${reachLabel(cash, start)}</strong>${moneyLines(cashVal, cashPut, base, goal.mep, cash)}</div>
      <div class="m-cell"><span>${assumeName(estado.asset, true)}</span><strong class="${withT === null ? "down" : "up"}">${reachLabel(withT, start)}</strong>${moneyLines(assumeVal, assumePut, base, goal.mep, withT)}</div>
    </div>
    <p class="fine-inline">${esc(ttwoNote)} Tope de la cuenta: 24 meses. El bitcoin puede caer mucho.</p>
    <h4 class="cmp-list-title">Escenarios</h4>
    <div class="table-wrap"><table class="m-scen">
      <thead><tr><th>Escenario</th><th>Solo aportes</th><th>${esc(assumeCol)}</th></tr></thead>
      <tbody>${scen}</tbody>
    </table></div>`;
}
