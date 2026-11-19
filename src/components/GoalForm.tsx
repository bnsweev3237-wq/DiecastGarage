"use client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { createGoal, type FormState } from "@/app/actions";
import CategoryOptions from "./CategoryOptions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

export default function GoalForm({ sets, defaultCategory }: { sets: { id: string; name: string }[]; defaultCategory: string }) {
  const [state, action] = useFormState<FormState, FormData>(createGoal, undefined);
  const [kind, setKind] = useState(sets.length ? "set" : "items");
  return (
    <form action={action} className="card">
      <h3>New goal</h3>
      <div className="grid2">
        <div className="field"><label className="label" htmlFor="kind">Goal</label>
          <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="set" disabled={!sets.length}>📋 Finish a set{sets.length ? "" : " (make a set first)"}</option>
            <option value="items">📦 Reach a number of items</option>
            <option value="category">🗂️ Reach a number in one category</option>
          </select></div>
        {kind === "set" ? (
          <div className="field"><label className="label" htmlFor="set_id">Set</label>
            <select id="set_id" name="set_id" required defaultValue="">{<option value="" disabled>Choose a set</option>}{sets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        ) : (
          <div className="field"><label className="label" htmlFor="target">How many items</label>
            <input id="target" name="target" type="number" min={1} max={100000} required inputMode="numeric" placeholder="100" /></div>
        )}
        {kind === "category" && (
          <div className="field"><label className="label" htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={defaultCategory}><CategoryOptions /></select></div>
        )}
        <div className="field"><label className="label" htmlFor="title">Name it (optional)</label>
          <input id="title" name="title" maxLength={80} placeholder="Every Earnhardt Goodwrench car" /></div>
        <div className="field full"><label className="check" htmlFor="is_public"><input id="is_public" name="is_public" type="checkbox" defaultChecked /> Show on my public page</label></div>
      </div>
      <FormMessage state={state} />
      <div className="actions"><SubmitButton pending="Adding…">Add goal</SubmitButton></div>
    </form>
  );
}
