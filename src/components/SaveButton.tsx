"use client";
import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions";

// ❤️ Save someone else's item to your private Saved list.
export default function SaveButton({ itemId, saved: initial }: { itemId: string; saved: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  function click() {
    const before = saved;
    setSaved(!before); setError("");
    start(async () => {
      const f = new FormData();
      f.set("item_id", itemId); f.set("saved", before ? "1" : "0");
      const r = await toggleFavorite(f);
      if (r?.error) { setSaved(before); setError(r.error); }
    });
  }
  return (
    <span className="save-wrap">
      <button type="button" className={saved ? "btn small save-btn on" : "btn small save-btn"} onClick={click} disabled={busy} aria-pressed={saved}>
        {saved ? "♥ Saved" : "♡ Save"}
      </button>
      {error && <span className="hint down">{error}</span>}
    </span>
  );
}
