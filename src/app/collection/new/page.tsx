import Link from "next/link";
import { redirect } from "next/navigation";
import ItemForm from "@/components/ItemForm";
import { getUser } from "@/lib/supabase/server";
import { FREE_ITEM_LIMIT, isMember } from "@/lib/limits";

export const metadata = { title: "Add an item" };

export default async function NewItem({ searchParams }: { searchParams: { category?: string; status?: string } }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/collection/new");
  const [{ count }, { data: m }, { data: prefs }] = await Promise.all([
    supabase.from("items").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("memberships").select("status, comp_active, comp_until").eq("user_id", user.id).single(),
    supabase.from("profiles").select("default_category").eq("id", user.id).single(),
  ]);
  // A category in the link wins; otherwise the collector's chosen default from Settings.
  const startCategory = searchParams.category ?? prefs?.default_category ?? undefined;
  const atLimit = !isMember(m) && (count ?? 0) >= FREE_ITEM_LIMIT;
  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="head"><div><Link href="/collection">← My collection</Link><h1>{searchParams.status === "wishlist" ? "Add to your wishlist" : "Add an item"}</h1></div></div>
      {atLimit ? (
        <div className="empty">
          <h3>Your {FREE_ITEM_LIMIT} free spots are full</h3>
          <p>Members can add as many items as they like. You keep everything you&apos;ve already added either way.</p>
          <Link className="btn flag" href="/settings#membership">Become a member</Link>
        </div>
      ) : (
        <ItemForm userId={user.id} member={isMember(m)} defaultCategory={startCategory} defaultStatus={searchParams.status} />
      )}
    </main>
  );
}
