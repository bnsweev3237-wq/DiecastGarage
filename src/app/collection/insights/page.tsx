import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { checkQueries } from "@/lib/report-error";
import { isMember } from "@/lib/limits";
import { categoryOf } from "@/lib/categories";
import { money, signed, type Comp, type Purchase } from "@/lib/items";
import { insights, type InsightRow } from "@/lib/insights";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collection insights" };

const pct = (n: number) => `${Math.round(n * 100)}%`;
const monthName = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });

export default async function Insights() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/collection/insights");
  const loaded = await Promise.all([
    supabase.from("items").select("id, title, category, quantity, created_at, is_certified, cert_type, item_purchases(*), comps(*)").eq("owner_id", user.id).eq("status", "owned").limit(5000),
    supabase.from("memberships").select("status, comp_active, comp_until").eq("user_id", user.id).maybeSingle(),
  ]);
  await checkQueries("Insights", "/collection/insights", loaded, user.id);
  const [{ data }, { data: membership }] = loaded;
  const member = isMember(membership);
  const rows: InsightRow[] = ((data ?? []) as unknown as (Omit<InsightRow, "purchase" | "comps"> & { item_purchases: Purchase | null; comps: Comp[] })[])
    .map(({ item_purchases, comps, ...r }) => ({ ...r, purchase: item_purchases, comps: comps ?? [] }));
  const r = insights(rows);
  const maxCat = Math.max(...r.byCategory.map((c) => (member ? c.value : c.items)), 1);
  const maxMonth = Math.max(...r.addedByMonth.map((m) => m.added), 1);

  return (
    <main className="wrap">
      <div className="head">
        <div><Link href="/collection">← My collection</Link><h1>📊 Collection insights</h1>
          <p>Where your collection&apos;s value sits and how it&apos;s grown. Only you can see this.</p></div>
      </div>
      {!r.items ? <div className="empty"><h3>Nothing to show yet</h3><p>Add items to your collection to see insights.</p><Link className="btn primary" href="/collection/new">+ Add an item</Link></div> : <>
        <section className="totals">
          <div className="total"><span className="label">Items</span><div className="v">{r.items}</div></div>
          <div className="total"><span className="label">Graded</span><div className="v">{pct(r.gradedShare)}</div><span className="hint">{r.graded} of {r.items}</span></div>
          {member ? <>
            <div className="total"><span className="label">Est. value</span><div className="v">{money(r.value)}</div><span className="hint">{r.valued} of {r.items} valued</span></div>
            <div className="total"><span className="label">Cost</span><div className="v">{money(r.cost)}</div></div>
          </> : <div className="total locked"><span className="label">Value and cost 🔒</span><Link href="/settings#membership">Members only</Link></div>}
        </section>

        <div className="insight-grid">
          <section className="card">
            <h3>{member ? "Value by category" : "Items by category"}</h3>
            <div className="cat-bars">
              {r.byCategory.map((c) => {
                const cat = categoryOf(c.category);
                const amount = member ? c.value : c.items;
                return (
                  <div key={c.category} className="bar-row">
                    <span className="bar-label">{cat.emoji} {cat.label}</span>
                    <span className="bar-track"><span style={{ width: `${Math.max(2, (amount / maxCat) * 100)}%` }} /></span>
                    <span className="bar-num">{member ? money(c.value) : c.items}{member && <span className="hint"> · {c.items}</span>}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card">
            <h3>Added in the last 12 months</h3>
            <div className="month-bars" role="img" aria-label={r.addedByMonth.map((m) => `${monthName(m.month)}: ${m.added}`).join(", ")}>
              {r.addedByMonth.map((m) => (
                <div key={m.month}><span className="month-bar" style={{ height: `${(m.added / maxMonth) * 100}%` }} title={`${m.added} added`} /><span className="hint">{monthName(m.month)[0]}</span></div>
              ))}
            </div>
          </section>

          {member ? <>
            <section className="card">
              <h3>💎 Most valuable</h3>
              {r.top.length ? <ol className="rank-list">{r.top.map((t) => <li key={t.id}><Link href={`/collection/${t.id}`}>{t.title}</Link><b>{money(t.value)}</b></li>)}</ol>
                : <p className="hint">Log sold listings or set your own value on items to see this.</p>}
            </section>
            <section className="card">
              <h3>📈 Biggest gainers</h3>
              {r.gainers.length ? <ol className="rank-list">{r.gainers.map((t) => <li key={t.id}><Link href={`/collection/${t.id}`}>{t.title}</Link><b className="up">{signed(t.gain!)}</b></li>)}</ol>
                : <p className="hint">Items need both a price paid and a value to show here.</p>}
            </section>
            <section className="card">
              <h3>📉 Down from what you paid</h3>
              {r.losers.length ? <ol className="rank-list">{r.losers.map((t) => <li key={t.id}><Link href={`/collection/${t.id}`}>{t.title}</Link><b className="down">{signed(t.gain!)}</b></li>)}</ol>
                : <p className="hint">Nothing is worth less than you paid. 🎉</p>}
            </section>
            <section className="card">
              <h3>💸 Spending by year</h3>
              {r.spendingByYear.length ? <ol className="rank-list">{r.spendingByYear.map((y) => <li key={y.year}><span>{y.year}</span><b>{money(y.cost)}</b></li>)}</ol>
                : <p className="hint">Add what you paid (and when) on your items to see this.</p>}
            </section>
          </> : (
            <section className="card members-teaser">
              <h3>See what your collection is worth 🔒</h3>
              <ul className="members-list"><li>Value and cost by category</li><li>Your most valuable items</li><li>Biggest gainers and items worth less than you paid</li><li>What you spent each year</li></ul>
              <a className="btn flag" href="/settings#membership">Become a member</a>
            </section>
          )}
        </div>
      </>}
    </main>
  );
}
