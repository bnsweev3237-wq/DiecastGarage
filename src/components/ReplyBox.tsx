"use client";
import { useState } from "react";
import CommentForm from "./CommentForm";

// A "Reply" link that opens a small reply form under a comment.
export default function ReplyBox({ profileId, itemId, path, parentId }: { profileId: string; itemId?: string; path: string; parentId: string }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button className="linkbtn reply-link" type="button" onClick={() => setOpen(true)}>↩ Reply</button>;
  return (
    <div className="reply-form">
      <CommentForm profileId={profileId} itemId={itemId} path={path} parentId={parentId} onDone={() => setOpen(false)} />
      <button className="linkbtn" type="button" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}
