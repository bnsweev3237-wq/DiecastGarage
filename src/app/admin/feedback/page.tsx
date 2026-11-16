import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { adminSetFeedbackStatus } from "@/app/admin/actions";
import { requireAdmin, when } from "@/lib/admin";

const KIND: Record<string, string> = { bug: "🐞 Bug", idea: "💡 Idea", other: "💬 Other" };

type Row = { id: string; kind: string; message: string; page: string | null; device: string | null; status: string; created_at: string;
  author: { id: string; username: string } | null };

export default async function AdminFeedback({ searchParams }: { searchParams: { show?: string; kind?: string } }) {
  const { db } = await requireAdmin();
  const done = searchParams.show === "done";
  let q = db.from("feedback").select("id, kind, message, page, device, status, created_at, author:profiles!feedback_author_id_fkey(id, username)")
    .eq("status", done ? "done" : "open").order("created_at", { ascending: false }).limit(300);
  if (searchParams.kind && KIND[searchParams.kind]) q = q.eq("kind", searchParams.kind);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];
  const link = (p: { show?: string; kind?: string }) => {
    const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString();
    return `/admin/feedback${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <div className="actions">
        <Link className={`btn small${done ? "" : " primary"}`} href={link({ kind: searchParams.kind })}>Open</Link>
        <Link className={`btn small${done ? " primary" : ""}`} href={link({ show: "done", kind: searchParams.kind })}>Done</Link>
        <span className="hint">·</span>
        <Link className={`btn small${!searchParams.kind ? " primary" : ""}`} href={link({ show: searchParams.show })}>All kinds</Link>
        {Object.entries(KIND).map(([k, l]) => <Link key={k} className={`btn small${searchParams.kind === k ? " primary" : ""}`} href={link({ show: searchParams.show, kind: k })}>{l}</Link>)}
      </div>
      {!rows.length && <div className="empty"><h3>{done ? "Nothing marked done yet" : "No open feedback"}</h3><p>Beta testers send feedback with the 💬 Feedback button. Mark someone as a beta tester on their page under Users.</p></div>}
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
          </p>
          <form action={adminSetFeedbackStatus}>
            <input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={done ? "open" : "done"} />
            <SubmitButton className="btn small" pending="…">{done ? "Reopen" : "Mark done"}</SubmitButton>
          </form>
        </section>
      ))}
    </>
  );
}
