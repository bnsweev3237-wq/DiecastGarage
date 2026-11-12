// Every collectible belongs to one category. Each category adds its own fields on top of the common ones
// (name, brand/maker, year, condition, packaging, description, photo, price paid, value, for sale).
// Keep the keys in sync with the checks on items in supabase/migrations/0006_items_and_categories.sql.

export type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  options?: string[]; // suggestions shown while typing; any value is allowed
  short?: boolean; // shown on item cards
};

export type Category = {
  key: string;
  label: string;
  brandLabel: string; // what "brand" means for this hobby
  packagingLabel: string; // what "in original packaging" means for this hobby
  fields: FieldDef[];
};

const GRADERS_CARDS = ["Raw (ungraded)", "PSA", "BGS", "CGC", "SGC", "TAG"];

export const CATEGORIES: Category[] = [
  {
    key: "diecast", label: "Diecast & model vehicles", brandLabel: "Brand", packagingLabel: "Has the original box",
    fields: [
      { key: "scale", label: "Scale", placeholder: "1:24", options: ["1:64", "1:43", "1:32", "1:24", "1:18", "1:12", "1:87"], short: true },
      { key: "series", label: "Series or line", placeholder: "Hot Wheels Premium, Lionel Racing" },
      { key: "vehicle", label: "Vehicle", placeholder: "1969 Camaro, #3 Monte Carlo" },
    ],
  },
  {
    key: "cards", label: "Trading cards", brandLabel: "Manufacturer", packagingLabel: "In a sleeve, toploader or slab",
    fields: [
      { key: "game", label: "Sport or game", placeholder: "Pokémon, Baseball", options: ["Pokémon", "Magic: The Gathering", "Yu-Gi-Oh!", "One Piece", "Lorcana", "Baseball", "Basketball", "Football", "Hockey", "Soccer"], short: true },
      { key: "set", label: "Set", placeholder: "Base Set, 2023 Topps Chrome", short: true },
      { key: "number", label: "Card number", placeholder: "4/102" },
      { key: "subject", label: "Player or character", placeholder: "Charizard, Shohei Ohtani" },
      { key: "grader", label: "Graded by", options: GRADERS_CARDS },
      { key: "grade", label: "Grade", placeholder: "10, 9.5", short: true },
    ],
  },
  {
    key: "coins", label: "Coins & currency", brandLabel: "Mint", packagingLabel: "In original mint packaging",
    fields: [
      { key: "country", label: "Country", placeholder: "United States", short: true },
      { key: "denomination", label: "Denomination", placeholder: "Morgan dollar, $20 note", short: true },
      { key: "mint_mark", label: "Mint mark", placeholder: "CC, S, D" },
      { key: "grader", label: "Graded by", options: ["Raw (ungraded)", "PCGS", "NGC", "ANACS", "PMG"] },
      { key: "grade", label: "Grade", placeholder: "MS-65", short: true },
    ],
  },
  {
    key: "comics", label: "Comics", brandLabel: "Publisher", packagingLabel: "Bagged and boarded",
    fields: [
      { key: "series", label: "Series", placeholder: "The Amazing Spider-Man", short: true },
      { key: "issue", label: "Issue", placeholder: "#300", short: true },
      { key: "variant", label: "Variant or printing", placeholder: "Newsstand, 2nd printing" },
      { key: "grader", label: "Graded by", options: ["Raw (ungraded)", "CGC", "CBCS", "PGX"] },
      { key: "grade", label: "Grade", placeholder: "9.8", short: true },
    ],
  },
  {
    key: "sneakers", label: "Sneakers", brandLabel: "Brand", packagingLabel: "Has the original box",
    fields: [
      { key: "model", label: "Model", placeholder: "Air Jordan 1 High", short: true },
      { key: "colorway", label: "Colorway", placeholder: "Chicago", short: true },
      { key: "size", label: "Size", placeholder: "US 10", short: true },
      { key: "sku", label: "Style code", placeholder: "DZ5485-612" },
    ],
  },
  {
    key: "toys", label: "Toys & action figures", brandLabel: "Brand", packagingLabel: "Still in the package (MOC/MIB)",
    fields: [
      { key: "line", label: "Toy line", placeholder: "Star Wars Black Series", short: true },
      { key: "character", label: "Character", placeholder: "Boba Fett", short: true },
      { key: "wave", label: "Wave or series", placeholder: "Wave 3" },
    ],
  },
  {
    key: "lego", label: "LEGO", brandLabel: "Brand", packagingLabel: "Sealed in the box",
    fields: [
      { key: "set_number", label: "Set number", placeholder: "75192", short: true },
      { key: "theme", label: "Theme", placeholder: "Star Wars, Technic", short: true },
      { key: "complete", label: "Complete?", options: ["Complete", "Complete with manual", "Missing pieces", "Built, no box"] },
    ],
  },
  {
    key: "funko", label: "Funko Pop!", brandLabel: "Brand", packagingLabel: "In the original box",
    fields: [
      { key: "number", label: "Pop number", placeholder: "#01", short: true },
      { key: "series", label: "Series", placeholder: "Marvel, Star Wars", short: true },
      { key: "exclusive", label: "Exclusive or sticker", placeholder: "SDCC, Hot Topic, Chase" },
    ],
  },
  {
    key: "vinyl", label: "Vinyl records", brandLabel: "Label", packagingLabel: "Still sealed",
    fields: [
      { key: "artist", label: "Artist", placeholder: "The Beatles", short: true },
      { key: "format", label: "Format", options: ["LP", "12\" single", "7\" 45", "EP", "Box set"], short: true },
      { key: "pressing", label: "Pressing", placeholder: "1969 UK first press" },
      { key: "catalog", label: "Catalog number", placeholder: "PCS 7088" },
    ],
  },
  {
    key: "games", label: "Video games", brandLabel: "Publisher", packagingLabel: "Still sealed",
    fields: [
      { key: "platform", label: "Platform", placeholder: "Nintendo 64", options: ["NES", "SNES", "Nintendo 64", "GameCube", "Game Boy", "Switch", "PlayStation", "PS2", "Xbox", "Sega Genesis"], short: true },
      { key: "region", label: "Region", options: ["NTSC (US)", "PAL (Europe)", "NTSC-J (Japan)"] },
      { key: "completeness", label: "Completeness", options: ["Loose", "Complete in box", "New / sealed"], short: true },
      { key: "grade", label: "Grade", placeholder: "WATA 9.4 A+" },
    ],
  },
  {
    key: "other", label: "Other", brandLabel: "Brand or maker", packagingLabel: "In original packaging",
    fields: [{ key: "type", label: "What kind of collectible", placeholder: "Stamps, watches, movie props", short: true }],
  },
];

export const CONDITIONS: [string, string][] = [
  ["sealed", "New / sealed"], ["mint", "Mint"], ["near_mint", "Near mint"], ["excellent", "Excellent"],
  ["good", "Good"], ["fair", "Fair"], ["poor", "Poor"],
];

export const categoryOf = (key: string | null | undefined) => CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
export const conditionLabel = (key: string | null | undefined) => CONDITIONS.find(([k]) => k === key)?.[1] ?? null;

// Short "Pokémon · Base Set · 9" style summary for cards and lists.
export function summary(item: { category: string; brand: string | null; year: string | null; attributes: Record<string, unknown> | null }) {
  const cat = categoryOf(item.category);
  const attrs = item.attributes ?? {};
  const bits = [item.brand, ...cat.fields.filter((f) => f.short).map((f) => attrs[f.key]), item.year]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return [...new Set(bits)].slice(0, 4).join(" · ");
}

// Keeps only this category's fields, as short trimmed strings.
export function cleanAttributes(category: string, read: (key: string) => string) {
  const out: Record<string, string> = {};
  for (const f of categoryOf(category).fields) {
    const v = read(f.key).trim().slice(0, 100);
    if (v) out[f.key] = v;
  }
  return out;
}
