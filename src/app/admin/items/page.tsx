import Link from "next/link";
import ConfirmAction from "@/components/ConfirmAction";
import RemoveWithReason from "@/components/admin/RemoveWithReason";
import Thumb from "@/components/Thumb";
import { adminDeleteItem, adminRemoveItemPhoto } from "@/app/admin/actions";
import { requireAdmin, when } from "@/lib/admin";
import { photoUrl } from "@/lib/items";

export default async function AdminCars() {
  const { db } = await requireAdmin();
  const { data } = await db.from("items").select("id, title, photo_path, is_hidden, for_sale, created_at, owner:profiles!cars_owner_id_fkey(id, username)")
    .order("created_at", { ascending: false }).limit(200);
  return (
    <section className="card">
      <h3>Newest items</h3>
      <div className="admin-table">
        {(data ?? []).map((c) => {
          const owner = c.owner as unknown as { id: string; username: string };
          const src = photoUrl(c.photo_path);
          return (
            <div key={c.id} className="admin-row car-row">
              <div className="car">
                {src ? <a href={src} target="_blank" rel="noopener noreferrer"><Thumb className="thumb" path={c.photo_path!} /></a> : <span className="thumb">No photo</span>}
                <div className="car-text">
                  <Link className="car-title" href={`/c/${owner.username}/${c.id}`}>{c.title}</Link>
                  <div className="meta">
                    <Link href={`/admin/users/${owner.id}`}>@{owner.username}</Link>
                    {c.is_hidden && <span className="chip box">Hidden</span>}
                    {c.for_sale && <span className="chip sale">For sale</span>}
                    <span className="hint">{when(c.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="actions">
                {c.photo_path && <RemoveWithReason action={adminRemoveItemPhoto} id={c.id} label="Remove photo" what="the cover photo" />}
                <RemoveWithReason action={adminDeleteItem} id={c.id} label="Delete item" what="this item" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
