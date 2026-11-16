import Link from "next/link";
import { redirect } from "next/navigation";
import { NewSetForm } from "@/components/SetForms";
import { getUser } from "@/lib/supabase/server";

export const metadata = { title: "New set" };

export default async function NewSet() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/sets/new");
  const { data: prefs } = await supabase.from("profiles").select("default_category").eq("id", user.id).single();
  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="head"><div><Link href="/sets">← My sets</Link><h1>New set</h1></div></div>
      <NewSetForm defaultCategory={prefs?.default_category ?? "cards"} />
    </main>
  );
}
