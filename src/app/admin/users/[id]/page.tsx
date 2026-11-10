import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import ConfirmAction from "@/components/ConfirmAction";
import SubmitButton from "@/components/SubmitButton";
import { adminClearProfile, adminDeleteAccount, adminDeleteCar, adminDeleteComment, adminRemoveCarPhoto, adminClearCarDescription } from "@/app/admin/actions";
import { requireAdmin, when } from "@/lib/admin";
import { money, photoUrl, valueOf, type Car, type Comp, type Purchase } from "@/lib/cars";
import { NETWORKS } from "@/lib/social";

export default async function AdminUser({ params }: { params: { id: string } }) {
  const { db } = await requireAdmin();
  const [{ data: p }, { data: priv }, { data: auth }, { data: m }, { data: cars }, { data: written }, { data: onTheirs }, { data: isAdmin }] = await Promise.all([
    db.from("profiles").select("*").eq("id", params.id).maybeSingle(),
    db.from("profile_private").select("*").eq("id", params.id).maybeSingle(),
    db.auth.admin.getUserById(params.id),
    db.from("memberships").select("*").eq("user_id", params.id).maybeSingle(),
    db.from("cars").select("*, car_purchases(*), comps(*)").eq("owner_id", params.id).order("created_at", { ascending: false }),
    db.from("comments").select("id, body, created_at, profile:profiles!comments_profile_id_fkey(username)").eq("author_id", params.id).order("created_at", { ascending: false }).limit(100),
    db.from("comments").select("id, body, created_at, author:profiles!comments_author_id_fkey(username)").eq("profile_id", params.id).order("created_at", { ascending: false }).limit(100),
    db.from("admins").select("user_id").eq("user_id", params.id).maybeSingle(),
  ]);
  if (!p) notFound();
  const u = auth?.user;
  const rows = (cars ?? []) as (Car & { car_purchases: Purchase | null; comps: Comp[] })[];
  const links = NETWORKS.filter((n) => p[n.key]);

  return (
    <>
      <section className="card">
        <div className="profile">
          <div className="car" style={{ alignItems: "flex-start" }}>
            <Avatar path={p.avatar_path} username={p.username} />
            <div className="car-text">
              <h2>@{p.username}{isAdmin && <span className="chip" style={{ marginLeft: 8 }}>Admin</span>}</h2>
              <Link href={`/c/${p.username}`}>View public page</Link>
            </div>
          </div>
        </div>
        <dl className="specs">
          <dt>Full name</dt><dd>{priv?.full_name || "—"}</dd>
          <dt>Email</dt><dd>{u?.email} {u?.email_confirmed_at ? "" : <span className="hint">(not confirmed)</span>}</dd>
          <dt>Location</dt><dd>{priv?.location || "—"}</dd>
          <dt>Joined</dt><dd>{when(p.created_at)}{u?.last_sign_in_at && <span className="hint"> · last signed in {when(u.last_sign_in_at)}</span>}</dd>
          <dt>Plan</dt><dd>{m?.status === "active" || m?.status === "trialing" ? "Member" : "Free"}{m?.status && m.status !== "none" && <span className="hint"> ({m.status})</span>}</dd>
          <dt>Collection</dt><dd>{p.is_public ? "Public" : "Private"}</dd>
          <dt>Shows</dt><dd>{[p.show_email && "email", p.show_values && "values", p.show_location && "location", p.show_follows && "follow lists"].filter(Boolean).join(", ") || "nothing optional"}</dd>
          <dt>Comments from</dt><dd>{p.comments_from}</dd>
        </dl>
      </section>

      <section className="card">
        <h3>Profile content</h3>
        <div className="admin-table">
          <div className="admin-row"><span>Picture</span><span className="hint">{p.avatar_path ? "Set" : "None"}</span>
            {p.avatar_path && <ConfirmAction action={adminClearProfile} fields={{ user_id: p.id, field: "avatar" }} label="Remove picture" confirmText="Remove their profile picture?" />}</div>
          <div className="admin-row"><span>About</span><span className="admin-text">{p.bio || <span className="hint">None</span>}</span>
            {p.bio && <ConfirmAction action={adminClearProfile} fields={{ user_id: p.id, field: "bio" }} label="Remove about" confirmText="Clear their About text?" />}</div>
          <div className="admin-row"><span>Links</span>
            <span className="admin-text">{links.length ? links.map((n) => <a key={n.key} href={p[n.key]} target="_blank" rel="noopener noreferrer" style={{ marginRight: 10 }}>{n.label} ↗</a>) : <span className="hint">None</span>}</span>
            {links.length > 0 && <ConfirmAction action={adminClearProfile} fields={{ user_id: p.id, field: "links" }} label="Remove links" confirmText="Remove all their Facebook, X, Instagram and eBay links?" />}</div>
        </div>
      </section>

      <section className="card">
        <h3>Cars ({rows.length})</h3>
        <div className="admin-table">
          {rows.map((c) => {
            const v = valueOf(c.car_purchases, c.comps);
            const src = photoUrl(c.photo_path);
            return (
              <div key={c.id} className="admin-row car-row">
                <div className="car">
                  {src ? <a href={src} target="_blank" rel="noopener noreferrer"><img className="thumb" src={src} alt="" /></a> : <span className="thumb">No photo</span>}
                  <div className="car-text">
                    <Link className="car-title" href={`/c/${p.username}/${c.id}`}>{c.title}</Link>
                    <div className="meta">
                      {c.is_hidden && <span className="chip box">Hidden</span>}
                      {c.for_sale && <span className="chip sale">For sale</span>}
                      <span className="hint">Paid {money(c.car_purchases?.paid ?? null, 2)} · value {v ? money(v.value, 2) : "—"}</span>
                      {c.ebay_url && <a href={c.ebay_url} target="_blank" rel="noopener noreferrer nofollow">eBay listing ↗</a>}
                    </div>
                    {c.description && <p className="admin-text hint">{c.description}</p>}
                  </div>
                </div>
                <div className="actions">
                  {c.photo_path && <ConfirmAction action={adminRemoveCarPhoto} fields={{ id: c.id }} label="Remove photo" confirmText="Remove this photo?" />}
                  {c.description && <ConfirmAction action={adminClearCarDescription} fields={{ id: c.id }} label="Remove description" confirmText="Clear this description?" />}
                  <ConfirmAction action={adminDeleteCar} fields={{ id: c.id }} label="Delete car" confirmText="Delete this car, its photo and its comments?" />
                </div>
              </div>
            );
          })}
          {!rows.length && <p className="hint">No cars.</p>}
        </div>
      </section>

      <section className="card">
        <h3>Comments they wrote ({written?.length ?? 0})</h3>
        <div className="admin-table">
          {(written ?? []).map((c) => (
            <div key={c.id} className="admin-row">
              <span className="hint">on @{(c.profile as unknown as { username: string } | null)?.username} · {when(c.created_at)}</span>
              <span className="admin-text">{c.body}</span>
              <ConfirmAction action={adminDeleteComment} fields={{ id: c.id }} label="Delete" confirmText="Delete this comment?" />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Comments on their collection ({onTheirs?.length ?? 0})</h3>
        <div className="admin-table">
          {(onTheirs ?? []).map((c) => (
            <div key={c.id} className="admin-row">
              <span className="hint">by @{(c.author as unknown as { username: string } | null)?.username} · {when(c.created_at)}</span>
              <span className="admin-text">{c.body}</span>
              <ConfirmAction action={adminDeleteComment} fields={{ id: c.id }} label="Delete" confirmText="Delete this comment?" />
            </div>
          ))}
        </div>
      </section>

      {!isAdmin && (
        <section className="card danger-zone">
          <h3>Delete account</h3>
          <p className="hint">Permanently deletes @{p.username}&apos;s login, profile, cars, photos, comments and follows. This can&apos;t be undone.</p>
          <form action={adminDeleteAccount} className="grid2">
            <input type="hidden" name="user_id" value={p.id} />
            <div className="field"><label className="label" htmlFor="confirm">Type {p.username} to confirm</label><input id="confirm" name="confirm" required autoComplete="off" /></div>
            <div className="field"><label className="label" htmlFor="reason">Reason (for the activity log)</label><input id="reason" name="reason" maxLength={200} /></div>
            <div className="actions"><SubmitButton className="btn danger" pending="Deleting…">Delete account</SubmitButton></div>
          </form>
        </section>
      )}
    </>
  );
}
