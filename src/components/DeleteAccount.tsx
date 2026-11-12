"use client";
import { useState } from "react";
import { useFormState } from "react-dom";
import { deleteMyAccount, type FormState } from "@/app/actions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

export default function DeleteAccount({ username, isMember }: { username: string; isMember: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<FormState, FormData>(deleteMyAccount, undefined);
  return (
    <section className="card danger-zone">
      <h3>Delete my account</h3>
      <p className="hint">
        Permanently deletes your account, items, photos, sold listings, comments and follows. This can&apos;t be undone.
        {isMember && " Your membership will be cancelled, with no refund for the rest of the current period."}
      </p>
      {!open ? (
        <div><button className="btn danger" type="button" onClick={() => setOpen(true)}>Delete my account…</button></div>
      ) : (
        <form action={action} className="field">
          <label className="label" htmlFor="confirm_delete">Type {username} to confirm</label>
          <input id="confirm_delete" name="confirm" required autoComplete="off" />
          <FormMessage state={state} />
          <div className="actions">
            <SubmitButton className="btn danger" pending="Deleting…">Delete everything</SubmitButton>
            <button className="btn" type="button" onClick={() => setOpen(false)}>Keep my account</button>
          </div>
        </form>
      )}
    </section>
  );
}
