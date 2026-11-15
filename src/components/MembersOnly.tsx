import Link from "next/link";

// A small "Members" lock badge that links to joining, for features free accounts can see but not use.
export function MembersBadge({ label = "Members" }: { label?: string }) {
  return <Link className="members-badge" href="/settings#membership" title="Become a member to use this">🔒 {label}</Link>;
}

// A note that sits on a locked section, saying what membership unlocks.
export function MembersNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="members-note">
      <span>🔒 {children}</span>
      <Link className="btn small flag" href="/settings#membership">Become a member</Link>
    </p>
  );
}
