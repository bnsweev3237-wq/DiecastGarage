import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";

type Props = { username: string; kind: "followers" | "following" };

export default async function FollowList({ username, kind }: Props) {
  const { supabase, user } = await getUser();
  const { data: profile } = await supabase.from("profiles").select("id, username, show_follows, is_public")
    .eq("username", username.toLowerCase()).maybeSingle();
  if (!profile) notFound();
  const isOwner = user?.id === profile.id;
  const open = isOwner || (profile.is_public && profile.show_follows);

  let people: string[] = [];
  if (open) {
    const { data } = kind === "followers"
      ? await supabase.from("follows").select("person:profiles!follows_follower_id_fkey(username)").eq("followee_id", profile.id)
      : await supabase.from("follows").select("person:profiles!follows_followee_id_fkey(username)").eq("follower_id", profile.id);
    people = (data ?? []).map((r) => (r.person as unknown as { username: string }).username).sort();
  }
  const title = kind === "followers" ? "Followers" : "Following";

  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="head">
        <div><Link href={`/c/${profile.username}`}>← @{profile.username}</Link><h1>{title}</h1></div>
        <div className="actions">
          <Link className={`btn small${kind === "followers" ? " primary" : ""}`} href={`/c/${profile.username}/followers`}>Followers</Link>
          <Link className={`btn small${kind === "following" ? " primary" : ""}`} href={`/c/${profile.username}/following`}>Following</Link>
        </div>
      </div>
      {isOwner && !profile.show_follows && <p className="notice">Your follow lists are private. Only you can see this page. Change it in Settings.</p>}
      {!open ? (
        <div className="empty"><h3>This list is private</h3><p>@{profile.username} keeps who they follow and who follows them to themselves.</p></div>
      ) : people.length ? (
        <section className="card">
          <div className="meta">{people.map((u) => <Link key={u} className="chip" href={`/c/${u}`}>@{u}</Link>)}</div>
          <p className="hint">Collectors who keep their own follow lists private aren&apos;t listed here.</p>
        </section>
      ) : (
        <div className="empty"><h3>Nobody here yet</h3></div>
      )}
    </main>
  );
}
