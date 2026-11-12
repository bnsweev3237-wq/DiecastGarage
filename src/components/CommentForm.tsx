"use client";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { addComment, type FormState } from "@/app/actions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

export default function CommentForm({ profileId, itemId, path }: { profileId: string; itemId?: string; path: string }) {
  const [state, action] = useFormState<FormState, FormData>(addComment, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="field">
      <input type="hidden" name="profile_id" value={profileId} />
      {itemId && <input type="hidden" name="item_id" value={itemId} />}
      <input type="hidden" name="path" value={path} />
      <label className="label" htmlFor="body">Leave a comment</label>
      <textarea id="body" name="body" maxLength={1000} required placeholder="Nice find! Where did you pick this one up?" />
      <div className="actions">
        <SubmitButton className="btn primary small" pending="Posting…">Post comment</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
