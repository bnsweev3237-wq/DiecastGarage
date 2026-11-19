// Finds items a collector owns more than once: separate entries that look like the same thing, or one
// entry with a quantity over 1. Two entries match when they're in the same category, have the same name
// once case, accents, punctuation and spacing are ignored, and the same grade (or both ungraded).

export type DupItem = {
  id: string; title: string; category: string; status: string; quantity: number; featured: boolean; created_at: string;
  is_certified: boolean; cert_type: string | null; cert_by: string | null; cert_grade: string | null; open_to_trade: boolean;
};
export type DupGroup<T extends DupItem> = { key: string; items: T[]; copies: number; extras: T[] };

export const normalizeTitle = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9#/]+/g, " ").trim().replace(/\s+/g, " ");

const gradeKey = (i: DupItem) => (i.is_certified && i.cert_type === "graded" ? `${normalizeTitle(i.cert_by ?? "")} ${normalizeTitle(i.cert_grade ?? "")}`.trim() : "raw");

export function findDuplicates<T extends DupItem>(items: T[]): DupGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const i of items) {
    if (i.status !== "owned") continue;
    const key = `${i.category}|${normalizeTitle(i.title)}|${gradeKey(i)}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }
  const out: DupGroup<T>[] = [];
  for (const [key, list] of groups) {
    const copies = list.reduce((n, i) => n + Math.max(1, i.quantity), 0);
    if (copies < 2) continue;
    // Keep a grail first, then the oldest entry; the rest are extras. A single entry with a quantity
    // over 1 has no separate extras: the entry itself is what gets opened to trade.
    const sorted = [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || a.created_at.localeCompare(b.created_at));
    out.push({ key, items: sorted, copies, extras: sorted.length > 1 ? sorted.slice(1) : sorted });
  }
  return out.sort((a, b) => b.copies - a.copies || a.key.localeCompare(b.key));
}
