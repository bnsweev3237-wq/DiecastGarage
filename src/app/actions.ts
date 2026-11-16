"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentsEnabled, stripe } from "@/lib/stripe";
import { MAX_PHOTOS, MAX_TAGS, STATUSES, isEbayUrl, isThumb, withThumbs } from "@/lib/items";
import { CATEGORIES, CONDITIONS, categoryOf, cleanAttributes } from "@/lib/categories";
import { NETWORKS, normalizeSocial } from "@/lib/social";
import { FREE_ITEM_LIMIT, FREE_PHOTO_LIMIT } from "@/lib/limits";
import { REPORT_REASONS } from "@/lib/reports";
import { checkFields, contentDbMessage } from "@/lib/content-rules";
import { emailNotifications } from "@/lib/notify-email";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optStr = (f: FormData, k: string) => str(f, k) || null;
function num(f: FormData, k: string) {
  const v = str(f, k);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

// Photos for items are still stored in the original "car-photos" bucket.
// Only paths in the user's own folder are kept, so nobody can attach someone else's photo.
function photoList(f: FormData, userId: string) {
  let list: unknown = [];
  try { list = JSON.parse(str(f, "photos") || "[]"); } catch { list = []; }
  const ok = (Array.isArray(list) ? list : []).filter((x): x is string => typeof x === "string" && x.startsWith(`${userId}/`) && x.length < 200 && !isThumb(x));
  return [...new Set(ok)].slice(0, MAX_PHOTOS);
}

// "Earnhardt, PC, trade bait" → up to 10 short tags, no duplicates.
function tagList(raw: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw.split(/[,#\n]/)) {
    const tag = t.trim().replace(/\s+/g, " ").slice(0, 30);
    if (tag && !seen.has(tag.toLowerCase())) { seen.add(tag.toLowerCase()); out.push(tag); }
  }
  return out.slice(0, MAX_TAGS);
}

// Free accounts: no for-sale listings, one photo (or what the item already had), and no money fields.
// The database enforces the same rules (supabase/migrations/0014_free_plan.sql).
function parseItem(f: FormData, userId: string, member: boolean, extraPhotosBefore = 0) {
  const status = STATUSES.some((x) => x.key === str(f, "status")) ? str(f, "status") : "owned";
  const forSale = member && status === "owned" && f.get("for_sale") === "on";
  const ebayUrl = optStr(f, "ebay_url");
  const category = CATEGORIES.some((c) => c.key === str(f, "category")) ? str(f, "category") : "other";
  if (!str(f, "title")) return { error: "Give the item a name." };
  if (forSale && !ebayUrl) return { error: "Add the eBay listing link to mark this item for sale." };
  if (forSale && ebayUrl && !isEbayUrl(ebayUrl))
    return { error: "The for-sale link must be an eBay listing that starts with https://www.ebay.com/ (or another eBay site)." };
  const blocked = checkFields([
    ["the name", str(f, "title")], ["the brand", str(f, "brand")], ["the year", str(f, "year")], ["the edition", str(f, "edition")],
    ["the description", str(f, "description")], ["provenance", str(f, "provenance")], ["tags", str(f, "tags")],
    ...categoryOf(category).fields.map((fd) => [fd.label.toLowerCase(), str(f, `a_${fd.key}`)] as [string, string]),
  ]);
  if (blocked) return { error: blocked };
  const certified = f.get("is_certified") === "on";
  const certType = str(f, "cert_type") === "coa" ? "coa" : "graded";
  const rating = Number(str(f, "rating"));
  const quantity = Math.round(Number(str(f, "quantity") || "1"));
  const photos = photoList(f, userId).slice(0, member ? undefined : Math.max(FREE_PHOTO_LIMIT, 1 + extraPhotosBefore));
  return {
    item: {
      title: str(f, "title").slice(0, 160),
      category,
      attributes: cleanAttributes(category, (k) => str(f, `a_${k}`)),
      condition: CONDITIONS.some(([k]) => k === str(f, "condition")) ? str(f, "condition") : null,
      brand: optStr(f, "brand")?.slice(0, 60) ?? null,
      year: optStr(f, "year")?.slice(0, 12) ?? null,
      description: optStr(f, "description")?.slice(0, 2000) ?? null,
      in_package: f.get("in_package") === "on",
      is_hidden: f.get("is_hidden") === "on",
      photo_path: photos[0] ?? null,
      photos: photos.slice(1),
      search_terms: optStr(f, "search_terms"),
      for_sale: forSale,
      ebay_url: ebayUrl,
      asking_price: forSale ? num(f, "asking_price") : null,
      status,
      featured: f.get("featured") === "on",
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
      quantity: Number.isFinite(quantity) && quantity >= 1 ? Math.min(quantity, 9999) : 1,
      edition: optStr(f, "edition")?.slice(0, 60) ?? null,
      is_certified: certified,
      cert_type: certified ? certType : null,
      cert_by: certified ? optStr(f, "cert_by")?.slice(0, 60) ?? null : null,
      cert_grade: certified && certType === "graded" ? optStr(f, "cert_grade")?.slice(0, 20) ?? null : null,
      cert_number: certified ? optStr(f, "cert_number")?.slice(0, 60) ?? null : null,
      provenance: optStr(f, "provenance")?.slice(0, 2000) ?? null,
      tags: tagList(str(f, "tags")),
    },
    purchase: !member ? {
      acquired_from: optStr(f, "acquired_from")?.slice(0, 100) ?? null,
      storage_location: optStr(f, "storage_location")?.slice(0, 100) ?? null,
    } : {
      paid: num(f, "paid"),
      shipping: num(f, "shipping"),
      tax: num(f, "tax"),
      fees: num(f, "fees"),
      purchased_at: optStr(f, "purchased_at"),
      manual_value: num(f, "manual_value"),
      acquired_from: optStr(f, "acquired_from")?.slice(0, 100) ?? null,
      storage_location: optStr(f, "storage_location")?.slice(0, 100) ?? null,
      sold_price: status === "sold" ? num(f, "sold_price") : null,
      sold_at: status === "sold" ? optStr(f, "sold_at") : null,
      include_shipping: f.get("include_shipping") === "on",
      include_tax: f.get("include_tax") === "on",
      include_fees: f.get("include_fees") === "on",
    },
  };
}

async function isMemberNow(supabase: Awaited<ReturnType<typeof getUser>>["supabase"], userId: string) {
  const { data } = await supabase.rpc("is_member", { uid: userId });
  return data === true;
}

const dbError = (message: string) =>
  contentDbMessage(message) ?? (message.includes("FREE_LIMIT")
    ? `Free accounts can keep up to ${FREE_ITEM_LIMIT} items. Become a member in Settings to add more.`
    : message.includes("MEMBERS_ONLY_SALE")
      ? "Listing items for sale is for members. Become a member in Settings."
    : message.includes("MEMBERS_ONLY_PHOTOS")
      ? `Free accounts get ${FREE_PHOTO_LIMIT} photo per item. Become a member in Settings for up to 8.`
    : message.includes("for_sale_only_when_owned")
      ? "Only items in your collection can be for sale."
      : message.includes("for_sale_needs_ebay_link")
      ? "The for-sale link must be an eBay listing."
      : "Couldn't save. Check your connection and try again.");

export async function createItem(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const parsed = parseItem(f, user.id, await isMemberNow(supabase, user.id));
  if ("error" in parsed) return { error: parsed.error };
  const { data, error } = await supabase.from("items").insert(parsed.item).select("id").single();
  if (error) return { error: dbError(error.message) };
  await supabase.from("item_purchases").insert({ item_id: data.id, ...parsed.purchase });
  revalidatePath("/collection");
  redirect(`/collection/${data.id}?added=1`);
}

export async function updateItem(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const id = str(f, "id");
  const { data: before } = await supabase.from("items").select("photo_path, photos").eq("id", id).single();
  const parsed = parseItem(f, user.id, await isMemberNow(supabase, user.id), before?.photos?.length ?? 0);
  if ("error" in parsed) return { error: parsed.error };
  const { error } = await supabase.from("items").update(parsed.item).eq("id", id).eq("owner_id", user.id);
  if (error) return { error: dbError(error.message) };
  await supabase.from("item_purchases").upsert({ item_id: id, ...parsed.purchase });
  // Delete photos that were removed from the item.
  const kept = new Set([parsed.item.photo_path, ...parsed.item.photos]);
  const gone = [before?.photo_path, ...(before?.photos ?? [])].filter((x): x is string => !!x && !kept.has(x));
  if (gone.length) await supabase.storage.from("car-photos").remove(withThumbs(gone));
  revalidatePath(`/collection/${id}`);
  revalidatePath("/collection");
  return { ok: "Saved" };
}

export async function deleteItem(f: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const id = str(f, "id");
  const { data } = await supabase.from("items").select("photo_path, photos").eq("id", id).single();
  await supabase.from("items").delete().eq("id", id).eq("owner_id", user.id);
  const files = [data?.photo_path, ...(data?.photos ?? [])].filter((x): x is string => !!x);
  if (files.length) await supabase.storage.from("car-photos").remove(withThumbs(files));
  revalidatePath("/collection");
  redirect("/collection");
}

export async function addComp(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const carId = str(f, "item_id");
  if (!(await isMemberNow(supabase, user.id))) return { error: "Tracking values is for members. Become a member in Settings." };
  const price = num(f, "price");
  if (!price) return { error: "Enter what it sold for." };
  const note = str(f, "note");
  const isUrl = /^https?:\/\//i.test(note);
  const source = ["eBay", "Facebook", "Other"].includes(str(f, "source")) ? str(f, "source") : "Other";
  const { error } = await supabase.from("comps").insert({
    item_id: carId, price, source, sold_on: optStr(f, "sold_on"),
    url: isUrl ? note.slice(0, 600) : null, note: isUrl ? null : note.slice(0, 200) || null,
  });
  if (error) return { error: "Couldn't log that sale. Try again." };
  revalidatePath(`/collection/${carId}`);
  revalidatePath("/collection");
  return { ok: "Sold listing logged" };
}

export async function removeComp(f: FormData) {
  const { supabase } = await getUser();
  await supabase.from("comps").delete().eq("id", str(f, "id"));
  revalidatePath(`/collection/${str(f, "item_id")}`);
  revalidatePath("/collection");
}

// Beta testers' feedback goes to the admin Feedback page. Only testers can send it (the database checks too).
export async function sendFeedback(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Sign in to send feedback." };
  const message = str(f, "message");
  if (!message) return { error: "Write something first." };
  const { error } = await supabase.from("feedback").insert({
    kind: ["bug", "idea", "other"].includes(str(f, "kind")) ? str(f, "kind") : "other",
    message: message.slice(0, 2000),
    page: str(f, "page").slice(0, 300) || null,
    device: str(f, "device").slice(0, 300) || null,
  });
  if (error) return { error: error.message.includes("RATE_LIMIT_FEEDBACK") ? "That's a lot of feedback today. Thank you! Try again tomorrow." : "Couldn't send that. Try again." };
  revalidatePath("/admin", "layout");
  return { ok: "Sent" };
}

// Rate someone else's item from 1 to 5 stars, or 0 to take your rating back.
// The database checks who may rate and keeps the item's totals (supabase/migrations/0017_ratings.sql).
export async function rateItem(f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Sign in to rate items." };
  const itemId = str(f, "item_id");
  const stars = Math.round(Number(str(f, "stars")));
  const { error } = stars >= 1 && stars <= 5
    ? await supabase.from("item_ratings").upsert({ item_id: itemId, rater_id: user.id, stars })
    : await supabase.from("item_ratings").delete().eq("item_id", itemId).eq("rater_id", user.id);
  if (error) return {
    error: error.message.includes("RATING_OWN_ITEM") ? "You can't rate your own items."
      : error.message.includes("RATE_LIMIT_RATINGS") ? "You've rated a lot of items today. Try again tomorrow."
      : error.message.includes("BLOCKED") || error.message.includes("RATING_NOT_ALLOWED") ? "You can't rate this item."
      : "Couldn't save your rating. Try again.",
  };
  revalidatePath(str(f, "path"));
  revalidatePath("/");
  return { ok: stars ? "Thanks for rating!" : "Rating removed" };
}

// Blocking: the blocked collector can't comment on your pages or follow you, and you stop seeing their
// comments. They aren't told. Enforced in the database (supabase/migrations/0016_moderation.sql).
export async function blockUser(f: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const blocked = str(f, "user_id");
  if (blocked && blocked !== user.id) await supabase.from("blocks").insert({ blocked_id: blocked });
  revalidatePath("/", "layout");
}

export async function unblockUser(f: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", str(f, "user_id"));
  revalidatePath("/", "layout");
}

export async function toggleFollow(f: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const followee = str(f, "followee_id");
  if (f.get("following") === "1") {
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", followee);
  } else {
    await supabase.from("follows").insert({ followee_id: followee });
  }
  revalidatePath(`/c/${str(f, "username")}`, "layout");
  revalidatePath("/feed");
}

export async function addComment(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const body = str(f, "body");
  if (!body) return { error: "Write something first." };
  if (body.length > 1000) return { error: "Keep comments under 1,000 characters." };
  const blocked = checkFields([["comments", body]]);
  if (blocked) return { error: blocked };
  const { data: posted, error } = await supabase.from("comments").insert({
    profile_id: str(f, "profile_id"), item_id: optStr(f, "item_id"), parent_id: optStr(f, "parent_id"), body,
  }).select("id").single();
  if (error) return { error: contentDbMessage(error.message) ?? (error.message.includes("REPLY_WRONG_PAGE") ? "That comment isn't on this page anymore." : "Couldn't post your comment. Try again.") };
  // Email the people this notified, if they asked for emails. Never blocks the comment.
  try { await emailNotifications(posted.id); } catch { /* emails are best effort */ }
  revalidatePath(str(f, "path"));
  return { ok: "Posted" };
}

export async function deleteComment(f: FormData) {
  const { supabase } = await getUser();
  await supabase.from("comments").delete().eq("id", str(f, "id"));
  revalidatePath(str(f, "path"));
}

export async function updateProfile(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const links: Record<string, string | null> = {};
  for (const n of NETWORKS) {
    const r = normalizeSocial(n, str(f, n.key));
    if (r.error) return { error: r.error };
    links[n.key] = r.url;
  }
  const blocked = checkFields([["your About text", str(f, "bio")], ["your location", str(f, "location")]]);
  if (blocked) return { error: blocked };
  const avatarPath = optStr(f, "avatar_path");
  const { data: before } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  const [{ error }, { error: privateError }] = await Promise.all([
    supabase.from("profiles").update({
      ...links,
      avatar_path: avatarPath && avatarPath.startsWith(`${user.id}/`) ? avatarPath : null,
      bio: str(f, "bio").slice(0, 500) || null,
      is_public: f.get("is_public") === "on",
      show_email: f.get("show_email") === "on",
      show_values: f.get("show_values") === "on",
      show_location: f.get("show_location") === "on",
      show_follows: f.get("show_follows") === "on",
      comments_from: ["everyone", "following", "nobody"].includes(str(f, "comments_from")) ? str(f, "comments_from") : "everyone",
      default_category: CATEGORIES.some((c) => c.key === str(f, "default_category")) ? str(f, "default_category") : null,
    }).eq("id", user.id),
    supabase.from("profile_private").upsert({
      id: user.id,
      full_name: str(f, "full_name").slice(0, 100) || null,
      location: str(f, "location").slice(0, 60) || null,
      email_notifications: f.get("email_notifications") === "on",
    }),
  ]);
  if (error || privateError) return { error: contentDbMessage((error ?? privateError)!.message) ?? "Couldn't save your profile. Try again." };
  if (before?.avatar_path && before.avatar_path !== avatarPath)
    await supabase.storage.from("avatars").remove([before.avatar_path]);
  revalidatePath("/", "layout");
  return { ok: "Profile saved" };
}

export async function submitReport(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) return { error: "Sign in to report something." };
  const reason = str(f, "reason");
  const type = str(f, "target_type");
  if (!REPORT_REASONS.some(([k]) => k === reason)) return { error: "Choose a reason." };
  if (!["item", "comment", "profile"].includes(type)) return { error: "Couldn't send that report." };
  const { error } = await supabase.from("reports").insert({
    target_type: type, target_id: str(f, "target_id"), reason, details: str(f, "details").slice(0, 1000) || null,
  });
  // A duplicate means they already reported it and it's still open, which is fine to treat as sent.
  if (error && !error.message.includes("reports_one_open")) return { error: contentDbMessage(error.message) ?? "Couldn't send that report. Try again." };
  return { ok: "Thanks. We'll take a look." };
}

// Permanently deletes the signed-in collector's account and everything in it.
export async function deleteMyAccount(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  if (!me || str(f, "confirm").toLowerCase() !== me.username) return { error: `Type ${me?.username ?? "your username"} exactly to confirm.` };
  const db = createAdminClient();
  const { data: isAdmin } = await db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (isAdmin) return { error: "Admin accounts can't be deleted here. Remove your admin access first." };

  const { data: m } = await db.from("memberships").select("stripe_subscription_id, status").eq("user_id", user.id).maybeSingle();
  if (paymentsEnabled() && m?.stripe_subscription_id && m.status !== "canceled") {
    try { await stripe.subscriptions.cancel(m.stripe_subscription_id); }
    catch { return { error: "Couldn't cancel your membership, so nothing was deleted. Try again in a minute." }; }
  }
  for (const bucket of ["car-photos", "avatars"]) {
    const { data: files } = await db.storage.from(bucket).list(user.id, { limit: 1000 });
    if (files?.length) await db.storage.from(bucket).remove(files.map((x) => `${user.id}/${x.name}`));
  }
  const { error } = await db.auth.admin.deleteUser(user.id); // the profile, items, comments and follows go with it
  if (error) return { error: "Couldn't delete your account. Try again in a minute." };
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}
