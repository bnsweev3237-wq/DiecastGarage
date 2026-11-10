import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { siteUrl, stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${siteUrl()}/login?next=/settings`, 303);
  const { data: m } = await supabase.from("memberships").select("stripe_customer_id").eq("user_id", user.id).single();
  if (!m?.stripe_customer_id) return NextResponse.redirect(`${siteUrl()}/settings`, 303);
  const portal = await stripe.billingPortal.sessions.create({ customer: m.stripe_customer_id, return_url: `${siteUrl()}/settings` });
  return NextResponse.redirect(portal.url, 303);
}
