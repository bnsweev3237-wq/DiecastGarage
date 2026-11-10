import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CarForm from "@/components/CarForm";
import CompForm from "@/components/CompForm";
import DeleteCar from "@/components/DeleteCar";
import { removeComp } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import { ebaySoldUrl, facebookUrl, money, searchTerms, signed, valueOf, type Car, type Comp, type Purchase } from "@/lib/cars";

export const dynamic = "force-dynamic";

export default async function EditCar({ params, searchParams }: { params: { id: string }; searchParams: { added?: string } }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const [{ data: car }, { data: me }] = await Promise.all([
    supabase.from("cars").select("*, car_purchases(*), comps(*)").eq("id", params.id).eq("owner_id", user.id).maybeSingle(),
    supabase.from("profiles").select("username").eq("id", user.id).single(),
  ]);
  if (!car) notFound();
  const c = car as Car & { car_purchases: Purchase | null; comps: Comp[] };
  const purchase = c.car_purchases;
  const comps = [...c.comps].sort((a, b) => (b.sold_on ?? "").localeCompare(a.sold_on ?? ""));
  const v = valueOf(purchase, comps);
  const hasPaid = purchase?.paid != null;
  const gain = v && hasPaid ? v.value - Number(purchase!.paid) : null;
  const terms = searchTerms(c);

  return (
    <main className="wrap">
      <div className="head">
        <div><Link href="/garage">← My garage</Link><h1>{c.title}</h1></div>
        {me && <Link className="btn" href={`/c/${me.username}/${c.id}`}>View public page</Link>}
      </div>
      {searchParams.added && <p className="msg ok">Added to your garage. Log a few sold listings to estimate its value.</p>}
      <div className="editor">
        <CarForm userId={user.id} car={c} purchase={purchase} />
        <div className="side">
          <section className="card">
            <h3>Estimated value</h3>
            <div className="est">
              <div><span className="label">{v?.manual ? "Your value" : "Median sold"}</span><div className="v">{v ? money(v.value, 2) : "—"}</div></div>
              <div><span className="label">Paid</span><div className="v">{hasPaid ? money(Number(purchase!.paid), 2) : "—"}</div></div>
              <div><span className="label">Gain / loss</span><div className={`v ${gain == null ? "" : gain >= 0 ? "up" : "down"}`}>{gain == null ? "—" : signed(Math.round(gain))}</div></div>
            </div>
            <p className="hint">
              {v?.est
                ? `Based on ${v.est.n} sold listing${v.est.n > 1 ? "s" : ""}${v.est.olderOnly ? " (all over a year old, so treat it as rough)" : " from the last 12 months"}${v.est.n >= 5 ? ", with the highest and lowest dropped" : ""}. Range ${money(v.est.low)}–${money(v.est.high)}.${v.manual ? ` Comps say ${money(v.est.median, 2)}; your own value is used instead.` : ""}`
                : "No sold listings yet. Search below and log what similar cars actually sold for."}
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
              This car is {c.boxed ? "boxed" : "loose (no box)"}; compare like with like.
            </p>
            <div>
              {comps.length ? comps.map((k) => (
                <div className="comp-row" key={k.id}>
                  <span className="num">{money(Number(k.price), 2)}</span>
                  <span className="date num hint">{k.sold_on ?? "no date"}</span>
                  <span className="note"><span className="src">{k.source}</span>{" "}
                    {k.url ? <a href={k.url} target="_blank" rel="noopener noreferrer">{k.note || "listing"} ↗</a> : k.note}</span>
                  <form action={removeComp}>
                    <input type="hidden" name="id" value={k.id} /><input type="hidden" name="car_id" value={c.id} />
                    <button className="linkbtn" type="submit" aria-label="Remove sold listing">✕</button>
                  </form>
                </div>
              )) : <p className="hint">Nothing logged yet.</p>}
            </div>
            <CompForm carId={c.id} />
          </section>
          <DeleteCar id={c.id} />
        </div>
      </div>
    </main>
  );
}
