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
  updated_at: string;
  under_review?: boolean;
  rating_count: number;
  rating_avg: number | null;
  rating_score: number;
  status: ItemStatus;
  featured: boolean;
  rating: number | null;
  quantity: number;
  edition: string | null;
  is_certified: boolean;
  cert_type: "graded" | "coa" | null;
  cert_by: string | null;
  cert_grade: string | null;
  cert_number: string | null;
  provenance: string | null;
  tags: string[];
  photos: string[];
};

export type ItemStatus = "owned" | "wishlist" | "sold";
export const STATUSES: { key: ItemStatus; label: string; hint: string }[] = [
  { key: "owned", label: "In my collection", hint: "You own it" },
  { key: "wishlist", label: "Wishlist", hint: "You're hunting for it" },
  { key: "sold", label: "Sold", hint: "Keep it on record with what you sold it for" },
];
export const MAX_PHOTOS = 8; // the cover plus 7 more
export const MAX_TAGS = 10;

export type Purchase = {
  paid: number | null; purchased_at: string | null; manual_value: number | null;
  shipping: number | null; tax: number | null; fees: number | null;
  acquired_from: string | null; storage_location: string | null;
  sold_price: number | null; sold_at: string | null;
  include_shipping: boolean; include_tax: boolean; include_fees: boolean;
  condition_adjustment: number | null;
};

// The extras a collector can choose to count toward gain or loss and profit. All are off by default,
// because eBay sold prices don't include shipping, tax or fees.
export const COST_EXTRAS = [
  { key: "shipping", include: "include_shipping", label: "Shipping" },
  { key: "tax", include: "include_tax", label: "Tax" },
  { key: "fees", include: "include_fees", label: "Fees" },
] as const;

// Cost used for gain or loss and profit: price paid plus whichever extras the collector chose to include.
// Null when no price paid was entered.
export function gainCost(p: Purchase | null | undefined) {
  if (p?.paid == null) return null;
  return COST_EXTRAS.reduce((sum, x) => sum + (p[x.include] ? Number(p[x.key] ?? 0) : 0), Number(p.paid));
}

// Extras that were entered but left out of gain or loss, for a note like "$8.00 shipping isn't counted".
export const leftOutExtras = (p: Purchase | null | undefined) =>
  p?.paid == null ? [] : COST_EXTRAS.filter((x) => !p[x.include] && Number(p[x.key] ?? 0) > 0).map((x) => ({ label: x.label.toLowerCase(), amount: Number(p[x.key]) }));

// All of an item's photos, cover first.
export const allPhotos = (item: Pick<Item, "photo_path" | "photos">) =>
  [item.photo_path, ...(item.photos ?? [])].filter((x): x is string => !!x);

// "PSA 10", "COA by JSA" and so on, for badges.
export function certLabel(item: Pick<Item, "is_certified" | "cert_type" | "cert_by" | "cert_grade">) {
  if (!item.is_certified) return null;
  if (item.cert_type === "coa") return item.cert_by ? `COA · ${item.cert_by}` : "COA";
  return [item.cert_by, item.cert_grade].filter(Boolean).join(" ") || "Graded";
}

export const GRADERS = ["PSA", "BGS (Beckett)", "CGC", "SGC", "TAG", "PCGS", "NGC", "ANACS", "PMG", "CBCS", "WATA", "VGA", "AFA", "HGA"];
export const COA_ISSUERS = ["PSA/DNA", "JSA", "Beckett (BAS)", "Fanatics", "Upper Deck", "Steiner", "Topps", "Manufacturer", "Dealer or seller"];

// Link to the grader's own certificate lookup, so anyone can check the number.
export function certLookupUrl(by: string | null, number: string | null) {
  if (!by || !number) return null;
  const n = encodeURIComponent(number.replace(/\s+/g, ""));
  const b = by.toLowerCase();
  if (b.startsWith("psa")) return `https://www.psacard.com/cert/${n}`;
  if (b.startsWith("pcgs")) return `https://www.pcgs.com/cert/${n}`;
  if (b.startsWith("ngc")) return `https://www.ngccoin.com/certlookup/${n}/`;
  if (b.startsWith("cgc")) return `https://www.cgccomics.com/certlookup/${n}/`;
  return null;
}

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

// Every item photo has a small copy for cards and lists, saved next to it as "<name>-t.jpg".
// Photos from before thumbnails get theirs from the daily job; until then pages fall back to the full photo.
export const THUMB_WIDTH = 560;
export const thumbPath = (path: string) => path.replace(/(\.[a-z0-9]+)?$/i, "-t.jpg");
export const isThumb = (path: string) => /-t\.jpg$/i.test(path);
export const withThumbs = (paths: string[]) => paths.flatMap((p) => [p, thumbPath(p)]);
export function thumbUrl(path: string | null) {
  return path ? photoUrl(thumbPath(path)) : null;
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

// The item's value: your own value if you typed one, otherwise the sold-listing estimate minus your
// condition adjustment (the percent to take off for wear, damage or missing parts). Same rule as
// item_values() in supabase/migrations/0024_condition_adjustment.sql.
export function valueOf(purchase: Purchase | null, comps: Comp[]) {
  const adjustment = Number(purchase?.condition_adjustment ?? 0);
  if (purchase?.manual_value != null) return { value: Number(purchase.manual_value), manual: true, est: estimate(comps), adjustment: 0 };
  const est = estimate(comps);
  return est ? { value: est.median * (1 - adjustment / 100), manual: false, est, adjustment } : null;
}

// What to search for on eBay and Facebook when looking up sold listings.
export function searchTerms(item: Pick<Item, "title" | "brand" | "category" | "attributes" | "search_terms"> & Partial<Pick<Item, "is_certified" | "cert_type" | "cert_by" | "cert_grade">>) {
  if (item.search_terms) return item.search_terms.trim();
  const attrs = item.attributes ?? {};
  const keys = ["scale", "set", "number", "issue", "denomination", "mint_mark", "set_number", "platform", "size"];
  const graded = "is_certified" in item && item.is_certified && item.cert_type === "graded" ? [item.cert_by?.split(" ")[0], item.cert_grade] : [];
  return [item.title, item.brand, ...keys.map((k) => attrs[k]), ...graded].filter(Boolean).join(" ").trim();
}
export const ebaySoldUrl = (q: string) =>
  `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1&_sop=13`;
export const facebookUrl = (q: string) => `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(q)}`;
