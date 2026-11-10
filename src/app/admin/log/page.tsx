import Link from "next/link";
import { requireAdmin, when } from "@/lib/admin";

const LABELS: Record<string, string> = {
  delete_car: "Deleted a car", remove_car_photo: "Removed a car photo", clear_car_description: "Cleared a car description",
  delete_comment: "Deleted a comment", clear_avatar: "Removed a profile picture", clear_bio: "Cleared About text",
  clear_links: "Removed profile links", delete_account: "Deleted an account",
};

export default async function AdminLog() {
  const { db } = await requireAdmin();
  const { data } = await db.from("admin_log")
    .select("id, action, detail, created_at, target_user, admin:profiles!admin_log_admin_id_fkey(username), target:profiles!admin_log_target_user_fkey(id, username)")
    .order("created_at", { ascending: false }).limit(300);
  return (
    <section className="card">
      <h3>Activity log</h3>
      <p className="hint">Only admins can see this.</p>
      <div className="admin-table">
        {(data ?? []).map((r) => {
          const admin = r.admin as unknown as { username: string } | null;
          const target = r.target as unknown as { id: string; username: string } | null;
          const detail = (r.detail ?? {}) as { title?: string; body?: string; username?: string; reason?: string };
          return (
            <div key={r.id} className="admin-row">
              <span className="hint">{when(r.created_at)} · @{admin?.username ?? "former admin"}</span>
              <span className="admin-text">
                {LABELS[r.action] ?? r.action}
                {target && <> for <Link href={`/admin/users/${target.id}`}>@{target.username}</Link></>}
                {detail.username && <> (@{detail.username})</>}
                {detail.title && <>: “{detail.title}”</>}
                {detail.body && <>: “{detail.body}”</>}
                {detail.reason && <span className="hint"> · Reason: {detail.reason}</span>}
              </span>
            </div>
          );
        })}
        {!data?.length && <p className="hint">Nothing yet.</p>}
      </div>
    </section>
  );
}
