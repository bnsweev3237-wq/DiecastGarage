"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useFormState } from "react-dom";
import { sendFeedback, type FormState } from "@/app/actions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

const KINDS = [["bug", "🐞 Bug"], ["idea", "💡 Idea"], ["other", "💬 Other"]] as const;

// Floating button for beta testers. Sends a note to the admin Feedback page with the page they were on.
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>("bug");
  const [state, action] = useFormState<FormState, FormData>(sendFeedback, undefined);
  const path = usePathname();
  const sent = state?.ok;
  const [device, setDevice] = useState("");
  useEffect(() => { setDevice(`${navigator.userAgent.slice(0, 220)} · ${window.innerWidth}×${window.innerHeight}`); }, [open]);

  return (
    <div className="feedback">
      {open && (
        <form className="feedback-panel card" action={action} key={sent ? "sent" : "form"}>
          <div className="card-title"><h3>Send feedback</h3><button type="button" className="linkbtn" onClick={() => setOpen(false)} aria-label="Close">✕</button></div>
          {sent ? (
            <p className="msg ok">Thanks! Your feedback went straight to the team.</p>
          ) : <>
            <div className="seg small kinds" role="radiogroup" aria-label="What kind of feedback">
              {KINDS.map(([k, label]) => (
                <label key={k} className={kind === k ? "on" : undefined}><input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} /><b>{label}</b></label>
              ))}
            </div>
            <textarea name="message" required maxLength={2000} rows={5} aria-label="Your feedback"
              placeholder={kind === "bug" ? "What happened, and what did you expect? Steps to repeat it help a lot." : "Tell us what you're thinking…"} />
            <input type="hidden" name="page" value={path ?? ""} />
            <input type="hidden" name="device" value={device} />
            <p className="hint">Sent from this page ({path}). Only the team sees it.</p>
            <FormMessage state={state} />
            <SubmitButton pending="Sending…">Send</SubmitButton>
          </>}
        </form>
      )}
      <button type="button" className="feedback-fab" onClick={() => setOpen((o) => !o)} aria-expanded={open}>💬 Feedback</button>
    </div>
  );
}
