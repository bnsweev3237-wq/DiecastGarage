import Link from "next/link";
import { categoryOf } from "@/lib/categories";
import { dateRange, kindOf, monthDay, place, type CalEvent } from "@/lib/events";

// One event in the calendar list.
export default function EventCard({ e, going }: { e: CalEvent; going?: boolean }) {
  const { month, day } = monthDay(e.starts_on);
  const k = kindOf(e.kind);
  return (
    <Link href={`/shows/${e.id}`} className={e.is_cancelled ? "event-card cancelled" : "event-card"}>
      <span className="event-date" aria-hidden="true"><span>{month}</span><b>{day}</b></span>
      <span className="event-body">
        <span className="event-title">{e.title}</span>
        <span className="hint">{k.emoji} {k.label} · {dateRange(e.starts_on, e.ends_on)}{e.hours ? ` · ${e.hours}` : ""}</span>
        <span className="hint">📍 {e.venue ? `${e.venue}, ` : ""}{place(e)}</span>
        {!!e.categories.length && <span className="event-cats">{e.categories.slice(0, 8).map((c) => <span key={c} title={categoryOf(c).label}>{categoryOf(c).emoji}</span>)}{e.categories.length > 8 && <span className="hint">+{e.categories.length - 8}</span>}</span>}
      </span>
      <span className="event-side">
        {e.is_cancelled ? <span className="chip down">Cancelled</span>
          : <span className="hint">{going ? "✓ You're going" : e.going_count ? `${e.going_count} going` : ""}</span>}
      </span>
    </Link>
  );
}
