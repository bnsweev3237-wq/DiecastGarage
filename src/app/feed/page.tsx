import Link from "next/link";
import { redirect } from "next/navigation";
import CarTile from "@/components/CarTile";
import { getUser } from "@/lib/supabase/server";
import type { Car } from "@/lib/cars";

export const dynamic = "force-dynamic";
export const metadata = { title: "Following" };

type Row = Car & { owner: { username: string } | null };

export default async function Feed() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/feed");
  const { data: follows } = await supabase.from("follows")
    .select("followee:profiles!follows_followee_id_fkey(id, username)").eq("follower_id", user.id);
  const people = (follows ?? []).map((f) => f.followee as unknown as { id: string; username: string });
  const { data } = people.length
    ? await supabase.from("cars").select("*, owner:profiles(username)")
        .in("owner_id", people.map((p) => p.id)).order("created_at", { ascending: false }).limit(60)
    : { data: [] };
  const rows = (data ?? []) as Row[];
  return (
    <main className="wrap">
      <div className="head">
        <div>
          <h1>Following</h1>
          <p>New cars from the {people.length} collector{people.length === 1 ? "" : "s"} you follow.</p>
        </div>
      </div>
      {!!people.length && (
        <div className="meta">{people.map((p) => <Link key={p.id} className="chip" href={`/c/${p.username}`}>@{p.username}</Link>)}</div>
      )}
      {rows.length ? (
        <section className="gallery">{rows.map((c) => <CarTile key={c.id} car={c} owner={c.owner} />)}</section>
      ) : (
        <div className="empty">
          <h3>{people.length ? "No cars from them yet" : "You're not following anyone yet"}</h3>
          <p>Find collectors on Explore and tap Follow on their page. Their new cars show up here.</p>
          <Link className="btn primary" href="/">Explore collectors</Link>
        </div>
      )}
    </main>
  );
}
