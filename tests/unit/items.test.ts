import { describe, expect, it } from "vitest";
import { certLabel, certLookupUrl, estimate, gainCost, isEbayUrl, leftOutExtras, thumbPath, valueOf, type Comp, type Purchase } from "@/lib/items";

const comp = (price: number, daysAgo = 10): Comp => ({ id: String(Math.random()), price, source: "eBay", sold_on: new Date(Date.now() - daysAgo * 864e5).toISOString().slice(0, 10), url: null, note: null });
const purchase = (p: Partial<Purchase>): Purchase => ({
  paid: null, purchased_at: null, manual_value: null, shipping: null, tax: null, fees: null, acquired_from: null, storage_location: null,
  sold_price: null, sold_at: null, include_shipping: false, include_tax: false, include_fees: false, condition_adjustment: null, ...p,
});

describe("estimated value", () => {
  it("uses the median of recent sold listings", () => expect(estimate([comp(10), comp(30), comp(20)])!.median).toBe(20));
  it("drops the highest and lowest once there are 5 or more", () => expect(estimate([comp(1), comp(10), comp(20), comp(30), comp(999)])!.median).toBe(20));
  it("prefers the last 12 months, falling back to older sales", () => {
    expect(estimate([comp(100, 30), comp(5, 800)])!.median).toBe(100);
    expect(estimate([comp(5, 800)])!.olderOnly).toBe(true);
  });
  it("is empty with no listings", () => expect(estimate([])).toBeNull());
});

describe("value and cost", () => {
  it("takes the condition adjustment off the estimate", () => expect(valueOf(purchase({ condition_adjustment: 20 }), [comp(100)])!.value).toBe(80));
  it("uses your own value as-is", () => expect(valueOf(purchase({ manual_value: 120, condition_adjustment: 20 }), [comp(100)])!.value).toBe(120));
  it("counts only the extras you chose", () => {
    const p = purchase({ paid: 50, shipping: 8, tax: 4, fees: 2, include_tax: true });
    expect(gainCost(p)).toBe(54);
    expect(leftOutExtras(p).map((x) => x.label)).toEqual(["shipping", "fees"]);
    expect(gainCost(purchase({}))).toBeNull();
  });
});

describe("helpers", () => {
  it("builds thumbnail paths", () => { expect(thumbPath("u/abc.jpg")).toBe("u/abc-t.jpg"); expect(thumbPath("u/abc")).toBe("u/abc-t.jpg"); });
  it("labels grading", () => {
    expect(certLabel({ is_certified: true, cert_type: "graded", cert_by: "PSA", cert_grade: "10" })).toBe("PSA 10");
    expect(certLabel({ is_certified: true, cert_type: "coa", cert_by: "JSA", cert_grade: null })).toBe("COA · JSA");
    expect(certLabel({ is_certified: false, cert_type: null, cert_by: null, cert_grade: null })).toBeNull();
  });
  it("links cert lookups for known graders only", () => {
    expect(certLookupUrl("PSA", "1234 5678")).toBe("https://www.psacard.com/cert/12345678");
    expect(certLookupUrl("SGC", "1")).toBeNull();
  });
  it("accepts only eBay listing links", () => {
    expect(isEbayUrl("https://www.ebay.com/itm/1")).toBe(true);
    expect(isEbayUrl("https://ebay.example.com/itm/1")).toBe(false);
    expect(isEbayUrl("http://www.ebay.com/itm/1")).toBe(false);
  });
});
