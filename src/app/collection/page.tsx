import Link from "next/link";
import ItemPlaceholder from "@/components/ItemPlaceholder";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { FREE_ITEM_LIMIT, isActiveMembership } from "@/lib/limits";
import { money, photoUrl, signed, valueOf, type Item, type Comp, type Purchase } from "@/lib/items";
import { CATEGORIES, categoryOf, summary } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "My collection" };

type Row = Item & { item_purchases: Purchase | null; comps: Comp[] };

export default async function MyCollection({ searchParams }: { searchParams: { category?: string } }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/collection");
  const [{ data }, { data: membership }, { data: me }] = await Promise.all([
    supabase.from("items").select("*, item_purchases(*), comps(*)").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("memberships").select("status").eq("user_id", user.id).single(),
    supabase.from("profiles").select("username, is_public").eq("id", user.id).single(),
  ]);
  const all = (data ?? []) as Row[];
  const used = CATEGORIES.filter((c) => all.some((i) => i.category === c.key));
  const items = searchParams.category ? all.filter((i) => i.category === searchParams.category) : all;
  const member = isActiveMembership(membership?.status);
  const atLimit = !member && all.length >= FREE_ITEM_LIMIT;

  let paid = 0, value = 0, valued = 0, gainBase = 0, gainVal = 0;
  const rows = items.map((c) => {
    const p = c.item_purchases;
    const v = valueOf(p, c.comps);
    const hasPaid = p?.paid != null;
    paid += Number(p?.paid ?? 0);
    if (v) { value += v.value; valued++; if (hasPaid) { gainBase += Number(p!.paid); gainVal += v.value; } }
    return { c, p, v, gain: v && hasPaid ? v.value - Number(p!.paid) : null };
  });
  const gain = gainVal - gainBase;

  return (
    <main className="wrap">
      <div className="head">
        <div>
          <h1>My collection</h1>
          <p>
            {member ? "Member: unlimited items." : `${all.length} of ${FREE_ITEM_LIMIT} free items used.`}{" "}
            {me && <>Your collection is {me.is_public ? <Link href={`/c/${me.username}`}>public</Link> : "private"}. What you paid and gain or loss are only shown to you.</>}
          </p>
        </div>
        {atLimit ? <Link className="btn flag" href="/settings#membership">Become a member to add more</Link>
          : <Link className="btn primary" href="/collection/new">+ Add an item</Link>}
      </div>

      {used.length > 1 && (
        <nav className="tabs" aria-label="Filter by category">
          <Link className={!searchParams.category ? "on" : undefined} href="/collection">All ({all.length})</Link>
          {used.map((c) => <Link key={c.key} className={searchParams.category === c.key ? "on" : undefined} href={`/collection?category=${c.key}`}>{c.label} ({all.filter((i) => i.category === c.key).length})</Link>)}
        </nav>
      )}

      <section className="totals" aria-label="Collection totals">
        <div className="total"><span className="label">Items</span><span className="v num">{items.length}</span><span className="n">{valued} valued · {items.length - valued} need sold listings</span></div>
        <div className="total"><span className="label">Total paid</span><span className="v num">{money(paid)}</span><span className="n">purchase prices</span></div>
        <div className="total"><span className="label">Est. value</span><span className="v num">{money(value)}</span><span className="n">median of sold listings</span></div>
        <div className="total"><span className="label">Gain / loss</span>
          <span className={`v num ${valued ? (gain >= 0 ? "up" : "down") : ""}`}>{valued ? signed(gain) : "—"}</span>
          <span className="n">{valued && gainBase ? `${((gain / gainBase) * 100).toFixed(0)}% vs. what you paid` : "on valued items"}</span></div>
      </section>

      {items.length ? (
        <section className="list">
          <div className="row headrow"><span className="label">Item</span><span className="label r">Paid</span><span className="label r">Est. value</span><span className="label r">Gain / loss</span></div>
          {rows.map(({ c, p, v, gain }) => {
            const src = photoUrl(c.photo_path);
            return (
              <Link key={c.id} href={`/collection/${c.id}`} className="row">
                <div className="car">
                  {src ? <img className="thumb" src={src} alt="" loading="lazy" /> : <span className="thumb" aria-hidden="true"><ItemPlaceholder width={56} /></span>}
                  <div className="car-text">
                    <div className="car-title">{c.title}</div>
                    <div className="meta">
                      {c.is_hidden && <span className="chip box">Hidden</span>}
                      {c.for_sale && <span className="chip sale">For sale</span>}
                      <span className="chip cat">{categoryOf(c.category).label}</span>
                      {summary(c) && <span className="hint">{summary(c)}</span>}
                    </div>
                  </div>
                </div>
                <div className="r"><span className="label mlabel">Paid</span><span className="num">{p?.paid != null ? money(Number(p.paid), 2) : "—"}</span></div>
                <div className="r"><span className="label mlabel">Value</span><span className="num">{v ? money(v.value, 2) : "—"}</span>
                  <span className="sm">{v ? (v.manual ? "your value" : `${v.est!.n} sold`) : ""}</span></div>
                <div className="r"><span className="label mlabel">Gain</span>
                  {gain == null ? <span className="pill none">{v ? "no price paid" : "needs sold listings"}</span>
                    : <span className={`pill ${gain >= 0 ? "up" : "down"}`}>{signed(Math.round(gain))}</span>}</div>
              </Link>
            );
          })}
        </section>
      ) : (
        <div className="empty">
          <h3>{all.length ? "Nothing in this category" : "Your collection is empty"}</h3>
          <p>Add your first item with a photo and what you paid: cards, coins, comics, diecast, sneakers, toys or anything else. Then log a few sold eBay or Facebook Marketplace listings to estimate its value.</p>
          <Link className="btn primary" href="/collection/new">+ Add an item</Link>
        </div>
      )}
    </main>
  );
}
