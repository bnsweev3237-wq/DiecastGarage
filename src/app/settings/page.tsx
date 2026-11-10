import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { getUser } from "@/lib/supabase/server";
import { FREE_CAR_LIMIT, isActiveMembership } from "@/lib/limits";
import { paymentsEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function Settings({ searchParams }: { searchParams: { membership?: string } }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login?next=/settings");
  const [{ data: profile }, { data: priv }, { data: m }, { count }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("profile_private").select("full_name, location").eq("id", user.id).maybeSingle(),
    supabase.from("memberships").select("*").eq("user_id", user.id).single(),
    supabase.from("cars").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
  ]);
  const member = isActiveMembership(m?.status);
  const renews = m?.current_period_end ? new Date(m.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <div className="head"><div><h1>Settings</h1><p>@{profile?.username} · {user.email}</p></div></div>
      {searchParams.membership === "success" && <p className="msg ok">Thanks for joining! Your membership is active once payment clears, usually within a minute.</p>}
      {searchParams.membership === "cancelled" && <p className="msg error">Checkout was cancelled. You haven&apos;t been charged.</p>}

      <ProfileForm fullName={priv?.full_name ?? null} email={user.email ?? ""} bio={profile?.bio ?? null}
        isPublic={profile?.is_public ?? true} showEmail={profile?.show_email ?? false} showValues={profile?.show_values ?? false}
        location={priv?.location ?? null} showLocation={profile?.show_location ?? false} commentsFrom={profile?.comments_from ?? "everyone"}
        showFollows={profile?.show_follows ?? true} />

      <section className="card" id="membership">
        <h3>Membership</h3>
        <div className="plan">
          <div className={member ? "" : "on"}>
            <span className="label">Free</span>
            <ul><li>Up to {FREE_CAR_LIMIT} cars</li><li>Value tracking, follows and comments</li></ul>
          </div>
          <div className={member ? "on" : ""}>
            <span className="label">Member</span>
            <ul><li>Unlimited cars</li><li>Everything in Free</li></ul>
          </div>
        </div>
        {member ? (
          <>
            <p className="hint">You&apos;re a member{renews ? `. Renews ${renews}` : ""}. You have {count ?? 0} cars.</p>
            <form action="/api/stripe/portal" method="post"><button className="btn" type="submit">Manage or cancel membership</button></form>
          </>
        ) : (
          <>
            <p className="hint">You&apos;re using {count ?? 0} of {FREE_CAR_LIMIT} free cars. Payment is handled securely by Stripe.</p>
            {paymentsEnabled()
              ? <form action="/api/stripe/checkout" method="post"><button className="btn flag" type="submit">Become a member</button></form>
              : <p className="notice">Memberships are coming soon.</p>}
          </>
        )}
      </section>

      <form action="/auth/signout" method="post"><button className="btn" type="submit">Sign out</button></form>
    </main>
  );
}
