// Keep these patterns in sync with the checks on profiles in supabase/migrations/0004_admin_and_profiles.sql.
export type SocialKey = "facebook_url" | "x_url" | "instagram_url" | "ebay_url";

type Network = { key: SocialKey; label: string; pattern: RegExp; fromHandle: (h: string) => string; handle: RegExp; example: string };

const EBAY_HOST = String.raw`([a-z0-9-]+\.)*ebay\.(com|us|ca|co\.uk|com\.au|de|fr|it|es|ie|at|ch|nl|be|pl|com\.sg|com\.my|ph|in)`;

export const NETWORKS: Network[] = [
  {
    key: "facebook_url", label: "Facebook",
    pattern: /^https:\/\/(www\.|m\.)?(facebook\.com|fb\.com)\/\S{1,200}$/i,
    handle: /^[a-z0-9.]{5,50}$/i, fromHandle: (h) => `https://www.facebook.com/${h}`,
    example: "https://www.facebook.com/yourname",
  },
  {
    key: "x_url", label: "X",
    pattern: /^https:\/\/(www\.)?(x\.com|twitter\.com)\/[a-z0-9_]{1,15}\/?$/i,
    handle: /^[a-z0-9_]{1,15}$/i, fromHandle: (h) => `https://x.com/${h}`,
    example: "@yourname",
  },
  {
    key: "instagram_url", label: "Instagram",
    pattern: /^https:\/\/(www\.)?instagram\.com\/[a-z0-9_.]{1,30}\/?$/i,
    handle: /^[a-z0-9_.]{1,30}$/i, fromHandle: (h) => `https://www.instagram.com/${h}`,
    example: "@yourname",
  },
  {
    key: "ebay_url", label: "eBay",
    pattern: new RegExp(String.raw`^https://${EBAY_HOST}/(usr|str)/[^\s/?#]{1,80}/?$`, "i"),
    handle: /^[a-z0-9._-]{1,64}$/i, fromHandle: (h) => `https://www.ebay.com/usr/${h}`,
    example: "your eBay username or https://www.ebay.com/usr/yourname",
  },
];

// Turns what someone typed into a link we accept: a full link, a link without https://, or a bare username.
export function normalizeSocial(network: Network, input: string): { url: string | null; error?: string } {
  let v = input.trim();
  if (!v) return { url: null };
  v = v.replace(/^@/, "");
  if (!/^https?:\/\//i.test(v) && v.includes(".") && v.includes("/")) v = `https://${v}`;
  v = v.replace(/^http:\/\//i, "https://");
  // Facebook profile links can carry the id in the query (profile.php?id=123); drop tracking junk elsewhere.
  if (network.key !== "facebook_url") v = v.replace(/[?#].*$/, "");
  if (network.pattern.test(v)) return { url: v };
  if (network.handle.test(v)) return { url: network.fromHandle(v) };
  return { url: null, error: `That doesn't look like a link to your ${network.label} profile. Try ${network.example}.` };
}
