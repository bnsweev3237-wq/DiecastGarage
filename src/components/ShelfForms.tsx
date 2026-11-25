"use client";
import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { addToShelf, createShelf, updateShelf, type FormState } from "@/app/actions";
import Thumb from "./Thumb";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

export function NewShelfForm() {
  const [state, action] = useFormState<FormState, FormData>(createShelf, undefined);
  return (
    <form action={action} className="card">
      <h3>New shelf</h3>
      <div className="grid2">
        <div className="field"><label className="label" htmlFor="name">Shelf name</label>
          <input id="name" name="name" required maxLength={80} placeholder="Earnhardt shelf, PSA 10s, Holiday display" /></div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label className="check" htmlFor="is_public"><input id="is_public" name="is_public" type="checkbox" defaultChecked /> Show on my public page</label></div>
        <div className="field full"><label className="label" htmlFor="description">Description (optional)</label>
          <input id="description" name="description" maxLength={500} placeholder="What this shelf is about" /></div>
      </div>
      <FormMessage state={state} />
      <div className="actions"><SubmitButton pending="Creating…">Create shelf</SubmitButton></div>
    </form>
  );
}

export function EditShelfForm({ shelf }: { shelf: { id: string; name: string; description: string | null; is_public: boolean } }) {
  const [state, action] = useFormState<FormState, FormData>(updateShelf, undefined);
  return (
    <form action={action} className="card">
      <h3>Edit shelf</h3>
      <input type="hidden" name="id" value={shelf.id} />
      <div className="grid2">
        <div className="field"><label className="label" htmlFor="name">Shelf name</label><input id="name" name="name" required maxLength={80} defaultValue={shelf.name} /></div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label className="check" htmlFor="is_public"><input id="is_public" name="is_public" type="checkbox" defaultChecked={shelf.is_public} /> Show on my public page</label></div>
        <div className="field full"><label className="label" htmlFor="description">Description</label><input id="description" name="description" maxLength={500} defaultValue={shelf.description ?? ""} /></div>
      </div>
      <FormMessage state={state} />
      <div className="actions"><SubmitButton pending="Saving…">Save</SubmitButton></div>
    </form>
  );
}

type Pick = { id: string; title: string; photo_path: string | null; is_hidden: boolean; search: string };

// Tick items from your collection to put them on the shelf. Searchable, since collections get big.
export function ShelfPicker({ shelfId, items, room }: { shelfId: string; items: Pick[]; room: number }) {
  const [state, action] = useFormState<FormState, FormData>(addToShelf, undefined);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = useMemo(() => items.filter((i) => words.every((w) => i.search.includes(w))).slice(0, 120), [items, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  if (!items.length) return <section className="card"><h3>Add items</h3><p className="hint">Everything in your collection is already on this shelf.</p></section>;
  return (
    <form action={(f) => { action(f); setPicked(new Set()); }} className="card">
      <input type="hidden" name="id" value={shelfId} />
      <div className="card-title"><h3>Add items</h3><span className="hint">{picked.size} ticked · room for {room} more</span></div>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your collection…" aria-label="Search your collection" className="text-input" />
      <ul className="pick-list">
        {shown.map((i) => (
          <li key={i.id}>
            <label className={picked.has(i.id) ? "on" : undefined}>
              <input type="checkbox" name="item_id" value={i.id} checked={picked.has(i.id)} onChange={() => toggle(i.id)} disabled={!picked.has(i.id) && picked.size >= room} />
              {i.photo_path ? <Thumb className="pick-img" path={i.photo_path} /> : <span className="pick-img" />}
              <span>{i.title}{i.is_hidden && <span className="hint"> · hidden, won&apos;t show publicly</span>}</span>
            </label>
          </li>
        ))}
        {!shown.length && <li className="hint">Nothing matches “{q}”.</li>}
      </ul>
      {items.length > shown.length && !q && <p className="hint">Showing the first 120. Search to find others.</p>}
      <FormMessage state={state} />
      <div className="actions"><SubmitButton pending="Adding…">{picked.size ? `Add ${picked.size} to shelf` : "Add to shelf"}</SubmitButton></div>
    </form>
  );
}
