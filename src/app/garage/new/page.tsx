import Link from "next/link";
import { redirect } from "next/navigation";
import CarForm from "@/components/CarForm";
import { getUser } from "@/lib/supabase/server";
import { FREE_CAR_LIMIT, isActiveMembership } from "@/lib/limits";

export const metadata = { title: "Add a car" };

export default async function NewCar() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/garage/new");
  const [{ count }, { data: m }] = await Promise.all([
    supabase.from("cars").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("memberships").select("status").eq("user_id", user.id).single(),
  ]);
  const atLimit = !isActiveMembership(m?.status) && (count ?? 0) >= FREE_CAR_LIMIT;
  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="head"><div><Link href="/garage">← My garage</Link><h1>Add a car</h1></div></div>
      {atLimit ? (
        <div className="empty">
          <h3>Your {FREE_CAR_LIMIT} free spots are full</h3>
          <p>Members can add as many cars as they like. You keep every car you&apos;ve already added either way.</p>
          <Link className="btn flag" href="/settings#membership">Become a member</Link>
        </div>
      ) : (
        <CarForm userId={user.id} />
      )}
    </main>
  );
}
