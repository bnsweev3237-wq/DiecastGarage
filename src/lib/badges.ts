// Badges shown on a collector's page and share card. Worked out from what anyone can already see on
// their page (public items they own, public sets, follower count), so they never reveal anything private.
// Help explains each one (src/lib/help.ts, "badges"); keep the two in step.

export type BadgeStats = {
  items: number; // items they own that are on their public page
  grails: number;
  graded: number; // graded or with a COA
  categories: number; // different categories among those items
  completedSets: number; // public sets of 5+ pieces with every piece ticked
  followers: number;
  topRated: boolean; // an item averaging 4.5+ stars from 3+ collectors
  joined: string; // profile created_at
  beta: boolean;
};

export type Badge = { key: string; emoji: string; label: string; why: string };

// Everyone who joins before the official launch is a founding collector, for good. The launch date
// isn't set yet, so for now every collector gets it. On launch, set it ("2027-03-01") and ship.
export const LAUNCH_DATE: string | null = null;

const ITEM_TIERS = [1000, 500, 250, 100, 50, 10];
const FOLLOWER_TIERS = [1000, 250, 100, 50, 10];
const n = (x: number) => x.toLocaleString("en-US");

export function badgesFor(s: BadgeStats): Badge[] {
  const out: Badge[] = [];
  if (LAUNCH_DATE === null || (s.joined && s.joined < LAUNCH_DATE)) out.push({ key: "founding", emoji: "🌱", label: "Founding collector", why: "Joined before theCollectorHQ officially launched" });
  if (s.beta) out.push({ key: "beta", emoji: "🧪", label: "Beta tester", why: "Helps test new features before everyone else" });
  const items = ITEM_TIERS.find((t) => s.items >= t);
  if (items) out.push({ key: "items", emoji: "📦", label: `${n(items)}+ items`, why: `Has ${n(items)} or more items in their collection` });
  if (s.grails > 0) out.push({ key: "grail", emoji: "⭐", label: "Grail hunter", why: "Has a grail: an item featured as one of their best" });
  if (s.graded >= 5) out.push({ key: "graded", emoji: "🏅", label: "Graded collection", why: "Has 5 or more graded or certified items" });
  if (s.completedSets > 0) out.push({ key: "set", emoji: "📋", label: s.completedSets > 1 ? `${s.completedSets} sets complete` : "Set complete", why: "Finished a set checklist of 5 or more pieces" });
  if (s.topRated) out.push({ key: "top", emoji: "🔥", label: "Crowd favorite", why: "Has an item rated 4.5 stars or more by at least 3 collectors" });
  if (s.categories >= 5) out.push({ key: "explorer", emoji: "🧭", label: "Explorer", why: "Collects in 5 or more categories" });
  const followers = FOLLOWER_TIERS.find((t) => s.followers >= t);
  if (followers) out.push({ key: "followers", emoji: "👥", label: `${n(followers)}+ followers`, why: `Followed by ${n(followers)} or more collectors` });
  return out;
}

type ItemLike = { status: string; is_hidden?: boolean; featured: boolean; is_certified: boolean; category: string; rating_avg: number | string | null; rating_count: number };
type SetLike = { is_public: boolean; set_entries: { have: boolean }[] };

// The stats from rows the page already has. Hidden items and anything not owned are left out.
export function badgeStats(items: ItemLike[], sets: SetLike[], extra: { followers: number; joined: string; beta: boolean }): BadgeStats {
  const owned = items.filter((i) => i.status === "owned" && !i.is_hidden);
  return {
    items: owned.length,
    grails: owned.filter((i) => i.featured).length,
    graded: owned.filter((i) => i.is_certified).length,
    categories: new Set(owned.map((i) => i.category)).size,
    completedSets: sets.filter((s) => s.is_public && s.set_entries.length >= 5 && s.set_entries.every((e) => e.have)).length,
    topRated: owned.some((i) => i.rating_count >= 3 && Number(i.rating_avg) >= 4.5),
    ...extra,
  };
}
