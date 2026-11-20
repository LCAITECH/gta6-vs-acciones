// Series de cotizaciones: cierres por fecha, fechas de horizonte, valores en pantalla y puntos del gráfico.
import { estado } from "./estado.js";
export function closeOnOrBefore(quotes, iso) {
  for (let i = quotes.length - 1; i >= 0; i -= 1) {
    if (quotes[i].date <= iso) return quotes[i];
  }
  return quotes[0];
}

export function closeAt(list, iso) {
  if (!list || !list.length || !iso) return null;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].date <= iso) return list[i];
  }
  return null;
}

export function addDaysIso(iso, days) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days));
  return dt.toISOString().slice(0, 10);
}
export function addMonthsIso(iso, months) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1 + months, d || 1));
  return dt.toISOString().slice(0, 10);
}
export function lastAvailableDate(list, live) {
  const d1 = list && list.length ? list[list.length - 1].date : null;
  const d2 = live && live.asOfDate;
  if (d2 && (!d1 || d2 > d1)) return d2;
  return d1;
}
export function livePx(list, live) {
  if (live && typeof live.price === "number") return live.price;
  return list && list.length ? list[list.length - 1].close : null;
}
export function toDisplay(usd, ccy, fxNow) {
  return ccy === "ARS" ? usd * fxNow : usd;
}

function seriesFrom(quotes, startDate, shares, spendUsd, fxNow, displayCcy, live) {
  const pts = quotes.filter((q) => q.date >= startDate).map((q) => ({ date: q.date, close: q.close }));
  if (pts.length === 0) {
    const last = closeOnOrBefore(quotes, startDate) || quotes[quotes.length - 1];
    pts.push({ date: last.date, close: last.close });
  }
  if (live && typeof live.price === "number" && live.asOfDate) {
    const last = pts[pts.length - 1];
    if (live.asOfDate > last.date) {
      pts.push({ date: live.asOfDate, close: live.price });
    } else if (live.asOfDate === last.date && live.price !== last.close) {
      last.close = live.price;
    }
  }
  return pts.map((q) => {
    const invUsd = shares * q.close;
    return {
      date: q.date,
      spent: displayCcy === "ARS" ? spendUsd * fxNow : spendUsd,
      invested: displayCcy === "ARS" ? invUsd * fxNow : invUsd,
      close: q.close,
    };
  });
}

export function clockFromArt(stamp) {
  if (!stamp || !stamp.includes(" ")) return "";
  return stamp.split(" ")[1];
}

export function unionChartPoints(purchase, spendUsd, fxNow, ccy, sharesT, sharesB, showT, showB) {
  const dates = new Set();
  const pushDates = (list, live) => {
    if (!list) return;
    for (const q of list) if (q.date >= purchase) dates.add(q.date);
    const d = live && live.asOfDate;
    if (d && d >= purchase) dates.add(d);
  };
  if (showT) pushDates(estado.quotes, estado.latestQuote);
  if (showB) pushDates(estado.btcQuotes, estado.latestBtc);
  const spent = toDisplay(spendUsd, ccy, fxNow);
  const days = [...dates].sort();
  if (!days.length) {
    return [{ date: purchase, spent, invested: null, btc: null }];
  }
  const liveClose = (list, live, day) => {
    if (live && live.asOfDate === day && typeof live.price === "number") return live.price;
    const q = closeAt(list, day);
    return q ? q.close : null;
  };
  return days.map((day) => {
    const t = showT && sharesT ? liveClose(estado.quotes, estado.latestQuote, day) : null;
    const b = showB && sharesB ? liveClose(estado.btcQuotes, estado.latestBtc, day) : null;
    return {
      date: day,
      spent,
      invested: t != null ? toDisplay(sharesT * t, ccy, fxNow) : null,
      btc: b != null ? toDisplay(sharesB * b, ccy, fxNow) : null,
      close: t,
    };
  });
}
