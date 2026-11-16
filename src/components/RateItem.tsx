"use client";
import { useState, useTransition } from "react";
import { rateItem } from "@/app/actions";

// Lets a signed-in collector rate someone else's item. Click a star to rate; click it again to clear.
export default function RateItem({ itemId, path, mine }: { itemId: string; path: string; mine: number | null }) {
  const [value, setValue] = useState(mine);
  const [hover, setHover] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, start] = useTransition();
  const shown = hover ?? value ?? 0;

  function pick(n: number) {
    const next = value === n ? 0 : n;
    const before = value;
    setValue(next || null);
    start(async () => {
      const f = new FormData();
      f.set("item_id", itemId); f.set("path", path); f.set("stars", String(next));
      const r = await rateItem(f);
      if (r?.error) { setValue(before); setMessage(r.error); } else setMessage(r?.ok ?? "");
    });
  }

  return (
    <div className="rate-item">
      <span className="label">{value ? "Your rating" : "Rate this item"}</span>
      <div className="star-input" role="radiogroup" aria-label="Rate this item" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} disabled={busy}
            className={n <= shown ? "on" : undefined} onMouseEnter={() => setHover(n)} onClick={() => pick(n)}>★</button>
        ))}
      </div>
      <span className="hint" role="status">{message || (value ? "Click your star again to take it back." : "")}</span>
    </div>
  );
}
