// The card show and swap meet calendar. Limits match supabase/migrations/0032_events.sql.

export const EVENT_KINDS = [
  { key: "show", label: "Card or toy show", emoji: "🎪" },
  { key: "swap", label: "Swap meet", emoji: "🔁" },
  { key: "convention", label: "Convention or expo", emoji: "🏟️" },
  { key: "auction", label: "Auction", emoji: "🔨" },
  { key: "meetup", label: "Collector meetup", emoji: "🤝" },
  { key: "other", label: "Other event", emoji: "📅" },
] as const;
export type EventKind = (typeof EVENT_KINDS)[number]["key"];
export const kindOf = (k: string) => EVENT_KINDS.find((x) => x.key === k) ?? EVENT_KINDS[EVENT_KINDS.length - 1];

export const COUNTRIES = [["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"], ["AU", "Australia"], ["NZ", "New Zealand"], ["IE", "Ireland"], ["DE", "Germany"], ["MX", "Mexico"]] as const;
export const countryName = (c: string) => COUNTRIES.find(([k]) => k === c)?.[1] ?? c;

export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"],
  ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"],
  ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

export type CalEvent = {
  id: string; created_by: string; title: string; kind: string; starts_on: string; ends_on: string; hours: string | null;
  venue: string | null; address: string | null; city: string; region: string; country: string; categories: string[];
  admission: string | null; website: string | null; description: string | null; is_cancelled: boolean; under_review: boolean;
  going_count: number; created_at: string;
};

const d = (s: string) => new Date(`${s}T12:00:00Z`);
const fmt = (s: string, o: Intl.DateTimeFormatOptions) => d(s).toLocaleDateString("en-US", { timeZone: "UTC", ...o });

// "Sat, Mar 14, 2027", "Mar 14–15, 2027", "Mar 30 – Apr 1, 2027"
export function dateRange(start: string, end: string) {
  if (start === end) return fmt(start, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  if (sameMonth) return `${fmt(start, { month: "short", day: "numeric" })}–${fmt(end, { day: "numeric" })}, ${start.slice(0, 4)}`;
  if (sameYear) return `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(end, { month: "short", day: "numeric" })}, ${start.slice(0, 4)}`;
  return `${fmt(start, { month: "short", day: "numeric", year: "numeric" })} – ${fmt(end, { month: "short", day: "numeric", year: "numeric" })}`;
}
export const monthDay = (s: string) => ({ month: fmt(s, { month: "short" }), day: fmt(s, { day: "numeric" }) });
export const place = (e: Pick<CalEvent, "city" | "region" | "country">) => `${e.city}, ${e.region}${e.country === "US" ? "" : `, ${countryName(e.country)}`}`;
export const isHttps = (s: string) => /^https:\/\/\S{3,}$/i.test(s) && s.length <= 300;
