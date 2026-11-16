"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAction, requireAdmin } from "@/lib/admin";
import { withThumbs } from "@/lib/items";
import { REMOVAL_REASONS, removalText } from "@/lib/reports";
import { emailNotificationIds } from "@/lib/notify-email";

// Removing an item or photo notifies its owner with the reason. Other removals are silent.

// Tells a collector the team removed their item or photo, and why.
async function noticeRemoval(db: Awaited<ReturnType<typeof requireAdmin>>["db"], f: FormData,
  n: { userId: string; kind: "removed_item" | "removed_photo"; title: string; itemId?: string }) {
  const reason = REMOVAL_REASONS.some(([k]) => k === str(f, "reason")) ? str(f, "reason") : "other";
  const note = str(f, "note").slice(0, 500);
  const { data } = await db.from("notifications").insert({
    user_id: n.userId, kind: n.kind, profile_id: n.userId, item_id: n.itemId ?? null,
    subject: n.title.slice(0, 200), message: [removalText(reason), note].filter(Boolean).join("\n\n"),
  }).select("id").single();
  if (data) { try { await emailNotificationIds([data.id]); } catch { /* best effort */ } }
  return { reason, note: note || null };
}
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
  const { data: car } = await db.from("items").select("owner_id, title, photo_path, photos").eq("id", id).maybeSingle();
  if (!car) return;
  await db.from("items").delete().eq("id", id);
  const files = [car.photo_path, ...(car.photos ?? [])].filter((x): x is string => !!x);
  if (files.length) await db.storage.from("car-photos").remove(withThumbs(files));
  await closeReports(db, adminId, id);
  const why = await noticeRemoval(db, f, { userId: car.owner_id, kind: "removed_item", title: car.title });
  await logAdminAction(db, adminId, "delete_item", car.owner_id, { title: car.title, reason: removalText(why.reason) + (why.note ? ` (${why.note})` : "") });
  refresh();
}

export async function adminRemoveItemPhoto(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const id = str(f, "id");
  const { data: car } = await db.from("items").select("owner_id, title, photo_path, photos").eq("id", id).maybeSingle();
  if (!car?.photo_path) return;
  // The next photo, if there is one, becomes the cover.
  const rest = (car.photos ?? []) as string[];
  await db.from("items").update({ photo_path: rest[0] ?? null, photos: rest.slice(1) }).eq("id", id);
  await db.storage.from("car-photos").remove(withThumbs([car.photo_path]));
  const why = await noticeRemoval(db, f, { userId: car.owner_id, kind: "removed_photo", title: car.title, itemId: id });
  await logAdminAction(db, adminId, "remove_item_photo", car.owner_id, { title: car.title, reason: removalText(why.reason) + (why.note ? ` (${why.note})` : "") });
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
  // Whatever was auto-hidden after 5 reports comes back once an admin has looked at it.
  const table = { item: "items", comment: "comments", profile: "profiles" }[str(f, "target_type")];
  if (table) await db.from(table).update({ under_review: false }).eq("id", targetId);
  await logAdminAction(db, adminId, status === "dismissed" ? "dismiss_report" : "resolve_report", str(f, "owner_id") || null, { type: str(f, "target_type") });
  revalidatePath("/admin", "layout");
}

// Complimentary memberships. The member sees only that they have one and when it ends;
// who granted it and the reason stay in the admin activity log.
export async function adminGrantComp(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const userId = str(f, "user_id");
  const forever = str(f, "ends") !== "date";
  const until = str(f, "comp_until");
  if (!userId || (!forever && !/^\d{4}-\d{2}-\d{2}$/.test(until))) return;
  const { data: before } = await db.from("memberships").select("comp_active, comp_until").eq("user_id", userId).maybeSingle();
  await db.from("memberships").upsert({ user_id: userId, comp_active: true, comp_until: forever ? null : until, updated_at: new Date().toISOString() });
  await logAdminAction(db, adminId, before?.comp_active ? "update_comp_membership" : "grant_comp_membership", userId,
    { until: forever ? "no end date" : until, reason: str(f, "reason") || null });
  refresh();
}

export async function adminRevokeComp(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const userId = str(f, "user_id");
  await db.from("memberships").update({ comp_active: false, comp_until: null, updated_at: new Date().toISOString() }).eq("user_id", userId);
  await logAdminAction(db, adminId, "revoke_comp_membership", userId, {});
  refresh();
}

// Makes small copies for photos that don't have one yet, without waiting for the daily job.
export async function adminMakeThumbs() {
  const { adminId, db } = await requireAdmin();
  const { makeMissingThumbs } = await import("@/lib/thumbs");
  const r = await makeMissingThumbs(db, { limit: 60, budgetMs: 8_000 });
  if (r.made) await logAdminAction(db, adminId, "make_thumbnails", null, { title: `${r.made} made` });
  refresh();
}

// Beta testers get the Send feedback button.
export async function adminSetBetaTester(f: FormData) {
  const { adminId, db } = await requireAdmin();
  const userId = str(f, "user_id");
  const on = str(f, "on") === "1";
  await db.from("profiles").update({ is_beta_tester: on }).eq("id", userId);
  await logAdminAction(db, adminId, on ? "add_beta_tester" : "remove_beta_tester", userId, {});
  refresh();
}

// Feedback moves between New (open), In review, Done and Dismissed.
export async function adminSetFeedbackStatus(f: FormData) {
  const status = ["open", "in_review", "done", "dismissed"].includes(str(f, "status")) ? str(f, "status") : "open";
  await requireAdmin().then(({ db }) =>
    db.from("feedback").update({ status, status_changed_at: new Date().toISOString() }).eq("id", str(f, "id")));
  revalidatePath("/admin", "layout");
}
