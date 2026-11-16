import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { adminSetFeedbackStatus } from "@/app/admin/actions";
import { requireAdmin, when } from "@/lib/admin";

const KIND: Record<string, string> = { bug: "🐞 Bug", idea: "💡 Idea", other: "💬 Other" };
const STATUSES = [
  { key: "open", label: "New", hint: "Not looked at yet" },
  { key: "in_review", label: "In review", hint: "Being looked into" },
  { key: "done", label: "Done", hint: "Fixed or added" },
  { key: "dismissed", label: "Dismissed", hint: "Won't act on it" },
] as const;

type Row = { id: string; kind: string; message: string; page: string | null; device: string | null; status: string; created_at: string;
  status_changed_at: string | null; author: { id: string; username: string } | null };

export default async function AdminFeedback({ searchParams }: { searchParams: { show?: string; kind?: string } }) {
  const { db } = await requireAdmin();
  const show = STATUSES.some((s) => s.key === searchParams.show) ? searchParams.show! : "open";
  const kind = searchParams.kind && KIND[searchParams.kind] ? searchParams.kind : undefined;
  let q = db.from("feedback").select("id, kind, message, page, device, status, created_at, status_changed_at, author:profiles!feedback_author_id_fkey(id, username)")
    .eq("status", show).order("created_at", { ascending: false }).limit(300);
  if (kind) q = q.eq("kind", kind);
  const [{ data }, ...counts] = await Promise.all([
    q,
    ...STATUSES.map((s) => db.from("feedback").select("id", { count: "exact", head: true }).eq("status", s.key)),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const link = (p: { show?: string; kind?: string }) => {
    const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v && v !== "open") as [string, string][]).toString();
    return `/admin/feedback${qs ? `?${qs}` : ""}`;
  };
  const current = STATUSES.find((s) => s.key === show)!;

  return (
    <>
      <nav className="seg-tabs" aria-label="Feedback status">
        {STATUSES.map((s, i) => (
          <Link key={s.key} className={show === s.key ? "on" : undefined} href={link({ show: s.key, kind })}>{s.label} <span className="num">{counts[i].count ?? 0}</span></Link>
        ))}
      </nav>
      <div className="actions">
        <Link className={`btn small${!kind ? " primary" : ""}`} href={link({ show })}>All kinds</Link>
        {Object.entries(KIND).map(([k, l]) => <Link key={k} className={`btn small${kind === k ? " primary" : ""}`} href={link({ show, kind: k })}>{l}</Link>)}
      </div>
      {!rows.length && <div className="empty"><h3>Nothing {current.label.toLowerCase()}</h3><p>Beta testers send feedback with the 💬 Feedback button. Mark someone as a beta tester on their page under Users.</p></div>}
      {rows.map((r) => (
        <section key={r.id} className="card feedback-item">
          <div className="card-title">
            <h3>{KIND[r.kind] ?? r.kind}</h3>
            <span className="hint">{r.author ? <Link href={`/admin/users/${r.author.id}`}>@{r.author.username}</Link> : "A deleted account"} · {when(r.created_at)}</span>
          </div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.message}</p>
          <p className="hint">
            {r.page && <>On <a href={r.page} target="_blank" rel="noopener noreferrer">{r.page}</a></>}
            {r.device && <> · {r.device}</>}
            {r.status_changed_at && <> · moved to {current.label} {when(r.status_changed_at)}</>}
          </p>
          <div className="actions">
            <span className="label">Move to</span>
            {STATUSES.filter((s) => s.key !== r.status).map((s) => (
              <form key={s.key} action={adminSetFeedbackStatus}>
                <input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={s.key} />
                <SubmitButton className={s.key === "done" ? "btn small primary" : "btn small"} pending="…">{s.label}</SubmitButton>
              </form>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
