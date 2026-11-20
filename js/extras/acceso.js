// Acceso al DOM y a lo que expone app.js (window.__gta), más las tasas de cambio vigentes.
export const $ = (id) => document.getElementById(id);

export const G = () => window.__gta;

export const num = (id) => Math.max(0, Number($(id).value) || 0);

export function rates() {
  const g = G();
  return {
    oficial: g.fxVenta("oficial"),
    mep: g.fxVenta("bolsa"),
    fund: g.fxVenta($("fund-rate").value),
    iva: $("iva").checked ? 0.21 : 0,
    iibb: Math.max(0, Number($("iibb").value) || 0) / 100,
  };
}
