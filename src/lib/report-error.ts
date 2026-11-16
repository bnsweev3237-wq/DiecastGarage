import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Records an error in the app_errors log (Admin → Errors) and, the first time a new error appears,
// emails an alert to ALERT_EMAIL through Resend when RESEND_API_KEY and EMAIL_FROM are set.
// Never throws: reporting an error must not cause another one.

export type ErrorSource = "server" | "browser" | "query" | "daily_check" | "job";
type Report = { source: ErrorSource; message: string; detail?: string | null; path?: string | null; userId?: string | null };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecollectorhq.com";

// Same error on different items should group together, so ids and numbers in paths are replaced.
const normalizePath = (p?: string | null) => (p ?? "").split("?")[0].replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id").replace(/\/\d+(?=\/|$)/g, "/:n");

export async function reportError(r: Report) {
  try {
    console.error(`[${r.source}] ${r.message}${r.path ? ` (${r.path})` : ""}${r.detail ? `\n${r.detail}` : ""}`);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    const fingerprint = `${r.source}|${r.message.slice(0, 200)}|${normalizePath(r.path)}`;
    const db = createAdminClient();
    const { data: isNew } = await db.rpc("log_app_error", {
      p_fingerprint: fingerprint, p_source: r.source, p_message: r.message.slice(0, 500),
      p_detail: r.detail?.slice(0, 4000) ?? null, p_path: r.path?.slice(0, 300) ?? null, p_user: r.userId ?? null,
    });
    if (isNew === true) await alert(db, fingerprint, r);
  } catch { /* swallow */ }
}

async function alert(db: ReturnType<typeof createAdminClient>, fingerprint: string, r: Report) {
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM, to = process.env.ALERT_EMAIL;
  if (!key || !from || !to) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to, subject: `⚠️ theCollectorHQ error: ${r.message.slice(0, 80)}`,
      text: `A new error was recorded on theCollectorHQ.\n\nWhat: ${r.message}\nWhere: ${r.path ?? "unknown"}\nKind: ${r.source}\n\n${r.detail ?? ""}\n\nSee all errors: ${SITE}/admin/errors\n\nYou get one email per new error. Repeats are counted in Admin → Errors.`,
    }),
  });
  if (res.ok) await db.from("app_errors").update({ alerted_at: new Date().toISOString() }).eq("fingerprint", fingerprint).eq("status", "open");
}

type QueryError = { message: string; code?: string; details?: string | null; hint?: string | null };

// Supabase reports a failed request as an `error` on the result instead of throwing, so pages can
// quietly show nothing (like the empty Explore page in 0.24). Pass a page's results here to log them.
// Accepts any results; ones without an error (including placeholders like { data: null }) are skipped.
export async function checkQueries(where: string, path: string, results: readonly unknown[], userId?: string | null) {
  for (const r of results) {
    const error = (r as { error?: QueryError | null } | null)?.error;
    if (error) await reportError({ source: "query", message: `${where}: ${error.message}`, detail: [error.code, error.details, error.hint].filter(Boolean).join(" · ") || null, path, userId });
  }
}
