import Link from "next/link";
import { redirect } from "next/navigation";
import ItemTile from "@/components/ItemTile";
import { getUser } from "@/lib/supabase/server";
import type { Item } from "@/lib/items";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved items" };

type Row = { created_at: string; item: (Item & { owner: { username: string } | null }) | null };

export default async function Saved() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/saved");
  const { data } = await supabase.from("favorites")
    .select("created_at, item:items(*, owner:profiles!cars_owner_id_fkey(username))")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(500);
  // Items that were deleted or hidden since you saved them drop out.
  const items = ((data ?? []) as unknown as Row[]).map((r) => r.item).filter((i): i is NonNullable<Row["item"]> => !!i);
  return (
    <main className="wrap">
      <div className="head"><div><h1>♥ Saved items</h1><p>Items from other collectors you&apos;ve saved. Only you can see this list.</p></div></div>
      {items.length ? (
        <section className="gallery">{items.map((i) => <ItemTile key={i.id} item={i} owner={i.owner} />)}</section>
      ) : (
        <div className="empty"><span className="empty-emoji" aria-hidden="true">♡</span><h3>Nothing saved yet</h3>
          <p>Tap ♡ Save on any other collector&apos;s item to keep it here.</p><Link className="btn primary" href="/">Explore collections</Link></div>
      )}
    </main>
  );
}
