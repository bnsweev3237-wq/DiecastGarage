import Link from "next/link";
import { redirect } from "next/navigation";
import SetCard, { summarize } from "@/components/SetCard";
import { getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "My sets" };

export default async function MySets() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/sets");
  const { data } = await supabase.from("sets").select("id, name, category, is_public, set_entries(have)").eq("owner_id", user.id).order("updated_at", { ascending: false });
  const sets = summarize((data ?? []) as Parameters<typeof summarize>[0]);
  return (
    <main className="wrap">
      <div className="head">
        <div><Link href="/collection">← My collection</Link><h1>📋 My sets</h1><p>Checklists you&apos;re working through, like a card set or a diecast series. Tick off what you have and see what&apos;s missing.</p></div>
        <Link className="btn primary" href="/sets/new">+ New set</Link>
      </div>
      {sets.length ? <section className="set-grid">{sets.map((s) => <SetCard key={s.id} s={s} mine />)}</section>
        : <div className="empty"><span className="empty-emoji" aria-hidden="true">📋</span><h3>No sets yet</h3><p>Start one by pasting a checklist, one line per piece.</p><Link className="btn primary" href="/sets/new">+ New set</Link></div>}
    </main>
  );
}
