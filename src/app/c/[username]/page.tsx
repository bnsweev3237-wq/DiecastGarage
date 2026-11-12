import Link from "next/link";
import { notFound } from "next/navigation";
import ItemTile from "@/components/ItemTile";
import Comments from "@/components/Comments";
import FollowButton from "@/components/FollowButton";
import Avatar from "@/components/Avatar";
import SocialLinks from "@/components/SocialLinks";
import ReportButton from "@/components/ReportButton";
import { getUser } from "@/lib/supabase/server";
import { money, type Item } from "@/lib/items";

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
    canView ? supabase.from("items").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    // Both return nothing unless the collector chose to show them (or it's their own page).
    supabase.rpc("profile_email", { p_profile: profile.id }),
    canView ? supabase.rpc("item_values", { p_owner: profile.id }) : Promise.resolve({ data: [] }),
    supabase.rpc("profile_location", { p_profile: profile.id }),
  ]);
  const valueByCar = new Map(((values ?? []) as { item_id: string; value: number }[]).map((v) => [v.item_id, Number(v.value)]));
  const showValues = isOwner ? profile.show_values : valueByCar.size > 0;
  const totalValue = [...valueByCar.values()].reduce((a, b) => a + b, 0);
  // Owners get their hidden cars back from the database; leave them out so this page matches what others see.
  const mine = (cars ?? []) as Item[];
  const all = mine.filter((c) => !c.is_hidden);
  const hiddenCount = mine.length - all.length;
  for (const c of mine) if (c.is_hidden) valueByCar.delete(c.id);
  const shown = searchParams.filter === "sale" ? all.filter((c) => c.for_sale) : all;
  const forSale = all.filter((c) => c.for_sale).length;
  const name = profile.username;

  return (
    <>
      <section className="band">
        <div className="band-in">
          <div className="car" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <Avatar path={profile.avatar_path} username={name} />
            <div className="car-text" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h1>@{name}</h1>
              <span className="muted">
                {profile.is_public ? "Public collection" : "Private collection"}
                {typeof location === "string" && (!isOwner || profile.show_location) && <> · {location}</>}
                {typeof email === "string" && (!isOwner || profile.show_email) && <> · <a href={`mailto:${email}`}>{email}</a></>}
              </span>
              {profile.bio && <p style={{ margin: 0, maxWidth: "60ch", color: "var(--band-muted)" }}>{profile.bio}</p>}
              <SocialLinks profile={profile} />
              <div className="actions" style={{ marginTop: 6 }}>
                {isOwner ? <Link className="btn small" href="/settings">Edit profile &amp; privacy</Link>
                  : profile.is_public && <FollowButton signedIn={!!user} followeeId={profile.id} username={profile.username} following={!!myFollow} />}
                {user && !isOwner && <ReportButton type="profile" id={profile.id} />}
              </div>
            </div>
          </div>
          <div className="stats">
            <span><b>{canView ? all.length : "—"}</b>Items</span>
            <Link className="stat" href={`/c/${profile.username}/followers`}><b>{(counts as { followers: number } | null)?.followers ?? 0}</b>Followers</Link>
            <Link className="stat" href={`/c/${profile.username}/following`}><b>{(counts as { following: number } | null)?.following ?? 0}</b>Following</Link>
            {showValues && valueByCar.size > 0 && <span className="value"><b>{money(totalValue)}</b>Est. value</span>}
          </div>
        </div>
      </section>

    <main className="wrap">
      {!canView ? (
        <div className="empty"><h3>This collection is private</h3><p>@{name} has chosen to keep their collection to themselves.</p></div>
      ) : (
        <>
          <nav className="tabs" aria-label="Filter items">
            <Link className={searchParams.filter !== "sale" ? "on" : undefined} href={`/c/${profile.username}`}>All items ({all.length})</Link>
            {forSale > 0 && <Link className={searchParams.filter === "sale" ? "on" : undefined} href={`/c/${profile.username}?filter=sale`}>For sale ({forSale})</Link>}
          </nav>
          {isOwner && hiddenCount > 0 && (
            <p className="notice">{hiddenCount} hidden item{hiddenCount > 1 ? "s aren't" : " isn't"} shown here. Only you can see {hiddenCount > 1 ? "them" : "it"}, in <Link href="/collection">My collection</Link>.</p>
          )}
          {shown.length ? (
            <section className="gallery">{shown.map((c) => <ItemTile key={c.id} item={c} owner={profile} value={showValues ? valueByCar.get(c.id) : null} />)}</section>
          ) : (
            <div className="empty"><h3>Nothing here yet</h3>{isOwner && <Link className="btn primary" href="/collection/new">+ Add an item</Link>}</div>
          )}
          <Comments profileId={profile.id} path={`/c/${profile.username}`} />
        </>
      )}
    </main>
    </>
  );
}
