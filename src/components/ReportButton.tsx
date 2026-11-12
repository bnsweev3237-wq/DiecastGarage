"use client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { submitReport, type FormState } from "@/app/actions";
import { REPORT_REASONS, type ReportTarget } from "@/lib/reports";
import SubmitButton from "./SubmitButton";

const NOUN: Record<ReportTarget, string> = { item: "item", comment: "comment", profile: "collector" };

export default function ReportButton({ type, id }: { type: ReportTarget; id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<FormState, FormData>(submitReport, undefined);
  if (state?.ok) return <span className="hint" role="status">{state.ok}</span>;
  if (!open) return <button className="linkbtn" type="button" onClick={() => setOpen(true)}>Report</button>;
  return (
    <form action={action} className="card report-form">
      <input type="hidden" name="target_type" value={type} />
      <input type="hidden" name="target_id" value={id} />
      <div className="field"><label className="label" htmlFor={`reason-${id}`}>Why are you reporting this {NOUN[type]}?</label>
        <select id={`reason-${id}`} name="reason" required defaultValue="">
          <option value="" disabled>Choose a reason</option>
          {REPORT_REASONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select></div>
      <div className="field"><label className="label" htmlFor={`details-${id}`}>Anything else we should know? (optional)</label>
        <textarea id={`details-${id}`} name="details" maxLength={1000} /></div>
      {state?.error && <p className="msg error" role="alert">{state.error}</p>}
      <div className="actions">
        <SubmitButton className="btn small primary" pending="Sending…">Send report</SubmitButton>
        <button className="btn small" type="button" onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <p className="hint">Reports are private. The collector isn&apos;t told who reported them.</p>
    </form>
  );
}
