import { itemCard, publicDb, SIZE } from "@/app/_og/card";
import { certLabel, photoUrl } from "@/lib/items";
import { categoryOf, summary } from "@/lib/categories";

// The picture shown when someone shares this item. See src/app/_og/card.tsx.
export const runtime = "edge";
export const alt = "An item on theCollectorHQ";
export const size = SIZE;
export const contentType = "image/png";

type Row = Parameters<typeof summary>[0] & Parameters<typeof certLabel>[0] & {
  title: string; photo_path: string | null; for_sale: boolean; asking_price: number | null; status: string;
  rating_avg: number | null; rating_count: number; owner: { username: string } | null;
};

export default async function Image({ params }: { params: { username: string; itemId: string } }) {
  const { data } = await publicDb().from("items")
    .select("title, photo_path, category, brand, year, attributes, is_certified, cert_type, cert_by, cert_grade, for_sale, asking_price, status, rating_avg, rating_count, owner:profiles!cars_owner_id_fkey(username)")
    .eq("id", params.itemId).maybeSingle();
  const item = data as unknown as Row | null;
  if (!item || item.owner?.username !== params.username.toLowerCase()) return itemCard(null);
  const cat = categoryOf(item.category);
  const chips = [
    certLabel(item),
    item.rating_count > 0 ? `Rated ${Number(item.rating_avg).toFixed(1)} of 5` : null,
    item.status === "wishlist" ? "On my wishlist" : item.status === "sold" ? "Sold" : null,
  ].filter((c): c is string => !!c);
  const price = item.for_sale && item.status === "owned"
    ? item.asking_price != null ? `For sale · $${Number(item.asking_price).toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "For sale"
    : null;
  return itemCard({
    title: item.title, photo: photoUrl(item.photo_path), category: cat.label,
    details: summary(item), chips, price, username: item.owner.username,
  });
}
