import Link from "next/link";
import { notFound } from "next/navigation";
import CarTile from "@/components/CarTile";
import Comments from "@/components/Comments";
import FollowButton from "@/components/FollowButton";
import { getUser } from "@/lib/supabase/server";
import { money, type Car } from "@/lib/cars";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { username: string } }) {
  return { title: `@${params.username}` };
}

export default async function Collection({ params, searchParams }: { params: { username: string }; searchParams: { filter?: string } }) {
  const { supabase, user } = await getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", params.username.toLowerCase()).maybeSingle();
  if (!profile) notFound();
  const isOwner = user?.id === profile.id;
  const canView = profile.is_public || isOwner;

  const [{ data: counts }, { data: myFollow }, { data: cars }, { data: email }, { data: values }, { data: location }] = await Promise.all([
    // Counts come from a function so they stay right even when some follow lists are private.
    supabase.rpc("follow_counts", { p_profile: profile.id }).single(),
    user ? supabase.from("follows").select("followee_id").eq("follower_id", user.id).eq("followee_id", profile.id).maybeSingle() : Promise.resolve({ data: null }),
    canView ? supabase.from("cars").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    // Both return nothing unless the collector chose to show them (or it's their own page).
    supabase.rpc("profile_email", { p_profile: profile.id }),
    canView ? supabase.rpc("car_values", { p_owner: profile.id }) : Promise.resolve({ data: [] }),
    supabase.rpc("profile_location", { p_profile: profile.id }),
  ]);
  const valueByCar = new Map(((values ?? []) as { car_id: string; value: number }[]).map((v) => [v.car_id, Number(v.value)]));
  const showValues = isOwner ? profile.show_values : valueByCar.size > 0;
  const totalValue = [...valueByCar.values()].reduce((a, b) => a + b, 0);
  // Owners get their hidden cars back from the database; leave them out so this page matches what others see.
  const mine = (cars ?? []) as Car[];
  const all = mine.filter((c) => !c.is_hidden);
  const hiddenCount = mine.length - all.length;
  for (const c of mine) if (c.is_hidden) valueByCar.delete(c.id);
  const shown = searchParams.filter === "sale" ? all.filter((c) => c.for_sale) : all;
  const forSale = all.filter((c) => c.for_sale).length;
  const name = profile.username;

  return (
    <main className="wrap">
      <section className="profile">
        <div className="car" style={{ alignItems: "flex-start" }}>
          <div className="avatar" aria-hidden="true">{name.slice(0, 1)}</div>
          <div className="car-text" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1>@{name}</h1>
            <span className="muted">
              {profile.is_public ? "Public collection" : "Private collection"}
              {typeof location === "string" && (!isOwner || profile.show_location) && <> · {location}</>}
              {typeof email === "string" && (!isOwner || profile.show_email) && <> · <a href={`mailto:${email}`}>{email}</a></>}
            </span>
            {profile.bio && <p style={{ margin: 0, maxWidth: "65ch" }}>{profile.bio}</p>}
            <div className="stats">
              <span><b>{canView ? all.length : "—"}</b> cars</span>
              <Link className="stat" href={`/c/${profile.username}/followers`}><b>{(counts as { followers: number } | null)?.followers ?? 0}</b> followers</Link>
              <Link className="stat" href={`/c/${profile.username}/following`}><b>{(counts as { following: number } | null)?.following ?? 0}</b> following</Link>
              {forSale > 0 && <span><b>{forSale}</b> for sale</span>}
              {showValues && valueByCar.size > 0 && <span><b>{money(totalValue)}</b> est. value</span>}
            </div>
          </div>
        </div>
        {isOwner ? <Link className="btn" href="/settings">Edit profile &amp; privacy</Link>
          : profile.is_public && <FollowButton signedIn={!!user} followeeId={profile.id} username={profile.username} following={!!myFollow} />}
      </section>

      {!canView ? (
        <div className="empty"><h3>This collection is private</h3><p>@{name} has chosen to keep their cars to themselves.</p></div>
      ) : (
        <>
          {forSale > 0 && (
            <div className="actions">
              <Link className={`btn small${searchParams.filter !== "sale" ? " primary" : ""}`} href={`/c/${profile.username}`}>All cars</Link>
              <Link className={`btn small${searchParams.filter === "sale" ? " primary" : ""}`} href={`/c/${profile.username}?filter=sale`}>For sale ({forSale})</Link>
            </div>
          )}
          {isOwner && hiddenCount > 0 && (
            <p className="notice">{hiddenCount} hidden car{hiddenCount > 1 ? "s aren't" : " isn't"} shown here. Only you can see {hiddenCount > 1 ? "them" : "it"}, in <Link href="/garage">My garage</Link>.</p>
          )}
          {shown.length ? (
            <section className="gallery">{shown.map((c) => <CarTile key={c.id} car={c} owner={profile} value={showValues ? valueByCar.get(c.id) : null} />)}</section>
          ) : (
            <div className="empty"><h3>No cars yet</h3>{isOwner && <Link className="btn primary" href="/garage/new">+ Add a car</Link>}</div>
          )}
          <Comments profileId={profile.id} path={`/c/${profile.username}`} />
        </>
      )}
    </main>
  );
}
