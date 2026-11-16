import Link from "next/link";
import ConfirmAction from "@/components/ConfirmAction";
import RemoveWithReason from "@/components/admin/RemoveWithReason";
import SubmitButton from "@/components/SubmitButton";
import { adminCloseReport, adminDeleteItem, adminDeleteComment } from "@/app/admin/actions";
import { requireAdmin, when } from "@/lib/admin";
import { photoUrl } from "@/lib/items";
import { reasonLabel } from "@/lib/reports";

type Report = { id: string; target_type: "item" | "comment" | "profile"; target_id: string; target_owner_id: string | null; reason: string; details: string | null; created_at: string; reporter: { username: string } | null };

export default async function AdminReports({ searchParams }: { searchParams: { show?: string } }) {
  const { db } = await requireAdmin();
  const closed = searchParams.show === "closed";
  const { data } = await db.from("reports")
    .select("id, target_type, target_id, target_owner_id, reason, details, created_at, status, reporter:profiles!reports_reporter_id_fkey(username)")
    .in("status", closed ? ["resolved", "dismissed"] : ["open"]).order("created_at", { ascending: false }).limit(300);
  const reports = (data ?? []) as unknown as (Report & { status: string })[];

  // Group reports about the same item so it's reviewed once.
  const groups = new Map<string, (Report & { status: string })[]>();
  for (const r of reports) groups.set(r.target_id, [...(groups.get(r.target_id) ?? []), r]);
  const ids = (t: string) => [...new Set(reports.filter((r) => r.target_type === t).map((r) => r.target_id))];
  const [{ data: cars }, { data: comments }, { data: profiles }] = await Promise.all([
    db.from("items").select("id, title, description, photo_path, under_review, owner:profiles!cars_owner_id_fkey(id, username)").in("id", ids("item")),
    db.from("comments").select("id, body, item_id, under_review, author:profiles!comments_author_id_fkey(id, username), profile:profiles!comments_profile_id_fkey(username)").in("id", ids("comment")),
    db.from("profiles").select("id, username, bio, under_review").in("id", ids("profile")),
  ]);
  // Each collector's report history for the last 3 months: how many different items, comments and
  // profile reports were filed about them, including content that's since been removed.
  const owners = [...new Set(reports.map((r) => r.target_owner_id).filter((x): x is string => !!x))];
  const since = new Date(Date.now() - 90 * 864e5).toISOString();
  const { data: past } = owners.length
    ? await db.from("reports").select("target_owner_id, target_type, target_id").in("target_owner_id", owners).gte("created_at", since)
    : { data: [] };
  const history = new Map<string, { item: Set<string>; comment: Set<string>; profile: Set<string> }>();
  for (const r of (past ?? []) as { target_owner_id: string; target_type: "item" | "comment" | "profile"; target_id: string }[]) {
    const h = history.get(r.target_owner_id) ?? { item: new Set(), comment: new Set(), profile: new Set() };
    h[r.target_type].add(r.target_id);
    history.set(r.target_owner_id, h);
  }
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const car = new Map((cars ?? []).map((c) => [c.id, c]));
  const comment = new Map((comments ?? []).map((c) => [c.id, c]));
  const profile = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <>
      <div className="actions">
        <Link className={`btn small${closed ? "" : " primary"}`} href="/admin/reports">Open</Link>
        <Link className={`btn small${closed ? " primary" : ""}`} href="/admin/reports?show=closed">Closed</Link>
      </div>
      {!groups.size && <div className="empty"><h3>{closed ? "No closed reports" : "No open reports"}</h3>{!closed && <p>When collectors report an item, comment or profile, it shows up here.</p>}</div>}
      {[...groups.entries()].map(([targetId, rs]) => {
        const first = rs[0];
        const c = first.target_type === "item" ? car.get(targetId) : undefined;
        const k = first.target_type === "comment" ? comment.get(targetId) : undefined;
        const p = first.target_type === "profile" ? profile.get(targetId) : undefined;
        const carOwner = c?.owner as unknown as { id: string; username: string } | undefined;
        const author = k?.author as unknown as { id: string; username: string } | undefined;
        const ownerId = carOwner?.id ?? author?.id ?? p?.id ?? first.target_owner_id ?? "";
        const h = history.get(ownerId);
        const ownerName = carOwner?.username ?? author?.username ?? p?.username;
        const gone = !c && !k && !p;
        return (
          <section className="card" key={targetId}>
            <div className="card-title">
              <h3>Reported {first.target_type} · {rs.length} report{rs.length > 1 ? "s" : ""}</h3>
              {(c?.under_review || k?.under_review || p?.under_review) && <span className="chip sale">Auto-hidden: 5+ people reported it. Closing the report brings it back unless you remove it.</span>}
              <span className="hint">{when(first.created_at)}</span>
            </div>

            {h && (
              <p className={h.item.size + h.comment.size > 2 ? "history warn" : "history"}>
                <b>{ownerName ? `@${ownerName}` : "This collector"}, last 3 months:</b>{" "}
                {plural(h.item.size, "item")} reported{h.comment.size ? `, ${plural(h.comment.size, "comment")}` : ""}{h.profile.size ? ", their profile" : ""}.
                {ownerId && <> <Link href={`/admin/users/${ownerId}`}>See account</Link></>}
              </p>
            )}
            {gone && <p className="hint">This {first.target_type} has already been deleted.</p>}
            {c && (
              <div className="car">
                {photoUrl(c.photo_path) ? <a href={photoUrl(c.photo_path)!} target="_blank" rel="noopener noreferrer"><img className="thumb" src={photoUrl(c.photo_path)!} alt="" /></a> : <span className="thumb">No photo</span>}
                <div className="car-text">
                  <Link className="car-title" href={`/c/${carOwner?.username}/${c.id}`}>{c.title}</Link>
                  <div className="hint">by <Link href={`/admin/users/${carOwner?.id}`}>@{carOwner?.username}</Link></div>
                  {c.description && <p className="admin-text hint">{c.description}</p>}
                </div>
              </div>
            )}
            {k && (
              <div>
                <div className="hint"><Link href={`/admin/users/${author?.id}`}>@{author?.username}</Link> on {(k.profile as unknown as { username: string }).username}&apos;s {k.item_id ? "item" : "collection"}</div>
                <p className="admin-text">{k.body}</p>
              </div>
            )}
            {p && (
              <div>
                <Link href={`/admin/users/${p.id}`}>@{p.username}</Link> · <Link href={`/c/${p.username}`}>public page</Link>
                {p.bio && <p className="admin-text hint">{p.bio}</p>}
              </div>
            )}

            <div className="admin-table">
              {rs.map((r) => (
                <div key={r.id} className="admin-row">
                  <span><b>{reasonLabel(r.reason)}</b></span>
                  <span className="admin-text hint">{r.details || "No details"} · from @{r.reporter?.username ?? "deleted account"}</span>
                  <span className="hint">{closed ? r.status : ""}</span>
                </div>
              ))}
            </div>

            {!closed && (
              <div className="actions">
                {c && <RemoveWithReason action={adminDeleteItem} id={c.id} label="Delete item" what="this item (its reports close too)" />}
                {k && <ConfirmAction action={adminDeleteComment} fields={{ id: k.id }} label="Delete comment" confirmText="Delete this comment? Its reports close too." />}
                {p && <Link className="btn small" href={`/admin/users/${p.id}`}>Review account</Link>}
                <form action={adminCloseReport}>
                  <input type="hidden" name="target_id" value={targetId} /><input type="hidden" name="target_type" value={first.target_type} />
                  <input type="hidden" name="owner_id" value={ownerId} /><input type="hidden" name="status" value={gone ? "resolved" : "dismissed"} />
                  <SubmitButton className="btn small" pending="…">{gone ? "Close" : "Dismiss: it's fine"}</SubmitButton>
                </form>
                {p && (
                  <form action={adminCloseReport}>
                    <input type="hidden" name="target_id" value={targetId} /><input type="hidden" name="target_type" value="profile" />
                    <input type="hidden" name="owner_id" value={ownerId} /><input type="hidden" name="status" value="resolved" />
                    <SubmitButton className="btn small" pending="…">Mark handled</SubmitButton>
                  </form>
                )}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
