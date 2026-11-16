import { CATEGORIES } from "./categories";

// The spreadsheet columns for export and import. Import also accepts the label, ignoring case and
// punctuation, so "Price Paid" or "price_paid" both work. Category details (set, scale, grade…)
// export as "Detail: <label>" columns and import from any column named after a category field.
export type Column = { key: string; label: string; money?: boolean };

export const COLUMNS: Column[] = [
  { key: "title", label: "Name" },
  { key: "category", label: "Category" },
  { key: "brand", label: "Brand or maker" },
  { key: "year", label: "Year" },
  { key: "condition", label: "Condition" },
  { key: "in_package", label: "Has box or packaging" },
  { key: "quantity", label: "Quantity" },
  { key: "edition", label: "Edition or serial" },
  { key: "status", label: "Status" },
  { key: "is_hidden", label: "Hidden" },
  { key: "featured", label: "Grail" },
  { key: "rating", label: "My rating" },
  { key: "tags", label: "Tags" },
  { key: "description", label: "Description" },
  { key: "provenance", label: "Provenance" },
  { key: "cert_type", label: "Graded or COA" },
  { key: "cert_by", label: "Graded or issued by" },
  { key: "cert_grade", label: "Grade" },
  { key: "cert_number", label: "Cert number" },
  { key: "acquired_from", label: "Where I got it" },
  { key: "storage_location", label: "Where it's stored" },
  { key: "paid", label: "Price paid", money: true },
  { key: "purchased_at", label: "Date bought", money: true },
  { key: "shipping", label: "Shipping", money: true },
  { key: "tax", label: "Tax", money: true },
  { key: "fees", label: "Fees", money: true },
  { key: "manual_value", label: "My value", money: true },
  { key: "condition_adjustment", label: "Condition adjustment %", money: true },
  { key: "sold_price", label: "Sold for", money: true },
  { key: "sold_at", label: "Date sold", money: true },
];

export const norm = (s: string) => s.toLowerCase().replace(/^detail:\s*/, "").replace(/[^a-z0-9]+/g, "");

// Every category detail field, by its normalized key and label, for matching import columns.
export const DETAIL_FIELDS = (() => {
  const m = new Map<string, string>();
  for (const c of CATEGORIES) for (const f of c.fields) { m.set(norm(f.key), f.key); m.set(norm(f.label), f.key); }
  return m;
})();

// Extra header names people commonly use.
export const ALIASES: Record<string, string> = {
  name: "title", item: "title", itemname: "title", title: "title", description: "description", notes: "description",
  brand: "brand", maker: "brand", manufacturer: "brand", publisher: "brand", category: "category", type: "category",
  qty: "quantity", count: "quantity", box: "in_package", boxed: "in_package", inbox: "in_package", packaged: "in_package",
  paid: "paid", cost: "paid", price: "paid", purchaseprice: "paid", pricepaid: "paid", value: "manual_value", myvalue: "manual_value",
  tags: "tags", grader: "cert_by", gradedby: "cert_by", grade: "cert_grade", cert: "cert_number", certnumber: "cert_number",
  location: "storage_location", storage: "storage_location", stored: "storage_location", source: "acquired_from", boughtfrom: "acquired_from",
  date: "purchased_at", datebought: "purchased_at", purchasedate: "purchased_at",
};

export function matchColumn(header: string): string | null {
  const n = norm(header);
  if (!n) return null;
  const direct = COLUMNS.find((c) => norm(c.key) === n || norm(c.label) === n);
  if (direct) return direct.key;
  if (ALIASES[n]) return ALIASES[n];
  const detail = DETAIL_FIELDS.get(n);
  return detail ? `a_${detail}` : null;
}
