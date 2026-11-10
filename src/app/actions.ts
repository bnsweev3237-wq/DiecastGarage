"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { isEbayUrl } from "@/lib/cars";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optStr = (f: FormData, k: string) => str(f, k) || null;
function num(f: FormData, k: string) {
  const v = str(f, k);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

function parseCar(f: FormData) {
  const forSale = f.get("for_sale") === "on";
  const ebayUrl = optStr(f, "ebay_url");
  if (!str(f, "title")) return { error: "Give the car a name, like the driver, number and sponsor." };
  if (forSale && !ebayUrl) return { error: "Add the eBay listing link to mark this car for sale." };
  if (forSale && ebayUrl && !isEbayUrl(ebayUrl))
    return { error: "The for-sale link must be an eBay listing that starts with https://www.ebay.com/ (or another eBay site)." };
  return {
    car: {
      title: str(f, "title").slice(0, 160),
      brand: optStr(f, "brand"),
      scale: optStr(f, "scale"),
      year: optStr(f, "year"),
      description: optStr(f, "description"),
      boxed: f.get("boxed") === "on",
      is_hidden: f.get("is_hidden") === "on",
      photo_path: optStr(f, "photo_path"),
      search_terms: optStr(f, "search_terms"),
      for_sale: forSale,
      ebay_url: ebayUrl,
      asking_price: forSale ? num(f, "asking_price") : null,
    },
    purchase: {
      paid: num(f, "paid"),
      purchased_at: optStr(f, "purchased_at"),
      manual_value: num(f, "manual_value"),
    },
  };
}

const dbError = (message: string) =>
  message.includes("FREE_LIMIT")
    ? "Free accounts can keep up to 5 cars. Become a member in Settings to add more."
    : message.includes("for_sale_needs_ebay_link")
      ? "The for-sale link must be an eBay listing."
      : "Couldn't save. Check your connection and try again.";

export async function createCar(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const parsed = parseCar(f);
  if ("error" in parsed) return { error: parsed.error };
  const { data, error } = await supabase.from("cars").insert(parsed.car).select("id").single();
  if (error) return { error: dbError(error.message) };
  await supabase.from("car_purchases").insert({ car_id: data.id, ...parsed.purchase });
  revalidatePath("/garage");
  redirect(`/garage/${data.id}?added=1`);
}

export async function updateCar(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const id = str(f, "id");
  const parsed = parseCar(f);
  if ("error" in parsed) return { error: parsed.error };
  const { data: before } = await supabase.from("cars").select("photo_path").eq("id", id).single();
  const { error } = await supabase.from("cars").update(parsed.car).eq("id", id).eq("owner_id", user.id);
  if (error) return { error: dbError(error.message) };
  await supabase.from("car_purchases").upsert({ car_id: id, ...parsed.purchase });
  if (before?.photo_path && before.photo_path !== parsed.car.photo_path)
    await supabase.storage.from("car-photos").remove([before.photo_path]);
  revalidatePath(`/garage/${id}`);
  revalidatePath("/garage");
  return { ok: "Saved" };
}

export async function deleteCar(f: FormData) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const id = str(f, "id");
  const { data } = await supabase.from("cars").select("photo_path").eq("id", id).single();
  await supabase.from("cars").delete().eq("id", id).eq("owner_id", user.id);
  if (data?.photo_path) await supabase.storage.from("car-photos").remove([data.photo_path]);
  revalidatePath("/garage");
  redirect("/garage");
}

export async function addComp(_: FormState, f: FormData): Promise<FormState> {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const carId = str(f, "car_id");
  const price = num(f, "price");
  if (!price) return { error: "Enter what it sold for." };
  const note = str(f, "note");
  const isUrl = /^https?:\/\//i.test(note);
  const source = ["eBay", "Facebook", "Other"].includes(str(f, "source")) ? str(f, "source") : "Other";
  const { error } = await supabase.from("comps").insert({
    car_id: carId, price, source, sold_on: optStr(f, "sold_on"),
    url: isUrl ? note.slice(0, 600) : null, note: isUrl ? null : note.slice(0, 200) || null,
  });
  if (error) return { error: "Couldn't log that sale. Try again." };
  revalidatePath(`/garage/${carId}`);
  revalidatePath("/garage");
  return { ok: "Sold listing logged" };
}

export async function removeComp(f: FormData) {
  const { supabase } = await getUser();
  await supabase.from("comps").delete().eq("id", str(f, "id"));
  revalidatePath(`/garage/${str(f, "car_id")}`);
  revalidatePath("/garage");
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
  const { error } = await supabase.from("comments").insert({
    profile_id: str(f, "profile_id"), car_id: optStr(f, "car_id"), body,
  });
  if (error) return { error: "Couldn't post your comment. Try again." };
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
  const [{ error }, { error: privateError }] = await Promise.all([
    supabase.from("profiles").update({
      bio: str(f, "bio").slice(0, 500) || null,
      is_public: f.get("is_public") === "on",
      show_email: f.get("show_email") === "on",
      show_values: f.get("show_values") === "on",
      show_location: f.get("show_location") === "on",
      show_follows: f.get("show_follows") === "on",
      comments_from: ["everyone", "following", "nobody"].includes(str(f, "comments_from")) ? str(f, "comments_from") : "everyone",
    }).eq("id", user.id),
    supabase.from("profile_private").upsert({
      id: user.id,
      full_name: str(f, "full_name").slice(0, 100) || null,
      location: str(f, "location").slice(0, 60) || null,
    }),
  ]);
  if (error || privateError) return { error: "Couldn't save your profile. Try again." };
  revalidatePath("/", "layout");
  return { ok: "Profile saved" };
}
