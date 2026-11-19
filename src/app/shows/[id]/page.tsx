import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import ConfirmAction from "@/components/ConfirmAction";
import EventForm from "@/components/EventForm";
import ReportButton from "@/components/ReportButton";
import SubmitButton from "@/components/SubmitButton";
import { deleteEvent, toggleGoing } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import { publicDb } from "@/lib/supabase/public";
import { checkQueries } from "@/lib/report-error";
import { categoryOf } from "@/lib/categories";
import { countryName, dateRange, kindOf, place, US_STATES, type CalEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data } = await publicDb().from("events").select("title, starts_on, ends_on, city, region, country").eq("id", params.id).maybeSingle();
  if (!data) return { title: "Event" };
  const description = `${dateRange(data.starts_on, data.ends_on)} in ${place(data)}. Find card shows and swap meets on theCollectorHQ.`;
  return { title: data.title, description, openGraph: { title: data.title, description } };
}

export default async function EventPage({ params, searchParams }: { params: { id: string }; searchParams: { new?: string } }) {
  const { supabase, user } = await getUser();
  const loadedOne = await supabase.from("events").select("*, poster:profiles!events_created_by_fkey(username, avatar_path)").eq("id", params.id).maybeSingle();
  await checkQueries("Event", `/shows/${params.id}`, [loadedOne], user?.id);
  const e = loadedOne.data as (CalEvent & { poster: { username: string; avatar_path: string | null } | null }) | null;
  if (!e) notFound();
  const loaded = await Promise.all([
    supabase.from("event_rsvps").select("user_id, profile:profiles!event_rsvps_user_id_fkey(username, avatar_path, is_public)").eq("event_id", e.id).order("created_at").limit(60),
  ]);
  await checkQueries("Event", `/shows/${params.id}`, loaded, user?.id);
  const rsvps = (loaded[0].data ?? []) as unknown as { user_id: string; profile: { username: string; avatar_path: string | null; is_public: boolean } | null }[];
  const imGoing = !!user && rsvps.some((r) => r.user_id === user.id);
  // Only collectors with public pages are listed by name; everyone counts.
  const shown = rsvps.filter((r) => r.profile?.is_public || r.user_id === user?.id);
  const mine = user?.id === e.created_by;
  const k = kindOf(e.kind);
  const today = new Date().toISOString().slice(0, 10);
  const past = e.ends_on < today;
  const stateName = e.country === "US" ? US_STATES.find(([c]) => c === e.region)?.[1] ?? e.region : e.region;
  const mapQuery = encodeURIComponent([e.venue, e.address, e.city, stateName, countryName(e.country)].filter(Boolean).join(", "));

  return (
    <main className="wrap" style={{ maxWidth: 900 }}>
      <div className="head">
        <div><Link href="/shows">← Card shows &amp; swap meets</Link>
          <h1>{e.title}</h1>
          <p className="hint">{k.emoji} {k.label}{e.poster && <> · posted by <Link href={`/c/${e.poster.username}`}>@{e.poster.username}</Link></>}</p></div>
      </div>
      {searchParams.new && <p className="msg ok">Your event is posted. We marked you as going; untick it below if you&apos;re not.</p>}
      {e.is_cancelled && <p className="notice">This event has been cancelled.</p>}
      {e.under_review && <p className="notice">This event is hidden from others while our team reviews reports about it.</p>}
      {past && !e.is_cancelled && <p className="notice">This event has already happened.</p>}

      <div className="carpage">
        <section className="card event-details">
          <div><span className="label">When</span>
            <p className="event-when">{dateRange(e.starts_on, e.ends_on)}</p>{e.hours && <span className="hint">{e.hours}</span>}</div>
          <div><span className="label">Where</span>
            <p style={{ margin: "4px 0 0" }}>{e.venue && <><b>{e.venue}</b><br /></>}{e.address && <>{e.address}<br /></>}{e.city}, {stateName}{e.country !== "US" && `, ${countryName(e.country)}`}</p>
            <a className="btn small" style={{ marginTop: 8 }} href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer">Open in Maps ↗</a></div>
          {e.admission && <div><span className="label">Admission</span><p style={{ margin: "4px 0 0" }}>{e.admission}</p></div>}
          {e.website && <div><span className="label">Website</span><p style={{ margin: "4px 0 0" }}><a href={e.website} target="_blank" rel="noopener noreferrer nofollow ugc">{e.website.replace(/^https:\/\//, "").slice(0, 60)} ↗</a></p></div>}
          {!!e.categories.length && <div><span className="label">What you&apos;ll find</span>
            <p className="tag-list" style={{ margin: "6px 0 0" }}>{e.categories.map((c) => <Link key={c} className="chip" href={`/shows?category=${c}`}>{categoryOf(c).emoji} {categoryOf(c).label}</Link>)}</p></div>}
          {e.description && <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{e.description}</p>}
          <p className="hint">Details are posted by collectors. Check with the organizer before you travel.</p>
          {user && !mine && <ReportButton type="event" id={e.id} />}
        </section>

        <div className="side">
          <section className="card">
            <h3>{e.going_count} going</h3>
            {!past && !e.is_cancelled && !e.under_review && (
              user ? (
                <form action={toggleGoing}>
                  <input type="hidden" name="id" value={e.id} /><input type="hidden" name="going" value={imGoing ? "0" : "1"} />
                  <SubmitButton className={imGoing ? "btn" : "btn primary"} pending="…">{imGoing ? "✓ I'm going (undo)" : "I'm going"}</SubmitButton>
                </form>
              ) : <Link className="btn primary" href={`/login?next=/shows/${e.id}`}>Sign in to say you&apos;re going</Link>
            )}
            {shown.length > 0 && (
              <div className="people" style={{ gridTemplateColumns: "1fr" }}>
                {shown.map((r) => r.profile && (
                  <Link key={r.user_id} className="person" href={`/c/${r.profile.username}`}>
                    <Avatar path={r.profile.avatar_path} username={r.profile.username} size="small" /><span><b>@{r.profile.username}</b></span>
                  </Link>
                ))}
              </div>
            )}
            {e.going_count > shown.length && <p className="hint">{e.going_count - shown.length} more with private pages.</p>}
          </section>
        </div>
      </div>

      {mine && <>
        <EventForm event={e} />
        <section className="card danger-zone"><h3>Delete this event</h3><p className="hint">If it&apos;s just called off, tick “This event is cancelled” above instead so people who planned to go can see.</p>
          <ConfirmAction action={deleteEvent} fields={{ id: e.id }} label="Delete event" confirmText="Delete this event for everyone?" /></section>
      </>}
    </main>
  );
}
