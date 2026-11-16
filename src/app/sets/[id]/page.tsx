import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmAction from "@/components/ConfirmAction";
import { AutoMatch, Checklist, EditSetForm } from "@/components/SetForms";
import { deleteSet } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import { categoryOf } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function SetPage({ params, searchParams }: { params: { id: string }; searchParams: { new?: string } }) {
  const { supabase, user } = await getUser();
  const { data: set } = await supabase.from("sets").select("id, owner_id, name, description, category, is_public, owner:profiles!sets_owner_id_fkey(username)").eq("id", params.id).maybeSingle();
  if (!set) notFound();
  const { data: entries } = await supabase.from("set_entries").select("id, label, have, item:items(id, title)").eq("set_id", set.id).order("position").limit(2000);
  const owner = user?.id === set.owner_id;
  const ownerName = (set.owner as unknown as { username: string } | null)?.username ?? "";
  return (
    <main className="wrap" style={{ maxWidth: 900 }}>
      <div className="head">
        <div>
          {owner ? <Link href="/sets">← My sets</Link> : <Link href={`/c/${ownerName}?filter=sets`}>← @{ownerName}&apos;s sets</Link>}
          <h1>{set.category ? `${categoryOf(set.category).emoji} ` : ""}{set.name}</h1>
          {set.description && <p>{set.description}</p>}
          {owner && !set.is_public && <p className="hint">Private: only you can see this set.</p>}
        </div>
        {owner && <AutoMatch setId={set.id} />}
      </div>
      {searchParams.new && <p className="msg ok">Set created. Tick off what you have, or use “Match my items” to tick off items already in your collection.</p>}
      <Checklist setId={set.id} owner={owner} ownerName={ownerName}
        entries={(entries ?? []).map((e) => ({ id: e.id, label: e.label, have: e.have, item: e.item as unknown as { id: string; title: string } | null }))} />
      {owner && <>
        <EditSetForm set={set} />
        <section className="card danger-zone"><h3>Delete this set</h3><p className="hint">Deletes the checklist only. Your items stay in your collection.</p>
          <ConfirmAction action={deleteSet} fields={{ id: set.id }} label="Delete set" confirmText="Delete this set and its checklist?" /></section>
      </>}
    </main>
  );
}
