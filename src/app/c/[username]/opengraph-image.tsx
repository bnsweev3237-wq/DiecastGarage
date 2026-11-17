import { profileCard, publicDb, SIZE } from "@/app/_og/card";
import { avatarUrl, photoUrl } from "@/lib/items";
import { badgeStats, badgesFor } from "@/lib/badges";

// The picture shown when someone shares a collection. See src/app/_og/card.tsx.
export const runtime = "edge";
export const alt = "A collection on theCollectorHQ";
export const size = SIZE;
export const contentType = "image/png";

type ItemRow = Parameters<typeof badgeStats>[0][number] & { photo_path: string | null };

export default async function Image({ params }: { params: { username: string } }) {
  const db = publicDb();
  const { data: p } = await db.from("profiles").select("id, username, avatar_path, is_public, under_review, is_beta_tester, created_at")
    .eq("username", params.username.toLowerCase()).maybeSingle();
  if (!p || !p.is_public || p.under_review) return profileCard(null);
  const [{ data: items }, { data: counts }, { data: sets }] = await Promise.all([
    db.from("items").select("photo_path, status, featured, is_certified, category, rating_avg, rating_count")
      .eq("owner_id", p.id).order("featured", { ascending: false }).order("rating_score", { ascending: false }).order("created_at", { ascending: false }),
    db.rpc("follow_counts", { p_profile: p.id }).single(),
    db.from("sets").select("is_public, set_entries(have)").eq("owner_id", p.id).eq("is_public", true),
  ]);
  const rows = (items ?? []) as ItemRow[];
  const followers = (counts as { followers: number } | null)?.followers ?? 0;
  const stats = badgeStats(rows, (sets ?? []) as Parameters<typeof badgeStats>[1], { followers, joined: p.created_at, beta: p.is_beta_tester });
  return profileCard({
    username: p.username, avatar: avatarUrl(p.avatar_path), items: stats.items, followers,
    photos: rows.filter((i) => i.status === "owned" && i.photo_path).map((i) => photoUrl(i.photo_path)!).slice(0, 4),
    badges: badgesFor(stats).map((b) => b.label),
  });
}
