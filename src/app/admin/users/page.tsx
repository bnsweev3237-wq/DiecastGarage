import Link from "next/link";
import { requireAdmin, when } from "@/lib/admin";
import { compActive, isActiveMembership } from "@/lib/limits";

export default async function AdminUsers({ searchParams }: { searchParams: { q?: string } }) {
  const { db } = await requireAdmin();
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const [{ data: profiles }, { data: auth }, { data: members }, { data: carRows }] = await Promise.all([
    db.from("profiles").select("id, username, is_public, is_beta_tester, created_at").order("created_at", { ascending: false }),
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from("memberships").select("user_id, status, comp_active, comp_until"),
    db.from("items").select("owner_id"),
  ]);
  const email = new Map(auth?.users.map((u) => [u.id, u.email ?? ""]) ?? []);
  const plan = new Map((members ?? []).map((m) => [m.user_id, isActiveMembership(m.status) ? "Member" : compActive(m) ? "Member (comp)" : "Free"]));
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
        <div className="admin-row head"><span className="label">Collector</span><span className="label">Email</span><span className="label">Items</span><span className="label">Plan</span><span className="label">Joined</span></div>
        {rows.map((p) => (
          <Link key={p.id} href={`/admin/users/${p.id}`} className="admin-row">
            <span>@{p.username}{p.is_beta_tester && <span className="chip sale" style={{ marginLeft: 6 }}>Beta</span>}{!p.is_public && <span className="hint"> · private</span>}</span>
            <span className="hint">{email.get(p.id)}</span>
            <span className="num">{cars.get(p.id) ?? 0}</span>
            <span>{plan.get(p.id) ?? "Free"}</span>
            <span className="hint">{when(p.created_at)}</span>
          </Link>
        ))}
        {!rows.length && <p className="hint">No collectors match.</p>}
      </div>
    </section>
  );
}
