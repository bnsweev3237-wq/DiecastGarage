"use client";
import { useRouter } from "next/navigation";

// A sort menu that switches the list as soon as you pick an option.
export default function SortSelect({ value, options }: { value: string; options: { key: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="sort-select">
      <span className="label">Sort</span>
      <select value={value} onChange={(e) => router.push(options.find((o) => o.key === e.target.value)!.href)} aria-label="Sort items">
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  );
}
