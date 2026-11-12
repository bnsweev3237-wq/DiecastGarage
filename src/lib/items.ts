export type Item = {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  attributes: Record<string, string> | null;
  condition: string | null;
  brand: string | null;
  year: string | null;
  description: string | null;
  in_package: boolean;
  is_hidden: boolean;
  photo_path: string | null;
  search_terms: string | null;
  for_sale: boolean;
  ebay_url: string | null;
  asking_price: number | null;
  created_at: string;
};

export type Purchase = { paid: number | null; purchased_at: string | null; manual_value: number | null };

export type Comp = {
  id: string;
  price: number;
  source: string;
  sold_on: string | null;
  url: string | null;
  note: string | null;
};

// Keep in sync with the for_sale_needs_ebay_link check in the migration.
const EBAY_URL = /^https:\/\/([a-z0-9-]+\.)*ebay\.(com|us|ca|co\.uk|com\.au|de|fr|it|es|ie|at|ch|nl|be|pl|com\.sg|com\.my|ph|in)\//i;
export const isEbayUrl = (url: string) => EBAY_URL.test(url.trim());

export function photoUrl(path: string | null) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/car-photos/${path}`;
}

export function avatarUrl(path: string | null) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

export const money = (n: number | null | undefined, digits = 0) =>
  n == null || Number.isNaN(n)
    ? "—"
    : (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const signed = (n: number) => (n > 0 ? "+" : "") + money(n);

const YEAR_MS = 365 * 864e5;

// Median of sold listings from the last 12 months (all of them if none are that recent),
// dropping the highest and lowest once there are 5 or more.
export function estimate(comps: Comp[]) {
  const valid = comps.filter((c) => Number(c.price) > 0);
  if (!valid.length) return null;
  const recent = valid.filter((c) => !c.sold_on || Date.now() - Date.parse(c.sold_on) <= YEAR_MS);
  const use = recent.length ? recent : valid;
  const prices = use.map((c) => Number(c.price)).sort((a, b) => a - b);
  const trimmed = prices.length >= 5 ? prices.slice(1, -1) : prices;
  const m = trimmed.length;
  const median = m % 2 ? trimmed[(m - 1) / 2] : (trimmed[m / 2 - 1] + trimmed[m / 2]) / 2;
  return { median, low: prices[0], high: prices[prices.length - 1], n: use.length, olderOnly: !recent.length };
}

export function valueOf(purchase: Purchase | null, comps: Comp[]) {
  if (purchase?.manual_value != null) return { value: Number(purchase.manual_value), manual: true, est: estimate(comps) };
  const est = estimate(comps);
  return est ? { value: est.median, manual: false, est } : null;
}

// What to search for on eBay and Facebook when looking up sold listings.
export function searchTerms(item: Pick<Item, "title" | "brand" | "category" | "attributes" | "search_terms">) {
  if (item.search_terms) return item.search_terms.trim();
  const attrs = item.attributes ?? {};
  const keys = ["scale", "set", "number", "grade", "issue", "denomination", "mint_mark", "set_number", "platform", "size"];
  return [item.title, item.brand, ...keys.map((k) => attrs[k])].filter(Boolean).join(" ").trim();
}
export const ebaySoldUrl = (q: string) =>
  `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1&_sop=13`;
export const facebookUrl = (q: string) => `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(q)}`;
