import Link from "next/link";
import { redirect } from "next/navigation";
import GoalBar from "@/components/GoalBar";
import GoalForm from "@/components/GoalForm";
import SubmitButton from "@/components/SubmitButton";
import { deleteGoal } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import { checkQueries } from "@/lib/report-error";
import { goalProgress, type Goal } from "@/lib/goals";

export const dynamic = "force-dynamic";
export const metadata = { title: "Goals" };

export default async function Goals() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/goals");
  const loaded = await Promise.all([
    supabase.from("goals").select("*").eq("owner_id", user.id).order("created_at"),
    supabase.from("items").select("status, is_hidden, category").eq("owner_id", user.id).limit(10000),
    supabase.from("sets").select("id, name, set_entries(have)").eq("owner_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("profiles").select("username, default_category").eq("id", user.id).single(),
  ]);
  await checkQueries("Goals", "/goals", loaded, user.id);
  const [{ data: goals }, { data: items }, { data: sets }, { data: me }] = loaded;
  const progress = goalProgress((goals ?? []) as Goal[], items ?? [], (sets ?? []) as { id: string; name: string; set_entries: { have: boolean }[] }[]);
  return (
    <main className="wrap" style={{ maxWidth: 860 }}>
      <div className="head">
        <div><Link href="/collection">← My collection</Link><h1>🎯 Goals</h1>
          <p>Set targets for your collection and watch the bars fill. Public goals show on your page, and reaching one earns the Goal reached badge.</p></div>
        {me && <Link className="btn" href={`/c/${me.username}`}>See my page</Link>}
      </div>
      {progress.length ? (
        <section className="card goals">
          {progress.map((g) => (
            <div key={g.id} className="goal-row">
              <GoalBar g={g} />
              <div className="goal-meta">
                <span className="hint">{g.is_public ? "Public" : "Private"}</span>
                <form action={deleteGoal}><input type="hidden" name="id" value={g.id} /><SubmitButton className="linkbtn" pending="…">Remove</SubmitButton></form>
              </div>
            </div>
          ))}
        </section>
      ) : <div className="empty"><span className="empty-emoji" aria-hidden="true">🎯</span><h3>No goals yet</h3><p>Pick something to work toward: finishing a set, reaching 100 items, or 50 in one category.</p></div>}
      <GoalForm sets={(sets ?? []).map((s) => ({ id: s.id, name: s.name }))} defaultCategory={me?.default_category ?? "cards"} />
    </main>
  );
}
