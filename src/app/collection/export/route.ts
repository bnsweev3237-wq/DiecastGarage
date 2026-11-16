import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { CATEGORIES, categoryOf, conditionLabel } from "@/lib/categories";
import { COLUMNS } from "@/lib/item-columns";
import { photoUrl, valueOf, type Comp, type Item, type Purchase } from "@/lib/items";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

// Downloads the signed-in collector's whole collection as a spreadsheet (CSV opens in Excel,
// Numbers and Google Sheets). It includes private details, since it's their own data.
export async function GET(req: Request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/collection", req.url));
  const { data } = await supabase.from("items").select("*, item_purchases(*), comps(*)").eq("owner_id", user.id).order("created_at");
  const items = (data ?? []) as (Item & { item_purchases: Purchase | null; comps: Comp[] })[];

  // One column for every category detail any of these items uses.
  const detailKeys: { key: string; label: string }[] = [];
  for (const c of CATEGORIES) for (const f of c.fields)
    if (items.some((i) => i.category === c.key && i.attributes?.[f.key]) && !detailKeys.some((d) => d.key === f.key))
      detailKeys.push({ key: f.key, label: f.label });

  const header = [...COLUMNS.map((c) => c.label), ...detailKeys.map((d) => `Detail: ${d.label}`), "Estimated value", "Photo", "Added"];
  const yes = (b: boolean) => (b ? "Yes" : "");
  const rows = items.map((i) => {
    const p = i.item_purchases;
    const get: Record<string, string | number | null | undefined> = {
      title: i.title, category: categoryOf(i.category).label, brand: i.brand, year: i.year, condition: conditionLabel(i.condition),
      in_package: yes(i.in_package), quantity: i.quantity, edition: i.edition,
      status: i.status === "owned" ? "In my collection" : i.status === "wishlist" ? "Wishlist" : "Sold",
      is_hidden: yes(i.is_hidden), featured: yes(i.featured), rating: i.rating, tags: (i.tags ?? []).join(", "),
      description: i.description, provenance: i.provenance,
      cert_type: i.is_certified ? (i.cert_type === "coa" ? "COA" : "Graded") : "", cert_by: i.cert_by, cert_grade: i.cert_grade, cert_number: i.cert_number,
      acquired_from: p?.acquired_from, storage_location: p?.storage_location, paid: p?.paid, purchased_at: p?.purchased_at,
      shipping: p?.shipping, tax: p?.tax, fees: p?.fees, manual_value: p?.manual_value, condition_adjustment: p?.condition_adjustment,
      sold_price: p?.sold_price, sold_at: p?.sold_at,
    };
    const v = valueOf(p, i.comps ?? []);
    return [
      ...COLUMNS.map((c) => get[c.key]),
      ...detailKeys.map((d) => i.attributes?.[d.key] ?? ""),
      v ? Math.round(v.value * 100) / 100 : "", photoUrl(i.photo_path) ?? "", i.created_at.slice(0, 10),
    ];
  });
  const name = `thecollectorhq-collection-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(toCsv([header, ...rows]), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
}
