import Link from "next/link";
import ConfirmAction from "@/components/ConfirmAction";
import { adminDeleteComment } from "@/app/admin/actions";
import { requireAdmin, when } from "@/lib/admin";

export default async function AdminComments() {
  const { db } = await requireAdmin();
  const { data } = await db.from("comments")
    .select("id, body, created_at, item_id, author:profiles!comments_author_id_fkey(id, username), profile:profiles!comments_profile_id_fkey(username)")
    .order("created_at", { ascending: false }).limit(200);
  return (
    <section className="card">
      <h3>Newest comments</h3>
      <div className="admin-table">
        {(data ?? []).map((c) => {
          const author = c.author as unknown as { id: string; username: string };
          const on = (c.profile as unknown as { username: string }).username;
          return (
            <div key={c.id} className="admin-row">
              <span className="hint">
                <Link href={`/admin/users/${author.id}`}>@{author.username}</Link> on{" "}
                <Link href={c.item_id ? `/c/${on}/${c.item_id}` : `/c/${on}`}>@{on}{c.item_id ? "'s item" : ""}</Link> · {when(c.created_at)}
              </span>
              <span className="admin-text">{c.body}</span>
              <ConfirmAction action={adminDeleteComment} fields={{ id: c.id }} label="Delete" confirmText="Delete this comment?" />
            </div>
          );
        })}
        {!data?.length && <p className="hint">No comments yet.</p>}
      </div>
    </section>
  );
}
