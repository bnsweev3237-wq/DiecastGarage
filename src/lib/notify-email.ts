import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Emails people about a new comment or reply, if they turned on email notifications in Settings.
// Uses Resend (resend.com). Does nothing until RESEND_API_KEY and EMAIL_FROM are set, so the bell
// still works without it. At most one email per person every 10 minutes, so a busy thread can't flood them.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecollectorhq.com";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function emailNotifications(commentId: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return;
  const db = createAdminClient();
  const { data: rows } = await db.from("notifications")
    .select("id, user_id, kind, item_id, actor:profiles!notifications_actor_id_fkey(username), owner:profiles!notifications_profile_id_fkey(username), item:items(title), comment:comments(body)")
    .eq("comment_id", commentId).is("emailed_at", null);

  for (const n of (rows ?? []) as unknown as {
    id: string; user_id: string; kind: string; item_id: string | null;
    actor: { username: string } | null; owner: { username: string } | null; item: { title: string } | null; comment: { body: string } | null;
  }[]) {
    const [{ data: prefs }, { data: recent }] = await Promise.all([
      db.from("profile_private").select("email_notifications").eq("id", n.user_id).maybeSingle(),
      db.from("notifications").select("id").eq("user_id", n.user_id).gt("emailed_at", new Date(Date.now() - 10 * 60_000).toISOString()).limit(1),
    ]);
    if (prefs && prefs.email_notifications === false) continue;
    if (recent?.length) continue;
    const { data: who } = await db.auth.admin.getUserById(n.user_id);
    const to = who?.user?.email;
    if (!to) continue;

    const actor = `@${n.actor?.username ?? "someone"}`;
    const what = n.kind === "reply" ? `${actor} replied to your comment`
      : n.kind === "comment_item" ? `${actor} commented on your ${n.item?.title ? `“${n.item.title}”` : "item"}`
      : `${actor} commented on your collection`;
    const link = `${SITE}/c/${n.owner?.username}${n.item_id ? `/${n.item_id}` : ""}#comments`;
    const body = (n.comment?.body ?? "").slice(0, 400);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to, subject: `${what} on theCollectorHQ`,
        text: `${what}:\n\n"${body}"\n\nSee it and reply: ${link}\n\nTurn these emails off in Settings: ${SITE}/settings#notifications`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#121212">
          <p style="font-size:16px"><b>${esc(what)}</b></p>
          <blockquote style="margin:0;padding:12px 16px;border-left:4px solid #fe7101;background:#faf8f5">${esc(body)}</blockquote>
          <p><a href="${link}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#fe7101;color:#121212;border-radius:999px;font-weight:bold;text-decoration:none">See it and reply</a></p>
          <p style="color:#777;font-size:12px">You get these because email notifications are on. <a href="${SITE}/settings#notifications" style="color:#777">Turn them off</a>.</p>
        </div>`,
      }),
    });
    if (res.ok) await db.from("notifications").update({ emailed_at: new Date().toISOString() }).eq("id", n.id);
  }
}
