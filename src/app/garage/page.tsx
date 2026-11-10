import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { FREE_CAR_LIMIT, isActiveMembership } from "@/lib/limits";
import { money, photoUrl, signed, valueOf, type Car, type Comp, type Purchase } from "@/lib/cars";

export const dynamic = "force-dynamic";
export const metadata = { title: "My garage" };

type Row = Car & { car_purchases: Purchase | null; comps: Comp[] };

export default async function Garage() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/garage");
  const [{ data }, { data: membership }, { data: me }] = await Promise.all([
    supabase.from("cars").select("*, car_purchases(*), comps(*)").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("memberships").select("status").eq("user_id", user.id).single(),
    supabase.from("profiles").select("username, is_public").eq("id", user.id).single(),
  ]);
  const cars = (data ?? []) as Row[];
  const member = isActiveMembership(membership?.status);
  const atLimit = !member && cars.length >= FREE_CAR_LIMIT;

  let paid = 0, value = 0, valued = 0, gainBase = 0, gainVal = 0;
  const rows = cars.map((c) => {
    const p = c.car_purchases;
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
          <h1>My garage</h1>
          <p>
            {member ? "Member: unlimited cars." : `${cars.length} of ${FREE_CAR_LIMIT} free cars used.`}{" "}
            {me && <>Your collection is {me.is_public ? <Link href={`/c/${me.username}`}>public</Link> : "private"}. What you paid and gain or loss are only shown to you.</>}
          </p>
        </div>
        {atLimit ? <Link className="btn flag" href="/settings#membership">Become a member to add more</Link>
          : <Link className="btn primary" href="/garage/new">+ Add a car</Link>}
      </div>

      <section className="totals" aria-label="Collection totals">
        <div className="total"><span className="label">Cars</span><span className="v num">{cars.length}</span><span className="n">{valued} valued · {cars.length - valued} need comps</span></div>
        <div className="total"><span className="label">Total paid</span><span className="v num">{money(paid)}</span><span className="n">purchase prices</span></div>
        <div className="total"><span className="label">Est. value</span><span className="v num">{money(value)}</span><span className="n">median of sold listings</span></div>
        <div className="total"><span className="label">Gain / loss</span>
          <span className={`v num ${valued ? (gain >= 0 ? "up" : "down") : ""}`}>{valued ? signed(gain) : "—"}</span>
          <span className="n">{valued && gainBase ? `${((gain / gainBase) * 100).toFixed(0)}% vs. what you paid` : "on valued cars"}</span></div>
      </section>

      {cars.length ? (
        <section className="list">
          <div className="row headrow"><span className="label">Car</span><span className="label r">Paid</span><span className="label r">Est. value</span><span className="label r">Gain / loss</span></div>
          {rows.map(({ c, p, v, gain }) => {
            const src = photoUrl(c.photo_path);
            return (
              <Link key={c.id} href={`/garage/${c.id}`} className="row">
                <div className="car">
                  {src ? <img className="thumb" src={src} alt="" loading="lazy" /> : <span className="thumb" aria-hidden="true">No photo</span>}
                  <div className="car-text">
                    <div className="car-title">{c.title}</div>
                    <div className="meta">
                      {c.is_hidden && <span className="chip box">Hidden</span>}
                      {c.for_sale && <span className="chip sale">For sale</span>}
                      {c.scale && <span className="chip scale">{c.scale}</span>}
                      {c.brand && <span className="chip">{c.brand}</span>}
                      {c.year && <span className="chip">{c.year}</span>}
                      <span className="chip box">{c.boxed ? "Boxed" : "No box"}</span>
                    </div>
                  </div>
                </div>
                <div className="r"><span className="label mlabel">Paid</span><span className="num">{p?.paid != null ? money(Number(p.paid), 2) : "—"}</span></div>
                <div className="r"><span className="label mlabel">Value</span><span className="num">{v ? money(v.value, 2) : "—"}</span>
                  <span className="sm">{v ? (v.manual ? "your value" : `${v.est!.n} sold`) : ""}</span></div>
                <div className="r"><span className="label mlabel">Gain</span>
                  {gain == null ? <span className="pill none">{v ? "no price paid" : "needs comps"}</span>
                    : <span className={`pill ${gain >= 0 ? "up" : "down"}`}>{signed(Math.round(gain))}</span>}</div>
              </Link>
            );
          })}
        </section>
      ) : (
        <div className="empty">
          <h3>No cars in the garage yet</h3>
          <p>Add your first diecast with a photo and what you paid, then log a few sold eBay or Facebook Marketplace listings to estimate its value.</p>
          <Link className="btn primary" href="/garage/new">+ Add a car</Link>
        </div>
      )}
    </main>
  );
}
