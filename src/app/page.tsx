import Link from "next/link";
import CarTile from "@/components/CarTile";
import { getUser } from "@/lib/supabase/server";
import type { Car } from "@/lib/cars";

export const dynamic = "force-dynamic";

type Row = Car & { owner: { username: string; is_public: boolean } | null };

export default async function Explore() {
  const { supabase, user } = await getUser();
  const [{ data: cars }, { data: collectors }] = await Promise.all([
    supabase.from("cars").select("*, owner:profiles!inner(username, is_public)")
      .eq("owner.is_public", true).order("created_at", { ascending: false }).limit(24),
    supabase.from("profiles").select("username, cars(count)").eq("is_public", true)
      .order("created_at", { ascending: false }).limit(12),
  ]);
  const rows = (cars ?? []) as Row[];
  return (
    <main className="wrap">
      <div className="head">
        <div>
          <h1>Explore the garage</h1>
          <p>Race car diecasts collectors just added. Follow the ones you like and see their new cars in your feed.</p>
        </div>
        {user ? <Link className="btn primary" href="/garage/new">+ Add a car</Link>
          : <Link className="btn primary" href="/signup">Start your collection free</Link>}
      </div>
      {rows.length ? (
        <section className="gallery" aria-label="Recently added cars">
          {rows.map((c) => <CarTile key={c.id} car={c} owner={c.owner} />)}
        </section>
      ) : (
        <div className="empty"><h3>No public cars yet</h3><p>Be the first to show off your collection.</p></div>
      )}
      {!!collectors?.length && (
        <section className="card">
          <h3>Collectors</h3>
          <div className="meta">
            {collectors.map((p) => (
              <Link key={p.username} className="chip" href={`/c/${p.username}`}>
                @{p.username} · {(p.cars as unknown as { count: number }[])[0]?.count ?? 0} cars
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
