"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { voteComment } from "@/app/actions";

type Props = { commentId: string; path: string; score: number; mine: -1 | 0 | 1; canVote: boolean; signedIn: boolean };

// ▲ score ▼ next to a comment. Click an arrow to vote, click it again to take the vote back.
export default function CommentVote({ commentId, path, score, mine, canVote, signedIn }: Props) {
  const [vote, setVote] = useState(mine);
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const shown = score - mine + vote; // the server's score with this browser's latest vote swapped in

  function cast(v: 1 | -1) {
    const next = vote === v ? 0 : v;
    const before = vote;
    setVote(next); setError("");
    start(async () => {
      const f = new FormData();
      f.set("comment_id", commentId); f.set("value", String(next)); f.set("path", path);
      const r = await voteComment(f);
      if (r?.error) { setVote(before); setError(r.error); }
    });
  }

  const cls = shown > 0 ? "vote-score up" : shown < 0 ? "vote-score down" : "vote-score";
  if (!signedIn) return (
    <span className="votes" title="Sign in to vote">
      <Link className="vote" href={`/login?next=${encodeURIComponent(path)}`} aria-label="Sign in to upvote">▲</Link>
      <span className={cls}>{shown}</span>
      <Link className="vote" href={`/login?next=${encodeURIComponent(path)}`} aria-label="Sign in to downvote">▼</Link>
    </span>
  );
  return (
    <span className="votes" title={error || (canVote ? undefined : "This is your comment")}>
      <button type="button" className={vote === 1 ? "vote on-up" : "vote"} disabled={!canVote || busy} onClick={() => cast(1)} aria-label="Upvote" aria-pressed={vote === 1}>▲</button>
      <span className={cls} aria-label={`Score ${shown}`}>{shown}</span>
      <button type="button" className={vote === -1 ? "vote on-down" : "vote"} disabled={!canVote || busy} onClick={() => cast(-1)} aria-label="Downvote" aria-pressed={vote === -1}>▼</button>
      {error && <span className="hint down" role="status">{error}</span>}
    </span>
  );
}
