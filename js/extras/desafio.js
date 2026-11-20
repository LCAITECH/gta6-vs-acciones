// Desafío Gordo Compu: resultado real con TTWO y escenarios, y meta que viene del armador de PC.
import { $, G, num, rates } from "./acceso.js";
import { setShare } from "./compartir.js";
import { DISCLAIMER, DISCLAIMER_SHORT, GOALS } from "./datos.js";
import { goalUsd, scenarioCards, simulate } from "./desafio-calculo.js";
import { renderWait } from "./espera.js";
import { ars, usd, usd0 } from "./formato.js";
import { renderSim } from "./simulador.js";
import { debounceTrack } from "./track.js";
let desafioText = "";
export function renderDesafio() {
  const g = G();
  if (!g || !g.quotes || !g.quotes.length) return;
  const r = rates();
  $("d-goal-custom").hidden = $("d-goal").value !== "custom";
  const goal = goalUsd(r);
  const lump = num("d-lump"), monthly = num("d-monthly");
  const start = $("d-start").value || "2026-06-25";
  const sim = simulate(lump, monthly, start);
  const goalTxt = goal.ccy === "ARS" ? (G()?.arsUsdMep ? G().arsUsdMep(goal.amount, goal.usd) : `${ars(goal.amount)} ≈ ${usd0(goal.usd)} (${G()?.mepStamp?.() || "MEP"})`) : usd0(goal.usd);
  if (!sim || !sim.put) {
    $("d-real").innerHTML = `<p class="muted">Cargá un monto inicial o un aporte mensual.</p>`;
    $("d-scen").innerHTML = ""; return;
  }
  const up = sim.value >= sim.put;
  $("d-real").innerHTML = `
    <div class="stat ${up ? "up" : "down"}"><div class="k">Resultado real con TTWO hasta hoy</div>
      <div class="v">${usd(sim.value)}</div>
      <div class="s">Pusiste ${usd(sim.put)} desde el ${g.dmy(start)}${monthly ? ` (${sim.n} aportes mensuales de ${usd(monthly)})` : ""} · ${up ? "+" : "−"}${g.fmtAR.format(Math.abs((sim.value / sim.put - 1) * 100))}% · meta ${goalTxt}: ${Math.round((sim.value / goal.usd) * 100) || 0}%</div></div>`;
  $("d-scen-lead").textContent = `Escenarios hipotéticos sobre lo que pusiste (${usd0(sim.put)}). Meta: ${goalTxt}.`;
  $("d-scen").innerHTML = scenarioCards(sim.put, goal.usd);
  desafioText = `Desafío Gordo Compu con TTWO: pongo ${usd0(sim.put)} para una meta de ${usd0(goal.usd)}. Si Take-Two duplica: ${usd0(sim.put * 2)}. Si cae 50%: ${usd0(sim.put * 0.5)}.`;
  setShare("d", `${desafioText} ${DISCLAIMER_SHORT}`, "#desafio", `${desafioText}\n\n${DISCLAIMER}`);
  debounceTrack("challenge_calc");
  renderWait();
}

export function setBuildGoal(label, amount, ccy) {
  GOALS.build = { label, amount, ccy };
  const sel = $("d-goal");
  if (!sel) return;
  let opt = sel.querySelector('option[value="build"]');
  if (!opt) {
    opt = document.createElement("option");
    opt.value = "build";
    const custom = sel.querySelector('option[value="custom"]');
    sel.insertBefore(opt, custom || null);
  }
  opt.textContent = label;
  sel.value = "build";
  $("d-goal-custom").hidden = true;
  renderDesafio();
  renderSim();
}
