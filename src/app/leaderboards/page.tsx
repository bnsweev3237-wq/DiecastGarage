import Link from "next/link";
import Avatar from "@/components/Avatar";
import Thumb from "@/components/Thumb";
import { getUser } from "@/lib/supabase/server";
import { checkQueries } from "@/lib/report-error";
import { categoryOf } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboards", description: "Top-rated items, most-followed collectors and fastest-growing collections on theCollectorHQ." };

// Worked out by the database from public collections only (supabase/migrations/0035_leaderboards_reputation.sql).
export default async function Leaderboards() {
  const { supabase, user } = await getUser();
  const boards = await Promise.all([
    supabase.rpc("leaderboard_items", { p_days: 30, p_limit: 10 }),
    supabase.rpc("leaderboard_followed", { p_limit: 10 }),
    supabase.rpc("leaderboard_growing", { p_days: 30, p_limit: 10 }),
  ]);
  await checkQueries("Leaderboards", "/leaderboards", boards, user?.id);
  const top = (boards[0].data ?? []) as { item_id: string; ratings: number; avg_stars: number }[];
  const followed = (boards[1].data ?? []) as { profile_id: string; followers: number }[];
  const growing = (boards[2].data ?? []) as { profile_id: string; added: number }[];
  const people = [...new Set([...followed, ...growing].map((r) => r.profile_id))];
  const details = await Promise.all([
    top.length ? supabase.from("items").select("id, title, category, photo_path, owner:profiles!cars_owner_id_fkey(username)").in("id", top.map((t) => t.item_id)) : Promise.resolve({ data: [] }),
    people.length ? supabase.from("profiles").select("id, username, avatar_path").in("id", people) : Promise.resolve({ data: [] }),
  ]);
  await checkQueries("Leaderboards", "/leaderboards", details, user?.id);
  const items = new Map(((details[0].data ?? []) as unknown as { id: string; title: string; category: string; photo_path: string | null; owner: { username: string } | null }[]).map((i) => [i.id, i]));
  const profiles = new Map(((details[1].data ?? []) as { id: string; username: string; avatar_path: string | null }[]).map((p) => [p.id, p]));
  const empty = <p className="hint">Nothing here yet. Check back soon.</p>;

  return (
    <main className="wrap">
      <div className="head">
        <div><Link href="/">← Explore</Link><h1>🏆 Leaderboards</h1>
          <p>Who&apos;s on top right now, from public collections. Updated live.</p></div>
      </div>
      <div className="board-grid">
        <section className="card">
          <h3>⭐ Top-rated items</h3><p className="hint">Best rated by collectors in the last 30 days (2 or more ratings).</p>
          {top.length ? <ol className="board">{top.map((t) => {
            const i = items.get(t.item_id);
            if (!i?.owner) return null;
            return (
              <li key={t.item_id}><Link href={`/c/${i.owner.username}/${i.id}`}>
                {i.photo_path ? <Thumb className="pick-img" path={i.photo_path} /> : <span className="pick-img" />}
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}><b>{i.title}</b><span className="hint">{categoryOf(i.category).emoji} @{i.owner.username}</span></span>
                <span className="num">★ {Number(t.avg_stars).toFixed(1)} <span className="hint">({t.ratings})</span></span>
              </Link></li>
            );
          })}</ol> : empty}
        </section>
        <section className="card">
          <h3>👥 Most followed</h3><p className="hint">Collectors with the most followers.</p>
          {followed.length ? <ol className="board">{followed.map((r) => {
            const p = profiles.get(r.profile_id);
            return p && <li key={r.profile_id}><Link href={`/c/${p.username}`}><Avatar path={p.avatar_path} username={p.username} size="small" /><b>@{p.username}</b><span className="num">{Number(r.followers).toLocaleString("en-US")}</span></Link></li>;
          })}</ol> : empty}
        </section>
        <section className="card">
          <h3>🚀 Fastest growing</h3><p className="hint">Most items added in the last 30 days.</p>
          {growing.length ? <ol className="board">{growing.map((r) => {
            const p = profiles.get(r.profile_id);
            return p && <li key={r.profile_id}><Link href={`/c/${p.username}`}><Avatar path={p.avatar_path} username={p.username} size="small" /><b>@{p.username}</b><span className="num">+{Number(r.added).toLocaleString("en-US")}</span></Link></li>;
          })}</ol> : empty}
        </section>
      </div>
    </main>
  );
}
