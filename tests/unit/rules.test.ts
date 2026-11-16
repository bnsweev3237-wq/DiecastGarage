import { describe, expect, it } from "vitest";
import { compActive, isMember, FREE_ITEM_LIMIT, FREE_PHOTO_LIMIT } from "@/lib/limits";
import { CATEGORIES, categoryOf, cleanAttributes, summary } from "@/lib/categories";
import { matchesAll, searchWords } from "@/lib/search";
import { releases } from "@/lib/releases";
import { HELP, HELP_UPDATED_FOR } from "@/lib/help";

const day = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

describe("plans", () => {
  it("free plan limits", () => { expect(FREE_ITEM_LIMIT).toBe(25); expect(FREE_PHOTO_LIMIT).toBe(1); });
  it("paid members", () => { expect(isMember({ status: "active" })).toBe(true); expect(isMember({ status: "canceled" })).toBe(false); });
  it("complimentary memberships end after their last day", () => {
    expect(compActive({ comp_active: true, comp_until: null })).toBe(true);
    expect(compActive({ comp_active: true, comp_until: day(0) })).toBe(true);
    expect(compActive({ comp_active: true, comp_until: day(-2) })).toBe(false);
    expect(compActive({ comp_active: false, comp_until: null })).toBe(false);
  });
});

describe("categories", () => {
  it("keys are unique and shaped like the database expects", () => {
    const keys = CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) expect(k).toMatch(/^[a-z][a-z_]{1,39}$/);
  });
  it("every category has an emoji, a group and unique field keys", () => {
    for (const c of CATEGORIES) {
      expect(c.emoji.length).toBeGreaterThan(0);
      expect(["popular", "ebay", "other"]).toContain(c.group);
      expect(new Set(c.fields.map((f) => f.key)).size).toBe(c.fields.length);
    }
  });
  it("unknown categories fall back to Other", () => expect(categoryOf("nope").key).toBe("other"));
  it("keeps only the category's own fields", () => {
    expect(cleanAttributes("diecast", (k) => (k === "scale" ? " 1:24 " : k === "grade" ? "10" : ""))).toEqual({ scale: "1:24" });
  });
  it("summarizes with grading", () => {
    expect(summary({ category: "cards", brand: null, year: null, attributes: { game: "Pokémon", set: "Base Set" }, is_certified: true, cert_type: "graded", cert_by: "PSA", cert_grade: "9" }))
      .toBe("Pokémon · Base Set · PSA 9");
  });
});

describe("search", () => {
  it("ignores accents and case, and every word must match", () => {
    expect(searchWords("Pokémon  CHARIZARD")).toEqual(["pokemon", "charizard"]);
    expect(matchesAll(["pokemon", "psa"], "1999 Pokémon Charizard", { grade: "PSA 9" })).toBe(true);
    expect(matchesAll(["pokemon", "bgs"], "1999 Pokémon Charizard")).toBe(false);
  });
});

describe("release notes and help", () => {
  it("newest release first, versions unique", () => {
    const v = releases.map((r) => r.version.split(".").map(Number));
    for (let i = 1; i < v.length; i++) expect(v[i - 1][0] * 1000 + v[i - 1][1]).toBeGreaterThan(v[i][0] * 1000 + v[i][1]);
  });
  it("help is up to date for the newest release", () => expect(HELP_UPDATED_FOR).toBe(releases[0].version.split(".").slice(0, 2).join(".")));
  it("help sections have unique ids and content", () => {
    expect(new Set(HELP.map((s) => s.id)).size).toBe(HELP.length);
    for (const s of HELP) expect(s.body.length).toBeGreaterThan(0);
  });
});
