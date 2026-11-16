import Link from "next/link";
import { redirect } from "next/navigation";
import ItemForm from "@/components/ItemForm";
import { getUser } from "@/lib/supabase/server";
import { FREE_ITEM_LIMIT, isMember } from "@/lib/limits";
import type { Item, Purchase } from "@/lib/items";

export const metadata = { title: "Add an item" };

export default async function NewItem({ searchParams }: { searchParams: { category?: string; status?: string; copy?: string } }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/collection/new");
  const [{ count }, { data: m }, { data: prefs }, { data: copy }] = await Promise.all([
    supabase.from("items").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("memberships").select("status, comp_active, comp_until").eq("user_id", user.id).single(),
    supabase.from("profiles").select("default_category").eq("id", user.id).single(),
    // "Add another like this": start from one of your own items.
    searchParams.copy
      ? supabase.from("items").select("*, item_purchases(*)").eq("id", searchParams.copy).eq("owner_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const copyFrom = copy as (Item & { item_purchases: Purchase | null }) | null;
  // Copy what it cost, but not that it was sold.
  const copyPurchase = copyFrom?.item_purchases ? { ...copyFrom.item_purchases, sold_price: null, sold_at: null } : null;
  // A category in the link wins; otherwise the collector's chosen default from Settings.
  const startCategory = searchParams.category ?? prefs?.default_category ?? undefined;
  const atLimit = !isMember(m) && (count ?? 0) >= FREE_ITEM_LIMIT;
  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="head"><div><Link href="/collection">← My collection</Link><h1>{copyFrom ? "Add another like this" : searchParams.status === "wishlist" ? "Add to your wishlist" : "Add an item"}</h1>
        {copyFrom && <p>Starting from <b>{copyFrom.title}</b>. Change what&apos;s different, add photos, and save. The original isn&apos;t changed.</p>}</div></div>
      {atLimit ? (
        <div className="empty">
          <h3>Your {FREE_ITEM_LIMIT} free spots are full</h3>
          <p>Members can add as many items as they like. You keep everything you&apos;ve already added either way.</p>
          <Link className="btn flag" href="/settings#membership">Become a member</Link>
        </div>
      ) : (
        <ItemForm userId={user.id} member={isMember(m)} copyFrom={copyFrom ?? undefined} purchase={copyPurchase} defaultCategory={startCategory} defaultStatus={searchParams.status} />
      )}
    </main>
  );
}
