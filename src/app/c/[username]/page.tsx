import Link from "next/link";
import { notFound } from "next/navigation";
import ItemTile from "@/components/ItemTile";
import Comments from "@/components/Comments";
import FollowButton from "@/components/FollowButton";
import Avatar from "@/components/Avatar";
import SocialLinks from "@/components/SocialLinks";
import ReportButton from "@/components/ReportButton";
import ConfirmAction from "@/components/ConfirmAction";
import SetCard, { summarize } from "@/components/SetCard";
import { blockUser, unblockUser } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import { money, type Item } from "@/lib/items";
import { CATEGORIES, categoryOf } from "@/lib/categories";
import { matchesAll, searchWords } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { username: string } }) {
  return { title: `@${params.username}` };
}

export default async function Collection({ params, searchParams }: { params: { username: string }; searchParams: { filter?: string; tag?: string; q?: string; category?: string; grails?: string } }) {
  const { supabase, user } = await getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", params.username.toLowerCase()).maybeSingle();
  if (!profile) notFound();
  const isOwner = user?.id === profile.id;
  // A profile reported by 5 people is hidden from others until an admin reviews it.
  const underReview = profile.under_review && !isOwner;
  const canView = (profile.is_public && !profile.under_review) || isOwner;

  const [{ data: counts }, { data: myFollow }, { data: cars }, { data: email }, { data: values }, { data: location }, { data: myBlock }, { data: setRows }] = await Promise.all([
    // Counts come from a function so they stay right even when some follow lists are private.
    supabase.rpc("follow_counts", { p_profile: profile.id }).single(),
    user ? supabase.from("follows").select("followee_id").eq("follower_id", user.id).eq("followee_id", profile.id).maybeSingle() : Promise.resolve({ data: null }),
    canView ? supabase.from("items").select("*").eq("owner_id", profile.id).order("featured", { ascending: false }).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    // Both return nothing unless the collector chose to show them (or it's their own page).
    supabase.rpc("profile_email", { p_profile: profile.id }),
    canView ? supabase.rpc("item_values", { p_owner: profile.id }) : Promise.resolve({ data: [] }),
    supabase.rpc("profile_location", { p_profile: profile.id }),
    user && !isOwner ? supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id).eq("blocked_id", profile.id).maybeSingle() : Promise.resolve({ data: null }),
    canView ? supabase.from("sets").select("id, name, category, is_public, set_entries(have)").eq("owner_id", profile.id).order("updated_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  // Only public sets show here, so the owner sees what everyone else sees.
  const sets = summarize(((setRows ?? []) as Parameters<typeof summarize>[0]).filter((s) => s.is_public));
  const valueByCar = new Map(((values ?? []) as { item_id: string; value: number }[]).map((v) => [v.item_id, Number(v.value)]));
  // Owners get their hidden items back from the database; leave them out so this page matches what others see.
  const mine = (cars ?? []) as Item[];
  const visible = mine.filter((c) => !c.is_hidden);
  const hiddenCount = mine.length - visible.length;
  // Only items they own count toward the collection's value.
  for (const c of mine) if (c.is_hidden || c.status !== "owned") valueByCar.delete(c.id);
  const showValues = isOwner ? profile.show_values : valueByCar.size > 0;
  const totalValue = [...valueByCar.values()].reduce((a, b) => a + b, 0);
  const all = visible.filter((c) => c.status === "owned");
  const wishlist = visible.filter((c) => c.status === "wishlist");
  const sold = visible.filter((c) => c.status === "sold");
  const filter = ["sale", "wishlist", "sold", "sets"].includes(searchParams.filter ?? "") ? searchParams.filter : undefined;
  const base = filter === "sets" ? [] : filter === "wishlist" ? wishlist : filter === "sold" ? sold : filter === "sale" ? all.filter((c) => c.for_sale) : all;
  const tag = searchParams.tag?.toLowerCase();
  const words = searchWords(searchParams.q);
  const category = CATEGORIES.some((c) => c.key === searchParams.category) ? searchParams.category : undefined;
  const grailsOnly = searchParams.grails === "1";
  const usedCategories = CATEGORIES.filter((c) => base.some((i) => i.category === c.key));
  const shown = base
    .filter((c) => !tag || (c.tags ?? []).some((t) => t.toLowerCase() === tag))
    .filter((c) => !category || c.category === category)
    .filter((c) => !grailsOnly || c.featured)
    .filter((c) => matchesAll(words, c.title, c.brand, c.year, c.edition, c.cert_by, c.cert_grade, c.cert_number, c.tags, c.attributes, c.description, categoryOf(c.category).label));
  const narrowed = !!(tag || category || grailsOnly || words.length);
  // The Grails row shows above everything else only when nothing is filtered.
  const grails = !filter && !narrowed ? all.filter((c) => c.featured) : [];
  const forSale = all.filter((c) => c.for_sale).length;
  const name = profile.username;

  return (
    <>
      <section className="band">
        <div className="band-in">
          <div className="car" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <Avatar path={underReview ? null : profile.avatar_path} username={name} />
            <div className="car-text" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <h1>@{name}</h1>
              <span className="muted">
                {profile.is_public ? "Public collection" : "Private collection"}
                {typeof location === "string" && (!isOwner || profile.show_location) && <> · {location}</>}
                {typeof email === "string" && (!isOwner || profile.show_email) && <> · <a href={`mailto:${email}`}>{email}</a></>}
              </span>
              {profile.bio && !underReview && <p style={{ margin: 0, maxWidth: "60ch", color: "var(--band-muted)" }}>{profile.bio}</p>}
              {!underReview && <SocialLinks profile={profile} />}
              <div className="actions" style={{ marginTop: 6 }}>
                {isOwner ? <><Link className="btn small primary" href="/collection/new">+ Add an item</Link><Link className="btn small" href="/settings">Edit profile &amp; privacy</Link></>
                  : profile.is_public && !myBlock && !underReview && <FollowButton signedIn={!!user} followeeId={profile.id} username={profile.username} following={!!myFollow} />}
                {user && !isOwner && <ReportButton type="profile" id={profile.id} />}
                {user && !isOwner && (myBlock
                  ? <form action={unblockUser}><input type="hidden" name="user_id" value={profile.id} /><button className="btn small" type="submit">Unblock</button></form>
                  : <ConfirmAction action={blockUser} fields={{ user_id: profile.id }} label="Block"
                      confirmText={`Block @${name}? They won't be able to comment on your pages or follow you, and you won't see their comments. They aren't told.`} />)}
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
      {myBlock && <p className="notice">You&apos;ve blocked @{name}. They can&apos;t comment on your pages or follow you, and you won&apos;t see their comments. <Link href="/settings#blocked">Manage blocked collectors</Link></p>}
      {isOwner && profile.under_review && <p className="notice">Your profile is hidden from other collectors while our team reviews reports about it. You can still use the site as usual.</p>}
      {underReview ? (
        <div className="empty"><h3>This profile is being reviewed</h3><p>It&apos;s hidden for now while our team takes a look.</p></div>
      ) : !canView ? (
        <div className="empty"><h3>This collection is private</h3><p>@{name} has chosen to keep their collection to themselves.</p></div>
      ) : (
        <>
          <nav className="tabs" aria-label="Filter items">
            <Link className={!filter ? "on" : undefined} href={`/c/${profile.username}`}>Collection ({all.length})</Link>
            {forSale > 0 && <Link className={filter === "sale" ? "on" : undefined} href={`/c/${profile.username}?filter=sale`}>For sale ({forSale})</Link>}
            {wishlist.length > 0 && <Link className={filter === "wishlist" ? "on" : undefined} href={`/c/${profile.username}?filter=wishlist`}>Wishlist ({wishlist.length})</Link>}
            {sold.length > 0 && <Link className={filter === "sold" ? "on" : undefined} href={`/c/${profile.username}?filter=sold`}>Sold ({sold.length})</Link>}
            {sets.length > 0 && <Link className={filter === "sets" ? "on" : undefined} href={`/c/${profile.username}?filter=sets`}>📋 Sets ({sets.length})</Link>}
          </nav>
          {filter === "sets" && <section className="set-grid">{sets.map((s) => <SetCard key={s.id} s={s} />)}</section>}
          {base.length > 1 && (
            <form className="filterbar" role="search" action={`/c/${profile.username}`}>
              {filter && <input type="hidden" name="filter" value={filter} />}
              {searchParams.tag && <input type="hidden" name="tag" value={searchParams.tag} />}
              <input type="search" name="q" defaultValue={searchParams.q ?? ""} placeholder={`Search @${name}'s items…`} aria-label="Search these items" />
              {usedCategories.length > 1 && (
                <select name="category" defaultValue={category ?? ""} aria-label="Category">
                  <option value="">All categories</option>
                  {usedCategories.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label} ({base.filter((i) => i.category === c.key).length})</option>)}
                </select>
              )}
              {base.some((c) => c.featured) && <label className="check grail-check"><input type="checkbox" name="grails" value="1" defaultChecked={grailsOnly} /> ★ Grails only</label>}
              <button className="btn" type="submit">Filter</button>
              {narrowed && <Link className="btn small" href={`/c/${profile.username}${filter ? `?filter=${filter}` : ""}`}>Clear</Link>}
            </form>
          )}
          {narrowed && <p className="hint">Showing {shown.length} of {base.length}{tag && <> tagged <b>#{searchParams.tag}</b></>}{category && <> in {categoryOf(category).emoji} {categoryOf(category).label}</>}{grailsOnly && <>, grails only</>}{words.length > 0 && <> matching “{searchParams.q}”</>}.</p>}
          {grails.length > 0 && (
            <>
              <div className="sec-head"><h2>★ Grails</h2></div>
              <section className="gallery">{grails.map((c) => <ItemTile key={c.id} item={c} owner={profile} value={showValues ? valueByCar.get(c.id) : null} />)}</section>
              <div className="sec-head"><h2>Everything</h2></div>
            </>
          )}
          {isOwner && hiddenCount > 0 && (
            <p className="notice">{hiddenCount} hidden item{hiddenCount > 1 ? "s aren't" : " isn't"} shown here. Only you can see {hiddenCount > 1 ? "them" : "it"}, in <Link href="/collection">My collection</Link>.</p>
          )}
          {shown.length > grails.length ? (
            <section className="gallery">{shown.filter((c) => !grails.includes(c)).map((c) => <ItemTile key={c.id} item={c} owner={profile} value={showValues ? valueByCar.get(c.id) : null} />)}</section>
          ) : grails.length || filter === "sets" ? null : (
            <div className="empty"><h3>Nothing here yet</h3>{isOwner && <Link className="btn primary" href="/collection/new">+ Add an item</Link>}</div>
          )}
          <Comments profileId={profile.id} path={`/c/${profile.username}`} />
        </>
      )}
    </main>
    </>
  );
}
