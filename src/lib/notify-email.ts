import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Emails people about their notifications (comments, replies, and the team removing an item or photo),
// if they turned on email notifications in Settings. Uses Resend (resend.com) and does nothing until
// RESEND_API_KEY and EMAIL_FROM are set, so the bell still works without it. Comment emails go out at most
// once per person every 10 minutes so a busy thread can't flood them; team notices always go out.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecollectorhq.com";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Row = {
  id: string; user_id: string; kind: string; item_id: string | null; subject: string | null; message: string | null;
  actor: { username: string } | null; owner: { username: string } | null; item: { title: string } | null; comment: { body: string } | null;
};

const SELECT = "id, user_id, kind, item_id, subject, message, actor:profiles!notifications_actor_id_fkey(username), owner:profiles!notifications_profile_id_fkey(username), item:items(title), comment:comments(body)";

// Everyone notified by one new comment or reply.
export async function emailNotifications(commentId: string) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return;
  const db = createAdminClient();
  const { data } = await db.from("notifications").select(SELECT).eq("comment_id", commentId).is("emailed_at", null);
  await send(db, (data ?? []) as unknown as Row[]);
}

// Specific notifications, such as a removal notice from the team.
export async function emailNotificationIds(ids: string[]) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !ids.length) return;
  const db = createAdminClient();
  const { data } = await db.from("notifications").select(SELECT).in("id", ids).is("emailed_at", null);
  await send(db, (data ?? []) as unknown as Row[]);
}

async function send(db: ReturnType<typeof createAdminClient>, rows: Row[]) {
  const key = process.env.RESEND_API_KEY!;
  const from = process.env.EMAIL_FROM!;
  for (const n of rows) {
    const fromTeam = n.kind === "removed_item" || n.kind === "removed_photo";
    const [{ data: prefs }, { data: recent }] = await Promise.all([
      db.from("profile_private").select("email_notifications").eq("id", n.user_id).maybeSingle(),
      fromTeam ? Promise.resolve({ data: [] })
        : db.from("notifications").select("id").eq("user_id", n.user_id).gt("emailed_at", new Date(Date.now() - 10 * 60_000).toISOString()).limit(1),
    ]);
    if (prefs && prefs.email_notifications === false) continue;
    if (recent?.length) continue;
    const { data: who } = await db.auth.admin.getUserById(n.user_id);
    const to = who?.user?.email;
    if (!to) continue;

    const actor = `@${n.actor?.username ?? "someone"}`;
    const title = n.subject ?? n.item?.title;
    const what = n.kind === "removed_item" ? `Our team removed your item${title ? ` “${title}”` : ""}`
      : n.kind === "removed_photo" ? `Our team removed a photo from${title ? ` “${title}”` : " your item"}`
      : n.kind === "reply" ? `${actor} replied to your comment`
      : n.kind === "comment_item" ? `${actor} commented on your ${title ? `“${title}”` : "item"}`
      : `${actor} commented on your collection`;
    const body = (fromTeam ? n.message : n.comment?.body)?.slice(0, 600) ?? "";
    const link = n.kind === "removed_item" ? `${SITE}/collection`
      : `${SITE}/c/${n.owner?.username}${n.item_id ? `/${n.item_id}` : ""}${fromTeam ? "" : "#comments"}`;
    const button = n.kind === "removed_item" ? "Go to my collection" : fromTeam ? "See the item" : "See it and reply";
    const intro = fromTeam ? "Here's why:" : `${what}:`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to, subject: `${what} on theCollectorHQ`,
        text: `${what}.\n\n${intro}\n"${body}"\n\n${button}: ${link}\n\nTurn these emails off in Settings: ${SITE}/settings#notifications`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#121212">
          <p style="font-size:16px"><b>${esc(what)}</b></p>
          ${fromTeam ? `<p>${esc(intro)}</p>` : ""}
          <blockquote style="margin:0;padding:12px 16px;border-left:4px solid #fe7101;background:#faf8f5;white-space:pre-wrap">${esc(body)}</blockquote>
          <p><a href="${link}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#fe7101;color:#121212;border-radius:999px;font-weight:bold;text-decoration:none">${button}</a></p>
          <p style="color:#777;font-size:12px">You get these because email notifications are on. <a href="${SITE}/settings#notifications" style="color:#777">Turn them off</a>.</p>
        </div>`,
      }),
    });
    if (res.ok) await db.from("notifications").update({ emailed_at: new Date().toISOString() }).eq("id", n.id);
  }
}
