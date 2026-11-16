"use client";
import { useMemo, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { autoMatchSet, createSet, setEntryHave, updateSet, type FormState } from "@/app/actions";
import CategoryOptions from "./CategoryOptions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

export function NewSetForm({ defaultCategory }: { defaultCategory: string }) {
  const [state, action] = useFormState<FormState, FormData>(createSet, undefined);
  const [lines, setLines] = useState("");
  const count = lines.split(/\r?\n/).filter((l) => l.trim()).length;
  return (
    <form action={action} className="card">
      <div className="grid2">
        <div className="field full"><label className="label" htmlFor="name">Set name</label>
          <input id="name" name="name" required maxLength={120} placeholder="1999 Pokémon Base Set, 2023 Hot Wheels Mainline" /></div>
        <div className="field"><label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={defaultCategory}><CategoryOptions /></select></div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label className="check" htmlFor="is_public"><input id="is_public" name="is_public" type="checkbox" defaultChecked /> Show on my public page</label></div>
        <div className="field full"><label className="label" htmlFor="description">Description (optional)</label>
          <input id="description" name="description" maxLength={1000} placeholder="What counts toward this set" /></div>
        <div className="field full"><label className="label" htmlFor="lines">The checklist: one line per piece</label>
          <textarea id="lines" name="lines" rows={12} value={lines} onChange={(e) => setLines(e.target.value)}
            placeholder={"1/102 Alakazam\n2/102 Blastoise\n3/102 Chansey\n4/102 Charizard"} />
          <span className="hint">{count} line{count === 1 ? "" : "s"}. Paste a list from a checklist site or spreadsheet. You can add more later.</span></div>
      </div>
      <FormMessage state={state} />
      <div className="actions"><SubmitButton pending="Creating…">Create set</SubmitButton></div>
    </form>
  );
}

export function EditSetForm({ set }: { set: { id: string; name: string; description: string | null; category: string | null; is_public: boolean } }) {
  const [state, action] = useFormState<FormState, FormData>(updateSet, undefined);
  return (
    <form action={action} className="card">
      <h3>Edit set</h3>
      <input type="hidden" name="id" value={set.id} />
      <div className="grid2">
        <div className="field full"><label className="label" htmlFor="name">Set name</label><input id="name" name="name" required maxLength={120} defaultValue={set.name} /></div>
        <div className="field"><label className="label" htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={set.category ?? ""}><option value="">Any category</option><CategoryOptions /></select></div>
        <div className="field" style={{ justifyContent: "flex-end" }}>
          <label className="check" htmlFor="is_public"><input id="is_public" name="is_public" type="checkbox" defaultChecked={set.is_public} /> Show on my public page</label></div>
        <div className="field full"><label className="label" htmlFor="description">Description</label><input id="description" name="description" maxLength={1000} defaultValue={set.description ?? ""} /></div>
        <div className="field full"><label className="label" htmlFor="more_lines">Add more lines (one per piece)</label><textarea id="more_lines" name="more_lines" rows={3} /></div>
      </div>
      <FormMessage state={state} />
      <div className="actions"><SubmitButton pending="Saving…">Save</SubmitButton></div>
    </form>
  );
}

export function AutoMatch({ setId }: { setId: string }) {
  const [state, action] = useFormState<FormState, FormData>(autoMatchSet, undefined);
  return (
    <form action={action} className="actions">
      <input type="hidden" name="id" value={setId} />
      <SubmitButton className="btn small" pending="Matching…">🔗 Match my items</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

type Entry = { id: string; label: string; have: boolean; item: { id: string; title: string } | null };

// The checklist. Owners tick lines off; everyone else sees what's had and what's missing.
export function Checklist({ setId, entries, owner, ownerName }: { setId: string; entries: Entry[]; owner: boolean; ownerName: string }) {
  const [rows, setRows] = useState(entries);
  const [show, setShow] = useState<"all" | "have" | "missing">("all");
  const [q, setQ] = useState("");
  const [, start] = useTransition();
  const shown = useMemo(() => rows.filter((r) => (show === "all" || (show === "have") === r.have) && (!q || r.label.toLowerCase().includes(q.toLowerCase()))), [rows, show, q]);
  const have = rows.filter((r) => r.have).length;

  function send(id: string, fields: Record<string, string>, next: (r: Entry[]) => Entry[]) {
    const before = rows;
    setRows(next(rows));
    start(async () => {
      const f = new FormData(); f.set("entry_id", id); f.set("set_id", setId);
      for (const [k, v] of Object.entries(fields)) f.set(k, v);
      const r = await setEntryHave(f);
      if (r?.error) setRows(before);
    });
  }

  return (
    <section className="card">
      <div className="card-title">
        <h3>{have} of {rows.length} · {rows.length ? Math.round((have / rows.length) * 100) : 0}%</h3>
        <nav className="sort-toggle" aria-label="Show">
          {(["all", "have", "missing"] as const).map((k) => (
            <button key={k} type="button" className={show === k ? "on" : undefined} onClick={() => setShow(k)}>
              {k === "all" ? `All ${rows.length}` : k === "have" ? `Have ${have}` : `Missing ${rows.length - have}`}
            </button>
          ))}
        </nav>
      </div>
      <div className="progress" aria-hidden="true"><span style={{ width: `${rows.length ? (have / rows.length) * 100 : 0}%` }} /></div>
      {rows.length > 15 && <input type="search" className="checklist-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a line…" aria-label="Find a line" />}
      <ul className="checklist">
        {shown.map((r) => (
          <li key={r.id} className={r.have ? "have" : undefined}>
            {owner
              ? <label className="check"><input type="checkbox" checked={r.have} onChange={(e) => send(r.id, { have: e.target.checked ? "1" : "0" },
                  (rs) => rs.map((x) => x.id === r.id ? { ...x, have: e.target.checked, item: e.target.checked ? x.item : null } : x))} /> {r.label}</label>
              : <span className="check">{r.have ? "✅" : "⬜️"} {r.label}</span>}
            {r.item && <Link className="hint" href={owner ? `/collection/${r.item.id}` : `/c/${ownerName}/${r.item.id}`}>🔗 {r.item.title}</Link>}
            {owner && <button type="button" className="linkbtn" aria-label={`Remove ${r.label}`} onClick={() => send(r.id, { remove: "1" }, (rs) => rs.filter((x) => x.id !== r.id))}>✕</button>}
          </li>
        ))}
        {!shown.length && <li className="hint">{show === "missing" ? "Nothing missing. Set complete! 🎉" : "Nothing here."}</li>}
      </ul>
    </section>
  );
}
