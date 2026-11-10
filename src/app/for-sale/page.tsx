import CarTile from "@/components/CarTile";
import { getUser } from "@/lib/supabase/server";
import { SCALES, type Car } from "@/lib/cars";

export const dynamic = "force-dynamic";
export const metadata = { title: "For sale" };

type Row = Car & { owner: { username: string } | null };

export default async function ForSale({ searchParams }: { searchParams: { scale?: string; q?: string } }) {
  const { supabase } = await getUser();
  let query = supabase.from("cars").select("*, owner:profiles!inner(username, is_public)")
    .eq("for_sale", true).eq("owner.is_public", true).order("created_at", { ascending: false }).limit(60);
  if (searchParams.scale) query = query.eq("scale", searchParams.scale);
  if (searchParams.q) query = query.ilike("title", `%${searchParams.q.replace(/[%_]/g, "")}%`);
  const { data } = await query;
  const rows = (data ?? []) as Row[];
  return (
    <main className="wrap">
      <div className="head">
        <div>
          <h1>For sale</h1>
          <p>Cars collectors are selling. Every one is listed on eBay, so you buy there with eBay&apos;s buyer protection.</p>
        </div>
      </div>
      <form className="toolbar" role="search">
        <input name="q" defaultValue={searchParams.q} placeholder="Search driver, car, sponsor" aria-label="Search" />
        <select name="scale" defaultValue={searchParams.scale ?? ""} aria-label="Scale">
          <option value="">All scales</option>
          {SCALES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn" type="submit">Search</button>
      </form>
      {rows.length ? (
        <section className="gallery">{rows.map((c) => <CarTile key={c.id} car={c} owner={c.owner} />)}</section>
      ) : (
        <div className="empty"><h3>Nothing for sale here yet</h3><p>Collectors can mark a car for sale with a link to its eBay listing.</p></div>
      )}
    </main>
  );
}
