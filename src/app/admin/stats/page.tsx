import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { compActive, isActiveMembership } from "@/lib/limits";

export const dynamic = "force-dynamic";

const WEEKS = 12;
const weekStart = (d: Date) => { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x; };

// Counts rows per week (Monday to Sunday, UTC) for the last 12 weeks.
function perWeek(dates: string[]) {
  const now = weekStart(new Date());
  const weeks = Array.from({ length: WEEKS }, (_, i) => { const d = new Date(now); d.setUTCDate(d.getUTCDate() - (WEEKS - 1 - i) * 7); return { start: d, n: 0 }; });
  for (const iso of dates) {
    const w = weekStart(new Date(iso)).getTime();
    const hit = weeks.find((x) => x.start.getTime() === w);
    if (hit) hit.n++;
  }
  return weeks;
}

function Bars({ title, weeks }: { title: string; weeks: { start: Date; n: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.n));
  const total = weeks.reduce((s, w) => s + w.n, 0);
  const label = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return (
    <section className="card stat-chart">
      <div className="card-title"><h3>{title}</h3><span className="hint">{total} in 12 weeks · {weeks[weeks.length - 1].n} this week</span></div>
      <div className="bars" role="img" aria-label={`${title}: ${weeks.map((w) => `${label(w.start)} ${w.n}`).join(", ")}`}>
        {weeks.map((w) => (
          <div key={w.start.toISOString()} className="bar-col" title={`Week of ${label(w.start)}: ${w.n}`}>
            <span className="bar-n">{w.n || ""}</span>
            <span className="bar" style={{ height: `${(w.n / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="bar-axis"><span>{label(weeks[0].start)}</span><span>This week</span></div>
    </section>
  );
}

export default async function AdminStats() {
  const { db } = await requireAdmin();
  const since = new Date(Date.now() - WEEKS * 7 * 864e5).toISOString();
  const count = (t: string) => db.from(t).select("*", { count: "exact", head: true });
  const [{ data: profiles }, { data: items }, { data: comments }, { data: ratings }, { data: members }, { data: auth },
    itemsTotal, commentsTotal, ratingsTotal, favoritesTotal, setsTotal, followsTotal] = await Promise.all([
    db.from("profiles").select("id, username, created_at, referred_by, is_beta_tester").limit(20000),
    db.from("items").select("created_at").gte("created_at", since).limit(50000),
    db.from("comments").select("created_at").gte("created_at", since).limit(50000),
    db.from("item_ratings").select("created_at").gte("created_at", since).limit(50000),
    db.from("memberships").select("user_id, status, comp_active, comp_until"),
    db.auth.admin.listUsers({ perPage: 1000 }),
    count("items"), count("comments"), count("item_ratings"), count("favorites"), count("sets"), count("follows"),
  ]);
  const people = profiles ?? [];
  const users = auth?.users ?? [];
  const activeIn = (days: number) => users.filter((u) => u.last_sign_in_at && Date.now() - Date.parse(u.last_sign_in_at) < days * 864e5).length;
  const paid = (members ?? []).filter((m) => isActiveMembership(m.status)).length;
  const comp = (members ?? []).filter((m) => !isActiveMembership(m.status) && compActive(m)).length;
  const inviters = new Map<string, number>();
  for (const p of people) if (p.referred_by) inviters.set(p.referred_by, (inviters.get(p.referred_by) ?? 0) + 1);
  const topInviters = [...inviters.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, n]) => ({ id, n, username: people.find((p) => p.id === id)?.username ?? "deleted" }));

  return (
    <>
      <section className="totals">
        <div className="total"><span className="label">Collectors</span><span className="v num">{people.length}</span><span className="n">{people.filter((p) => p.is_beta_tester).length} beta testers</span></div>
        <div className="total"><span className="label">Active</span><span className="v num">{activeIn(7)}</span><span className="n">signed in this week · {activeIn(30)} this month</span></div>
        <div className="total"><span className="label">Members</span><span className="v num">{paid + comp}</span><span className="n">{paid} paying · {comp} complimentary · {people.length - paid - comp} free</span></div>
        <div className="total"><span className="label">Items</span><span className="v num">{itemsTotal.count ?? 0}</span><span className="n">{setsTotal.count ?? 0} sets · {favoritesTotal.count ?? 0} saves</span></div>
      </section>
      <section className="totals">
        <div className="total"><span className="label">Comments</span><span className="v num">{commentsTotal.count ?? 0}</span><span className="n">all time</span></div>
        <div className="total"><span className="label">Ratings</span><span className="v num">{ratingsTotal.count ?? 0}</span><span className="n">all time</span></div>
        <div className="total"><span className="label">Follows</span><span className="v num">{followsTotal.count ?? 0}</span><span className="n">between collectors</span></div>
        <div className="total"><span className="label">Invited</span><span className="v num">{people.filter((p) => p.referred_by).length}</span><span className="n">joined with an invite link</span></div>
      </section>
      <div className="stat-grid">
        <Bars title="New collectors per week" weeks={perWeek(people.map((p) => p.created_at))} />
        <Bars title="Items added per week" weeks={perWeek((items ?? []).map((r) => r.created_at))} />
        <Bars title="Comments per week" weeks={perWeek((comments ?? []).map((r) => r.created_at))} />
        <Bars title="Ratings per week" weeks={perWeek((ratings ?? []).map((r) => r.created_at))} />
      </div>
      <section className="card">
        <h3>Top inviters</h3>
        {topInviters.length ? (
          <div className="admin-table">{topInviters.map((t) => (
            <Link key={t.id} href={`/admin/users/${t.id}`} className="admin-row"><span>@{t.username}</span><span className="num">{t.n} joined</span></Link>
          ))}</div>
        ) : <p className="hint">Nobody has joined with an invite link yet. Each collector&apos;s link is in their Settings.</p>}
      </section>
    </>
  );
}
