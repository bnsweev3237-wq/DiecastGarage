import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ItemForm from "@/components/ItemForm";
import CompForm from "@/components/CompForm";
import DeleteItem from "@/components/DeleteItem";
import { MembersBadge } from "@/components/MembersOnly";
import { isMember } from "@/lib/limits";
import { removeComp } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import { conditionLabel } from "@/lib/categories";
import { certLabel, ebaySoldUrl, facebookUrl, money, searchTerms, signed, gainCost, leftOutExtras, valueOf, type Item, type Comp, type Purchase } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function EditItem({ params, searchParams }: { params: { id: string }; searchParams: { added?: string } }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const [{ data: car }, { data: me }, { data: membership }] = await Promise.all([
    supabase.from("items").select("*, item_purchases(*), comps(*)").eq("id", params.id).eq("owner_id", user.id).maybeSingle(),
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase.from("memberships").select("status, comp_active, comp_until").eq("user_id", user.id).maybeSingle(),
  ]);
  const member = isMember(membership);
  if (!car) notFound();
  const c = car as Item & { item_purchases: Purchase | null; comps: Comp[] };
  const purchase = c.item_purchases;
  const comps = [...c.comps].sort((a, b) => (b.sold_on ?? "").localeCompare(a.sold_on ?? ""));
  const v = valueOf(purchase, comps);
  const sold = c.status === "sold";
  // Price paid plus whichever of shipping, tax and fees the collector chose to include.
  const cost = gainCost(purchase);
  const extras = cost != null && cost !== Number(purchase!.paid);
  const leftOut = leftOutExtras(purchase);
  const soldFor = sold && purchase?.sold_price != null ? Number(purchase.sold_price) : null;
  const gain = sold ? (soldFor != null && cost != null ? soldFor - cost : null) : v && cost != null ? v.value - cost : null;
  const terms = searchTerms(c);

  return (
    <main className="wrap">
      <div className="head">
        <div><Link href="/collection">← My collection</Link><h1>{c.title}</h1></div>
        <div className="actions">
          <Link className="btn" href={`/collection/new?copy=${c.id}`}>＋ Add another like this</Link>
          {me && <Link className="btn" href={`/c/${me.username}/${c.id}`}>View public page</Link>}
        </div>
      </div>
      {c.under_review && <p className="notice">This item is hidden from other collectors while our team reviews reports about it. You can still edit it.</p>}
      {searchParams.added && <p className="msg ok">Added to your collection. Log a few sold listings to estimate its value.</p>}
      <div className="editor">
        <ItemForm userId={user.id} member={member} item={c} purchase={purchase} />
        <div className="side">
          {member ? <>
          <section className="card">
            <h3>{sold ? "Your sale" : c.status === "wishlist" ? "What it's going for" : "Estimated value"}</h3>
            <div className="est">
              {sold ? <div><span className="label">Sold for</span><div className="v">{soldFor != null ? money(soldFor, 2) : "—"}</div></div>
                : <div><span className="label">{v?.manual ? (c.status === "wishlist" ? "Target price" : "Your value") : v?.adjustment ? "After condition" : "Median sold"}</span><div className="v">{v ? money(v.value, 2) : "—"}</div></div>}
              {c.status !== "wishlist" && <div><span className="label">{extras ? "Cost" : "Paid"}</span><div className="v">{cost != null ? money(cost, 2) : "—"}</div></div>}
              {c.status !== "wishlist" && <div><span className="label">{sold ? "Profit" : "Gain / loss"}</span><div className={`v ${gain == null ? "" : gain >= 0 ? "up" : "down"}`}>{gain == null ? "—" : signed(Math.round(gain))}</div></div>}
            </div>
            {extras && <p className="hint">Cost is {money(Number(purchase!.paid), 2)} paid{purchase!.include_shipping && purchase!.shipping ? ` + ${money(Number(purchase!.shipping), 2)} shipping` : ""}{purchase!.include_tax && purchase!.tax ? ` + ${money(Number(purchase!.tax), 2)} tax` : ""}{purchase!.include_fees && purchase!.fees ? ` + ${money(Number(purchase!.fees), 2)} fees` : ""}.</p>}
            {c.status !== "wishlist" && leftOut.length > 0 && <p className="hint">Not counted in {sold ? "profit" : "gain or loss"}: {leftOut.map((x) => `${money(x.amount, 2)} ${x.label}`).join(", ")}. Tick “Include in gain/loss calculations” on the item to count {leftOut.length > 1 ? "them" : "it"}.</p>}
            {(purchase?.storage_location || purchase?.acquired_from) && (
              <p className="hint">{purchase?.acquired_from && <>Got it from {purchase.acquired_from}. </>}{purchase?.storage_location && <>Stored in {purchase.storage_location}.</>}</p>
            )}
            {v && !v.manual && v.adjustment > 0 && v.est && (
              <p className="hint">Median sold {money(v.est.median, 2)} − {v.adjustment}% condition adjustment = <b>{money(v.value, 2)}</b>.</p>
            )}
            <p className="hint">
              {v?.est
                ? `Based on ${v.est.n} sold listing${v.est.n > 1 ? "s" : ""}${v.est.olderOnly ? " (all over a year old, so treat it as rough)" : " from the last 12 months"}${v.est.n >= 5 ? ", with the highest and lowest dropped" : ""}. Range ${money(v.est.low)}–${money(v.est.high)}.${v.manual ? ` Sold listings say ${money(v.est.median, 2)}; your own value is used instead.` : ""}`
                : "No sold listings yet. Search below and log what similar items actually sold for."}
            </p>
          </section>
          <section className="card">
            <div className="card-title"><h3>Sold listings</h3><span className="hint">{comps.length} logged · only you see these</span></div>
            <div className="actions">
              <a className="btn small" href={ebaySoldUrl(terms)} target="_blank" rel="noopener noreferrer">eBay sold listings ↗</a>
              <a className="btn small" href={facebookUrl(terms)} target="_blank" rel="noopener noreferrer">Facebook Marketplace ↗</a>
            </div>
            <p className="hint">
              Searching “{terms}”. eBay shows completed sales with the price in green. Facebook doesn&apos;t publish sold prices, so log listings marked Sold or Pending.
              Compare like with like: same condition{c.condition ? ` (${conditionLabel(c.condition)})` : ""}{c.is_certified && c.cert_type === "graded" ? `, same grade (${certLabel(c)})` : ""}, and {c.in_package ? "in its packaging" : "out of its packaging"}.
            </p>
            <div>
              {comps.length ? comps.map((k) => (
                <div className="comp-row" key={k.id}>
                  <span className="num">{money(Number(k.price), 2)}</span>
                  <span className="date num hint">{k.sold_on ?? "no date"}</span>
                  <span className="note"><span className="src">{k.source}</span>{" "}
                    {k.url ? <a href={k.url} target="_blank" rel="noopener noreferrer">{k.note || "listing"} ↗</a> : k.note}</span>
                  <form action={removeComp}>
                    <input type="hidden" name="id" value={k.id} /><input type="hidden" name="item_id" value={c.id} />
                    <button className="linkbtn" type="submit" aria-label="Remove sold listing">✕</button>
                  </form>
                </div>
              )) : <p className="hint">Nothing logged yet.</p>}
            </div>
            <CompForm itemId={c.id} />
          </section>
          </> : (
            <section className="card members-teaser">
              <div className="card-title"><h3>What&apos;s it worth?</h3><MembersBadge /></div>
              <div className="est blurred" aria-hidden="true">
                <div><span className="label">Median sold</span><div className="v">$1,234</div></div>
                <div><span className="label">Paid</span><div className="v">$999</div></div>
                <div><span className="label">Gain / loss</span><div className="v up">+$235</div></div>
              </div>
              <ul className="members-list">
                <li>Log real sold listings from eBay and Facebook Marketplace</li>
                <li>See an estimated value, updated as you add sales</li>
                <li>Track what you paid, plus shipping, tax and fees if you like</li>
                <li>See your gain or loss, and your profit when you sell</li>
                <li>List items for sale, with up to 8 photos each</li>
              </ul>
              <a className="btn flag" href="/settings#membership">Become a member</a>
            </section>
          )}
          <DeleteItem id={c.id} />
        </div>
      </div>
    </main>
  );
}
