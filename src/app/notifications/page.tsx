import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

type Row = {
  id: string; kind: string; item_id: string | null; read_at: string | null; created_at: string; comment_id: string | null;
  subject: string | null; message: string | null; stars: number | null;
  actor: { username: string; avatar_path: string | null } | null; owner: { username: string } | null;
  item: { title: string } | null; comment: { body: string } | null;
};

function ago(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 24 * 60) return `${Math.round(m / 60)} hr ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function Notifications() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/notifications");
  const { data } = await supabase.from("notifications")
    .select("id, kind, item_id, read_at, created_at, comment_id, subject, message, stars, actor:profiles!notifications_actor_id_fkey(username, avatar_path), owner:profiles!notifications_profile_id_fkey(username), item:items(title), comment:comments(body)")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as Row[];
  // Opening this page counts as reading them; they stay highlighted this time so you can see what's new.
  if (rows.some((r) => !r.read_at)) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);

  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="head">
        <div><h1>Notifications</h1><p>Comments, replies, new followers, ratings, new items from collectors you follow, and notes from our team. <Link href="/settings#notifications">Email settings</Link></p></div>
      </div>
      {rows.length ? (
        <section className="notif-list">
          {rows.map((n) => {
            const actor = n.actor?.username ?? "someone";
            const fromTeam = n.kind === "removed_item" || n.kind === "removed_photo";
            if (fromTeam) {
              const href = n.kind === "removed_photo" && n.item_id ? `/collection/${n.item_id}` : "/collection";
              return (
                <Link key={n.id} href={href} className={n.read_at ? "notif team" : "notif team unread"}>
                  <span className="team-badge" aria-hidden="true">🛡️</span>
                  <span className="notif-text">
                    <span><b>theCollectorHQ team</b> {n.kind === "removed_item" ? <>removed your item <b>{n.subject ?? "an item"}</b></> : <>removed a photo from <b>{n.subject ?? "your item"}</b></>}</span>
                    {n.message && <span className="notif-quote" style={{ whiteSpace: "pre-wrap" }}>{n.message}</span>}
                    <span className="hint">{ago(n.created_at)}</span>
                  </span>
                  {!n.read_at && <span className="notif-dot" aria-label="New" />}
                </Link>
              );
            }
            const href = n.kind === "follow" ? `/c/${actor}`
              : n.kind === "new_item" || n.kind === "rating" ? `/c/${n.owner?.username}/${n.item_id}`
              : `/c/${n.owner?.username}${n.item_id ? `/${n.item_id}` : ""}#comment-${n.comment_id}`;
            const what = n.kind === "follow" ? <>started following you</>
              : n.kind === "new_item" ? <>added new items, including <b>{n.item?.title ?? "a new item"}</b></>
              : n.kind === "rating" ? <>rated <b>{n.item?.title ?? "your item"}</b> <span className="stars small">{"★".repeat(n.stars ?? 0)}<span className="off">{"★".repeat(5 - (n.stars ?? 0))}</span></span></>
              : n.kind === "reply" ? <>replied to your comment</>
              : n.kind === "comment_item" ? <>commented on <b>{n.item?.title ?? "your item"}</b></>
              : <>commented on your collection</>;
            return (
              <Link key={n.id} href={href} className={n.read_at ? "notif" : "notif unread"}>
                <Avatar path={n.actor?.avatar_path ?? null} username={actor} size="small" />
                <span className="notif-text">
                  <span><b>@{actor}</b> {what}</span>
                  {n.comment?.body && <span className="notif-quote">“{n.comment.body.slice(0, 160)}{n.comment.body.length > 160 ? "…" : ""}”</span>}
                  <span className="hint">{ago(n.created_at)}</span>
                </span>
                {!n.read_at && <span className="notif-dot" aria-label="New" />}
              </Link>
            );
          })}
        </section>
      ) : (
        <div className="empty"><span className="empty-emoji" aria-hidden="true">🔔</span><h3>No notifications yet</h3><p>When someone comments on your collection or items, or replies to you, it shows up here.</p></div>
      )}
    </main>
  );
}
