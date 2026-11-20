// Precios oficiales, membresías y datos de las tarjetas cripto (BingX y Binance).
export const BINGX_URL =
  "https://bingx.com/act/general/1998331776/?ref=NZP9WN&source=agent_partner&ch=bingx_featuredevents_main_link";
export const BINANCE_URL =
  "https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=es-LA&ref=GRO_28502_9GVXD&utm_source=referral_entrance";

export const PRICES = {
  standard: { usd: 79.99, xboxArs: 113299, label: "Estándar" },
  ultimate: { usd: 99.99, xboxArs: 141990, label: "Ultimate" },
  "xbox-upgrade": { usd: null, xboxArs: 28691, label: "Mejora a Ultimate (Xbox)" },
};

export const GTAPLUS = { psUsd: 7.99, xboxArs: 6670 };

// Memberships (pre-tax), relevadas 18/11/2026. PS Plus AR en USD por período; Game Pass AR en ARS por mes.
export const MEMBERSHIPS = {
  "ps-essential": { label: "PS Plus Essential", ccy: "USD", periods: { 1: 8.99, 3: 22.99, 12: 64.99 } },
  "ps-extra": { label: "PS Plus Extra", ccy: "USD", periods: { 1: 13.49, 3: 37.99, 12: 107.99 } },
  "ps-deluxe": { label: "PS Plus Deluxe", ccy: "USD", periods: { 1: 15.99, 3: 43.99, 12: 124.99 } },
  "gp-essential": { label: "Game Pass Essential", ccy: "ARS", monthly: 8999 },
  "gp-premium": { label: "Game Pass Premium", ccy: "ARS", monthly: 11999 },
  "gp-ultimate": { label: "Game Pass Ultimate", ccy: "ARS", monthly: 18999 },
  "pc-gp": { label: "PC Game Pass", ccy: "ARS", monthly: 13999 },
};

export function membershipCost(plan, months) {
  const m = MEMBERSHIPS[plan];
  if (!m || !months) return null;
  if (m.ccy === "USD") {
    const p = m.periods[months];
    if (p != null) return { amount: p, ccy: "USD", label: `${m.label} ${months} ${months === 1 ? "mes" : "meses"}` };
    const p1 = m.periods[1];
    return { amount: p1 * months, ccy: "USD", label: `${m.label} ${months} × 1 mes` };
  }
  return { amount: m.monthly * months, ccy: "ARS", label: `${m.label} ${months} ${months === 1 ? "mes" : "meses"}` };
}

export const BINGX = { fee: 0.015, cashback: 0.02 };
export const BINANCE = { cashback: 0.03, cashbackUntil: "2026-12-31" };
