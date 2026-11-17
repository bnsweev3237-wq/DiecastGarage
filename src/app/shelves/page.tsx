import Link from "next/link";
import { redirect } from "next/navigation";
import ShelfCard, { summarizeShelves } from "@/components/ShelfCard";
import { NewShelfForm } from "@/components/ShelfForms";
import { getUser } from "@/lib/supabase/server";
import { checkQueries } from "@/lib/report-error";

export const dynamic = "force-dynamic";
export const metadata = { title: "My shelves" };

export default async function MyShelves() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/shelves");
  const loaded = await supabase.from("shelves").select("id, name, is_public, shelf_items(position, item:items(photo_path))")
    .eq("owner_id", user.id).order("created_at");
  await checkQueries("My shelves", "/shelves", [loaded], user.id);
  const shelves = summarizeShelves((loaded.data ?? []) as unknown as Parameters<typeof summarizeShelves>[0]);
  return (
    <main className="wrap">
      <div className="head">
        <div><Link href="/collection">← My collection</Link><h1>🗄️ My shelves</h1>
          <p>Display cases for your page. Group your favorites however you like, like an Earnhardt shelf or your PSA 10s.</p></div>
      </div>
      {shelves.length ? <section className="set-grid">{shelves.map((s) => <ShelfCard key={s.id} s={s} mine />)}</section>
        : <div className="empty"><span className="empty-emoji" aria-hidden="true">🗄️</span><h3>No shelves yet</h3><p>Make your first one below, then add items from your collection.</p></div>}
      <NewShelfForm />
    </main>
  );
}
