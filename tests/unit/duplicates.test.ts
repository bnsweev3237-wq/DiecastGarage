import { describe, expect, it } from "vitest";
import { findDuplicates, normalizeTitle, type DupItem } from "@/lib/duplicates";

let n = 0;
const item = (over: Partial<DupItem>): DupItem => ({
  id: `i${++n}`, title: "Charizard", category: "cards", status: "owned", quantity: 1, featured: false, created_at: `2026-01-${String(10 + n).padStart(2, "0")}`,
  is_certified: false, cert_type: null, cert_by: null, cert_grade: null, open_to_trade: false, ...over,
});

describe("duplicate finder", () => {
  it("ignores case, accents, punctuation and spacing", () => {
    expect(normalizeTitle("1999  Pokémon Base-Set Charizard, 4/102!")).toBe("1999 pokemon base set charizard 4/102");
  });
  it("groups the same thing and keeps the oldest (or grail) as the one to hold onto", () => {
    const a = item({ title: "1:64 Earnhardt Goodwrench #3" }), b = item({ title: "1:64 earnhardt goodwrench #3" }), c = item({ title: "1:64 Earnhardt Wrangler #3" });
    const groups = findDuplicates([b, c, a]);
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((i) => i.id)).toEqual([a.id, b.id]);
    expect(groups[0].extras.map((i) => i.id)).toEqual([b.id]);
    const g = item({ title: "1:64 Earnhardt Goodwrench #3", featured: true });
    expect(findDuplicates([a, b, g])[0].extras.map((i) => i.id)).toEqual([a.id, b.id]);
  });
  it("different grades, categories or statuses aren't duplicates", () => {
    const psa9 = item({ is_certified: true, cert_type: "graded", cert_by: "PSA", cert_grade: "9" });
    const psa10 = item({ is_certified: true, cert_type: "graded", cert_by: "PSA", cert_grade: "10" });
    expect(findDuplicates([psa9, psa10])).toHaveLength(0);
    expect(findDuplicates([item({}), item({ category: "comics" })])).toHaveLength(0);
    expect(findDuplicates([item({}), item({ status: "wishlist" })])).toHaveLength(0);
    expect(findDuplicates([psa9, item({ is_certified: true, cert_type: "graded", cert_by: "psa", cert_grade: "9" })])).toHaveLength(1);
  });
  it("one entry with a quantity over 1 counts", () => {
    const x = item({ quantity: 3 });
    const [g] = findDuplicates([x]);
    expect(g.copies).toBe(3);
    expect(g.extras.map((i) => i.id)).toEqual([x.id]);
  });
});
