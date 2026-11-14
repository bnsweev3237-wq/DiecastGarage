import Link from "next/link";
import ItemTile from "@/components/ItemTile";
import Avatar from "@/components/Avatar";
import { getUser } from "@/lib/supabase/server";
import type { Item } from "@/lib/items";
import { CATEGORIES, categoriesIn, categoryOf } from "@/lib/categories";

export const dynamic = "force-dynamic";

type Row = Item & { owner: { username: string; is_public: boolean } | null };
type Collector = { username: string; avatar_path: string | null; items: { count: number }[] };

// Floating stickers in the hero, one per hobby.
const STICKERS = [
  { emoji: "🃏", label: "Cards", tilt: -8 },
  { emoji: "🏎️", label: "Diecast", tilt: 6 },
  { emoji: "🪙", label: "Coins", tilt: -4 },
  { emoji: "👟", label: "Sneakers", tilt: 9 },
  { emoji: "💥", label: "Comics", tilt: -10 },
  { emoji: "🎮", label: "Games", tilt: 5 },
];

const fmt = (n: number | null) => (n ?? 0).toLocaleString("en-US");

export default async function Explore({ searchParams }: { searchParams: { deleted?: string; category?: string } }) {
  const { supabase, user } = await getUser();
  const category = CATEGORIES.some((c) => c.key === searchParams.category) ? searchParams.category : undefined;
  let itemsQuery = supabase.from("items").select("*, owner:profiles!inner(username, is_public)")
    .eq("owner.is_public", true).order("created_at", { ascending: false }).limit(24);
  if (category) itemsQuery = itemsQuery.eq("category", category);
  const [{ data: items }, { data: collectors }, { count: itemCount }, { count: collectorCount }, { count: saleCount }] = await Promise.all([
    itemsQuery,
    supabase.from("profiles").select("username, avatar_path, items(count)").eq("is_public", true)
      .order("created_at", { ascending: false }).limit(12),
    supabase.from("items").select("id, owner:profiles!inner(is_public)", { count: "exact", head: true }).eq("owner.is_public", true).eq("is_hidden", false),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_public", true),
    supabase.from("items").select("id, owner:profiles!inner(is_public)", { count: "exact", head: true }).eq("owner.is_public", true).eq("for_sale", true).eq("is_hidden", false),
  ]);
  const rows = (items ?? []) as Row[];
  const people = (collectors ?? []) as unknown as Collector[];
  const picked = category ? categoryOf(category) : null;

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <div className="hero-copy">
            <span className="kicker">The home base for collectors</span>
            <h1>Show off <span className="hl">what you collect.</span></h1>
            <p>Catalog every piece, see what it&apos;s worth from real sold listings, and follow collectors who are into the same stuff you are.</p>
            <div className="hero-actions">
              {user ? <Link className="btn primary big" href="/collection/new">+ Add an item</Link>
                : <Link className="btn primary big" href="/signup">Start your collection free →</Link>}
              <Link className="btn ghost big" href="/for-sale">See what&apos;s for sale</Link>
            </div>
            <dl className="hero-stats">
              <div><dt>Items</dt><dd className="num">{fmt(itemCount)}</dd></div>
              <div><dt>Collectors</dt><dd className="num">{fmt(collectorCount)}</dd></div>
              <div><dt>For sale</dt><dd className="num">{fmt(saleCount)}</dd></div>
            </dl>
          </div>
          <div className="stickers" aria-hidden="true">
            {STICKERS.map((s, i) => (
              <span key={s.label} className="sticker" style={{ "--tilt": `${s.tilt}deg`, "--delay": `${i * -0.7}s` } as React.CSSProperties}>
                <span className="sticker-emoji">{s.emoji}</span>{s.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((n) => (
            <span key={n}>{CATEGORIES.map((c) => <span key={c.key}>{c.label} <b>★</b> </span>)}</span>
          ))}
        </div>
      </div>

      <main className="wrap">
        {searchParams.deleted && <p className="msg ok">Your account and everything in it has been deleted.</p>}

        <nav className="cats" aria-label="Browse by category">
          <Link className={!category ? "on" : undefined} href="/"><span className="cat-emoji">🔥</span>Everything</Link>
          {[...(picked && picked.group !== "popular" ? [picked] : []), ...categoriesIn("popular")].map((c) => (
            <Link key={c.key} className={category === c.key ? "on" : undefined} href={`/?category=${c.key}`}>
              <span className="cat-emoji">{c.emoji}</span>{c.label}
            </Link>
          ))}
          <Link className="more" href="/categories"><span className="cat-emoji">🗂️</span>All {CATEGORIES.length} categories →</Link>
        </nav>

        <div className="sec-head">
          <h2>{picked ? <>{picked.emoji} {picked.label}</> : "Just added"}</h2>
          <Link href="/for-sale">Shop items for sale →</Link>
        </div>
        {rows.length ? (
          <section className="gallery" aria-label="Recently added items">
            {rows.map((c) => <ItemTile key={c.id} item={c} owner={c.owner} />)}
          </section>
        ) : (
          <div className="empty big">
            <span className="empty-emoji" aria-hidden="true">{picked?.emoji ?? "🏆"}</span>
            <h3>{picked ? `No ${picked.label.toLowerCase()} yet` : "No public items yet"}</h3>
            <p>Be the first to show yours off. Your collection could be the one everyone&apos;s talking about.</p>
            <Link className="btn primary" href={user ? "/collection/new" : "/signup"}>{user ? "+ Add an item" : "Start your collection free"}</Link>
          </div>
        )}

        {!user && (
          <section className="steps" aria-label="How it works">
            <div className="step"><b>01</b><h3>Catalog it</h3><p>Snap a photo and add the details that matter for your hobby: set, grade, scale, mint mark and more.</p></div>
            <div className="step"><b>02</b><h3>Know its value</h3><p>Log real sold listings from eBay and Facebook Marketplace, and watch your collection&apos;s worth add up.</p></div>
            <div className="step"><b>03</b><h3>Show it off</h3><p>Share your page, follow other collectors, trade comments, and link your eBay listings when it&apos;s time to sell.</p></div>
          </section>
        )}

        {!!people.length && (
          <>
            <div className="sec-head"><h2>Collectors to follow</h2></div>
            <section className="people">
              {people.map((p) => (
                <Link key={p.username} className="person" href={`/c/${p.username}`}>
                  <Avatar path={p.avatar_path} username={p.username} size="small" />
                  <span><b>@{p.username}</b><span className="muted">{p.items?.[0]?.count ?? 0} items</span></span>
                </Link>
              ))}
            </section>
          </>
        )}
      </main>
    </>
  );
}
