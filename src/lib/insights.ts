// Collection insights (members): where a collection's value sits and how it has moved. Uses the same
// value and cost rules as My collection (valueOf and gainCost in src/lib/items.ts); each entry counts
// once, like the totals there.
import { gainCost, valueOf, type Comp, type Purchase } from "./items";

export type InsightRow = {
  id: string; title: string; category: string; quantity: number; created_at: string;
  is_certified: boolean; cert_type: string | null; purchase: Purchase | null; comps: Comp[];
};
type Scored = InsightRow & { value: number | null; cost: number | null; gain: number | null };

export function insights(rows: InsightRow[], now = new Date()) {
  const scored: Scored[] = rows.map((r) => {
    const v = valueOf(r.purchase, r.comps);
    const cost = gainCost(r.purchase);
    return { ...r, value: v ? v.value : null, cost, gain: v && cost != null ? v.value - cost : null };
  });
  const cats = new Map<string, { category: string; items: number; value: number; cost: number }>();
  for (const s of scored) {
    const c = cats.get(s.category) ?? { category: s.category, items: 0, value: 0, cost: 0 };
    c.items += 1; c.value += s.value ?? 0; c.cost += s.cost ?? 0;
    cats.set(s.category, c);
  }
  const byYear = new Map<string, number>();
  for (const s of scored) {
    if (s.cost == null) continue;
    const y = s.purchase?.purchased_at?.slice(0, 4) || "No date";
    byYear.set(y, (byYear.get(y) ?? 0) + s.cost);
  }
  // Items added in each of the last 12 months, oldest first.
  const months: { month: string; added: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({ month: d.toISOString().slice(0, 7), added: 0 });
  }
  for (const s of scored) { const m = months.find((x) => x.month === s.created_at.slice(0, 7)); if (m) m.added++; }
  const withGain = scored.filter((s) => s.gain != null);
  const graded = scored.filter((s) => s.is_certified && s.cert_type === "graded").length;
  return {
    items: scored.length,
    value: scored.reduce((n, s) => n + (s.value ?? 0), 0),
    valued: scored.filter((s) => s.value != null).length,
    cost: scored.reduce((n, s) => n + (s.cost ?? 0), 0),
    byCategory: [...cats.values()].sort((a, b) => b.value - a.value || b.items - a.items),
    top: scored.filter((s) => s.value != null).sort((a, b) => b.value! - a.value!).slice(0, 5),
    gainers: withGain.filter((s) => s.gain! > 0).sort((a, b) => b.gain! - a.gain!).slice(0, 5),
    losers: withGain.filter((s) => s.gain! < 0).sort((a, b) => a.gain! - b.gain!).slice(0, 5),
    graded, gradedShare: scored.length ? graded / scored.length : 0,
    spendingByYear: [...byYear.entries()].sort(([a], [b]) => (a === "No date" ? 1 : b === "No date" ? -1 : b.localeCompare(a))).map(([year, cost]) => ({ year, cost })),
    addedByMonth: months,
  };
}
