"use client";
import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { bulkEditItems, type FormState } from "@/app/actions";
import CategoryOptions from "./CategoryOptions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";
import Thumb from "./Thumb";

export type BulkRow = { id: string; title: string; photo: string | null; category: string; status: string; tags: string[]; storage: string | null; hidden: boolean; box: boolean };

// Tick items, choose what to change, apply. Only the changes you fill in are made.
export default function BulkEditor({ rows, tags }: { rows: BulkRow[]; tags: string[] }) {
  const [state, action] = useFormState<FormState, FormData>(bulkEditItems, undefined);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? rows.filter((r) => [r.title, r.category, r.storage, ...r.tags].join(" ").toLowerCase().includes(q)) : rows;
  }, [rows, filter]);
  const allShown = shown.length > 0 && shown.every((r) => picked.has(r.id));
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setPicked((p) => { const n = new Set(p); for (const r of shown) { if (allShown) n.delete(r.id); else n.add(r.id); } return n; });

  return (
    <form action={action} className="bulk">
      {[...picked].map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
      <section className="card bulk-changes">
        <div className="card-title"><h3>Change {picked.size} selected item{picked.size === 1 ? "" : "s"}</h3><span className="hint">Leave a box empty to keep it as it is</span></div>
        <div className="grid2">
          <div className="field"><label className="label" htmlFor="add_tags">Add tags</label>
            <input id="add_tags" name="add_tags" maxLength={300} placeholder="Earnhardt, Trade bait" /></div>
          <div className="field"><label className="label" htmlFor="remove_tag">Remove a tag</label>
            <select id="remove_tag" name="remove_tag" defaultValue=""><option value="">Keep tags</option>{tags.map((t) => <option key={t} value={t}>#{t}</option>)}</select></div>
          <div className="field"><label className="label" htmlFor="category">Move to category</label>
            <select id="category" name="category" defaultValue=""><option value="">Keep category</option><CategoryOptions /></select></div>
          <div className="field"><label className="label" htmlFor="storage_location">Where it&apos;s stored</label>
            <input id="storage_location" name="storage_location" maxLength={100} placeholder="Binder 3, garage shelf B" />
            <label className="check small" htmlFor="clear_storage"><input id="clear_storage" name="clear_storage" type="checkbox" /> Clear where it&apos;s stored</label></div>
          <div className="field"><label className="label" htmlFor="hidden">Public page</label>
            <select id="hidden" name="hidden" defaultValue=""><option value="">Keep as is</option><option value="yes">Hide from my public page</option><option value="no">Show on my public page</option></select></div>
          <div className="field"><label className="label" htmlFor="box">Original box or packaging</label>
            <select id="box" name="box" defaultValue=""><option value="">Keep as is</option><option value="yes">Has it</option><option value="no">Doesn&apos;t have it</option></select></div>
        </div>
        <FormMessage state={state} />
        <div className="actions"><SubmitButton pending="Updating…">Apply to {picked.size} item{picked.size === 1 ? "" : "s"}</SubmitButton>
          {picked.size > 0 && <button type="button" className="btn small" onClick={() => setPicked(new Set())}>Clear selection</button>}</div>
      </section>

      <div className="bulk-tools">
        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name, category, tag or storage…" aria-label="Filter items" />
        <label className="check"><input type="checkbox" checked={allShown} onChange={toggleAll} /> Select all {shown.length} shown</label>
      </div>
      <section className="list bulk-list">
        {shown.map((r) => (
          <label key={r.id} className={picked.has(r.id) ? "bulk-row on" : "bulk-row"}>
            <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.title}`} />
            {r.photo ? <Thumb className="thumb" path={r.photo} /> : <span className="thumb" />}
            <span className="bulk-text">
              <b>{r.title}</b>
              <span className="hint">{r.category}{r.status !== "owned" ? ` · ${r.status === "wishlist" ? "Wishlist" : "Sold"}` : ""}{r.box ? " · 📦 Boxed" : ""}{r.hidden ? " · Hidden" : ""}{r.storage ? ` · Stored: ${r.storage}` : ""}</span>
              {r.tags.length > 0 && <span className="hint">{r.tags.map((t) => `#${t}`).join(" ")}</span>}
            </span>
          </label>
        ))}
        {!shown.length && <p className="hint" style={{ padding: 16 }}>No items match.</p>}
      </section>
    </form>
  );
}
