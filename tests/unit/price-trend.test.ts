import { describe, expect, it } from "vitest";
import { monthLabel, monthlyMedians, trend } from "@/lib/price-trend";

describe("item value history", () => {
  it("groups dated sales by month and takes the middle price, oldest first", () => {
    const pts = monthlyMedians([
      { price: 20, sold_on: "2025-05-03" }, { price: "10", sold_on: "2025-03-10" }, { price: 14, sold_on: "2025-03-28" },
      { price: 30, sold_on: "2025-05-20" }, { price: 99, sold_on: null }, { price: 50, sold_on: "2025-05-21" },
    ]);
    expect(pts).toEqual([{ month: "2025-03", median: 12, n: 2 }, { month: "2025-05", median: 30, n: 3 }]);
  });
  it("trend compares the latest month with the first", () => {
    expect(trend([{ month: "2025-03", median: 12, n: 2 }, { month: "2025-05", median: 30, n: 3 }])).toMatchObject({ pct: 150 });
    expect(trend([{ month: "2025-03", median: 40, n: 1 }, { month: "2025-09", median: 30, n: 1 }])).toMatchObject({ pct: -25 });
    expect(trend([{ month: "2025-03", median: 12, n: 2 }])).toBeNull();
    expect(trend([])).toBeNull();
  });
  it("month labels", () => expect(monthLabel("2025-03")).toBe("Mar 2025"));
});
