import Link from "next/link";
import ItemPlaceholder from "@/components/ItemPlaceholder";
import { Stars } from "@/components/Stars";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { FREE_ITEM_LIMIT, isMember } from "@/lib/limits";
import { certLabel, money, photoUrl, signed, gainCost, valueOf, type Item, type ItemStatus, type Comp, type Purchase } from "@/lib/items";
import { CATEGORIES, categoryOf, summary } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "My collection" };

type Row = Item & { item_purchases: Purchase | null; comps: Comp[] };
type Params = { category?: string; status?: string; tag?: string };

const VIEWS: { key: ItemStatus; label: string }[] = [
  { key: "owned", label: "Collection" },
  { key: "wishlist", label: "Wishlist" },
  { key: "sold", label: "Sold" },
];

export default async function MyCollection({ searchParams }: { searchParams: Params }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/collection");
  const [{ data }, { data: membership }, { data: me }] = await Promise.all([
    supabase.from("items").select("*, item_purchases(*), comps(*)").eq("owner_id", user.id)
      .order("featured", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("memberships").select("status, comp_active, comp_until").eq("user_id", user.id).single(),
    supabase.from("profiles").select("username, is_public").eq("id", user.id).single(),
  ]);
  const everything = (data ?? []) as Row[];
  const view: ItemStatus = VIEWS.some((v) => v.key === searchParams.status) ? (searchParams.status as ItemStatus) : "owned";
  const all = everything.filter((i) => i.status === view);
  const used = CATEGORIES.filter((c) => all.some((i) => i.category === c.key));
  const tags = [...new Set(all.flatMap((i) => i.tags ?? []))].sort((a, b) => a.localeCompare(b));
  const items = all
    .filter((i) => !searchParams.category || i.category === searchParams.category)
    .filter((i) => !searchParams.tag || (i.tags ?? []).some((t) => t.toLowerCase() === searchParams.tag!.toLowerCase()));
  const member = isMember(membership);
  const atLimit = !member && everything.length >= FREE_ITEM_LIMIT;
  const link = (p: Params) => {
    const q = new URLSearchParams(Object.entries({ status: view === "owned" ? undefined : view, ...p }).filter(([, v]) => v) as [string, string][]);
    const qs = q.toString();
    return `/collection${qs ? `?${qs}` : ""}`;
  };

  let cost = 0, value = 0, valued = 0, gainBase = 0, gainVal = 0, soldFor = 0, profit = 0, profitKnown = 0, pieces = 0;
  const rows = items.map((c) => {
    const p = c.item_purchases;
    const v = valueOf(p, c.comps);
    // Price paid plus whichever of shipping, tax and fees the collector chose to include.
    const tc = gainCost(p);
    pieces += c.quantity ?? 1;
    cost += tc ?? 0;
    if (view === "sold") {
      const sp = p?.sold_price != null ? Number(p.sold_price) : null;
      soldFor += sp ?? 0;
      const g = sp != null && tc != null ? sp - tc : null;
      if (g != null) { profit += g; profitKnown++; }
      return { c, p, v, tc, gain: g };
    }
    if (v) { value += v.value; valued++; if (tc != null) { gainBase += tc; gainVal += v.value; } }
    return { c, p, v, tc, gain: v && tc != null ? v.value - tc : null };
  });
  const gain = gainVal - gainBase;

  return (
    <main className="wrap">
      <div className="head">
        <div>
          <h1>My collection</h1>
          <p>
            {member ? "Member: unlimited items." : `${everything.length} of ${FREE_ITEM_LIMIT} free items used.`}{" "}
            {me && <>Your collection is {me.is_public ? <Link href={`/c/${me.username}`}>public</Link> : "private"}. What you paid, sale prices and gain or loss are only shown to you.</>}
          </p>
        </div>
        {atLimit ? <Link className="btn flag" href="/settings#membership">Become a member to add more</Link>
          : <div className="actions">
              <Link className="btn" href="/collection/new?status=wishlist">+ Wishlist</Link>
              <Link className="btn primary" href="/collection/new">+ Add an item</Link>
            </div>}
      </div>

      <nav className="seg-tabs" aria-label="Collection, wishlist or sold">
        {VIEWS.map((v) => (
          <Link key={v.key} className={view === v.key ? "on" : undefined} href={v.key === "owned" ? "/collection" : `/collection?status=${v.key}`}>
            {v.label} <span className="num">{everything.filter((i) => i.status === v.key).length}</span>
          </Link>
        ))}
      </nav>

      {used.length > 1 && (
        <nav className="tabs" aria-label="Filter by category">
          <Link className={!searchParams.category ? "on" : undefined} href={link({ tag: searchParams.tag })}>All ({all.length})</Link>
          {used.map((c) => <Link key={c.key} className={searchParams.category === c.key ? "on" : undefined} href={link({ category: c.key, tag: searchParams.tag })}>{c.emoji} {c.label} ({all.filter((i) => i.category === c.key).length})</Link>)}
        </nav>
      )}
      {tags.length > 0 && (
        <nav className="meta" aria-label="Filter by tag">
          {searchParams.tag && <Link className="chip tag on" href={link({ category: searchParams.category })}>#{searchParams.tag} ✕</Link>}
          {tags.filter((t) => t.toLowerCase() !== searchParams.tag?.toLowerCase()).map((t) => (
            <Link key={t} className="chip tag" href={link({ category: searchParams.category, tag: t })}>#{t}</Link>
          ))}
        </nav>
      )}

      {view === "owned" && (
        <section className="totals" aria-label="Collection totals">
          <div className="total"><span className="label">Items</span><span className="v num">{items.length}</span><span className="n">{pieces !== items.length ? `${pieces} pieces · ` : ""}{valued} valued</span></div>
          <div className="total"><span className="label">Cost</span><span className="v num">{money(cost)}</span><span className="n">paid, plus extras you chose</span></div>
          <div className="total"><span className="label">Est. value</span><span className="v num">{money(value)}</span><span className="n">median of sold listings</span></div>
          <div className="total"><span className="label">Gain / loss</span>
            <span className={`v num ${valued ? (gain >= 0 ? "up" : "down") : ""}`}>{valued ? signed(gain) : "—"}</span>
            <span className="n">{valued && gainBase ? `${((gain / gainBase) * 100).toFixed(0)}% vs. what it cost` : "on valued items"}</span></div>
        </section>
      )}
      {view === "sold" && (
        <section className="totals" aria-label="Sales totals">
          <div className="total"><span className="label">Sold</span><span className="v num">{items.length}</span><span className="n">items</span></div>
          <div className="total"><span className="label">Total cost</span><span className="v num">{money(cost)}</span><span className="n">paid, plus extras you chose</span></div>
          <div className="total"><span className="label">Sold for</span><span className="v num">{money(soldFor)}</span><span className="n">sale prices</span></div>
          <div className="total"><span className="label">Profit</span>
            <span className={`v num ${profitKnown ? (profit >= 0 ? "up" : "down") : ""}`}>{profitKnown ? signed(profit) : "—"}</span>
            <span className="n">on {profitKnown} with both prices</span></div>
        </section>
      )}

      {items.length ? (
        <section className="list">
          <div className="row headrow">
            <span className="label">Item</span>
            <span className="label r">{view === "wishlist" ? "" : "Cost"}</span>
            <span className="label r">{view === "sold" ? "Sold for" : view === "wishlist" ? "Going for" : "Est. value"}</span>
            <span className="label r">{view === "sold" ? "Profit" : view === "wishlist" ? "" : "Gain / loss"}</span>
          </div>
          {rows.map(({ c, p, v, tc, gain }) => {
            const src = photoUrl(c.photo_path);
            const cert = certLabel(c);
            return (
              <Link key={c.id} href={`/collection/${c.id}`} className="row">
                <div className="car">
                  {src ? <img className="thumb" src={src} alt="" loading="lazy" /> : <span className="thumb" aria-hidden="true"><ItemPlaceholder width={56} /></span>}
                  <div className="car-text">
                    <div className="car-title">{c.featured && <span className="grail-star" title="Featured">★ </span>}{c.title}{c.quantity > 1 && <span className="qty"> ×{c.quantity}</span>}</div>
                    <div className="meta">
                      {c.is_hidden && <span className="chip box">Hidden</span>}
                      {c.for_sale && <span className="chip sale">For sale</span>}
                      {cert && <span className="chip cert">{cert}</span>}
                      <span className="chip cat">{categoryOf(c.category).emoji} {categoryOf(c.category).label}</span>
                      {summary(c) && <span className="hint">{summary(c)}</span>}
                      <Stars value={c.rating} small />
                      {p?.storage_location && <span className="hint">📦 {p.storage_location}</span>}
                    </div>
                  </div>
                </div>
                <div className="r"><span className="label mlabel">{view === "wishlist" ? "" : "Cost"}</span><span className="num">{view === "wishlist" ? "" : tc != null ? money(tc, 2) : "—"}</span></div>
                <div className="r"><span className="label mlabel">{view === "sold" ? "Sold" : "Value"}</span>
                  <span className="num">{view === "sold" ? (p?.sold_price != null ? money(Number(p.sold_price), 2) : "—") : v ? money(v.value, 2) : "—"}</span>
                  <span className="sm">{view === "sold" ? p?.sold_at ?? "" : v ? (v.manual ? (view === "wishlist" ? "target" : "your value") : `${v.est!.n} sold`) : ""}</span></div>
                <div className="r"><span className="label mlabel">{view === "wishlist" ? "" : "Gain"}</span>
                  {view === "wishlist" ? null : gain == null
                    ? <span className="pill none">{view === "sold" ? "add both prices" : v ? "no price paid" : "needs sold listings"}</span>
                    : <span className={`pill ${gain >= 0 ? "up" : "down"}`}>{signed(Math.round(gain))}</span>}</div>
              </Link>
            );
          })}
        </section>
      ) : (
        <div className="empty">
          {view === "wishlist" ? <>
            <h3>Your wishlist is empty</h3>
            <p>Add the pieces you&apos;re hunting for. Other collectors can see your wishlist, and you can track what they&apos;re going for.</p>
            <Link className="btn primary" href="/collection/new?status=wishlist">+ Add to wishlist</Link>
          </> : view === "sold" ? <>
            <h3>Nothing sold yet</h3>
            <p>When you sell something, open it and set its status to Sold with the sale price. It stays on record so you can see your real profit.</p>
          </> : <>
            <h3>{all.length ? "Nothing matches" : "Your collection is empty"}</h3>
            <p>Add your first item with photos and what you paid: cards, coins, comics, diecast, sneakers, toys or anything else. Then log a few sold eBay or Facebook Marketplace listings to estimate its value.</p>
            <Link className="btn primary" href="/collection/new">+ Add an item</Link>
          </>}
        </div>
      )}
    </main>
  );
}
