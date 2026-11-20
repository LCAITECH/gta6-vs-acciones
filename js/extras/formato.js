// Formatos de montos y fechas, y chequeo de números positivos.
import { G } from "./acceso.js";
export const fmtArs2 = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const posNum = (v) => (typeof v === "number" && v > 0 ? v : null);
export const dayOf = (s) => String(s || "").split(/[\s~]/)[0]; // "19/11/2026 12:53" -> "19/11/2026"
export const dayKey = (s) => dayOf(s).split("/").reverse().join(""); // dd/mm/yyyy -> yyyymmdd, para comparar

export const ars = (n) => `ARS ${Math.round(n).toLocaleString("es-AR")}`;
export const moneyAR = (n) => `ARS ${G().fmtAR.format(n)}`;
export const usd = (n) => `US$ ${G().fmtAR.format(n)}`;
export const usd0 = (n) => `US$ ${Math.round(n).toLocaleString("es-AR")}`;
