// Estado compartido de la calculadora: cotizaciones cargadas, modelo calculado y opciones elegidas.
export const estado = {
  quotes: [],
  latestQuote: null,
  btcQuotes: [],
  latestBtc: null,
  fx: null,
  lastCompare: null,
  amountMode: "official", // official | custom | missing
  lastModel: null,
  gpIva: true, // Game Pass AR: IVA incluido sin confirmar -> sumamos IVA por defecto (conservador)
  binanceIva: true,
  asset: "both", // activo elegido: ttwo | btc | both
};
