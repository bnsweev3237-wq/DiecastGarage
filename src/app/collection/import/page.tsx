import Link from "next/link";
import { redirect } from "next/navigation";
import Importer from "@/components/Importer";
import { getUser } from "@/lib/supabase/server";
import { isMember } from "@/lib/limits";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // big imports take a while
export const metadata = { title: "Import from a spreadsheet" };

export default async function Import() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/collection/import");
  const [{ data: prefs }, { data: m }] = await Promise.all([
    supabase.from("profiles").select("default_category").eq("id", user.id).single(),
    supabase.from("memberships").select("status, comp_active, comp_until").eq("user_id", user.id).maybeSingle(),
  ]);
  return (
    <main className="wrap" style={{ maxWidth: 900 }}>
      <div className="head"><div><Link href="/collection">← My collection</Link><h1>Import from a spreadsheet</h1>
        <p>Add lots of items at once from a CSV file. Everything goes through the same checks as adding an item by hand.</p></div></div>
      <Importer defaultCategory={prefs?.default_category ?? "other"} member={isMember(m)} />
    </main>
  );
}
