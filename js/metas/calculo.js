// Cuentas de plazos y valores de las metas. Sin DOM ni estado: todo entra por parámetros.
export const MAX_M = 24;
const DOWN_CAP = 50; // a share can't fall more than 100%; we cap bear scenarios at −50%.

export function addMonths(iso, months) {
  const [y, mo, d] = (iso || "2026-11-18").split("-").map(Number);
  const dt = new Date(y, (mo || 1) - 1 + months, d || 1);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function cashMonths(initial, monthly, goal) {
  if (goal <= 0) return 0;
  if (initial >= goal - 1e-9) return 0;
  if (monthly <= 0) return null;
  const m = Math.ceil((goal - initial) / monthly - 1e-12);
  return m <= MAX_M ? m : null;
}

// Same interpolation idea as the projection simulator: linear path from live to target over 24 months.
function ttwoMonths(initial, monthly, goal, live, target) {
  if (goal <= 0) return 0;
  if (!(live > 0)) return cashMonths(initial, monthly, goal);
  let shares = initial / live;
  if (shares * live >= goal - 1e-9) return 0;
  for (let k = 1; k <= MAX_M; k++) {
    const p = Math.max(0.01, live + ((target - live) * k) / MAX_M);
    shares += monthly / p;
    if (shares * p >= goal - 1e-9) return k;
  }
  return null;
}

function mixMonths(initial, monthly, goal, liveT, targetT, liveB, targetB) {
  if (goal <= 0) return 0;
  if (!(liveT > 0) || !(liveB > 0)) {
    if (liveT > 0) return ttwoMonths(initial, monthly, goal, liveT, targetT);
    if (liveB > 0) return ttwoMonths(initial, monthly, goal, liveB, targetB);
    return cashMonths(initial, monthly, goal);
  }
  let sT = (initial / 2) / liveT;
  let sB = (initial / 2) / liveB;
  if (sT * liveT + sB * liveB >= goal - 1e-9) return 0;
  for (let k = 1; k <= MAX_M; k++) {
    const pT = Math.max(0.01, liveT + ((targetT - liveT) * k) / MAX_M);
    const pB = Math.max(0.01, liveB + ((targetB - liveB) * k) / MAX_M);
    sT += (monthly / 2) / pT;
    sB += (monthly / 2) / pB;
    if (sT * pT + sB * pB >= goal - 1e-9) return k;
  }
  return null;
}

export function cashValueAt(initial, monthly, k) {
  return initial + monthly * k;
}

function investedValueAt(initial, monthly, live, target, k) {
  if (!(live > 0)) return cashValueAt(initial, monthly, k);
  let shares = initial / live;
  for (let i = 1; i <= k; i++) {
    const p = Math.max(0.01, live + ((target - live) * i) / MAX_M);
    shares += monthly / p;
  }
  const pEnd = k === 0 ? live : Math.max(0.01, live + ((target - live) * k) / MAX_M);
  return shares * pEnd;
}

function mixValueAt(initial, monthly, liveT, targetT, liveB, targetB, k) {
  if (!(liveT > 0) || !(liveB > 0)) {
    if (liveT > 0) return investedValueAt(initial, monthly, liveT, targetT, k);
    if (liveB > 0) return investedValueAt(initial, monthly, liveB, targetB, k);
    return cashValueAt(initial, monthly, k);
  }
  let sT = (initial / 2) / liveT;
  let sB = (initial / 2) / liveB;
  for (let i = 1; i <= k; i++) {
    const pT = Math.max(0.01, liveT + ((targetT - liveT) * i) / MAX_M);
    const pB = Math.max(0.01, liveB + ((targetB - liveB) * i) / MAX_M);
    sT += (monthly / 2) / pT;
    sB += (monthly / 2) / pB;
  }
  const pT = k === 0 ? liveT : Math.max(0.01, liveT + ((targetT - liveT) * k) / MAX_M);
  const pB = k === 0 ? liveB : Math.max(0.01, liveB + ((targetB - liveB) * k) / MAX_M);
  return sT * pT + sB * pB;
}

export function assumeValueAt(asset, initial, monthly, liveT, targetT, liveB, targetB, k) {
  if (asset === "btc") return investedValueAt(initial, monthly, liveB, targetB, k);
  if (asset === "half") return mixValueAt(initial, monthly, liveT, targetT, liveB, targetB, k);
  return investedValueAt(initial, monthly, liveT, targetT, k);
}

export function scenarioDeltas(pct) {
  const up = Math.abs(pct) || 20;
  const down = Math.min(up, DOWN_CAP);
  return { up, down };
}

export function assumeMonths(asset, initial, monthly, goal, liveT, targetT, liveB, targetB) {
  if (asset === "btc") return ttwoMonths(initial, monthly, goal, liveB, targetB);
  if (asset === "half") return mixMonths(initial, monthly, goal, liveT, targetT, liveB, targetB);
  return ttwoMonths(initial, monthly, goal, liveT, targetT);
}
