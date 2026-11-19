// Collection goals: progress worked out from the collection. Items count when they're owned and not
// hidden, so a goal shows the same progress to everyone (supabase/migrations/0033_goals.sql).
import { categoryOf } from "./categories";

export type Goal = { id: string; kind: "set" | "items" | "category"; target: number | null; category: string | null; set_id: string | null; title: string | null; is_public: boolean };
type ItemLike = { status: string; is_hidden?: boolean; category: string };
type SetLike = { id: string; name: string; set_entries: { have: boolean }[] };
export type GoalProgress = Goal & { label: string; current: number; of: number; done: boolean; pct: number };

export function goalProgress(goals: Goal[], items: ItemLike[], sets: SetLike[]): GoalProgress[] {
  const owned = items.filter((i) => i.status === "owned" && !i.is_hidden);
  return goals.flatMap((g) => {
    let current = 0, of = g.target ?? 0, label = "";
    if (g.kind === "set") {
      const s = sets.find((x) => x.id === g.set_id);
      if (!s) return []; // the set was deleted or isn't visible
      current = s.set_entries.filter((e) => e.have).length; of = s.set_entries.length; label = `Finish ${s.name}`;
    } else if (g.kind === "category") {
      current = owned.filter((i) => i.category === g.category).length;
      label = `${(g.target ?? 0).toLocaleString("en-US")} ${categoryOf(g.category ?? "other").label.toLowerCase()}`;
    } else {
      current = owned.length; label = `${(g.target ?? 0).toLocaleString("en-US")} items`;
    }
    const done = of > 0 && current >= of;
    return [{ ...g, label: g.title?.trim() || label, current: Math.min(current, of || current), of, done, pct: of ? Math.min(100, Math.round((current / of) * 100)) : 0 }];
  });
}
