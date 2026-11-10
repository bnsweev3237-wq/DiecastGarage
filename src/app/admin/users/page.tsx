import Link from "next/link";
import { requireAdmin, when } from "@/lib/admin";

export default async function AdminUsers({ searchParams }: { searchParams: { q?: string } }) {
  const { db } = await requireAdmin();
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const [{ data: profiles }, { data: auth }, { data: members }, { data: carRows }] = await Promise.all([
    db.from("profiles").select("id, username, is_public, created_at").order("created_at", { ascending: false }),
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from("memberships").select("user_id, status"),
    db.from("cars").select("owner_id"),
  ]);
  const email = new Map(auth?.users.map((u) => [u.id, u.email ?? ""]) ?? []);
  const status = new Map((members ?? []).map((m) => [m.user_id, m.status]));
  const cars = new Map<string, number>();
  for (const c of carRows ?? []) cars.set(c.owner_id, (cars.get(c.owner_id) ?? 0) + 1);
  const rows = (profiles ?? []).filter((p) => !q || p.username.includes(q) || (email.get(p.id) ?? "").toLowerCase().includes(q));

  return (
    <section className="card">
      <form className="toolbar" role="search">
        <input name="q" defaultValue={q} placeholder="Search username or email" aria-label="Search users" />
        <button className="btn" type="submit">Search</button>
      </form>
      <div className="admin-table">
        <div className="admin-row head"><span className="label">Collector</span><span className="label">Email</span><span className="label">Cars</span><span className="label">Plan</span><span className="label">Joined</span></div>
        {rows.map((p) => (
          <Link key={p.id} href={`/admin/users/${p.id}`} className="admin-row">
            <span>@{p.username}{!p.is_public && <span className="hint"> · private</span>}</span>
            <span className="hint">{email.get(p.id)}</span>
            <span className="num">{cars.get(p.id) ?? 0}</span>
            <span>{status.get(p.id) === "active" || status.get(p.id) === "trialing" ? "Member" : "Free"}</span>
            <span className="hint">{when(p.created_at)}</span>
          </Link>
        ))}
        {!rows.length && <p className="hint">No collectors match.</p>}
      </div>
    </section>
  );
}
