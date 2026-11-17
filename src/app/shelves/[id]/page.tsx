import Link from "next/link";
import { notFound } from "next/navigation";
import ItemTile from "@/components/ItemTile";
import ConfirmAction from "@/components/ConfirmAction";
import { EditShelfForm, ShelfPicker } from "@/components/ShelfForms";
import { deleteShelf, removeFromShelf } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import { checkQueries } from "@/lib/report-error";
import { categoryOf } from "@/lib/categories";
import type { Item } from "@/lib/items";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Shelf" };
}

export default async function ShelfPage({ params, searchParams }: { params: { id: string }; searchParams: { new?: string } }) {
  const { supabase, user } = await getUser();
  const loadedShelf = await supabase.from("shelves").select("id, owner_id, name, description, is_public, owner:profiles!shelves_owner_id_fkey(username)").eq("id", params.id).maybeSingle();
  await checkQueries("Shelf", `/shelves/${params.id}`, [loadedShelf], user?.id);
  const shelf = loadedShelf.data;
  if (!shelf) notFound();
  const owner = user?.id === shelf.owner_id;
  const ownerName = (shelf.owner as unknown as { username: string } | null)?.username ?? "";
  const loaded = await Promise.all([
    supabase.from("shelf_items").select("position, item:items(*)").eq("shelf_id", shelf.id).order("position").limit(200),
    owner ? supabase.from("items").select("id, title, photo_path, is_hidden, brand, year, category, tags, search_text").eq("owner_id", shelf.owner_id).eq("status", "owned").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  await checkQueries("Shelf", `/shelves/${params.id}`, loaded, user?.id);
  const [{ data: rows }, { data: mine }] = loaded;
  // Others never get hidden items back; the owner sees them on their own shelf, marked.
  const items = (rows ?? []).map((r) => r.item as unknown as Item | null).filter((i): i is Item => !!i);
  const onShelf = new Set(items.map((i) => i.id));
  const choices = ((mine ?? []) as { id: string; title: string; photo_path: string | null; is_hidden: boolean; category: string; search_text: string }[])
    .filter((i) => !onShelf.has(i.id))
    .map((i) => ({ id: i.id, title: i.title, photo_path: i.photo_path, is_hidden: i.is_hidden, search: `${i.search_text ?? i.title} ${categoryOf(i.category).label}`.toLowerCase() }));

  return (
    <main className="wrap">
      <div className="head">
        <div>
          {owner ? <Link href="/shelves">← My shelves</Link> : <Link href={`/c/${ownerName}?filter=shelves`}>← @{ownerName}&apos;s shelves</Link>}
          <h1>🗄️ {shelf.name}</h1>
          {shelf.description && <p>{shelf.description}</p>}
          {owner && !shelf.is_public && <p className="hint">Private: only you can see this shelf.</p>}
        </div>
      </div>
      {searchParams.new && <p className="msg ok">Shelf created. Add items from your collection below.</p>}
      {items.length ? (
        <section className="gallery" aria-label={`Items on ${shelf.name}`}>
          {items.map((i) => (
            <div key={i.id} className="shelf-slot">
              <ItemTile item={i} owner={owner ? null : { username: ownerName }} />
              {owner && (
                <form action={removeFromShelf}>
                  <input type="hidden" name="id" value={shelf.id} /><input type="hidden" name="item_id" value={i.id} />
                  <button className="linkbtn" type="submit">Remove from shelf</button>
                  {i.is_hidden && <span className="hint"> · hidden, only you see it</span>}
                </form>
              )}
            </div>
          ))}
        </section>
      ) : <div className="empty"><span className="empty-emoji" aria-hidden="true">🗄️</span><h3>This shelf is empty</h3>{owner && <p>Tick items below to put them on it.</p>}</div>}
      {owner && <>
        <ShelfPicker shelfId={shelf.id} items={choices} room={Math.max(0, 200 - items.length)} />
        <EditShelfForm shelf={shelf} />
        <section className="card danger-zone"><h3>Delete this shelf</h3><p className="hint">Deletes the shelf only. Your items stay in your collection.</p>
          <ConfirmAction action={deleteShelf} fields={{ id: shelf.id }} label="Delete shelf" confirmText="Delete this shelf? Your items stay in your collection." /></section>
      </>}
    </main>
  );
}
