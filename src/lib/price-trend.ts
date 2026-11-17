// Value history for one item, from the sold listings its owner logged: one point per month (the middle
// price that month) and how far the latest month is from the first. Listings without a date are left out.

export type Sale = { price: number | string; sold_on: string | null };
export type MonthPoint = { month: string; median: number; n: number }; // month as "2025-03"

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function monthlyMedians(sales: Sale[]): MonthPoint[] {
  const byMonth = new Map<string, number[]>();
  for (const s of sales) {
    if (!s.sold_on || !/^\d{4}-\d{2}/.test(s.sold_on)) continue;
    const price = Number(s.price);
    if (!Number.isFinite(price)) continue;
    const m = s.sold_on.slice(0, 7);
    byMonth.set(m, [...(byMonth.get(m) ?? []), price]);
  }
  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, xs]) => ({ month, median: median(xs), n: xs.length }));
}

// Percent change from the first month to the latest. Null until there are two months to compare.
export function trend(points: MonthPoint[]): { from: MonthPoint; to: MonthPoint; pct: number } | null {
  if (points.length < 2) return null;
  const from = points[0], to = points[points.length - 1];
  if (!from.median) return null;
  return { from, to, pct: Math.round(((to.median - from.median) / from.median) * 100) };
}

export const monthLabel = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
