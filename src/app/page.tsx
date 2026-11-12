import Link from "next/link";
import ItemTile from "@/components/ItemTile";
import { getUser } from "@/lib/supabase/server";
import type { Item } from "@/lib/items";
import { CATEGORIES, categoryOf } from "@/lib/categories";

export const dynamic = "force-dynamic";

type Row = Item & { owner: { username: string; is_public: boolean } | null };

export default async function Explore({ searchParams }: { searchParams: { deleted?: string; category?: string } }) {
  const { supabase, user } = await getUser();
  const category = CATEGORIES.some((c) => c.key === searchParams.category) ? searchParams.category : undefined;
  let itemsQuery = supabase.from("items").select("*, owner:profiles!inner(username, is_public)")
    .eq("owner.is_public", true).order("created_at", { ascending: false }).limit(24);
  if (category) itemsQuery = itemsQuery.eq("category", category);
  const [{ data: cars }, { data: collectors }] = await Promise.all([
    itemsQuery,
    supabase.from("profiles").select("username, items(count)").eq("is_public", true)
      .order("created_at", { ascending: false }).limit(12),
  ]);
  const rows = (cars ?? []) as Row[];
  return (
    <>
    <section className="band">
      <div className="band-in">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 640 }}>
          <h1>Explore collections</h1>
          <p className="muted" style={{ margin: 0, fontSize: 18 }}>Cards, coins, comics, diecast, sneakers, toys and more, just added by collectors. Follow the ones you like and see what they add in your feed.</p>
        </div>
        {user ? <Link className="btn primary" href="/collection/new">+ Add an item</Link>
          : <Link className="btn primary" href="/signup">Start your collection free</Link>}
      </div>
    </section>
    <main className="wrap">
      {searchParams.deleted && <p className="msg ok">Your account and everything in it has been deleted.</p>}
      <nav className="tabs" aria-label="Browse by category">
        <Link className={!category ? "on" : undefined} href="/">Everything</Link>
        {CATEGORIES.map((c) => <Link key={c.key} className={category === c.key ? "on" : undefined} href={`/?category=${c.key}`}>{c.label}</Link>)}
      </nav>
      {rows.length ? (
        <section className="gallery" aria-label="Recently added items">
          {rows.map((c) => <ItemTile key={c.id} item={c} owner={c.owner} />)}
        </section>
      ) : (
        <div className="empty"><h3>{category ? `No ${categoryOf(category).label.toLowerCase()} yet` : "No public items yet"}</h3><p>Be the first to show off your collection.</p></div>
      )}
      {!!collectors?.length && (
        <section className="card">
          <h3>Collectors</h3>
          <div className="meta">
            {collectors.map((p) => (
              <Link key={p.username} className="chip" href={`/c/${p.username}`}>
                @{p.username} · {(p.items as unknown as { count: number }[])[0]?.count ?? 0} items
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
    </>
  );
}
