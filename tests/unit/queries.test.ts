import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Guards the 0.24 bug: when two tables both link items and profiles, Supabase can't tell which link
// a query means unless it's named. Every embed between these tables must name its link.
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = path.join(dir, f);
  return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
});

describe("Supabase queries name their links", () => {
  const src = files(path.join(__dirname, "../../src"));
  const offenders: string[] = [];
  for (const f of src) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(/\.select\(\s*["'`]([^"'`]*)["'`]/g)) {
      const sel = m[1];
      // profiles embedded from anywhere, and items embedded from profiles, need a !hint.
      if (/(^|[,:\s(])profiles\s*(\(|!inner\()/.test(sel)) offenders.push(`${path.relative(process.cwd(), f)}: ${sel}`);
      if (/(^|[,\s])items\s*\(/.test(sel) && /from\("profiles"\)/.test(text.slice(Math.max(0, m.index! - 200), m.index))) offenders.push(`${path.relative(process.cwd(), f)}: ${sel}`);
    }
  }
  it("no unnamed profiles or items links", () => expect(offenders).toEqual([]));
});
