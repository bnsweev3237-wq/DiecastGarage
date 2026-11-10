import Link from "next/link";
import { requireAdmin, when } from "@/lib/admin";

export default async function AdminHome() {
  const { db } = await requireAdmin();
  const count = (t: string) => db.from(t).select("*", { count: "exact", head: true });
  const [users, cars, comments, follows, members, { data: recent }] = await Promise.all([
    count("profiles"), count("cars"), count("comments"), count("follows"),
    db.from("memberships").select("*", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    db.from("profiles").select("id, username, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  return (
    <>
      <section className="totals">
        <div className="total"><span className="label">Collectors</span><span className="v num">{users.count ?? 0}</span><span className="n">{members.count ?? 0} members</span></div>
        <div className="total"><span className="label">Cars</span><span className="v num">{cars.count ?? 0}</span><span className="n">including hidden</span></div>
        <div className="total"><span className="label">Comments</span><span className="v num">{comments.count ?? 0}</span><span className="n">all collections</span></div>
        <div className="total"><span className="label">Follows</span><span className="v num">{follows.count ?? 0}</span><span className="n">between collectors</span></div>
      </section>
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
