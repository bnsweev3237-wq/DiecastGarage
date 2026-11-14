"use client";
import { useState } from "react";

// A 1 to 5 star rating picker for the item form. Click the same star again to clear it.
export function StarInput({ initial }: { initial: number | null }) {
  const [value, setValue] = useState<number | null>(initial);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  return (
    <div className="star-input" role="radiogroup" aria-label="My rating" onMouseLeave={() => setHover(null)}>
      <input type="hidden" name="rating" value={value ?? ""} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={n <= shown ? "on" : undefined} onMouseEnter={() => setHover(n)} onClick={() => setValue(value === n ? null : n)}>★</button>
      ))}
      <span className="hint">{value ? `${value} of 5` : "Not rated"}</span>
    </div>
  );
}

// Read-only stars for tiles and item pages.
export function Stars({ value, small }: { value: number | null; small?: boolean }) {
  if (!value) return null;
  return (
    <span className={small ? "stars small" : "stars"} role="img" aria-label={`Rated ${value} out of 5`}>
      {"★★★★★".slice(0, value)}<span className="off">{"★★★★★".slice(value)}</span>
    </span>
  );
}
