// Secciones extra: La jodita (cost builder), Desafío Gordo Compu, Consola hoy vs esperar la PC, Encuesta.
// Precios: ver FUENTES.md (relevados 18/11/2026). Nada inventado: si no hay precio publicado, lo carga el usuario.

const $ = (id) => document.getElementById(id);
const INITIAL_QS = new URLSearchParams(location.search);
const API = "https://gta6-analytics.lcaitech.workers.dev";
const SITE = "https://gta6.lcaitech.com/";

// Consolas: precios de referencia en tiendas argentinas (ARS, IVA incluido), 18/11/2026 ~11:15 (hora Argentina).
const CONSOLES = {
  none: { label: "No compro consola", ars: 0 },
  "ps5-digital": { label: "PS5 Slim Digital (bundle Astro Bot + GT7)", ars: 1899999, src: "Frávega" },
  "ps5-standard": { label: "PS5 Slim Standard con lectora (bundle Astro Bot + GT7)", ars: 1999999, src: "Frávega" },
  "ps5-pro": { label: "PS5 Pro Digital", ars: 2859999, src: "Tienda oficial Sony en Frávega" },
  "xbox-s": { label: "Xbox Series S 512 GB", ars: 1294000, src: "Game Sense" },
  "xbox-x": { label: "Xbox Series X 1 TB", ars: 2386000, src: "Game Sense" },
  custom: { label: "Otra / la cargo yo", ars: null },
};
// Cuotas y precios por tienda, verificados el 18/11/2026 (hora Argentina) en páginas oficiales de cada tienda.
const D = "18/11/2026";
const OFFERS = {
  "ps5-digital": [
    { store: "Cetrogar", price: 1899999, url: "https://www.cetrogar.com.ar/consola-playstation-ps5-digital-bundle-gt7---astrobot-825gb-el3034/p",
      plans: [{ n: 18, cuota: 105555.5, si: true, cond: "Visa / Mastercard (CFT 0%)" }, { n: 12, cuota: 158333.25, si: true, cond: "Visa / Mastercard" }, { n: 6, cuota: 316666.5, si: true, cond: "Visa / Mastercard" }],
      note: "Naranja: 6/9/12/18 sin interés; Amex/Sol hasta 12; Cabal/Tuya hasta 9." },
    { store: "Frávega", price: 1899999, url: "https://www.fravega.com/promociones/bancarias",
      plans: [{ n: 6, cuota: 1899999 / 6, si: true, cond: "Banco Provincia, si aplica en el checkout" }] },
  ],
  "ps5-standard": [
    { store: "Frávega", price: 1999999, url: "https://www.fravega.com/promociones/bancarias",
      plans: [{ n: 6, cuota: 1999999 / 6, si: true, cond: "Banco Provincia, si aplica en el checkout" }] },
    { store: "Cetrogar", price: 2099999, url: "https://www.cetrogar.com.ar/consola-ps5-playstation-standard-bundle-gt7-astrobot-el3000/p",
      plans: [{ n: 18, cuota: 116666.61, si: true, cond: "Visa / Mastercard (CFT 0%)" }, { n: 12, cuota: 174999.91, si: true, cond: "Visa / Mastercard" }],
      note: "Naranja: 6/9/12/18 sin interés; Amex/Sol hasta 12; Cabal/Tuya hasta 9." },
  ],
  "ps5-pro": [
    { store: "Tienda oficial Sony en Frávega", price: 2859999, url: "https://www.fravega.com/l/videojuegos/consolas/?tipo-de-consola=ps5", plans: [], note: "Cuotas sin interés: no confirmadas." },
  ],
  "xbox-s": [
    { store: "Game Sense", price: 1294000, url: "https://gamesenseargentina.com/productos/consola-xbox-microsoft-series-s-de-512gb-digital-color-blanco/",
      cash: 1035200, transfer: 1164600,
      plans: [{ n: 6, cuota: 284981.93, si: false, cond: "Mercado Pago (total ARS 1.709.891,60)" }, { n: 12, cuota: 167562.22, si: false, cond: "Mercado Pago (total ARS 2.010.746,60)" }],
      note: "Con Mercado Pago solo 1 pago es sin interés." },
  ],
  "xbox-x": [
    { store: "Game Sense", price: 2386000, url: "https://gamesenseargentina.com/productos/xbox-series-x-standard-1tb/",
      cash: 1908800, transfer: 2147400,
      plans: [{ n: 6, cuota: 525476.73, si: false, cond: "Mercado Pago (total ARS 3.152.860,40)" }, { n: 12, cuota: 308967.12, si: false, cond: "Mercado Pago (total ARS 3.707.605,40)" }],
      note: "Con Mercado Pago solo 1 pago es sin interés." },
  ],
};
// Juego en caja (ARS, compra local, entra en cuotas de la tienda)
const BOXED = {
  ps: { label: "GTA VI PS5 caja con código (Frávega)", ars: 219999, url: "https://www.fravega.com/p/juego-ps5-grand-theft-auto-vi-formato-fisico-con-codigo-342114/" },
  xbox: { label: "GTA VI Xbox caja (Game Sense)", ars: 239999, url: "https://gamesenseargentina.com/" },
};

function bestOffer(key) {
  const offers = OFFERS[key] || [];
  let best = null;
  offers.forEach((o) => {
    const cashPrice = o.cash || o.price;
    if (!best || cashPrice < best.amount) best = { amount: cashPrice, how: o.cash ? `efectivo en ${o.store} (−20%)` : `precio de lista en ${o.store}`, offer: o };
  });
  const si = offers.flatMap((o) => o.plans.filter((p) => p.si).map((p) => ({ ...p, store: o.store, url: o.url, price: o.price }))).sort((a, b) => b.n - a.n)[0];
  return { best, si };
}

function cuotasHtml(key) {
  const offers = OFFERS[key];
  if (!CONSOLES[key] || !CONSOLES[key].ars) return "";
  if (!offers) return `<div class="cuotas-box pending"><strong>Cuotas:</strong> pendiente de verificar. Mirá las condiciones de tu banco.</div>`;
  const fmt = (n) => `ARS ${G().fmtAR.format(n)}`;
  return `<div class="cuotas-box"><strong>Precio y cuotas por tienda</strong> (${D}):<ul>${offers.map((o) => `<li><strong>${o.store}</strong>: ${fmt(o.price)}${o.cash ? ` · efectivo ${fmt(o.cash)} · transferencia ${fmt(o.transfer)}` : ""}${o.plans.length ? "<br>" + o.plans.map((p) => `${p.n} cuotas ${p.si ? "sin interés" : "con interés"} de <strong>${fmt(p.cuota)}</strong> <span class="fine-inline">(${p.cond})</span>`).join("<br>") : ""}${o.note ? `<br><span class="fine-inline">${o.note}</span>` : ""} · <a href="${o.url}" target="_blank" rel="noopener noreferrer">ver</a></li>`).join("")}</ul><span class="fine">Las condiciones cambian según banco, tarjeta y día. Confirmá en el checkout.</span></div>`;
}

// Metas del desafío (referencias, no requisitos). ARS = tiendas AR 18/11/2026; USD = precio sugerido de NVIDIA.
const GOALS = {
  "5060-ar": { label: "RTX 5060 8 GB · Venex · ARS 979.999 (18/11/2026)", amount: 979999, ccy: "ARS" },
  "5070-ar": { label: "RTX 5070 12 GB · FullH4rd · ARS 1.789.650 (18/11/2026)", amount: 1789650, ccy: "ARS" },
  "5060-msrp": { label: "RTX 5060 · precio sugerido NVIDIA US$ 299", amount: 299, ccy: "USD" },
  "5070-msrp": { label: "RTX 5070 · precio sugerido NVIDIA US$ 549", amount: 549, ccy: "USD" },
  custom: { label: "Mi PC / otra meta (la cargo yo)", amount: null, ccy: "USD" },
};
const SCEN = [
  { k: "x2", m: 2, label: "Si duplica (x2)" },
  { k: "+50", m: 1.5, label: "Si sube 50%" },
  { k: "+30", m: 1.3, label: "Si sube 30%" },
  { k: "0", m: 1, label: "Si queda igual" },
  { k: "-30", m: 0.7, label: "Si cae 30%" },
  { k: "-50", m: 0.5, label: "Si cae 50%" },
];
const DISCLAIMER = "Esto no es asesoramiento financiero ni una recomendación de inversión. No te estamos diciendo que metas tus ahorros acá para multiplicarlos. Es solo una herramienta para visualizar una apuesta chica a futuro: puede salir bien o puede salir mal. Si Take-Two sube, tu meta se acerca; si baja, perdés plata, punto. Nadie debería hacer esto si le da miedo o si no quiere arriesgar. El dinero que no estás dispuesto a perder, dejalo afuera. Los escenarios son hipotéticos, no una promesa ni un pronóstico.";
const DISCLAIMER_SHORT = "No es asesoramiento financiero: puede salir bien o mal. La plata que no estás dispuesto a perder, dejala afuera.";

const G = () => window.__gta;
const ars = (n) => `ARS ${Math.round(n).toLocaleString("es-AR")}`;
const moneyAR = (n) => `ARS ${G().fmtAR.format(n)}`;
const usd = (n) => `US$ ${G().fmtAR.format(n)}`;
const usd0 = (n) => `US$ ${Math.round(n).toLocaleString("es-AR")}`;
const num = (id) => Math.max(0, Number($(id).value) || 0);

function rates() {
  const g = G();
  return {
    oficial: g.fxVenta("oficial"),
    mep: g.fxVenta("bolsa"),
    fund: g.fxVenta($("fund-rate").value),
    iva: $("iva").checked ? 0.21 : 0,
    iibb: Math.max(0, Number($("iibb").value) || 0) / 100,
  };
}

// ---- cost per item, by type ----
// type "digital": foreign digital service (game, PS Plus, Game Pass). Bank card: oficial + IVA (+IIBB), no 30% (RG 5677/2025).
// type "local": bought in Argentina in pesos (hardware, tele). IVA already included; no foreign-card taxes.
function itemCosts(item, r) {
  const g = G();
  const bnCash = todayIso() <= g.BINANCE.cashbackUntil ? g.BINANCE.cashback : 0;
  const bxMul = 1 + g.BINGX.fee - g.BINGX.cashback;
  if (item.type === "digital") {
    const ivaHere = item.noIva ? 0 : r.iva;
    const usdBase = item.ccy === "USD" ? item.amount : item.amount / r.oficial;
    const bank = item.ccy === "USD" ? item.amount * r.oficial * (1 + ivaHere + r.iibb) : item.amount * (1 + ivaHere + r.iibb);
    const bingx = usdBase * bxMul * r.fund;
    const binance = usdBase * (1 + (g.binanceIva && !item.noIva ? 0.21 : 0) - bnCash) * r.fund;
    return { bank, bingx, binance };
  }
  // local ARS: the card network converts pesos to USD (we approximate at oficial), then you spend USDT bought at r.fund.
  const usdBase = item.amount / r.oficial;
  return { bank: item.amount, bingx: usdBase * bxMul * r.fund, binance: usdBase * (1 - bnCash) * r.fund };
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

function ttwoValue(amountUsd, dateIso) {
  const g = G();
  const qs = g.quotes;
  if (!qs || !qs.length || !amountUsd) return null;
  const entry = g.closeOnOrBefore(qs, dateIso);
  const live = g.latestQuote && typeof g.latestQuote.price === "number" ? g.latestQuote.price : qs[qs.length - 1].close;
  const value = (amountUsd / entry.close) * live;
  return { entry, live, value, pct: (value / amountUsd - 1) * 100 };
}

// ================= LA JODITA =================
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

let joditaResult = null;
function renderJodita() {
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
function bestCuotaFor(consoleKey) {
  if (!consoleKey || consoleKey === "none" || consoleKey === "custom") return null;
  const { si, best } = bestOffer(consoleKey);
  if (!si) return null;
  return { n: si.n, cuota: si.cuota, store: si.store, cond: si.cond, price: si.price, cash: best ? best.amount : si.price };
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

function convPrice(key) {
  const o = bestOffer(key);
  if (o && o.best) return { ars: o.best.amount, how: o.best.how };
  const c = CONSOLES[key];
  return c && c.ars ? { ars: c.ars, how: `precio de lista en ${c.src}` } : null;
}
function renderConviene() {
  const table = $("conv-table");
  if (!table) return;
  const slimD = convPrice("ps5-digital");
  const slimS = convPrice("ps5-standard");
  const pro = convPrice("ps5-pro");
  const xs = convPrice("xbox-s");
  const xx = convPrice("xbox-x");
  const slimPrice = slimD && slimS
    ? `Digital ${ars(slimD.ars)} <span class="tag">${slimD.how}</span>Standard ${ars(slimS.ars)} <span class="tag">${slimS.how}</span>`
    : "—";
  const rows = [
    {
      name: "PS5 Slim (Digital / Standard)",
      render: "1440p", out: "4K", up: "TAA espacial de Rockstar",
      fps: "30 fps (tirones a los 20 altos; peor caso, 20 bajos)",
      stab: "Sólida, un poco más floja que la Pro",
      price: slimPrice,
      verd: "Se ve y se juega bien; la imagen es más blanda que en la Pro y puede haber algún bajón.",
    },
    {
      name: "PS5 Pro",
      render: "1440p", out: "4K", up: "PSSR (upscaler de IA temporal)",
      fps: "30 fps (bajones cortos a 24 fps con lanzagranadas; recupera rápido)",
      stab: "La más firme (~75 h de prueba en 30, casi siempre)",
      price: pro ? `${ars(pro.ars)} <span class="tag">${pro.how}</span>` : "—",
      verd: "La mejor opción según DF: imagen tipo 4K, sombras con ray tracing y el 30 fps más estable.",
    },
    {
      name: "Xbox Series X",
      render: "1440p", out: "4K", up: "TAA espacial de Rockstar",
      fps: "30 fps (tirones a los 20 altos; peor caso, 20 bajos)",
      stab: "A la par de la PS5 Slim (el sistema permite un contenedor VRR a 120 Hz)",
      price: xx ? `${ars(xx.ars)} <span class="tag">${xx.how}</span>` : "—",
      verd: "Se ve y se juega bien, al nivel de la PS5 Slim; misma resolución y un upscaler espacial similar.",
    },
    {
      name: "Xbox Series S",
      render: "720p", out: "~1080p", up: "AMD FSR 4 (temporal)",
      fps: "A menudo 25–30 fps (peor caso ~20; con explosivos puede irse a los teens)",
      stab: "La menos estable de las cuatro: el 30 más flojo",
      price: xs ? `${ars(xs.ars)} <span class="tag">${xs.how}</span>` : "—",
      verd: "La más difícil de recomendar según DF: salida a 1080p, recortes visuales y bajones a los 20 medios.",
    },
    {
      name: "Xbox One (solo nube)",
      render: "720p (Series S, en el servidor)", out: "~1080p, comprimido por el stream", up: "FSR 4 en el servidor + compresión de la nube",
      fps: "El de Series S, vía Xbox Cloud Gaming (sin medición de DF al 18/11/2026)",
      stab: "Depende de tu conexión; no hay test publicado del stream",
      price: "— <span class=\"tag\">no hay versión nativa; usás la consola que ya tenés</span>",
      verd: "La única forma de jugarlo en One. Ajustes de Series S; Rockstar advierte que la conexión puede afectar el rendimiento. DF no midió el stream (nota del 10/11/2026).",
    },
    {
      name: "PC",
      render: "TBA", out: "TBA", up: "TBA",
      fps: "TBA",
      stab: "TBA",
      price: "— <span class=\"tag\">sin versión anunciada</span>",
      verd: "No hay fecha oficial. Lo de 2027 es rumor; no lo damos por hecho.",
    },
  ];
  table.innerHTML = `<thead><tr><th>Plataforma</th><th>Render / salida</th><th>Upscaler</th><th>FPS</th><th>Estabilidad</th><th class="n">Precio ARS hoy</th><th>Veredicto</th></tr></thead><tbody>` +
    rows.map((row) => `<tr>
      <th scope="row">${row.name}</th>
      <td data-label="Render / salida">${row.render} → ${row.out}</td>
      <td data-label="Upscaler">${row.up}</td>
      <td data-label="FPS">${row.fps}</td>
      <td data-label="Estabilidad">${row.stab}</td>
      <td class="n" data-label="Precio ARS hoy">${row.price}</td>
      <td data-label="Veredicto">${row.verd}</td>
    </tr>`).join("") + `</tbody>`;
}

function syncConsolePrice(force) {
  const c = $("j-console").value;
  const inp = $("j-console-price");
  const info = CONSOLES[c];
  $("j-console-row").hidden = c === "none";
  if (info.ars != null && (force || !inp.dataset.edited)) { inp.value = info.ars; inp.dataset.edited = ""; }
  if (c === "custom" && force) { inp.value = ""; inp.dataset.edited = "1"; }
  $("j-console-hint").innerHTML = info.ars
    ? `Referencia: ${ars(info.ars)} en ${info.src} (18/11/2026, IVA incluido). Editalo si conseguiste otro precio.`
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

function syncJMembMonths() {
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

// ================= DESAFÍO GORDO COMPU =================
function goalUsd(r) {
  const k = $("d-goal").value;
  const gdef = GOALS[k];
  const amount = k === "custom" ? num("d-goal-amount") : gdef.amount;
  const ccy = k === "custom" ? $("d-goal-ccy").value : gdef.ccy;
  return { usd: ccy === "ARS" ? amount / r.mep : amount, amount, ccy };
}

function simulate(lump, monthly, startIso) {
  const g = G();
  const qs = g.quotes;
  if (!qs || !qs.length) return null;
  const last = qs[qs.length - 1].date;
  const live = g.latestQuote && typeof g.latestQuote.price === "number" ? g.latestQuote.price : qs[qs.length - 1].close;
  let units = 0, put = 0, n = 0;
  const start = new Date(startIso + "T12:00:00Z");
  if (lump) { const e = g.closeOnOrBefore(qs, startIso); units += lump / e.close; put += lump; }
  if (monthly) {
    for (let k = lump ? 1 : 0; k < 240; k++) {
      const d = new Date(start); d.setUTCMonth(d.getUTCMonth() + k);
      const iso = d.toISOString().slice(0, 10);
      if (iso > last) break;
      const e = g.closeOnOrBefore(qs, iso); units += monthly / e.close; put += monthly; n++;
    }
  }
  return { put, value: units * live, n };
}

function scenarioCards(base, goal) {
  return SCEN.map((s) => {
    const v = base * s.m;
    const reach = goal ? (v / goal) * 100 : 0;
    const cls = s.m > 1 ? "up" : s.m < 1 ? "down" : "flat";
    return `<div class="scen ${cls}"><div class="k">${s.label}</div><div class="v">${usd0(v)}</div><div class="s">${goal ? (v >= goal ? "Llegás a la meta" : `${Math.round(reach)}% de la meta · faltan ${usd0(goal - v)}`) : ""}</div></div>`;
  }).join("");
}

let desafioText = "";
function renderDesafio() {
  const g = G();
  if (!g || !g.quotes || !g.quotes.length) return;
  const r = rates();
  $("d-goal-custom").hidden = $("d-goal").value !== "custom";
  const goal = goalUsd(r);
  const lump = num("d-lump"), monthly = num("d-monthly");
  const start = $("d-start").value || "2026-06-25";
  const sim = simulate(lump, monthly, start);
  const goalTxt = goal.ccy === "ARS" ? `${ars(goal.amount)} (≈ ${usd0(goal.usd)} al MEP)` : usd0(goal.usd);
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

// ================= CONSOLA HOY VS ESPERAR =================
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
    <p class="warn">Precio de hoy (${D}) como referencia: puede cambiar para el 27–30/11. No inventamos descuentos de Black Friday; si aparece una oferta real, cargala en La jodita. El juego digital no tiene cuotas (PS Store cobra un pago en USD + IVA; Game Pass es mensual).</p>`;
  $("w-scen-lead").textContent = "";
  $("w-scen").innerHTML = "";
}

function renderWait() {
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

// ================= ENCUESTA =================
const POLL = "pc-o-consola";
const POLL_OPTS = [
  ["consola", "Ya compré consola para esto exclusivo"],
  ["pc", "Espero el de PC"],
  ["acciones", "Compro acciones de Take-Two mientras jaja"],
  ["ambas", "Ambas cosas"],
  ["tengo-todo", "Tengo consola y PC lista"],
];
function pollRoots() { return [...document.querySelectorAll("[data-poll-root]")]; }
function setPollStatus(msg) {
  document.querySelectorAll(".poll-status").forEach((el) => { el.textContent = msg; });
}
function renderPollButtons() {
  const voted = localStorage.getItem("gta6-poll-" + POLL);
  const html = POLL_OPTS.map(([k, l]) => `<button type="button" class="poll-btn${voted === k ? " chosen" : ""}" data-opt="${k}"${voted ? " disabled" : ""}>${l}</button>`).join("");
  pollRoots().forEach((root) => {
    const opts = root.querySelector(".poll-options");
    if (opts) opts.innerHTML = html;
  });
}
let pollFirstPaint = true;
function renderPollResults(d) {
  const voted = localStorage.getItem("gta6-poll-" + POLL);
  const total = d.total || 0;
  const rows = POLL_OPTS.map(([k, l]) => {
    const n = (d.counts && d.counts[k]) || 0; const pct = total ? Math.round((n / total) * 100) : 0;
    return `<div class="poll-row${voted === k ? " mine" : ""}"><div class="poll-label"><span>${l}${voted === k ? " · tu voto" : ""}</span><span>${pct}% (${n})</span></div><div class="poll-bar"><div data-pct="${pct}" style="width:${pollFirstPaint ? 0 : pct}%"></div></div></div>`;
  }).join("") + `<p class="muted">${total} voto${total === 1 ? "" : "s"} en total. Un voto por navegador; no guardamos datos personales.</p>`;
  pollRoots().forEach((root) => {
    const box = root.querySelector(".poll-results");
    if (!box) return;
    box.innerHTML = rows;
    box.hidden = false;
  });
  const grow = () => document.querySelectorAll(".poll-bar div[data-pct]").forEach((el) => { el.style.width = el.dataset.pct + "%"; });
  if (pollFirstPaint) {
    pollFirstPaint = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (motion) grow();
    else requestAnimationFrame(() => requestAnimationFrame(grow));
  }
}
async function loadPollResults() {
  try {
    const res = await fetch(`${API}/poll/results?poll=${POLL}`, { cache: "no-store" });
    if (res.ok) renderPollResults(await res.json());
  } catch { /* offline */ }
}
function startPollLive() {
  loadPollResults();
  if (startPollLive.timer) return;
  startPollLive.timer = setInterval(() => {
    if (document.visibilityState === "visible") loadPollResults();
  }, 30000);
}
async function vote(opt) {
  if (localStorage.getItem("gta6-poll-" + POLL)) return;
  setPollStatus("Enviando…");
  try {
    const res = await fetch(`${API}/poll`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ poll: POLL, option: opt }) });
    if (!res.ok) throw new Error(res.status);
    localStorage.setItem("gta6-poll-" + POLL, opt);
    G().track("poll_vote");
    setPollStatus("¡Gracias por votar!");
    renderPollButtons();
    renderPollResults(await res.json());
  } catch (e) {
    setPollStatus("No se pudo registrar el voto. Probá de nuevo en un rato.");
  }
}

function setBuildGoal(label, amount, ccy) {
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
window.__gtaSetBuildGoal = setBuildGoal;

// ================= SHARE + URL STATE =================
function setShare(prefix, text, anchor, longText) {
  const url = SITE + location.search + anchor;
  $(`${prefix}-share-x`).href = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  $(`${prefix}-share-wa`).href = `https://wa.me/?text=${encodeURIComponent((longText || text) + " " + url)}`;
  $(`${prefix}-share-copy`).dataset.url = url;
}

const XKEYS = {
  "j-console": "jc", "j-console-price": "jp", "j-game": "jg", "j-game-format": "jf", "j-upgrade": "ju", "j-upgrade-price": "jup", "j-upgrade-ccy": "juc",
  "j-memb": "jm", "j-memb-plan": "jmp", "j-memb-months": "jmm", "j-tv": "jt", "j-other": "jo",
  "w-mode": "wm", "d-goal": "pg", "d-goal-amount": "pa", "d-goal-ccy": "pc", "d-lump": "pl", "d-monthly": "pmo", "d-start": "pd", "w-pcdate": "wd",
};
let XDEF = null;
const val = (el) => (el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value);
function extraState(q) {
  if (!XDEF) return;
  Object.entries(XKEYS).forEach(([id, k]) => {
    const el = $(id); if (!el) return;
    if (id === "j-console-price" && !el.dataset.edited) return;
    if (id === "j-upgrade-price" && !el.dataset.edited) return;
    const v = val(el);
    if (v !== XDEF[id]) q.set(k, v);
  });
}
function restoreExtras() {
  Object.entries(XKEYS).forEach(([id, k]) => {
    const el = $(id); if (!el || !INITIAL_QS.has(k)) return;
    const v = INITIAL_QS.get(k).slice(0, 32);
    if (el.type === "checkbox") el.checked = v === "1";
    else if (el.tagName === "SELECT") { if ([...el.options].some((o) => o.value === v)) el.value = v; }
    else el.value = v;
    if (id === "j-console-price" || id === "j-upgrade-price") el.dataset.edited = "1";
  });
}

const tTimers = {};
function debounceTrack(name) {
  clearTimeout(tTimers[name]);
  tTimers[name] = setTimeout(() => G().track(name), 3000);
}

function renderAll() {
  renderJodita();
  renderDesafio();
  renderWait();
  G().refreshUrl();
}

function init() {
  const g = G();
  if (!g) return setTimeout(init, 50);
  $("j-console").innerHTML = Object.entries(CONSOLES).map(([k, c]) => `<option value="${k}">${c.label}${c.ars ? ` · ${ars(c.ars)}` : ""}</option>`).join("");
  $("j-console").value = "ps5-digital";
  $("d-goal").innerHTML = Object.entries(GOALS).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
  $("d-goal").value = "5070-msrp";
  $("j-memb-plan").innerHTML = Object.entries(g.MEMBERSHIPS).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join("");
  syncConsolePrice(true);
  syncJMembMonths();
  XDEF = Object.fromEntries(Object.keys(XKEYS).map((id) => [id, val($(id))]));
  restoreExtras();
  syncConsolePrice(false);
  if (INITIAL_QS.has("jmm")) { syncJMembMonths(); $("j-memb-months").value = INITIAL_QS.get("jmm"); }
  else syncJMembMonths();
  $("j-memb-fields").hidden = !$("j-memb").checked;
  $("j-upgrade-fields").hidden = !$("j-upgrade").checked;
  $("d-disclaimer").textContent = DISCLAIMER;
  $("w-disclaimer").textContent = DISCLAIMER_SHORT + " Los escenarios son hipotéticos.";
  window.__gtaExtraState = extraState;

  $("j-console").addEventListener("change", () => { syncConsolePrice(true); renderAll(); });
  $("j-console-price").addEventListener("input", (e) => { e.target.dataset.edited = "1"; renderAll(); });
  $("j-upgrade-price").addEventListener("input", (e) => { e.target.dataset.edited = "1"; renderAll(); });
  $("j-upgrade").addEventListener("change", () => { $("j-upgrade-fields").hidden = !$("j-upgrade").checked; renderAll(); });
  $("j-memb").addEventListener("change", () => { $("j-memb-fields").hidden = !$("j-memb").checked; renderAll(); });
  $("j-memb-plan").addEventListener("change", () => { syncJMembMonths(); renderAll(); });
  $("j-gp-iva").addEventListener("change", (e) => g.setGpIva(e.target.checked));
  ["j-game", "j-game-format", "j-upgrade-ccy", "j-memb-months", "j-tv", "j-other", "d-goal", "d-goal-amount", "d-goal-ccy", "d-lump", "d-monthly", "d-start", "w-pcdate", "w-mode"]
    .forEach((id) => $(id).addEventListener("input", renderAll));
  ["j", "d"].forEach((p) => {
    const name = p === "j" ? "jodita" : "challenge";
    $(`${p}-share-x`).addEventListener("click", () => g.track(`share_${name}_x`));
    $(`${p}-share-wa`).addEventListener("click", () => g.track(`share_${name}_whatsapp`));
    $(`${p}-share-copy`).addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(e.target.dataset.url); g.toast("Link copiado"); } catch { g.toast("No se pudo copiar el link"); }
      g.track(`share_${name}_copy`);
    });
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-poll-root] .poll-btn");
    if (b) vote(b.dataset.opt);
  });
  renderPollButtons();
  startPollLive();

  g.listeners.push(() => { renderJodita(); renderDesafio(); renderWait(); renderConviene(); });
  const waitQuotes = () => (g.quotes && g.quotes.length ? (($("d-start").min = g.quotes[0].date), ($("d-start").max = g.quotes[g.quotes.length - 1].date), renderAll()) : setTimeout(waitQuotes, 100));
  waitQuotes();
}
init();


// ================= SIMULADOR DE PROYECCIÓN =================
let simMonths = 6;
let simInitDone = false;
function livePrice() {
  const g = G();
  if (g.latestQuote && typeof g.latestQuote.price === "number") return g.latestQuote.price;
  return g.quotes && g.quotes.length ? g.quotes[g.quotes.length - 1].close : 0;
}
function renderSim() {
  const g = G();
  if (!g || !g.model || !g.quotes || !g.quotes.length) return;
  const live = livePrice();
  if (!simInitDone) {
    $("s-initial").value = (g.model.listUsd || 99.99).toFixed(2);
    $("s-target").value = live.toFixed(2);
    simInitDone = true;
  }
  const r = rates();
  const initial = num("s-initial"), monthly = num("s-monthly");
  const target = Math.max(0.01, Number($("s-target").value) || live);
  const H = simMonths;
  let shares = live ? initial / live : 0;
  for (let k = 1; k <= H; k++) {
    const p = live + ((target - live) * k) / H;
    shares += monthly / p;
  }
  const put = initial + monthly * H;
  const value = shares * target;
  const diff = value - put;
  const pct = put ? (diff / put) * 100 : 0;
  const up = diff >= 0;
  const goal = goalUsd(r).usd;
  const pctTarget = live ? (target / live - 1) * 100 : 0;
  $("s-slider-val").textContent = `${pctTarget >= 0 ? "+" : "−"}${Math.abs(Math.round(pctTarget))}% (US$ ${g.fmtAR.format(target)})`;
  const end = new Date(($("s-start").value || "2026-11-18") + "T12:00:00Z"); end.setUTCMonth(end.getUTCMonth() + H);
  $("s-out").innerHTML = `
    <div class="sim-cell"><span>Total aportado</span><strong>${usd(put)}</strong></div>
    <div class="sim-cell"><span>Acciones</span><strong>${g.fmtAR.format(shares)}</strong></div>
    <div class="sim-cell ${up ? "up" : "down"}"><span>Valor al ${g.dmy(end.toISOString().slice(0, 10))}</span><strong>${usd(value)}</strong><em>${ars(value * r.mep)}</em></div>
    <div class="sim-cell ${up ? "up" : "down"}"><span>${up ? "Ganancia" : "Pérdida"}</span><strong>${up ? "+" : "−"}${usd(Math.abs(diff)).replace("US$ ", "US$ ")}</strong><em>${up ? "+" : "−"}${g.fmtAR.format(Math.abs(pct))}%</em></div>
    <div class="sim-goal ${value >= goal ? "up" : "down"}">${value >= goal ? `Llegás a la meta de ${usd0(goal)}` : `Te faltan ${usd0(goal - value)} para la meta de ${usd0(goal)} (${Math.round((value / goal) * 100)}%)`}</div>`;
  debounceTrack("projection_calc");
}
function initSim() {
  ["s-initial", "s-monthly", "s-start"].forEach((id) => $(id).addEventListener("input", renderSim));
  $("s-target").addEventListener("input", () => {
    const live = livePrice();
    const pct = live ? (Number($("s-target").value) / live - 1) * 100 : 0;
    $("s-slider").value = String(Math.max(-50, Math.min(100, Math.round(pct / 5) * 5)));
    renderSim();
  });
  $("s-slider").addEventListener("input", () => {
    $("s-target").value = (livePrice() * (1 + Number($("s-slider").value) / 100)).toFixed(2);
    renderSim();
  });
  $("s-horizon").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]"); if (!b) return;
    simMonths = Number(b.dataset.m);
    $("s-horizon").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    renderSim();
  });
  $("sim").addEventListener("toggle", () => { if ($("sim").open) renderSim(); });
  G().listeners.push(renderSim);
  renderSim();
}
const waitSim = () => (G() && G().quotes && G().quotes.length && G().model ? initSim() : setTimeout(waitSim, 150));
waitSim();
