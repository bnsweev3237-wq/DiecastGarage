import Link from "next/link";
import { requireAdmin, when } from "@/lib/admin";
import { compActive, isMember } from "@/lib/limits";
import { adminMakeThumbs } from "@/app/admin/actions";
import SubmitButton from "@/components/SubmitButton";

export default async function AdminHome() {
  const { db } = await requireAdmin();
  const count = (t: string) => db.from(t).select("*", { count: "exact", head: true });
  const [users, cars, comments, follows, members, { data: recent }, reports, { data: missing }] = await Promise.all([
    count("profiles"), count("items"), count("comments"), count("follows"),
    db.from("memberships").select("status, comp_active, comp_until"),
    db.from("profiles").select("id, username, created_at").order("created_at", { ascending: false }).limit(10),
    db.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    db.rpc("photos_missing_thumbs", { p_limit: 5000 }),
  ]);
  const needThumbs = (missing as unknown[] | null)?.length ?? 0;
  return (
    <>
      {!!reports.count && <p className="msg error"><Link href="/admin/reports">{reports.count} open report{reports.count > 1 ? "s" : ""} to review →</Link></p>}
      <section className="totals">
        <div className="total"><span className="label">Collectors</span><span className="v num">{users.count ?? 0}</span><span className="n">{(members.data ?? []).filter(isMember).length} members{(members.data ?? []).some(compActive) ? `, ${(members.data ?? []).filter(compActive).length} complimentary` : ""}</span></div>
        <div className="total"><span className="label">Items</span><span className="v num">{cars.count ?? 0}</span><span className="n">including hidden</span></div>
        <div className="total"><span className="label">Comments</span><span className="v num">{comments.count ?? 0}</span><span className="n">all collections</span></div>
        <div className="total"><span className="label">Follows</span><span className="v num">{follows.count ?? 0}</span><span className="n">between collectors</span></div>
      </section>
      {needThumbs > 0 && (
        <section className="card">
          <h3>Photo thumbnails</h3>
          <p className="hint">{needThumbs} photo{needThumbs > 1 ? "s don't" : " doesn't"} have a small copy yet, so cards load the full photo instead. The daily job makes them automatically; this does a batch now.</p>
          <form action={adminMakeThumbs}><SubmitButton className="btn small" pending="Making thumbnails…">Make thumbnails now</SubmitButton></form>
        </section>
      )}
      <section className="card">
        <h3>Newest collectors</h3>
        <div className="admin-table">
          {(recent ?? []).map((p) => (
            <Link key={p.id} href={`/admin/users/${p.id}`} className="admin-row"><span>@{p.username}</span><span className="hint">{when(p.created_at)}</span></Link>
          ))}
        </div>
      </section>
    </>
  );
}
