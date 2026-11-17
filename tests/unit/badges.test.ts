import { describe, expect, it } from "vitest";
import { badgeStats, badgesFor, LAUNCH_DATE } from "@/lib/badges";

const item = (over: Partial<Parameters<typeof badgeStats>[0][number]> = {}) =>
  ({ status: "owned", is_hidden: false, featured: false, is_certified: false, category: "cards", rating_avg: null, rating_count: 0, ...over });
const keys = (items: ReturnType<typeof item>[], sets: Parameters<typeof badgeStats>[1] = [], extra = {}) =>
  badgesFor(badgeStats(items, sets, { followers: 0, joined: "2026-06-01T00:00:00Z", beta: false, ...extra })).map((b) => b.label).filter((l) => l !== "Founding collector");

describe("badges", () => {
  it("a new collector with nothing yet has none", () => expect(keys([])).toEqual([]));
  it("item milestones show only the highest reached, counting owned public items", () => {
    expect(keys(Array.from({ length: 9 }, () => item()))).toEqual([]);
    expect(keys(Array.from({ length: 10 }, () => item()))).toEqual(["10+ items"]);
    expect(keys(Array.from({ length: 120 }, () => item()))).toEqual(["100+ items"]);
    const hiddenAndWishlist = [...Array.from({ length: 9 }, () => item()), item({ is_hidden: true }), item({ status: "wishlist" }), item({ status: "sold" })];
    expect(keys(hiddenAndWishlist)).toEqual([]);
  });
  it("grail, graded, crowd favorite and explorer", () => {
    expect(keys([item({ featured: true })])).toContain("Grail hunter");
    expect(keys(Array.from({ length: 5 }, () => item({ is_certified: true })))).toContain("Graded collection");
    expect(keys(Array.from({ length: 4 }, () => item({ is_certified: true })))).not.toContain("Graded collection");
    expect(keys([item({ rating_avg: "4.67", rating_count: 3 })])).toContain("Crowd favorite");
    expect(keys([item({ rating_avg: 5, rating_count: 2 })])).not.toContain("Crowd favorite");
    expect(keys(["cards", "coins", "comics", "toys", "lego"].map((category) => item({ category })))).toContain("Explorer");
  });
  it("set complete needs a public set of 5+ pieces, all ticked", () => {
    const set = (n: number, have = true, is_public = true) => ({ is_public, set_entries: Array.from({ length: n }, () => ({ have })) });
    expect(keys([], [set(5)])).toContain("Set complete");
    expect(keys([], [set(5), set(8)])).toContain("2 sets complete");
    expect(keys([], [set(4)])).toEqual([]);
    expect(keys([], [set(5, false)])).toEqual([]);
    expect(keys([], [set(5, true, false)])).toEqual([]);
  });
  it("founding collector: everyone until a launch date is set, then only those who joined before it", () => {
    const founding = (joined: string) => badgesFor(badgeStats([], [], { followers: 0, joined, beta: false })).some((b) => b.key === "founding");
    if (LAUNCH_DATE === null) {
      expect(founding("2026-06-01T00:00:00Z")).toBe(true);
      expect(founding("2030-01-01T00:00:00Z")).toBe(true);
    } else {
      expect(founding(new Date(Date.parse(LAUNCH_DATE) - 864e5).toISOString())).toBe(true);
      expect(founding(`${LAUNCH_DATE}T00:00:00Z`)).toBe(false);
    }
  });
  it("beta and follower milestones", () => {
    expect(keys([], [], { beta: true })).toEqual(["Beta tester"]);
    expect(keys([], [], { followers: 49 })).toEqual(["10+ followers"]);
    expect(keys([], [], { followers: 1200 })).toEqual(["1,000+ followers"]);
  });
});
