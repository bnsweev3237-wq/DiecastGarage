import "server-only";
import { createClient } from "@supabase/supabase-js";
import { reportError } from "@/lib/report-error";

// The daily site check. Runs the same requests the main public pages make, as a signed-out visitor,
// and logs any that fail. It would have caught the 0.24 Explore problem the morning after.
export async function runSiteCheck() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data: one } = await db.from("items").select("id").eq("status", "owned").limit(1).maybeSingle();
  const checks: [string, PromiseLike<{ error: { message: string } | null }>][] = [
    ["Explore items", db.from("items").select("*, owner:profiles!cars_owner_id_fkey!inner(username, is_public)").eq("owner.is_public", true).eq("status", "owned").order("rating_score", { ascending: false }).limit(5)],
    ["Explore collectors", db.from("profiles").select("username, avatar_path, items!cars_owner_id_fkey(count)").eq("is_public", true).limit(5)],
    ["Explore counts", db.from("items").select("id, owner:profiles!cars_owner_id_fkey!inner(is_public)", { count: "exact", head: true }).eq("owner.is_public", true)],
    ["For sale", db.from("items").select("*, owner:profiles!cars_owner_id_fkey!inner(username, is_public)").eq("for_sale", true).limit(5)],
    ["Search", db.from("items").select("id, owner:profiles!cars_owner_id_fkey!inner(username)").ilike("search_text", "%a%").limit(5)],
    ["Comments", db.from("comments").select("id, author:profiles!comments_author_id_fkey(username)").limit(5)],
    ["Public sets", db.from("sets").select("id, set_entries(have)").limit(5)],
    ["Shows calendar", db.from("events").select("id, poster:profiles!events_created_by_fkey(username)").limit(5)],
    ["Public shelves", db.from("shelves").select("id, shelf_items(position, item_id)").limit(5)],
    ["Item values", db.rpc("item_values", { p_owner: "00000000-0000-0000-0000-000000000000" })],
  ];
  if (one) checks.push(["Item page", db.from("items").select("*, owner:profiles!cars_owner_id_fkey(id, username)").eq("id", one.id).maybeSingle()]);
  let failed = 0;
  for (const [name, q] of checks) {
    try {
      const { error } = await q;
      if (error) { failed++; await reportError({ source: "daily_check", message: `Daily check: ${name} failed: ${error.message}`, path: name }); }
    } catch (e) {
      failed++; await reportError({ source: "daily_check", message: `Daily check: ${name} threw: ${e instanceof Error ? e.message : String(e)}`, path: name });
    }
  }
  return { checked: checks.length, failed };
}
