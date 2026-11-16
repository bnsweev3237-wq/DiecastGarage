import Link from "next/link";
import SubmitButton from "@/components/SubmitButton";
import { adminResolveErrors } from "@/app/admin/actions";
import { requireAdmin, when } from "@/lib/admin";

const SOURCE: Record<string, string> = { server: "🖥️ Server", browser: "🌐 Browser", query: "🗄️ Database request", daily_check: "🩺 Daily site check", job: "⏰ Daily job" };

type Row = { id: string; source: string; message: string; detail: string | null; path: string | null; count: number; first_seen: string; last_seen: string; status: string; alerted_at: string | null; user: { id: string; username: string } | null };

export default async function AdminErrors({ searchParams }: { searchParams: { show?: string } }) {
  const { db } = await requireAdmin();
  const resolved = searchParams.show === "resolved";
  const { data } = await db.from("app_errors").select("id, source, message, detail, path, count, first_seen, last_seen, status, alerted_at, user:profiles!app_errors_user_id_fkey(id, username)")
    .eq("status", resolved ? "resolved" : "open").order("last_seen", { ascending: false }).limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const emailOn = !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.ALERT_EMAIL);
  return (
    <>
      <div className="actions">
        <Link className={`btn small${resolved ? "" : " primary"}`} href="/admin/errors">Open</Link>
        <Link className={`btn small${resolved ? " primary" : ""}`} href="/admin/errors?show=resolved">Resolved</Link>
        {!resolved && rows.length > 0 && <form action={adminResolveErrors}><input type="hidden" name="all" value="1" /><SubmitButton className="btn small" pending="…">Mark all resolved</SubmitButton></form>}
      </div>
      <p className="hint">Page crashes, browser errors, failed database requests and the daily site check land here. Repeats of the same error are counted together.
        {emailOn ? " You get one email per new error." : " Email alerts start once notification emails (Resend) are set up with an ALERT_EMAIL address."}</p>
      {!rows.length && <div className="empty"><span className="empty-emoji" aria-hidden="true">✅</span><h3>{resolved ? "Nothing resolved yet" : "No open errors"}</h3><p>{resolved ? "" : "Everything's running smoothly."}</p></div>}
      {rows.map((r) => (
        <section key={r.id} className="card error-item">
          <div className="card-title">
            <h3>{r.message}</h3>
            <span className={r.count > 9 ? "chip sale" : "chip box"}>{r.count}×</span>
          </div>
          <p className="hint">{SOURCE[r.source] ?? r.source}{r.path ? ` · ${r.path}` : ""} · first {when(r.first_seen)} · last {when(r.last_seen)}{r.user ? <> · last seen by <Link href={`/admin/users/${r.user.id}`}>@{r.user.username}</Link></> : null}{r.alerted_at ? " · emailed" : ""}</p>
          {r.detail && <pre className="error-detail">{r.detail}</pre>}
          {!resolved && <form action={adminResolveErrors}><input type="hidden" name="id" value={r.id} /><SubmitButton className="btn small" pending="…">Mark resolved</SubmitButton></form>}
        </section>
      ))}
    </>
  );
}
