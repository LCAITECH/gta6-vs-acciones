// Utilidades básicas: acceso al DOM, formatos de números, montos y fechas.
export const fmtAR = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
export const fmtInt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export const $ = (id) => document.getElementById(id);

export function money(amount, ccy) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const sign = ccy === "ARS" ? "ARS " : "US$ ";
  return sign + fmtAR.format(n);
}

export function dmy(iso) {
  const [y, m, d] = String(iso).split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}
