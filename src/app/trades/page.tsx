import Link from "next/link";
import { redirect } from "next/navigation";
import ItemTile from "@/components/ItemTile";
import { getUser } from "@/lib/supabase/server";
import { checkQueries } from "@/lib/report-error";
import type { Item } from "@/lib/items";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trades" };

type Match = { direction: "theirs" | "mine"; item_id: string; other_id: string; wish_id: string; wish_title: string };
type Owned = Item & { owner: { username: string } | null };

// Trade matches, worked out by the database (trade_matches in supabase/migrations/0031_trades.sql).
export default async function Trades() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/trades");
  const first = await Promise.all([
    supabase.rpc("trade_matches"),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("open_to_trade", true),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("status", "wishlist"),
    supabase.from("profiles").select("username").eq("id", user.id).single(),
  ]);
  await checkQueries("Trades", "/trades", first, user.id);
  const [{ data: rows }, { count: myTradeCount }, { count: myWishCount }, { data: me }] = first;
  const matches = (rows ?? []) as Match[];
  const itemIds = [...new Set(matches.map((m) => m.item_id))];
  const otherIds = [...new Set(matches.map((m) => m.other_id))];
  const second = await Promise.all([
    itemIds.length ? supabase.from("items").select("*, owner:profiles!cars_owner_id_fkey(username)").in("id", itemIds) : Promise.resolve({ data: [] }),
    otherIds.length ? supabase.from("profiles").select("id, username").in("id", otherIds) : Promise.resolve({ data: [] }),
  ]);
  await checkQueries("Trades", "/trades", second, user.id);
  const items = new Map(((second[0].data ?? []) as Owned[]).map((i) => [i.id, i]));
  const names = new Map(((second[1].data ?? []) as { id: string; username: string }[]).map((p) => [p.id, p.username]));

  const theirs = matches.filter((m) => m.direction === "theirs" && items.has(m.item_id));
  const mine = matches.filter((m) => m.direction === "mine" && items.has(m.item_id) && names.has(m.other_id));
  // Two-way: they have something you want, and want something you're trading.
  const twoWay = otherIds.filter((id) => theirs.some((m) => m.other_id === id) && mine.some((m) => m.other_id === id) && names.has(id));
  const wishFor = (itemId: string) => [...new Set(theirs.filter((m) => m.item_id === itemId).map((m) => m.wish_title))];
  const theirItems = (otherId: string) => [...new Set(theirs.filter((m) => m.other_id === otherId).map((m) => m.item_id))].map((id) => items.get(id)!);
  const myItemsWanted = (otherId: string) => [...new Set(mine.filter((m) => m.other_id === otherId).map((m) => m.item_id))].map((id) => items.get(id)!);
  // Items from two-way matches are already shown above.
  const oneWayTheirs = [...new Set(theirs.filter((m) => !twoWay.includes(m.other_id)).map((m) => m.item_id))].map((id) => items.get(id)!);
  const wantedBy = (itemId: string) => mine.filter((m) => m.item_id === itemId);
  const myWanted = [...new Set(mine.map((m) => m.item_id))].map((id) => items.get(id)!);

  return (
    <main className="wrap">
      <div className="head">
        <div><Link href="/collection">← My collection</Link><h1>🔁 Trades</h1>
          <p>Matches between what you&apos;re trading and other collectors&apos; wishlists, and the other way around. Talk trades over in the comments on the item.</p></div>
        {me && <Link className="btn" href={`/c/${me.username}?filter=trade`}>My items open to trade ({myTradeCount ?? 0})</Link>}
      </div>

      {(!myTradeCount || !myWishCount) && (
        <p className="notice">
          {!myTradeCount && <>Tick <b>🔁 Open to trade</b> on items you&apos;d trade away so others can find them. </>}
          {!myWishCount && <>Add what you&apos;re hunting for with <Link href="/collection/new?status=wishlist">+ Wishlist</Link> to see items up for trade that match.</>}
        </p>
      )}

      {twoWay.length > 0 && <>
        <div className="sec-head"><h2>🤝 Two-way matches</h2></div>
        {twoWay.map((id) => (
          <section key={id} className="card trade-match">
            <div className="card-title"><h3><Link href={`/c/${names.get(id)}`}>@{names.get(id)}</Link></h3>
              <span className="hint">has {theirItems(id).length} you want · wants {myItemsWanted(id).length} of yours</span></div>
            <div className="gallery">{theirItems(id).map((i) => <ItemTile key={i.id} item={i} owner={i.owner} />)}</div>
            <p className="hint">They want: {myItemsWanted(id).map((i, n) => <span key={i.id}>{n ? ", " : ""}<Link href={`/collection/${i.id}`}>{i.title}</Link></span>)}</p>
          </section>
        ))}
      </>}

      <div className="sec-head"><h2>🎯 {twoWay.length ? "More up for trade" : "Up for trade"}, on your wishlist</h2></div>
      {oneWayTheirs.length ? (
        <section className="gallery">
          {oneWayTheirs.map((i) => (
            <div key={i.id} className="shelf-slot">
              <ItemTile item={i} owner={i.owner} />
              <span className="hint">Matches “{wishFor(i.id).join("”, “")}” on your wishlist</span>
            </div>
          ))}
        </section>
      ) : <p className="hint">Nothing yet. When someone marks an item open to trade that matches your wishlist, it shows here and you get a 🔁 notification.</p>}

      <div className="sec-head"><h2>📣 Your trade items others want</h2></div>
      {myWanted.length ? (
        <div className="card">
          {myWanted.map((i) => (
            <div key={i.id} className="trade-row">
              <Link href={`/collection/${i.id}`}><b>{i.title}</b></Link>
              <span className="hint">wanted by {wantedBy(i.id).map((m, n) => <span key={m.wish_id}>{n ? ", " : ""}<Link href={`/c/${names.get(m.other_id)}?filter=wishlist`}>@{names.get(m.other_id)}</Link></span>)}</span>
            </div>
          ))}
        </div>
      ) : <p className="hint">None of your items open to trade are on anyone&apos;s wishlist yet.</p>}
    </main>
  );
}
