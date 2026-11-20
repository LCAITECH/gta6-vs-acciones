// API que app.js le expone a los otros módulos (window.__gta).
import { update } from "./actualizar.js";
import { track } from "./analitica.js";
import { dmy, fmtAR, fmtInt, money } from "./base.js";
import { BINANCE, BINGX, MEMBERSHIPS, PRICES, membershipCost } from "./config.js";
import { estado } from "./estado.js";
import { arsUsdMep, fxRate, fxVenta, mepStamp, renderFxRates } from "./fx.js";
import { syncMembMonths } from "./membresia.js";
import { closeOnOrBefore } from "./series.js";
import { toast } from "./toast.js";
import { saveStateToUrl } from "./url-state.js";
window.__gta = {
  get model() { return estado.lastModel; },
  get quotes() { return estado.quotes; },
  get latestQuote() { return estado.latestQuote; },
  get btcQuotes() { return estado.btcQuotes; },
  get latestBtc() { return estado.latestBtc; },
  get asset() { return estado.asset; },
  get compare() { return estado.lastCompare; },
  get binanceIva() { return estado.binanceIva; },
  get gpIva() { return estado.gpIva; },
  setGpIva(v) { estado.gpIva = !!v; syncMembMonths(); update(); },
  fxVenta, fxRate, mepStamp, arsUsdMep, renderFxRates, money, fmtAR, fmtInt, track, closeOnOrBefore, membershipCost, toast, dmy,
  MEMBERSHIPS, BINGX, BINANCE, PRICES,
  listeners: [],
  refreshUrl() { saveStateToUrl(); },
};
