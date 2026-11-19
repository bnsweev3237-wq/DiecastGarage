import Link from "next/link";
import { redirect } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import ShowModeView, { type ShowSet, type ShowTrade, type ShowWish } from "@/components/ShowModeView";
import { getUser } from "@/lib/supabase/server";
import { checkQueries } from "@/lib/report-error";
import { categoryOf, summary } from "@/lib/categories";
import { estimate, type Comp } from "@/lib/items";
import { dateRange, place, type CalEvent } from "@/lib/events";

export const dynamic = "force-dynamic";
export const metadata = { title: "Show mode" };

// Everything to take to a card show, on one page that works on a phone and keeps working offline
// once opened (public/sw.js saves the latest copy).
export default async function ShowMode() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/show-mode");
  const today = new Date().toISOString().slice(0, 10);
  const loaded = await Promise.all([
    supabase.from("items").select("id, title, category, brand, year, attributes, is_certified, cert_type, cert_by, cert_grade, item_purchases(manual_value), comps(id, price, source, sold_on, url, note)")
      .eq("owner_id", user.id).eq("status", "wishlist").order("created_at", { ascending: false }),
    supabase.from("sets").select("id, name, set_entries(label, have, position)").eq("owner_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("items").select("id, title, category, brand, year, attributes, is_certified, cert_type, cert_by, cert_grade, photo_path")
      .eq("owner_id", user.id).eq("status", "owned").eq("open_to_trade", true).order("created_at", { ascending: false }),
    supabase.rpc("item_values", { p_owner: user.id }),
    supabase.from("event_rsvps").select("event:events(*)").eq("user_id", user.id),
  ]);
  await checkQueries("Show mode", "/show-mode", loaded, user.id);
  const [{ data: wishRows }, { data: setRows }, { data: tradeRows }, { data: values }, { data: rsvps }] = loaded;

  type Row = Parameters<typeof summary>[0] & { id: string; title: string };
  const wishes: ShowWish[] = ((wishRows ?? []) as unknown as (Row & { item_purchases: { manual_value: number | null } | null; comps: Comp[] })[]).map((r) => ({
    id: r.id, title: r.title, details: summary(r), category: categoryOf(r.category).label,
    payUpTo: r.item_purchases?.manual_value != null ? Number(r.item_purchases.manual_value) : null,
    going: r.comps?.length ? estimate(r.comps)?.median ?? null : null,
  }));
  const sets: ShowSet[] = ((setRows ?? []) as { id: string; name: string; set_entries: { label: string; have: boolean; position: number }[] }[])
    .map((s) => ({ id: s.id, name: s.name, total: s.set_entries.length, missing: [...s.set_entries].sort((a, b) => a.position - b.position).filter((e) => !e.have).map((e) => e.label) }))
    .filter((s) => s.missing.length);
  const valueBy = new Map(((values ?? []) as { item_id: string; value: number }[]).map((v) => [v.item_id, Number(v.value)]));
  const trades: ShowTrade[] = ((tradeRows ?? []) as unknown as (Row & { photo_path: string | null })[]).map((r) => ({
    id: r.id, title: r.title, details: summary(r), photo: r.photo_path, value: valueBy.get(r.id) ?? null,
  }));
  const next = ((rsvps ?? []) as unknown as { event: CalEvent | null }[]).map((r) => r.event)
    .filter((e): e is CalEvent => !!e && e.ends_on >= today && !e.is_cancelled).sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0];

  return (
    <main className="wrap" style={{ maxWidth: 820 }}>
      <div className="head">
        <div><Link href="/collection">← My collection</Link><h1>🎪 Show mode</h1>
          <p>Your wishlist, missing set pieces and trade bait in one place. Open it before you leave and it keeps working without signal.</p></div>
        <PrintButton />
      </div>
      {next ? (
        <Link className="event-card" href={`/shows/${next.id}`}>
          <span className="event-body"><span className="hint">Your next show</span><span className="event-title">{next.title}</span>
            <span className="hint">{dateRange(next.starts_on, next.ends_on)}{next.hours ? ` · ${next.hours}` : ""} · 📍 {next.venue ? `${next.venue}, ` : ""}{place(next)}</span></span>
        </Link>
      ) : <p className="hint">Going to a show? Find one on <Link href="/shows">📅 Shows</Link> and tap I&apos;m going; it&apos;ll show here.</p>}
      <ShowModeView wishes={wishes} sets={sets} trades={trades} />
    </main>
  );
}
