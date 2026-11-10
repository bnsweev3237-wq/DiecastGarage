import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentsEnabled, siteUrl, stripe } from "@/lib/stripe";

export async function POST() {
  if (!paymentsEnabled()) return NextResponse.redirect(`${siteUrl()}/settings`, 303);
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return NextResponse.redirect(`${siteUrl()}/login?next=/settings`, 303);

  const admin = createAdminClient();
  const { data: m } = await admin.from("memberships").select("stripe_customer_id").eq("user_id", user.id).single();
  let customer = m?.stripe_customer_id;
  if (!customer) {
    customer = (await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })).id;
    await admin.from("memberships").upsert({ user_id: user.id, stripe_customer_id: customer });
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_MEMBERSHIP_PRICE_ID!, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${siteUrl()}/settings?membership=success`,
    cancel_url: `${siteUrl()}/settings?membership=cancelled`,
  });
  return NextResponse.redirect(session.url!, 303);
}
