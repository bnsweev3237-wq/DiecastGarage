"use client";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { addComment, type FormState } from "@/app/actions";
import SubmitButton from "./SubmitButton";
import FormMessage from "./FormMessage";

// Used for new comments and, with parentId, for replies under a comment.
export default function CommentForm({ profileId, itemId, path, parentId, onDone }: { profileId: string; itemId?: string; path: string; parentId?: string; onDone?: () => void }) {
  const [state, action] = useFormState<FormState, FormData>(addComment, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) { ref.current?.reset(); onDone?.(); } }, [state, onDone]);
  return (
    <form ref={ref} action={action} className="field">
      <input type="hidden" name="profile_id" value={profileId} />
      {itemId && <input type="hidden" name="item_id" value={itemId} />}
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <input type="hidden" name="path" value={path} />
      <label className="label" htmlFor={parentId ? `reply-${parentId}` : "body"}>{parentId ? "Your reply" : "Leave a comment"}</label>
      <textarea id={parentId ? `reply-${parentId}` : "body"} name="body" maxLength={1000} required autoFocus={!!parentId}
        placeholder={parentId ? "Write a reply…" : "Nice find! Where did you pick this one up?"} rows={parentId ? 2 : undefined} />
      <div className="actions">
        <SubmitButton className="btn primary small" pending="Posting…">{parentId ? "Post reply" : "Post comment"}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
