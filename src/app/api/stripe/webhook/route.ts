import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

// Stripe tells us when a membership starts, renews, lapses or is cancelled.
export async function POST(request: Request) {
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, request.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type.startsWith("customer.subscription.")) {
    const sub = event.data.object as Stripe.Subscription;
    const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
    const admin = createAdminClient();
    const update = {
      status,
      stripe_subscription_id: sub.id,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data } = await admin.from("memberships").update(update).eq("stripe_customer_id", customer).select("user_id");
    // Fall back to the user id we attached at checkout if the customer link wasn't saved.
    if (!data?.length && sub.metadata?.user_id)
      await admin.from("memberships").upsert({ user_id: sub.metadata.user_id, stripe_customer_id: customer, ...update });
  }
  return NextResponse.json({ received: true });
}
