import ItemTile from "@/components/ItemTile";
import { getUser } from "@/lib/supabase/server";
import { type Item } from "@/lib/items";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "For sale" };

type Row = Item & { owner: { username: string } | null };

export default async function ForSale({ searchParams }: { searchParams: { category?: string; q?: string } }) {
  const { supabase } = await getUser();
  let query = supabase.from("items").select("*, owner:profiles!inner(username, is_public)")
    .eq("for_sale", true).eq("owner.is_public", true).order("created_at", { ascending: false }).limit(60);
  if (searchParams.category) query = query.eq("category", searchParams.category);
  if (searchParams.q) query = query.ilike("title", `%${searchParams.q.replace(/[%_]/g, "")}%`);
  const { data } = await query;
  const rows = (data ?? []) as Row[];
  return (
    <main className="wrap">
      <div className="head">
        <div>
          <h1>For sale</h1>
          <p>Collectibles members are selling. Every one is listed on eBay, so you buy there with eBay&apos;s buyer protection.</p>
        </div>
      </div>
      <form className="toolbar" role="search">
        <input name="q" defaultValue={searchParams.q} placeholder="Search for an item" aria-label="Search" />
        <select name="category" defaultValue={searchParams.category ?? ""} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <button className="btn" type="submit">Search</button>
      </form>
      {rows.length ? (
        <section className="gallery">{rows.map((c) => <ItemTile key={c.id} item={c} owner={c.owner} />)}</section>
      ) : (
        <div className="empty"><h3>Nothing for sale here yet</h3><p>Members can mark an item for sale with a link to its eBay listing.</p></div>
      )}
    </main>
  );
}
