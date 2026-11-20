// La jodita: arma el costo de consola, juego, membresía y extras con cada medio de pago, y los escenarios de compra.
// ================= LA JODITA =================
import { $, G, num, rates } from "./acceso.js";
import { setShare } from "./compartir.js";
import { itemCosts, ttwoValue } from "./costos.js";
import { BOXED, CONSOLES, DISCLAIMER_SHORT, precios } from "./datos.js";
import { ars, dayOf, moneyAR, usd, usd0 } from "./formato.js";
import { bestCuotaFor, cuotasHtml } from "./ofertas.js";
import { debounceTrack } from "./track.js";
function joditaItems() {
  const g = G();
  const m = g.model;
  const items = [];
  const c = $("j-console").value;
  if (c !== "none") {
    const a = num("j-console-price");
    if (a) items.push({ key: "consola", label: c === "custom" ? "Consola" : CONSOLES[c].label, type: "local", ccy: "ARS", amount: a });
  }
  if ($("j-game").checked && m && $("j-game-format").value === "box") {
    const bx = BOXED[$("store").value === "xbox" ? "xbox" : "ps"];
    items.push({ key: "juego", label: bx.label, type: "local", ccy: "ARS", amount: bx.ars });
  } else if ($("j-game").checked && m) {
    const extrasUsd = m.dlcUsd + m.plusUsd;
    if (m.listCcy === "ARS") items.push({ key: "juego", label: `GTA VI (${$("edition").selectedOptions[0].text})${extrasUsd ? " + extras" : ""}`, type: "digital", ccy: "ARS", amount: m.listArs + extrasUsd * rates().oficial });
    else items.push({ key: "juego", label: `GTA VI (${$("edition").selectedOptions[0].text})${extrasUsd ? " + extras" : ""}`, type: "digital", ccy: "USD", amount: m.listUsd + extrasUsd });
  }
  if ($("j-upgrade").checked && $("edition").value === "standard") {
    const a = num("j-upgrade-price");
    if (a) items.push({ key: "upgrade", label: "Upgrade a Ultimate", type: "digital", ccy: $("j-upgrade-ccy").value, amount: a });
  }
  if ($("j-memb").checked) {
    const mc = g.membershipCost($("j-memb-plan").value, Number($("j-memb-months").value));
    if (mc) items.push({ key: "membresia", label: mc.label, type: "digital", ccy: mc.ccy, amount: mc.amount, noIva: mc.ccy === "ARS" && !g.gpIva });
  }
  const tv = num("j-tv");
  if (tv) items.push({ key: "tele", label: "La tele", type: "local", ccy: "ARS", amount: tv });
  const ot = num("j-other");
  if (ot) items.push({ key: "otros", label: "Otros (joystick, auris…)", type: "local", ccy: "ARS", amount: ot });
  return items;
}

export let joditaResult = null;
export function renderJodita() {
  const g = G();
  if (!g || !g.model) return;
  const r = rates();
  syncUpgradeDefaults();
  const items = joditaItems();
  let bank = 0, bx = 0, bn = 0, bxMix = 0, bnMix = 0;
  const rows = items.map((it) => {
    const c = itemCosts(it, r);
    bank += c.bank; bx += c.bingx; bn += c.binance;
    bxMix += Math.min(c.bank, c.bingx); bnMix += Math.min(c.bank, c.binance);
    const best = Math.min(c.bank, c.bingx, c.binance);
    const cell = (v) => `<td class="n${v === best ? " best-cell" : ""}">${ars(v)}</td>`;
    return `<tr><td>${it.label}<span class="tag ${it.type}">${it.type === "digital" ? "digital (exterior)" : "compra local en pesos"}</span></td>${cell(c.bank)}${cell(c.bingx)}${cell(c.binance)}</tr>`;
  });
  const saveBx = bank - bxMix, saveBn = bank - bnMix;
  const best = saveBn >= saveBx ? { name: "Binance Card", save: saveBn, mix: bnMix } : { name: "BingX Card", save: saveBx, mix: bxMix };
  joditaResult = { bank, best, items: items.length };
  $("j-table").innerHTML = items.length
    ? `<thead><tr><th>Ítem</th><th class="n">Tarjeta del banco</th><th class="n">BingX Card</th><th class="n">Binance Card</th></tr></thead><tbody>${rows.join("")}</tbody>
       <tfoot><tr><th>Total (todo con la misma tarjeta)</th><th class="n">${ars(bank)}</th><th class="n">${ars(bx)}</th><th class="n">${ars(bn)}</th></tr></tfoot>`
    : `<tbody><tr><td class="muted">Elegí al menos un ítem.</td></tr></tbody>`;
  $("j-total").innerHTML = items.length ? `La jodita completa con tarjeta del banco: <strong>${ars(bank)}</strong> ≈ <strong>${usd0(bank / r.mep)}</strong> (al dólar MEP ${g.fmtAR.format(r.mep)}).` : "";

  const date = $("purchase-date").value || "2026-06-25";
  if (best.save > 0) {
    const saveUsd = best.save / r.mep;
    const tv = ttwoValue(saveUsd, date);
    const up = tv && tv.pct >= 0;
    $("j-savings").innerHTML = `
      <div class="savings-box"><div class="savings-inner">
        <div class="k">Ahorro usando la ${best.name} donde conviene</div>
        <div class="big">${ars(best.save)}</div>
        <div class="sub">≈ ${usd(saveUsd)} · total ${ars(best.mix)} en vez de ${ars(bank)}</div>
        ${tv ? `<div class="ttwo-line">Si ese ahorro lo ponés en Take-Two… comprando el ${g.dmy(tv.entry.date)} hoy valdría <strong class="${up ? "up" : "down"}">${usd(tv.value)}</strong> (${up ? "+" : "−"}${g.fmtAR.format(Math.abs(tv.pct))}%). ${up ? "Te pagaste un par de birras con el ahorro." : "Ojo: hoy valdría menos de lo que ahorraste."}</div>` : ""}
        <div class="fine">Usamos la tarjeta cripto solo en los ítems donde sale más barata que la del banco. ${DISCLAIMER_SHORT}</div>
      </div></div>`;
  } else {
    $("j-savings").innerHTML = items.length ? `<p class="warn">Con estos ítems, la tarjeta cripto no te ahorra nada frente a la del banco.</p>` : "";
  }
  const hasLocal = items.some((i) => i.type === "local");
  $("j-note").textContent = hasLocal
    ? "Compras locales (consola, tele, otros): el precio en pesos ya trae IVA y no paga impuestos de compra en el exterior. Con una tarjeta cripto pagás en dólares de cripto (más caros que el oficial), así que en general conviene la del banco, y además ahí tenés cuotas. Para la conversión de la red de la tarjeta usamos el dólar oficial como aproximación. El ahorro fuerte está en lo digital del exterior (juego, membresías): ahí la tarjeta del banco suma IVA."
    : "Compras digitales del exterior: con la tarjeta del banco se suma IVA 21% (y sin el 30%, porque PSN, Microsoft y Rockstar están excluidas por la RG 5677/2025).";
  const text = best.save > 0
    ? `La jodita del GTA VI me sale ${ars(bank)} con la tarjeta del banco. Usando la ${best.name} donde conviene me ahorro ${ars(best.save)}. Calculá la tuya:`
    : `La jodita del GTA VI me sale ${ars(bank)}. Calculá la tuya:`;
  setShare("j", text, "#jodita");
  renderScenarios(items, r);
  debounceTrack("cost_builder_calc");
}


function localCash(it) {
  return it.type === "local" ? it.amount : 0;
}
function digitalLine(items, r) {
  const dig = items.filter((i) => i.type === "digital");
  if (!dig.length) return "No hay ítems digitales en este combo (PS Store / Game Pass / PS Plus).";
  const parts = dig.map((i) => {
    if (i.ccy === "USD") return `${i.label}: ${usd(i.amount)} + IVA, un solo pago`;
    return `${i.label}: ${ars(i.amount)}${i.noIva ? "" : " + IVA (si aplica)"}, un solo pago`;
  });
  return "Lo digital (sin cuotas): " + parts.join(" · ") + ".";
}

function scenarioCard(title, localItems, cuota, active) {
  const cash = localItems.reduce((s, i) => s + i.amount, 0);
  let cuotaHtml = "<span class=\"muted\">Sin cuotas sin interés verificadas para estos ítems.</span>";
  if (cuota && localItems.some((i) => i.key === "consola")) {
    const rest = localItems.filter((i) => i.key !== "consola").reduce((s, i) => s + i.amount, 0);
    cuotaHtml = `<strong>${cuota.n} × ${moneyAR(cuota.cuota)}</strong> <span class="fine-inline">${cuota.store}, ${cuota.cond}${cuota.price && cuota.cash && cuota.price !== cuota.cash ? ` · sobre ${moneyAR(cuota.price)}` : ""}</span>` +
      (rest ? `<br><span class="fine-inline">El resto al contado: ${ars(rest)} (sin cuotas verificadas).</span>` : "");
  } else if (!localItems.length) {
    cuotaHtml = "<span class=\"muted\">No hay compras locales en este escenario.</span>";
  }
  const list = localItems.length ? localItems.map((i) => `${i.label}: ${ars(i.amount)}`).join(" · ") : "Sin ítems locales";
  return `<article class="scen-card${active ? " on" : ""}"><h4>${title}</h4><p class="scen-cash">${cash ? ars(cash) : "—" } <span>contado</span></p><p class="fine-inline">${list}</p><p class="scen-cuotas">${cuotaHtml}</p></article>`;
}
function renderScenarios(items, r) {
  const grid = $("j-scen-grid");
  if (!grid) return;
  const cKey = $("j-console").value;
  const cuota = bestCuotaFor(cKey);
  const hasConsole = items.some((i) => i.key === "consola");
  const hasTv = items.some((i) => i.key === "tele");
  const baseLocal = items.filter((i) => i.type === "local" && i.key !== "consola" && i.key !== "tele");
  const consola = items.find((i) => i.key === "consola");
  const tele = items.find((i) => i.key === "tele");
  const variants = [];
  const add = (title, extra, on) => variants.push(scenarioCard(title, baseLocal.concat(extra), cuota, on));
  if (hasConsole && hasTv) {
    add("Con consola y tele", [consola, tele], true);
    add("Con consola, sin tele", [consola], false);
    add("Sin consola, con tele", [tele], false);
    add("Sin consola ni tele", [], false);
  } else if (hasConsole) {
    add("Con consola", [consola], true);
    add("Sin consola", [], false);
  } else if (hasTv) {
    add("Con tele (sin consola)", [tele], true);
    add("Sin tele ni consola", [], false);
  } else {
    add("Sin consola ni tele", [], true);
  }
  grid.innerHTML = variants.join("");
  $("j-scen-digital").textContent = digitalLine(items, r);
  const activeLocal = items.filter((i) => i.type === "local");
  const cash = activeLocal.reduce((s, i) => s + i.amount, 0);
  let resumen = "";
  if (!cash && !items.some((i) => i.type === "digital")) resumen = "Elegí al menos un ítem para ver el resumen.";
  else if (!cash) resumen = `En este combo no hay compras locales en pesos. ${digitalLine(items, r)}`;
  else if (cuota && hasConsole) {
    const rest = activeLocal.filter((i) => i.key !== "consola").reduce((s, i) => s + i.amount, 0);
    resumen = rest
      ? `Te sale ${ars(cash)} en efectivo, o ${cuota.n} cuotas de ${moneyAR(cuota.cuota)} con ${cuota.store} (${cuota.cond}) por la consola y ${ars(rest)} al contado del resto.`
      : `Te sale ${ars(cash)} en efectivo o ${cuota.n} cuotas de ${moneyAR(cuota.cuota)} con ${cuota.store} (${cuota.cond}).`;
  } else {
    resumen = `Te sale ${ars(cash)} en efectivo. No hay cuotas sin interés verificadas para estos ítems locales.`;
  }
  $("j-scen-resumen").textContent = resumen;
}

export function syncConsolePrice(force) {
  const c = $("j-console").value;
  const inp = $("j-console-price");
  const info = CONSOLES[c];
  $("j-console-row").hidden = c === "none";
  if (info.ars != null && (force || !inp.dataset.edited)) { inp.value = info.ars; inp.dataset.edited = ""; }
  if (c === "custom" && force) { inp.value = ""; inp.dataset.edited = "1"; }
  $("j-console-hint").innerHTML = info.ars
    ? `Referencia: ${ars(info.ars)} en ${info.src} (${info.fetched ? dayOf(info.fetched) : precios.fecha}${info.stale ? ", último verificado" : ""}, IVA incluido). Editalo si conseguiste otro precio.`
    : c === "custom" ? "Cargá el precio que pagaste o encontraste." : "";
  $("j-cuotas").innerHTML = cuotasHtml(c);
}

function syncUpgradeDefaults() {
  const store = $("store").value;
  const inp = $("j-upgrade-price");
  if ($("edition").value !== "standard") {
    $("j-upgrade-hint").textContent = "Arriba elegiste otra edición que no es la Estándar: el upgrade no se suma.";
    return;
  }
  if (inp.dataset.edited) return;
  if (store === "xbox") {
    inp.value = G().PRICES["xbox-upgrade"].xboxArs; $("j-upgrade-ccy").value = "ARS";
    $("j-upgrade-hint").textContent = "Xbox Store AR: ARS 28.691 (sin impuestos). Editable.";
  } else {
    inp.value = ""; $("j-upgrade-ccy").value = "USD";
    $("j-upgrade-hint").textContent = "En PlayStation Store AR la mejora figura como no disponible: si existe para vos, cargá el precio.";
  }
}

export function syncJMembMonths() {
  const plan = $("j-memb-plan").value;
  const sel = $("j-memb-months");
  const ps = G().MEMBERSHIPS[plan].ccy === "USD";
  const opts = ps ? [1, 3, 12] : [1, 2, 3, 6, 12];
  const cur = Number(sel.value) || 12;
  sel.innerHTML = opts.map((n) => `<option value="${n}">${n} ${n === 1 ? "mes" : "meses"}</option>`).join("");
  sel.value = opts.includes(cur) ? String(cur) : String(opts[0]);
  $("j-gp-iva-row").hidden = ps;
  $("j-gp-iva").checked = G().gpIva;
}
