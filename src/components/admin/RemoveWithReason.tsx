"use client";
import { useState } from "react";
import { REMOVAL_REASONS } from "@/lib/reports";
import SubmitButton from "@/components/SubmitButton";

type Props = { action: (f: FormData) => Promise<void>; id: string; label: string; what: string };

// A remove button that asks why. The reason and note are sent to the collector in a notification.
export default function RemoveWithReason({ action, id, label, what }: Props) {
  const [open, setOpen] = useState(false);
  if (!open) return <button className="linkbtn" type="button" onClick={() => setOpen(true)}>{label}</button>;
  return (
    <form action={action} className="remove-reason">
      <input type="hidden" name="id" value={id} />
      <label className="label" htmlFor={`reason-${id}`}>Why remove {what}?</label>
      <select id={`reason-${id}`} name="reason" required defaultValue="">
        <option value="" disabled>Choose a reason</option>
        {REMOVAL_REASONS.map(([k, text]) => <option key={k} value={k}>{text}</option>)}
      </select>
      <textarea name="note" maxLength={500} rows={2} placeholder="Optional note to the collector, e.g. what to change" aria-label="Note to the collector" />
      <span className="hint">The collector gets a notification with this reason and note (and an email if they've turned emails on).</span>
      <div className="actions">
        <SubmitButton className="btn small danger" pending="Removing…">Yes, {label.toLowerCase()}</SubmitButton>
        <button className="btn small" type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
