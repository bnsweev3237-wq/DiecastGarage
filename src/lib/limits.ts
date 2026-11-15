// The free plan. Keep in sync with supabase/migrations/0014_free_plan.sql.
// Free: up to 25 items, 1 photo each, no for-sale listings, no money features
// (purchase prices, values, gain or loss, sales). Members get all of it.
export const FREE_ITEM_LIMIT = 25;
export const FREE_PHOTO_LIMIT = 1;

export type MembershipRow = { status?: string | null; comp_active?: boolean | null; comp_until?: string | null } | null | undefined;

// Paid through Stripe.
export const isActiveMembership = (status?: string | null) => status === "active" || status === "trialing";

// A complimentary membership granted by an admin that hasn't ended. comp_until is its last day (UTC); null never ends.
export function compActive(m: MembershipRow) {
  if (!m?.comp_active) return false;
  return !m.comp_until || m.comp_until >= new Date().toISOString().slice(0, 10);
}

// Same rule as is_member() in supabase/migrations/0009_comp_memberships.sql.
export const isMember = (m: MembershipRow) => isActiveMembership(m?.status) || compActive(m);

export const compEnds = (m: MembershipRow) =>
  m?.comp_until ? new Date(`${m.comp_until}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;
