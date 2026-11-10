import { NETWORKS, type SocialKey } from "@/lib/social";

export default function SocialLinks({ profile }: { profile: Partial<Record<SocialKey, string | null>> }) {
  const links = NETWORKS.filter((n) => profile[n.key]);
  if (!links.length) return null;
  return (
    <div className="meta">
      {links.map((n) => (
        <a key={n.key} className="chip link" href={profile[n.key]!} target="_blank" rel="noopener noreferrer nofollow">{n.label} ↗</a>
      ))}
    </div>
  );
}
