"use client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { saveTradeReview, type FormState } from "@/app/actions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

// Leave or change your trade review of a collector.
export default function TradeReviewForm({ revieweeId, username, existing }: { revieweeId: string; username: string; existing: { positive: boolean; note: string | null } | null }) {
  const [state, action] = useFormState<FormState, FormData>(saveTradeReview, undefined);
  const [open, setOpen] = useState(false);
  const [positive, setPositive] = useState<"1" | "0" | "">(existing ? (existing.positive ? "1" : "0") : "");
  if (!open) return <button className="btn small" type="button" onClick={() => setOpen(true)}>{existing ? "Change your review" : `Traded with @${username}? Leave a review`}</button>;
  return (
    <form action={action} className="card review-form">
      <input type="hidden" name="reviewee_id" value={revieweeId} />
      <input type="hidden" name="positive" value={positive} />
      <h3>{existing ? "Your trade review" : `How was trading with @${username}?`}</h3>
      <div className="actions">
        <button type="button" className={positive === "1" ? "btn primary" : "btn"} onClick={() => setPositive("1")} aria-pressed={positive === "1"}>👍 Good trade</button>
        <button type="button" className={positive === "0" ? "btn primary" : "btn"} onClick={() => setPositive("0")} aria-pressed={positive === "0"}>👎 Had a problem</button>
      </div>
      <div className="field"><label className="label" htmlFor={`note-${revieweeId}`}>A few words (optional)</label>
        <textarea id={`note-${revieweeId}`} name="note" maxLength={300} rows={2} defaultValue={existing?.note ?? ""} placeholder="Shipped fast, packed well, item as described" /></div>
      <FormMessage state={state} />
      <div className="actions"><SubmitButton pending="Saving…">{existing ? "Update review" : "Post review"}</SubmitButton>
        <button className="btn small" type="button" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  );
}
