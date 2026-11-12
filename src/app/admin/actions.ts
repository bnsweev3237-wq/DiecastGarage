"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAction, requireAdmin } from "@/lib/admin";

// Removals are silent: nothing tells the collector, and nothing on the site marks the content as removed.
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

function refresh() {
  revalidatePath("/", "layout");
}

// Removing reported content closes its open reports too.
async function closeReports(db: Awaited<ReturnType<typeof requireAdmin>>["db"], adminId: string, targetId: string) {
  await db.from("reports").update({ status: "resolved", resolved_by: adminId, resolved_at: new Date().toISOString() })
    .eq("target_id", targetId).eq("status", "open");
}

export async function adminDeleteItem(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const id = str(f, "id");
  const { data: car } = await db.from("items").select("owner_id, title, photo_path").eq("id", id).maybeSingle();
  if (!car) return;
  await db.from("items").delete().eq("id", id);
  if (car.photo_path) await db.storage.from("car-photos").remove([car.photo_path]);
  await closeReports(db, adminId, id);
  await logAdminAction(db, adminId, "delete_item", car.owner_id, { title: car.title, reason: str(f, "reason") || null });
  refresh();
}

export async function adminRemoveItemPhoto(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const id = str(f, "id");
  const { data: car } = await db.from("items").select("owner_id, title, photo_path").eq("id", id).maybeSingle();
  if (!car?.photo_path) return;
  await db.from("items").update({ photo_path: null }).eq("id", id);
  await db.storage.from("car-photos").remove([car.photo_path]);
  await logAdminAction(db, adminId, "remove_item_photo", car.owner_id, { title: car.title });
  refresh();
}

export async function adminClearItemDescription(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const id = str(f, "id");
  const { data: car } = await db.from("items").select("owner_id, title").eq("id", id).maybeSingle();
  if (!car) return;
  await db.from("items").update({ description: null }).eq("id", id);
  await logAdminAction(db, adminId, "clear_item_description", car.owner_id, { title: car.title });
  refresh();
}

export async function adminDeleteComment(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const id = str(f, "id");
  const { data: c } = await db.from("comments").select("author_id, body").eq("id", id).maybeSingle();
  if (!c) return;
  await db.from("comments").delete().eq("id", id);
  await closeReports(db, adminId, id);
  await logAdminAction(db, adminId, "delete_comment", c.author_id, { body: c.body.slice(0, 300) });
  refresh();
}

const PROFILE_FIELDS = {
  bio: { bio: null },
  links: { facebook_url: null, x_url: null, instagram_url: null, ebay_url: null },
} as const;

export async function adminClearProfile(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const userId = str(f, "user_id");
  const field = str(f, "field");
  if (field === "avatar") {
    const { data: p } = await db.from("profiles").select("avatar_path").eq("id", userId).single();
    if (p?.avatar_path) {
      await db.from("profiles").update({ avatar_path: null }).eq("id", userId);
      await db.storage.from("avatars").remove([p.avatar_path]);
    }
  } else if (field === "bio" || field === "links") {
    await db.from("profiles").update(PROFILE_FIELDS[field]).eq("id", userId);
  } else return;
  await logAdminAction(db, adminId, `clear_${field}`, userId);
  refresh();
}

export async function adminDeleteAccount(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const userId = str(f, "user_id");
  const { data: p } = await db.from("profiles").select("username").eq("id", userId).single();
  const { data: isAdmin } = await db.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  // Typing the username is the confirmation. Admin accounts can't be deleted from here.
  if (!p || isAdmin || str(f, "confirm").toLowerCase() !== p.username) return;
  for (const bucket of ["car-photos", "avatars"]) {
    const { data: files } = await db.storage.from(bucket).list(userId, { limit: 1000 });
    if (files?.length) await db.storage.from(bucket).remove(files.map((x) => `${userId}/${x.name}`));
  }
  await db.auth.admin.deleteUser(userId); // removes the profile, items, comments and follows with it
  await closeReports(db, adminId, userId);
  await logAdminAction(db, adminId, "delete_account", null, { username: p.username, reason: str(f, "reason") || null });
  refresh();
  redirect("/admin/users");
}

// Close every open report on one item: "resolved" after acting on it, "dismissed" when it's fine.
export async function adminCloseReport(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const status = str(f, "status") === "dismissed" ? "dismissed" : "resolved";
  const targetId = str(f, "target_id");
  await db.from("reports").update({ status, resolved_by: adminId, resolved_at: new Date().toISOString() })
    .eq("target_id", targetId).eq("status", "open");
  await logAdminAction(db, adminId, status === "dismissed" ? "dismiss_report" : "resolve_report", str(f, "owner_id") || null, { type: str(f, "target_type") });
  revalidatePath("/admin", "layout");
}
