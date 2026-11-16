import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-next";

describe("after sign-in, only go to pages on this site", () => {
  it.each(["/collection", "/c/pete/123", "/search?q=charizard&x=1", "/settings#notifications"])("keeps %s", (p) => {
    expect(safeNext(p)).toBe(p);
  });
  it.each([
    "//evil.com", "/\\evil.com", "https://evil.com", "evil.com", "/\t/evil.com", "/\n/evil.com", "/ /evil.com", "", null, undefined,
    "javascript:alert(1)", "/%0a", "\\\\evil.com",
  ])("refuses %j", (p) => {
    const out = safeNext(p);
    expect(out === "/collection" || out === p).toBe(true);
    expect(out.startsWith("//") || out.includes("\\") || /[\s]/.test(out) || !out.startsWith("/")).toBe(false);
  });
  it("refuses the tricky ones outright", () => {
    for (const p of ["//evil.com", "/\\evil.com", "/\t/evil.com", "https://evil.com"]) expect(safeNext(p)).toBe("/collection");
  });
});
