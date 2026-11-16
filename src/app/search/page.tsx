import Link from "next/link";
import type { Metadata } from "next";
import ItemTile from "@/components/ItemTile";
import Avatar from "@/components/Avatar";
import CategoryOptions from "@/components/CategoryOptions";
import { getUser } from "@/lib/supabase/server";
import { searchWords } from "@/lib/search";
import { CATEGORIES, categoryOf } from "@/lib/categories";
import type { Item } from "@/lib/items";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

type Row = Item & { owner: { username: string; is_public: boolean } | null };
type Params = { q?: string; category?: string; sale?: string; grails?: string };

export default async function Search({ searchParams }: { searchParams: Params }) {
  const { supabase } = await getUser();
  const words = searchWords(searchParams.q);
  const category = CATEGORIES.some((c) => c.key === searchParams.category) ? searchParams.category : undefined;
  const saleOnly = searchParams.sale === "1";
  const grailsOnly = searchParams.grails === "1";
  const searching = words.length > 0 || !!category || saleOnly || grailsOnly;

  let items: Row[] = [];
  let people: { username: string; avatar_path: string | null; bio: string | null }[] = [];
  if (searching) {
    let q = supabase.from("items").select("*, owner:profiles!cars_owner_id_fkey!inner(username, is_public)")
      .eq("owner.is_public", true).eq("is_hidden", false)
      .order("created_at", { ascending: false }).limit(60);
    for (const w of words) q = q.ilike("search_text", `%${w}%`);
    if (category) q = q.eq("category", category);
    if (grailsOnly) q = q.eq("featured", true);
    q = saleOnly ? q.eq("for_sale", true) : q.neq("status", "sold");
    const [{ data: found }, { data: who }] = await Promise.all([
      q,
      // Usernames are one word, so collectors show up for one-word searches.
      words.length === 1 && !category && !saleOnly && !grailsOnly
        ? supabase.from("profiles").select("username, avatar_path, bio").eq("is_public", true).eq("under_review", false)
            .ilike("username", `%${words[0]}%`).limit(12)
        : Promise.resolve({ data: [] }),
    ]);
    items = (found ?? []) as Row[];
    people = (who ?? []) as typeof people;
  }

  return (
    <main className="wrap">
      <div className="head"><div><h1>Search</h1><p>Find items and collectors across theCollectorHQ.</p></div></div>
      <form className="searchbar" role="search" action="/search">
        <input name="q" type="search" defaultValue={searchParams.q ?? ""} placeholder="Charizard PSA 10, Earnhardt 1:24, Morgan dollar…" aria-label="Search for" autoFocus={!searching} />
        <select name="category" defaultValue={category ?? ""} aria-label="Category">
          <option value="">All categories</option>
          <CategoryOptions />
        </select>
        <label className="check"><input type="checkbox" name="sale" value="1" defaultChecked={saleOnly} /> For sale only</label>
        <label className="check grail-check"><input type="checkbox" name="grails" value="1" defaultChecked={grailsOnly} /> ★ Grails only</label>
        <button className="btn primary" type="submit">Search</button>
      </form>

      {!searching ? (
        <div className="empty big">
          <span className="empty-emoji" aria-hidden="true">🔍</span>
          <h3>What are you hunting for?</h3>
          <p>Search names, sets, players, brands, grades and tags. Every word has to match, so add more words to narrow it down.</p>
        </div>
      ) : (
        <>
          {people.length > 0 && (
            <>
              <div className="sec-head"><h2>Collectors</h2></div>
              <section className="people">
                {people.map((p) => (
                  <Link key={p.username} className="person" href={`/c/${p.username}`}>
                    <Avatar path={p.avatar_path} username={p.username} size="small" />
                    <span><b>@{p.username}</b>{p.bio && <span className="muted">{p.bio.slice(0, 60)}</span>}</span>
                  </Link>
                ))}
              </section>
            </>
          )}
          <div className="sec-head">
            <h2>{items.length === 60 ? "60+ items" : `${items.length} item${items.length === 1 ? "" : "s"}`}</h2>
            {category && <span className="hint">in {categoryOf(category).emoji} {categoryOf(category).label}</span>}
          </div>
          {items.length ? (
            <section className="gallery" aria-label="Search results">
              {items.map((c) => <ItemTile key={c.id} item={c} owner={c.owner} />)}
            </section>
          ) : (
            <div className="empty">
              <h3>No matches</h3>
              <p>Try fewer or different words{category ? ", or search all categories" : ""}{saleOnly ? ", or include items that aren't for sale" : ""}{grailsOnly ? ", or include items that aren't grails" : ""}.</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
