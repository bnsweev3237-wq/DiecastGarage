"use client";
import { useState } from "react";
import SubmitButton from "./SubmitButton";

type Props = {
  action: (f: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  confirmText: string;
};

// A remove button that asks once before it acts.
export default function ConfirmAction({ action, fields, label, confirmText }: Props) {
  const [sure, setSure] = useState(false);
  if (!sure) return <button className="linkbtn" type="button" onClick={() => setSure(true)}>{label}</button>;
  return (
    <form action={action} className="actions">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <span className="hint">{confirmText}</span>
      <SubmitButton className="btn small danger" pending="Removing…">Yes, {label.toLowerCase()}</SubmitButton>
      <button className="btn small" type="button" onClick={() => setSure(false)}>Cancel</button>
    </form>
  );
}
