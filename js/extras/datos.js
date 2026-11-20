// Datos de las secciones extra: consolas, ofertas por tienda, juego en caja, metas del desafío y escenarios.
// Precios: ver FUENTES.md (relevados 18/11/2026). Nada inventado: si no hay precio publicado, lo carga el usuario.
// PRECIOS: la fuente única es data/hardware-prices.json (la comparten Comparar, Armar PC, Metas y La jodita).
// Cada entrada con `item` toma de ahí su precio al cargar (ver applyCatalog). Los valores de este archivo son el
// respaldo si el JSON no carga (copia del catálogo al 19/11/2026) y la fuente de lo que el JSON no cubre:
// otras tiendas, condiciones de cuotas y juego en caja. Si cambiás un precio con `item`, cambialo en el JSON.
// Consolas: precios de lista en tiendas argentinas (ARS, IVA incluido).
export const CONSOLES = {
  none: { label: "No compro consola", ars: 0 },
  "ps5-digital": { label: "PS5 Slim Digital (bundle Astro Bot + GT7)", ars: 1899999, src: "Cetrogar", item: "con-ps5-digital" },
  "ps5-standard": { label: "PS5 Slim Standard con lectora (bundle Astro Bot + GT7)", ars: 1999999, src: "Frávega", item: "con-ps5-standard" },
  "ps5-pro": { label: "PS5 Pro Digital", ars: 2859999, src: "Tienda oficial Sony en Frávega", item: "con-ps5-pro" },
  "xbox-s": { label: "Xbox Series S 512 GB", ars: 1313000, src: "Game Sense", item: "con-xbox-s" },
  "xbox-x": { label: "Xbox Series X 1 TB", ars: 2409000, src: "Game Sense", item: "con-xbox-x" },
  custom: { label: "Otra / la cargo yo", ars: null },
};
// Cuotas y precios por tienda. Las condiciones de cuotas se relevaron el 18/11/2026 (hora Argentina) en las páginas
// de cada tienda. Las cuotas no se cargan a mano: se calculan sobre el precio vigente (cuota = precio × tasa ÷ n).
// Sin interés la tasa es 1; con interés (Mercado Pago) es total ÷ precio de lista, relevada ese mismo día.
export const PLANS_DATE = "18/11/2026";
export const precios = { fecha: PLANS_DATE }; // fecha de los precios que se muestran: pasa a ser la del catálogo cuando carga
export const OFFERS = {
  "ps5-digital": [
    { store: "Cetrogar", item: "con-ps5-digital", price: 1899999, url: "https://www.cetrogar.com.ar/consola-playstation-ps5-digital-bundle-gt7---astrobot-825gb-el3034/p",
      plans: [{ n: 18, si: true, cond: "Visa / Mastercard (CFT 0%)" }, { n: 12, si: true, cond: "Visa / Mastercard" }, { n: 6, si: true, cond: "Visa / Mastercard" }],
      note: "Naranja: 6/9/12/18 sin interés; Amex/Sol hasta 12; Cabal/Tuya hasta 9." },
    { store: "Frávega", price: 1899999, url: "https://www.fravega.com/promociones/bancarias",
      plans: [{ n: 6, si: true, cond: "Banco Provincia, si aplica en el checkout" }] },
  ],
  "ps5-standard": [
    { store: "Frávega", item: "con-ps5-standard", price: 1999999, url: "https://www.fravega.com/promociones/bancarias",
      plans: [{ n: 6, si: true, cond: "Banco Provincia, si aplica en el checkout" }] },
    { store: "Cetrogar", price: 2099999, url: "https://www.cetrogar.com.ar/consola-ps5-playstation-standard-bundle-gt7-astrobot-el3000/p",
      plans: [{ n: 18, si: true, cond: "Visa / Mastercard (CFT 0%)" }, { n: 12, si: true, cond: "Visa / Mastercard" }],
      note: "Naranja: 6/9/12/18 sin interés; Amex/Sol hasta 12; Cabal/Tuya hasta 9." },
  ],
  "ps5-pro": [
    { store: "Tienda oficial Sony en Frávega", item: "con-ps5-pro", price: 2859999, url: "https://www.fravega.com/l/videojuegos/consolas/?tipo-de-consola=ps5", plans: [], note: "Cuotas sin interés: no confirmadas." },
  ],
  "xbox-s": [
    { store: "Game Sense", item: "con-xbox-s", price: 1313000, url: "https://gamesenseargentina.com/productos/consola-xbox-microsoft-series-s-de-512gb-digital-color-blanco/",
      cash: 1050400, transfer: 1181700,
      plans: [{ n: 6, si: false, rate: 1709891.6 / 1294000, cond: "Mercado Pago" }, { n: 12, si: false, rate: 2010746.6 / 1294000, cond: "Mercado Pago" }],
      note: "Con Mercado Pago solo 1 pago es sin interés." },
  ],
  "xbox-x": [
    { store: "Game Sense", item: "con-xbox-x", price: 2409000, url: "https://gamesenseargentina.com/productos/xbox-series-x-standard-1tb/",
      cash: 1927200, transfer: 2168100,
      plans: [{ n: 6, si: false, rate: 3152860.4 / 2386000, cond: "Mercado Pago" }, { n: 12, si: false, rate: 3707605.4 / 2386000, cond: "Mercado Pago" }],
      note: "Con Mercado Pago solo 1 pago es sin interés." },
  ],
};
// Juego en caja (ARS, compra local, entra en cuotas de la tienda)
export const BOXED = {
  ps: { label: "GTA VI PS5 caja con código (Frávega)", ars: 219999, url: "https://www.fravega.com/p/juego-ps5-grand-theft-auto-vi-formato-fisico-con-codigo-342114/" },
  xbox: { label: "GTA VI Xbox caja (Game Sense)", ars: 239999, url: "https://gamesenseargentina.com/" },
};

// Metas del desafío (referencias, no requisitos). ARS = tiendas AR 18/11/2026; USD = precio sugerido de NVIDIA.
export const GOALS = {
  "5060-ar": { label: "RTX 5060 8 GB · Venex · ARS 694.999 (18/11/2026)", amount: 694999, ccy: "ARS", item: "gpu-rtx-5060-8" },
  "5070-ar": { label: "RTX 5070 12 GB · FullH4rd · ARS 1.789.650 (18/11/2026)", amount: 1789650, ccy: "ARS", item: "gpu-rtx-5070-12-fh" },
  "5060-msrp": { label: "RTX 5060 · precio sugerido NVIDIA US$ 299", amount: 299, ccy: "USD" },
  "5070-msrp": { label: "RTX 5070 · precio sugerido NVIDIA US$ 549", amount: 549, ccy: "USD" },
  custom: { label: "Mi PC / otra meta (la cargo yo)", amount: null, ccy: "USD" },
};
export const SCEN = [
  { k: "x2", m: 2, label: "Si duplica (x2)" },
  { k: "+50", m: 1.5, label: "Si sube 50%" },
  { k: "+30", m: 1.3, label: "Si sube 30%" },
  { k: "0", m: 1, label: "Si queda igual" },
  { k: "-30", m: 0.7, label: "Si cae 30%" },
  { k: "-50", m: 0.5, label: "Si cae 50%" },
];
export const DISCLAIMER = "Esto no es asesoramiento financiero ni una recomendación de inversión. No te estamos diciendo que metas tus ahorros acá para multiplicarlos. Es solo una herramienta para visualizar una apuesta chica a futuro: puede salir bien o puede salir mal. Si Take-Two o el bitcoin suben, tu meta se acerca; si bajan, perdés plata, punto. El bitcoin es más volátil y puede caer mucho. Nadie debería hacer esto si le da miedo o si no quiere arriesgar. El dinero que no estás dispuesto a perder, dejalo afuera. Los escenarios son hipotéticos, no una promesa ni un pronóstico.";
export const DISCLAIMER_SHORT = "No es asesoramiento financiero: puede salir bien o mal. El bitcoin puede caer mucho. La plata que no estás dispuesto a perder, dejala afuera.";
