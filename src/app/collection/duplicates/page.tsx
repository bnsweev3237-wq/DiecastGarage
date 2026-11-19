import Link from "next/link";
import { redirect } from "next/navigation";
import ItemTile from "@/components/ItemTile";
import SubmitButton from "@/components/SubmitButton";
import { openExtrasToTrade } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import { checkQueries } from "@/lib/report-error";
import { findDuplicates } from "@/lib/duplicates";
import type { Item } from "@/lib/items";

export const dynamic = "force-dynamic";
export const metadata = { title: "Duplicates" };

export default async function Duplicates() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/collection/duplicates");
  const loaded = await supabase.from("items").select("*").eq("owner_id", user.id).eq("status", "owned").order("created_at").limit(5000);
  await checkQueries("Duplicates", "/collection/duplicates", [loaded], user.id);
  const groups = findDuplicates((loaded.data ?? []) as Item[]);
  const extraCount = groups.reduce((n, g) => n + g.copies - 1, 0);

  return (
    <main className="wrap">
      <div className="head">
        <div><Link href="/collection">← My collection</Link><h1>🧩 Duplicates</h1>
          <p>Things you have more than one of: entries with the same name, category and grade, or a quantity over 1. Extras make great trade bait.</p></div>
        <Link className="btn" href="/trades">🔁 Trades</Link>
      </div>
      {groups.length ? <p className="hint">{groups.length} item{groups.length === 1 ? "" : "s"} with {extraCount} extra cop{extraCount === 1 ? "y" : "ies"} in all.</p> : null}
      {groups.map((g) => {
        const toOpen = g.extras.filter((i) => !i.open_to_trade);
        return (
          <section key={g.key} className="card">
            <div className="card-title">
              <h3>{g.items[0].title} <span className="hint">× {g.copies}</span></h3>
              {toOpen.length ? (
                <form action={openExtrasToTrade}>
                  {toOpen.map((i) => <input key={i.id} type="hidden" name="ids" value={i.id} />)}
                  <SubmitButton className="btn small primary" pending="…">{g.items.length > 1 ? `🔁 Open the ${toOpen.length === 1 ? "extra" : `${toOpen.length} extras`} to trade` : "🔁 Open to trade"}</SubmitButton>
                </form>
              ) : <span className="chip trade">🔁 Extras open to trade</span>}
            </div>
            {g.items.length > 1 && <p className="hint">Keeping {g.items[0].featured ? "your grail" : "the first one you added"}; the others are the extras.</p>}
            {g.items.length === 1 && <p className="hint">One entry with a quantity of {g.copies}. Opening it to trade lets people know you have spares.</p>}
            <div className="gallery">{g.items.map((i) => <ItemTile key={i.id} item={i} />)}</div>
          </section>
        );
      })}
      {!groups.length && (
        <div className="empty big"><span className="empty-emoji" aria-hidden="true">🧩</span><h3>No duplicates found</h3>
          <p>Nothing in your collection appears more than once. Items only match when the name, category and grade are the same, so check spelling if you know you have doubles.</p></div>
      )}
    </main>
  );
}
