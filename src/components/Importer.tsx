"use client";
import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { importItems, type ImportResult } from "@/app/actions";
import { parseCsv } from "@/lib/csv";
import { COLUMNS, matchColumn } from "@/lib/item-columns";
import { CATEGORIES } from "@/lib/categories";
import CategoryOptions from "./CategoryOptions";
import SubmitButton from "./SubmitButton";

const DETAILS = (() => {
  const seen = new Map<string, string>();
  for (const c of CATEGORIES) for (const f of c.fields) if (!seen.has(f.key)) seen.set(f.key, f.label);
  return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
})();

// Upload a CSV, check which column goes where, and import. Up to 500 rows at a time.
export default function Importer({ defaultCategory, member }: { defaultCategory: string; member: boolean }) {
  const [state, action] = useFormState<ImportResult, FormData>(importItems, undefined);
  const [fileName, setFileName] = useState("");
  const [table, setTable] = useState<string[][]>([]);
  const [map, setMap] = useState<string[]>([]);
  const [error, setError] = useState("");
  const headers = table[0] ?? [];
  const body = table.slice(1);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError("");
    if (!file) return;
    if (/\.(xlsx?|numbers)$/i.test(file.name)) { setError("Save the spreadsheet as CSV first: in Excel use File → Save As → CSV; in Google Sheets use File → Download → CSV."); return; }
    const rows = parseCsv(await file.text());
    if (rows.length < 2) { setError("That file has no rows under the header line."); return; }
    setFileName(file.name);
    setTable(rows);
    setMap(rows[0].map((h) => matchColumn(h) ?? ""));
  }

  const mapped = useMemo(() => body.slice(0, 500).map((r) => {
    const o: Record<string, string> = {};
    map.forEach((key, i) => { if (key && (r[i] ?? "").trim()) o[key] = (o[key] ? o[key] + ", " : "") + r[i].trim(); });
    return o;
  }), [body, map]);
  const hasName = map.includes("title");
  const missingNames = mapped.filter((r) => !r.title).length;

  if (state?.added != null) return (
    <section className="card">
      <h3>{state.added ? `Imported ${state.added} item${state.added === 1 ? "" : "s"} 🎉` : "Nothing was imported"}</h3>
      {state.stopped && <p className="msg error">Stopped early: {state.stopped}</p>}
      {!!state.failed?.length && <>
        <p className="hint">{state.failed.length} row{state.failed.length === 1 ? "" : "s"} couldn&apos;t be imported:</p>
        <ul className="import-errors">{state.failed.slice(0, 100).map((f) => <li key={f.row}><b>Row {f.row}</b> ({f.title}): {f.error}</li>)}</ul>
      </>}
      <p className="hint">Photos aren&apos;t imported. Add them from each item&apos;s page.</p>
      <div className="actions"><Link className="btn primary" href="/collection?sort=added">See my collection</Link><a className="btn" href="/collection/import">Import another file</a></div>
    </section>
  );

  return (
    <form action={action} className="bulk">
      <section className="card">
        <h3>1. Choose your spreadsheet</h3>
        <p className="hint">A CSV file with a header row, one item per row. Excel, Numbers and Google Sheets can all save as CSV. Not sure what columns to use? <a href="/collection/export">Export your collection</a> to see the format.</p>
        <input type="file" accept=".csv,text/csv,.xlsx,.xls" onChange={onFile} aria-label="Spreadsheet file" />
        {error && <p className="msg error">{error}</p>}
      </section>

      {headers.length > 0 && <>
        <section className="card">
          <div className="card-title"><h3>2. Match the columns</h3><span className="hint">{fileName}: {body.length} row{body.length === 1 ? "" : "s"}{body.length > 500 ? " (only the first 500 are imported)" : ""}</span></div>
          <p className="hint">We&apos;ve guessed where each column goes. Change any that are wrong, or choose &quot;Skip&quot;.</p>
          <div className="map-table">
            {headers.map((h, i) => (
              <div key={i} className="map-row">
                <span className="map-from"><b>{h || `Column ${i + 1}`}</b><span className="hint">{body.slice(0, 2).map((r) => r[i]).filter(Boolean).join(" · ").slice(0, 60)}</span></span>
                <span aria-hidden="true">→</span>
                <select value={map[i] ?? ""} onChange={(e) => setMap((m) => m.map((v, j) => (j === i ? e.target.value : v)))} aria-label={`Where ${h} goes`}>
                  <option value="">Skip this column</option>
                  <optgroup label="Item">{COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}{c.money && !member ? " (members)" : ""}</option>)}</optgroup>
                  <optgroup label="Category details">{DETAILS.map(([k, l]) => <option key={k} value={`a_${k}`}>{l}</option>)}</optgroup>
                </select>
              </div>
            ))}
          </div>
          <div className="field"><label className="label" htmlFor="default_category">Category for rows without one</label>
            <select id="default_category" name="default_category" defaultValue={defaultCategory}><CategoryOptions /></select></div>
          {!member && <p className="hint">🔒 Prices and values are skipped on the free plan, and free accounts can keep up to 25 items.</p>}
        </section>

        <section className="card">
          <h3>3. Import</h3>
          {!hasName ? <p className="msg error">Choose which column is the item&apos;s Name.</p>
            : <p>{mapped.length - missingNames} item{mapped.length - missingNames === 1 ? "" : "s"} ready{missingNames ? `, ${missingNames} row${missingNames === 1 ? "" : "s"} without a name will be skipped` : ""}.</p>}
          <input type="hidden" name="rows" value={JSON.stringify(mapped.filter((r) => r.title))} />
          {state?.error && <p className="msg error">{state.error}</p>}
          <div className="actions"><SubmitButton pending="Importing… this can take a minute">Import {mapped.length - missingNames} items</SubmitButton></div>
        </section>
      </>}
    </form>
  );
}
