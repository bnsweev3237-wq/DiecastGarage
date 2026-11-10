import Link from "next/link";
import { deleteComment } from "@/app/actions";
import { getUser } from "@/lib/supabase/server";
import CommentForm from "./CommentForm";

type Props = { profileId: string; carId?: string; path: string };

export default async function Comments({ profileId, carId, path }: Props) {
  const { supabase, user } = await getUser();
  let q = supabase.from("comments")
    .select("id, body, created_at, author_id, author:profiles!comments_author_id_fkey(username)")
    .eq("profile_id", profileId).order("created_at", { ascending: false }).limit(100);
  q = carId ? q.eq("car_id", carId) : q.is("car_id", null);
  const [{ data }, { data: allowed }, { data: owner }] = await Promise.all([
    q,
    user ? supabase.rpc("can_comment", { p_profile: profileId }) : Promise.resolve({ data: false }),
    supabase.from("profiles").select("username, comments_from").eq("id", profileId).single(),
  ]);
  const closedMessage = owner?.comments_from === "nobody"
    ? `@${owner.username} has turned off comments.`
    : `@${owner?.username} only allows comments from collectors they follow.`;
  const comments = (data ?? []) as unknown as {
    id: string; body: string; created_at: string; author_id: string; author: { username: string } | null;
  }[];
  return (
    <section className="card">
      <h3>Comments <span className="hint">({comments.length})</span></h3>
      {!user ? <p className="hint"><Link href={`/login?next=${encodeURIComponent(path)}`}>Sign in</Link> to leave a comment.</p>
        : allowed ? <CommentForm profileId={profileId} carId={carId} path={path} />
        : <p className="hint">{closedMessage}</p>}
      <div className="comments">
        {comments.map((c) => (
          <div className="comment" key={c.id}>
            <div className="who">
              {c.author ? <Link href={`/c/${c.author.username}`}>@{c.author.username}</Link> : <span>Someone</span>}
              <span>{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {user && (user.id === c.author_id || user.id === profileId) && (
                <form action={deleteComment}>
                  <input type="hidden" name="id" value={c.id} /><input type="hidden" name="path" value={path} />
                  <button className="linkbtn" type="submit">Delete</button>
                </form>
              )}
            </div>
            <p>{c.body}</p>
          </div>
        ))}
        {!comments.length && <p className="hint">No comments yet.</p>}
      </div>
    </section>
  );
}
