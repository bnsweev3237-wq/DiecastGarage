import { describe, expect, it } from "vitest";
import { insights, type InsightRow } from "@/lib/insights";
import type { Purchase } from "@/lib/items";

const purchase = (paid: number | null, manual: number | null, at: string | null = null): Purchase => ({
  paid, purchased_at: at, manual_value: manual, shipping: null, tax: null, fees: null, acquired_from: null, storage_location: null,
  sold_price: null, sold_at: null, include_shipping: false, include_tax: false, include_fees: false, condition_adjustment: null,
});
let n = 0;
const row = (over: Partial<InsightRow>): InsightRow => ({
  id: `i${++n}`, title: `Item ${n}`, category: "cards", quantity: 1, created_at: "2026-11-02T00:00:00Z", is_certified: false, cert_type: null,
  purchase: null, comps: [], ...over,
});

describe("collection insights", () => {
  const rows = [
    row({ title: "Charizard", purchase: purchase(100, 600, "2024-05-01"), is_certified: true, cert_type: "graded" }),
    row({ title: "Blastoise", purchase: purchase(80, 50, "2025-01-10") }),
    row({ title: "Goodwrench", category: "diecast", purchase: purchase(20, null, "2025-03-01"), comps: [{ id: "k", price: 35, source: "eBay", sold_on: null, url: null, note: null }] }),
    row({ title: "Unvalued", category: "diecast", created_at: "2025-01-01T00:00:00Z" }),
  ];
  const r = insights(rows, new Date("2026-11-19T00:00:00Z"));
  it("totals and categories by value", () => {
    expect(r).toMatchObject({ items: 4, value: 685, valued: 3, cost: 200, graded: 1 });
    expect(r.byCategory.map((c) => [c.category, c.items, c.value])).toEqual([["cards", 2, 650], ["diecast", 2, 35]]);
  });
  it("top items, gainers and losers", () => {
    expect(r.top.map((t) => t.title)).toEqual(["Charizard", "Blastoise", "Goodwrench"]);
    expect(r.gainers.map((t) => [t.title, t.gain])).toEqual([["Charizard", 500], ["Goodwrench", 15]]);
    expect(r.losers.map((t) => [t.title, t.gain])).toEqual([["Blastoise", -30]]);
  });
  it("spending by year, newest first, and items added per month", () => {
    expect(r.spendingByYear).toEqual([{ year: "2025", cost: 100 }, { year: "2024", cost: 100 }]);
    expect(r.addedByMonth).toHaveLength(12);
    expect(r.addedByMonth[11]).toEqual({ month: "2026-11", added: 3 });
    expect(r.addedByMonth[0].month).toBe("2025-12");
  });
});
