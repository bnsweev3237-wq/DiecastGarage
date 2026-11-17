import Link from "next/link";
import Thumb from "./Thumb";

export type ShelfSummary = { id: string; name: string; is_public: boolean; count: number; covers: string[] };

// A shelf in a list: its first few photos, name and how many items are on it.
export default function ShelfCard({ s, mine }: { s: ShelfSummary; mine?: boolean }) {
  return (
    <Link href={`/shelves/${s.id}`} className="shelf-card">
      <span className="shelf-covers" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => s.covers[i] ? <Thumb key={i} className="shelf-cover" path={s.covers[i]} /> : <span key={i} className="shelf-cover blank" />)}
      </span>
      <span className="set-name">🗄️ {s.name}</span>
      <span className="hint">{s.count} item{s.count === 1 ? "" : "s"}{mine && !s.is_public ? " · Private" : ""}</span>
    </Link>
  );
}

type Row = { id: string; name: string; is_public: boolean; shelf_items: { position: number; item: { photo_path: string | null } | null }[] };

// Shelves as loaded with their items' photos, in shelf order. Items others can't see come back as null.
export const summarizeShelves = (rows: Row[]): ShelfSummary[] =>
  rows.map((r) => {
    const items = [...r.shelf_items].filter((x) => x.item).sort((a, b) => a.position - b.position);
    return { id: r.id, name: r.name, is_public: r.is_public, count: items.length, covers: items.map((x) => x.item!.photo_path).filter((p): p is string => !!p).slice(0, 4) };
  });
