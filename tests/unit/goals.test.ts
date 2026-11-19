import { describe, expect, it } from "vitest";
import { goalProgress, type Goal } from "@/lib/goals";

const goal = (over: Partial<Goal>): Goal => ({ id: "g", kind: "items", target: 3, category: null, set_id: null, title: null, is_public: true, ...over });
const items = [
  { status: "owned", category: "diecast" }, { status: "owned", category: "diecast" }, { status: "owned", category: "cards" },
  { status: "owned", category: "diecast", is_hidden: true }, { status: "wishlist", category: "diecast" }, { status: "sold", category: "diecast" },
];
const sets = [{ id: "s1", name: "1999 Base Set", set_entries: [{ have: true }, { have: true }, { have: false }] }, { id: "s2", name: "Done set", set_entries: [{ have: true }] }];

describe("collection goals", () => {
  it("item goals count owned items that aren't hidden", () => {
    expect(goalProgress([goal({})], items, sets)[0]).toMatchObject({ label: "3 items", current: 3, of: 3, done: true, pct: 100 });
    expect(goalProgress([goal({ target: 10 })], items, sets)[0]).toMatchObject({ current: 3, done: false, pct: 30 });
  });
  it("category goals and custom names", () => {
    expect(goalProgress([goal({ kind: "category", category: "diecast", target: 4, title: "Diecast wall" })], items, sets)[0])
      .toMatchObject({ label: "Diecast wall", current: 2, of: 4, pct: 50 });
    expect(goalProgress([goal({ kind: "category", category: "diecast", target: 4 })], items, sets)[0].label).toBe("4 diecast & model vehicles");
  });
  it("set goals follow the checklist; a missing set drops out", () => {
    expect(goalProgress([goal({ kind: "set", set_id: "s1", target: null })], items, sets)[0]).toMatchObject({ label: "Finish 1999 Base Set", current: 2, of: 3, done: false });
    expect(goalProgress([goal({ kind: "set", set_id: "s2", target: null })], items, sets)[0].done).toBe(true);
    expect(goalProgress([goal({ kind: "set", set_id: "gone", target: null })], items, sets)).toEqual([]);
  });
});
