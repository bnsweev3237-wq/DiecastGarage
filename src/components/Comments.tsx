import Link from "next/link";
import { deleteComment } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import CommentForm from "./CommentForm";
import ReplyBox from "./ReplyBox";
import CommentVote from "./CommentVote";
import Avatar from "./Avatar";
import ReportButton from "./ReportButton";

type Props = { profileId: string; itemId?: string; path: string };
type Row = {
  id: string; body: string; created_at: string; author_id: string; under_review: boolean; parent_id: string | null; score: number;
  author: { username: string; avatar_path: string | null } | null;
};

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function Comments({ profileId, itemId, path }: Props) {
  const { supabase, user } = await getUser();
  let q = supabase.from("comments")
    .select("id, body, created_at, author_id, under_review, parent_id, score, author:profiles!comments_author_id_fkey(username, avatar_path)")
    .eq("profile_id", profileId).order("created_at", { ascending: false }).limit(300);
  q = itemId ? q.eq("item_id", itemId) : q.is("item_id", null);
  const [{ data }, { data: allowed }, { data: owner }] = await Promise.all([
    q,
    user ? supabase.rpc("can_comment", { p_profile: profileId }) : Promise.resolve({ data: false }),
    supabase.from("profiles").select("username, comments_from").eq("id", profileId).single(),
  ]);
  const closedMessage = owner?.comments_from === "nobody"
    ? `@${owner.username} has turned off comments.`
    : `@${owner?.username} only allows comments from collectors they follow.`;
  const all = (data ?? []) as unknown as Row[];
  const { data: votes } = user && all.length
    ? await supabase.from("comment_votes").select("comment_id, value").eq("voter_id", user.id).in("comment_id", all.map((c) => c.id))
    : { data: [] };
  const myVote = new Map(((votes ?? []) as { comment_id: string; value: number }[]).map((v) => [v.comment_id, v.value as -1 | 1]));
  // Best-voted conversations first, then newest. Replies stay in the order they were written.
  const top = all.filter((c) => !c.parent_id).sort((a, b) => b.score - a.score || b.created_at.localeCompare(a.created_at));
  const repliesTo = new Map<string, Row[]>();
  for (const c of [...all].reverse()) if (c.parent_id) repliesTo.set(c.parent_id, [...(repliesTo.get(c.parent_id) ?? []), c]);

  const one = (c: Row, isReply: boolean) => (
    <div className={isReply ? "comment reply" : "comment"} key={c.id} id={`comment-${c.id}`}>
      <div className="who">
        {c.author ? <><Avatar path={c.author.avatar_path} username={c.author.username} size="small" /><Link href={`/c/${c.author.username}`}>@{c.author.username}</Link></> : <span>Someone</span>}
        {c.author_id === profileId && <span className="chip owner-chip">Owner</span>}
        <span>{day(c.created_at)}</span>
        <CommentVote commentId={c.id} path={path} score={c.score} mine={myVote.get(c.id) ?? 0} canVote={!!user && user.id !== c.author_id} signedIn={!!user} />
        {user && (user.id === c.author_id || user.id === profileId) && (
          <form action={deleteComment}>
            <input type="hidden" name="id" value={c.id} /><input type="hidden" name="path" value={path} />
            <button className="linkbtn" type="submit">Delete</button>
          </form>
        )}
        {user && user.id !== c.author_id && <ReportButton type="comment" id={c.id} />}
      </div>
      <p>{c.body}</p>
      {c.under_review && <p className="hint">Only you can see this comment while our team reviews reports about it.</p>}
    </div>
  );

  return (
    <section className="card" id="comments">
      <h3>Comments <span className="hint">({all.length})</span></h3>
      {!user ? <p className="hint"><Link href={`/login?next=${encodeURIComponent(path)}`}>Sign in</Link> to leave a comment.</p>
        : allowed ? <CommentForm profileId={profileId} itemId={itemId} path={path} />
        : <p className="hint">{closedMessage}</p>}
      <div className="comments">
        {top.map((c) => (
          <div className="thread" key={c.id}>
            {one(c, false)}
            {(repliesTo.get(c.id) ?? []).map((r) => one(r, true))}
            {user && allowed && <ReplyBox profileId={profileId} itemId={itemId} path={path} parentId={c.id} />}
          </div>
        ))}
        {!top.length && <p className="hint">No comments yet.</p>}
      </div>
    </section>
  );
}
