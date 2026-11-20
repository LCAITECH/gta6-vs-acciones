// Datos y textos para compartir el resultado.
import { $, dmy, fmtAR, money } from "./base.js";
import { estado } from "./estado.js";
export const SITE_URL = "https://gta6.lcaitech.com/";

export function shareUrl() {
  return SITE_URL + location.search;
}

export function shareFacts() {
  const m = estado.lastModel;
  if (!m) return null;
  const ed = { standard: "Estándar", ultimate: "Ultimate", "xbox-upgrade": "mejora a Ultimate" }[$("edition").value] || "";
  const hasDlc = m.dlcUsd > 0;
  const what = `GTA VI ${ed}${hasDlc ? " + DLC" : ""}`;
  const paid = m.listCcy === "ARS"
    ? `ARS ${Math.round(m.listArs + m.dlcUsd * m.fxBuy).toLocaleString("es-AR")}`
    : `US$ ${fmtAR.format(m.listUsd + m.dlcUsd)}`;
  const withTax = `US$ ${fmtAR.format(m.spendUsd)}`;
  const pack = (valueUsd, missing) => {
    if (missing || valueUsd == null) return null;
    const diff = valueUsd - m.spendUsd;
    const pct = m.spendUsd ? (diff / m.spendUsd) * 100 : 0;
    const up = pct >= 0;
    return {
      up,
      pct,
      pctTxt: `${up ? "+" : "−"}${fmtAR.format(Math.abs(pct)).replace(/,00$/, "")}%`,
      valTxt: `US$ ${Math.round(valueUsd).toLocaleString("es-AR")}`,
      glTxt: `${up ? "ganarías" : "perderías"} US$ ${fmtAR.format(Math.abs(diff))}`,
    };
  };
  const ttwo = pack(m.valueNowUsd, m.ttwoMissing);
  const btc = pack(m.btcValueNowUsd, m.btcMissing);
  const mode = m.asset || "ttwo";
  const primary = mode === "btc" ? btc : ttwo;
  const c = estado.lastCompare;
  const saveTxt = c && c.save > 0 ? `Pagándolo con la ${c.best.name} me ahorraba ${money(c.save, "ARS")} frente a la tarjeta del banco` : "";
  return {
    what, paid, withTax, saveTxt, date: dmy((m.entry && m.entry.date) || $("purchase-date").value),
    mode, ttwo, btc,
    pct: primary ? primary.pct : 0,
    up: primary ? primary.up : true,
    pctTxt: primary ? primary.pctTxt : "—",
    valTxt: primary ? primary.valTxt : "—",
    glTxt: primary ? primary.glTxt : "",
  };
}

export function shareText() {
  const f = shareFacts();
  if (!f) return "";
  let mid;
  if (f.mode === "both") {
    const t = f.ttwo ? `en TTWO hoy valdrían ${f.ttwo.valTxt} (${f.ttwo.pctTxt})` : "en TTWO no hay dato";
    const b = f.btc ? `en BTC, ${f.btc.valTxt} (${f.btc.pctTxt})` : "en BTC no hay dato";
    mid = `Si hubiera puesto esa plata ${t}. ${b[0].toUpperCase()}${b.slice(1)}.`;
  } else if (f.mode === "btc" && f.btc) {
    mid = `Si hubiera comprado bitcoin (BTC), hoy valdrían ${f.btc.valTxt} (${f.btc.pctTxt}).`;
  } else {
    mid = `Si hubiera comprado acciones de Take-Two (TTWO), hoy valdrían ${f.valTxt} (${f.pctTxt}).`;
  }
  return `Compré ${f.what} por ${f.paid}. ${mid}${f.saveTxt ? " " + f.saveTxt + "." : ""} Calculá el tuyo:`;
}
