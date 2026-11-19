import Link from "next/link";
import EventCard from "@/components/EventCard";
import CategoryOptions from "@/components/CategoryOptions";
import { getUser } from "@/lib/supabase/server";
import { checkQueries } from "@/lib/report-error";
import { CATEGORIES } from "@/lib/categories";
import { EVENT_KINDS, US_STATES, type CalEvent } from "@/lib/events";

export const dynamic = "force-dynamic";
export const metadata = { title: "Card shows and swap meets", description: "Upcoming card shows, toy shows, swap meets and collector meetups near you." };

export default async function Shows({ searchParams }: { searchParams: { region?: string; category?: string; kind?: string; mine?: string } }) {
  const { supabase, user } = await getUser();
  const today = new Date().toISOString().slice(0, 10);
  const region = searchParams.region?.slice(0, 40) || undefined;
  const category = CATEGORIES.some((c) => c.key === searchParams.category) ? searchParams.category : undefined;
  const kind = EVENT_KINDS.some((k) => k.key === searchParams.kind) ? searchParams.kind : undefined;
  const mine = !!user && searchParams.mine === "1";

  let q = supabase.from("events").select("*").gte("ends_on", today).order("starts_on").order("created_at").limit(300);
  if (region) q = q.eq("region", region);
  if (kind) q = q.eq("kind", kind);
  // Events that don't list categories are for every kind of collector.
  if (category) q = q.or(`categories.cs.{${category}},categories.eq.{}`);
  const loaded = await Promise.all([
    q,
    user ? supabase.from("event_rsvps").select("event_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    supabase.from("events").select("region").gte("ends_on", today).limit(1000),
  ]);
  await checkQueries("Shows", "/shows", loaded, user?.id);
  const [{ data: rows }, { data: myRsvps }, { data: regionRows }] = loaded;
  const going = new Set(((myRsvps ?? []) as { event_id: string }[]).map((r) => r.event_id));
  const events = ((rows ?? []) as CalEvent[]).filter((e) => !mine || going.has(e.id));
  const regions = [...new Set(((regionRows ?? []) as { region: string }[]).map((r) => r.region))].sort();
  const stateName = (r: string) => US_STATES.find(([k]) => k === r)?.[1] ?? r;
  const filtered = !!(region || category || kind || mine);

  return (
    <main className="wrap">
      <div className="head">
        <div><h1>📅 Card shows &amp; swap meets</h1>
          <p>Upcoming shows, swap meets, conventions and meetups, posted by collectors. Mark the ones you&apos;re going to.</p></div>
        <Link className="btn primary" href={user ? "/shows/new" : "/login?next=/shows/new"}>+ Post an event</Link>
      </div>
      <form className="filterbar" action="/shows">
        <select name="region" defaultValue={region ?? ""} aria-label="State or region">
          <option value="">Everywhere</option>
          {regions.map((r) => <option key={r} value={r}>{stateName(r)}</option>)}
        </select>
        <select name="category" defaultValue={category ?? ""} aria-label="What you collect"><option value="">Anything</option><CategoryOptions /></select>
        <select name="kind" defaultValue={kind ?? ""} aria-label="Kind of event"><option value="">Every kind</option>{EVENT_KINDS.map((k) => <option key={k.key} value={k.key}>{k.emoji} {k.label}</option>)}</select>
        {user && <label className="check"><input type="checkbox" name="mine" value="1" defaultChecked={mine} /> Only ones I&apos;m going to</label>}
        <button className="btn" type="submit">Filter</button>
        {filtered && <Link className="btn small" href="/shows">Clear</Link>}
      </form>
      {events.length ? (
        <section className="event-list">{events.map((e) => <EventCard key={e.id} e={e} going={going.has(e.id)} />)}</section>
      ) : (
        <div className="empty big">
          <span className="empty-emoji" aria-hidden="true">📅</span>
          <h3>{filtered ? "No events match" : "No upcoming events yet"}</h3>
          <p>Know about a card show, toy show or swap meet coming up? Post it so other collectors can find it.</p>
          <Link className="btn primary" href={user ? "/shows/new" : "/login?next=/shows/new"}>+ Post an event</Link>
        </div>
      )}
    </main>
  );
}
