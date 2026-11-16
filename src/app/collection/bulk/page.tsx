import Link from "next/link";
import { redirect } from "next/navigation";
import BulkEditor, { type BulkRow } from "@/components/BulkEditor";
import { getUser } from "@/lib/supabase/server";
import { categoryOf } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bulk edit" };

export default async function BulkEdit() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/collection/bulk");
  const { data } = await supabase.from("items")
    .select("id, title, photo_path, category, status, tags, is_hidden, in_package, item_purchases(storage_location)")
    .eq("owner_id", user.id).order("created_at", { ascending: false });
  const rows: BulkRow[] = (data ?? []).map((i) => ({
    id: i.id, title: i.title, photo: i.photo_path, status: i.status, tags: i.tags ?? [], hidden: i.is_hidden, box: i.in_package,
    category: `${categoryOf(i.category).emoji} ${categoryOf(i.category).label}`,
    storage: (i.item_purchases as unknown as { storage_location: string | null } | null)?.storage_location ?? null,
  }));
  const tags = [...new Set(rows.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b));
  return (
    <main className="wrap">
      <div className="head"><div><Link href="/collection">← My collection</Link><h1>Bulk edit</h1>
        <p>Tick the items to change, choose the changes at the top, then apply. Anything you leave empty stays as it is.</p></div></div>
      <BulkEditor rows={rows} tags={tags} />
    </main>
  );
}
