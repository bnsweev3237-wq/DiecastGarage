import Link from "next/link";
import { redirect } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { MembersNote } from "@/components/MembersOnly";
import { getUser } from "@/lib/supabase/server";
import { isMember } from "@/lib/limits";
import { categoryOf, conditionLabel, summary } from "@/lib/categories";
import Thumb from "@/components/Thumb";
import { certLabel, gainCost, money, valueOf, type Comp, type Item, type Purchase } from "@/lib/items";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collection report" };

type Row = Item & { item_purchases: Purchase | null; comps: Comp[] };

// A printable list of everything you own, with photos, details, cost and value, for insurance
// or your records. "Print or save as PDF" uses the browser's own print dialog.
export default async function Report() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/collection/report");
  const [{ data: m }, { data: priv }, { data: me }, { data }] = await Promise.all([
    supabase.from("memberships").select("status, comp_active, comp_until").eq("user_id", user.id).maybeSingle(),
    supabase.from("profile_private").select("full_name, location").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase.from("items").select("*, item_purchases(*), comps(*)").eq("owner_id", user.id).eq("status", "owned"),
  ]);
  if (!isMember(m)) return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="head"><div><Link href="/collection">← My collection</Link><h1>Collection report</h1></div></div>
      <MembersNote>Members can print or save a full report of their collection, with photos, grading, what they paid and current values, for insurance or their records.</MembersNote>
    </main>
  );
  const rows = ((data ?? []) as Row[]).map((i) => ({ i, p: i.item_purchases, v: valueOf(i.item_purchases, i.comps ?? []), cost: gainCost(i.item_purchases) }))
    .sort((a, b) => (b.v?.value ?? -1) - (a.v?.value ?? -1));
  const totalValue = rows.reduce((s, r) => s + (r.v?.value ?? 0) * 1, 0);
  const totalCost = rows.reduce((s, r) => s + (r.cost ?? 0), 0);
  const pieces = rows.reduce((s, r) => s + (r.i.quantity ?? 1), 0);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <main className="wrap report">
      <div className="head no-print">
        <div><Link href="/collection">← My collection</Link><h1>Collection report</h1>
          <p>Everything you own, ready to print or save as a PDF for insurance or your records. Values are estimates.</p></div>
        <PrintButton />
      </div>
      <section className="report-sheet">
        <header className="report-head">
          <div>
            <h2>Collection report</h2>
            <p>{priv?.full_name ? <><b>{priv.full_name}</b> (@{me?.username})</> : <b>@{me?.username}</b>}{priv?.location ? ` · ${priv.location}` : ""}</p>
            <p className="hint">Prepared {today} on theCollectorHQ.com</p>
          </div>
          <dl className="report-totals">
            <div><dt>Items</dt><dd>{rows.length}{pieces !== rows.length ? ` (${pieces} pieces)` : ""}</dd></div>
            <div><dt>Total cost</dt><dd>{money(totalCost, 2)}</dd></div>
            <div><dt>Estimated value</dt><dd>{money(totalValue, 2)}</dd></div>
          </dl>
        </header>
        <table className="report-table">
          <thead><tr><th>Photo</th><th>Item</th><th>Condition and grading</th><th>Bought</th><th className="r">Cost</th><th className="r">Est. value</th></tr></thead>
          <tbody>
            {rows.map(({ i, p, v, cost }) => (
              <tr key={i.id}>
                <td>{i.photo_path ? <Thumb path={i.photo_path} /> : <span className="hint">No photo</span>}</td>
                <td>
                  <b>{i.title}</b>{i.quantity > 1 ? ` ×${i.quantity}` : ""}
                  <div className="hint">{categoryOf(i.category).label}{summary(i) ? ` · ${summary(i)}` : ""}</div>
                  {i.edition && <div className="hint">Edition: {i.edition}</div>}
                  {p?.storage_location && <div className="hint">Stored: {p.storage_location}</div>}
                </td>
                <td>
                  {conditionLabel(i.condition) ?? "—"}{i.in_package ? ` · ${categoryOf(i.category).packagingLabel}` : ""}
                  {i.is_certified && <div className="hint">{certLabel(i)}{i.cert_number ? ` · Cert #${i.cert_number}` : ""}</div>}
                </td>
                <td className="nowrap">{p?.purchased_at ? new Date(`${p.purchased_at}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}{p?.acquired_from && <div className="hint">{p.acquired_from}</div>}</td>
                <td className="r">{cost != null ? money(cost, 2) : "—"}</td>
                <td className="r">{v ? money(v.value, 2) : "—"}{v && <div className="hint">{v.manual ? "owner's value" : `${v.est!.n} sold listings`}</div>}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={4}><b>Total</b></td><td className="r"><b>{money(totalCost, 2)}</b></td><td className="r"><b>{money(totalValue, 2)}</b></td></tr></tfoot>
        </table>
        <p className="hint report-foot">Estimated values come from sold listings the owner logged, or values they entered, and are not an appraisal. Items on the wishlist or already sold aren&apos;t included.</p>
      </section>
    </main>
  );
}
