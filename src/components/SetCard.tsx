import Link from "next/link";
import { categoryOf } from "@/lib/categories";

export type SetSummary = { id: string; name: string; category: string | null; is_public: boolean; total: number; have: number };

// A set with its progress bar, for lists of sets.
export default function SetCard({ s, mine }: { s: SetSummary; mine?: boolean }) {
  const pct = s.total ? Math.round((s.have / s.total) * 100) : 0;
  return (
    <Link href={`/sets/${s.id}`} className={pct === 100 ? "set-card done" : "set-card"}>
      <span className="set-name">{s.category ? `${categoryOf(s.category).emoji} ` : ""}{s.name}</span>
      <span className="progress" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      <span className="hint">{s.have} of {s.total} · {pct}%{pct === 100 ? " · Complete! 🎉" : ""}{mine && !s.is_public ? " · Private" : ""}</span>
    </Link>
  );
}

export const summarize = (rows: { id: string; name: string; category: string | null; is_public: boolean; set_entries: { have: boolean }[] }[]): SetSummary[] =>
  rows.map((r) => ({ id: r.id, name: r.name, category: r.category, is_public: r.is_public, total: r.set_entries.length, have: r.set_entries.filter((e) => e.have).length }));
