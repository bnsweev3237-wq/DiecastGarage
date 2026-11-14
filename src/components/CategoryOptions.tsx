import { CATEGORY_GROUPS, categoriesIn } from "@/lib/categories";

// <option>s for a category <select>, grouped into Popular, More collectibles and Something else.
export default function CategoryOptions() {
  return (
    <>
      {CATEGORY_GROUPS.map((g) => (
        <optgroup key={g.key} label={g.label}>
          {categoriesIn(g.key).map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
        </optgroup>
      ))}
    </>
  );
}
