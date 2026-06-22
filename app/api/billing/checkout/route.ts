import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCustomer, createCheckoutSession } from "@/lib/stripe";
import { getSubscription } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { isPro, stripeCustomerId } = await getSubscription(supabase, user.id);
    if (isPro) return NextResponse.json({ error: "Already subscribed" }, { status: 400 });

    const { plan } = await request.json().catch(() => ({ plan: "monthly" }));
    // biweekly = $14 every 2 weeks, monthly = $25/month.
    // Fall back to the previous env var names so checkout keeps working until
    // the new STRIPE_PRICE_ID_BIWEEKLY / STRIPE_PRICE_ID_MONTHLY are set.
    const priceId = plan === "biweekly"
      ? (process.env.STRIPE_PRICE_ID_BIWEEKLY || process.env.STRIPE_PRICE_ID_ANNUAL!)
      : (process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID!);

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const customerId = await getOrCreateCustomer(user.email!, user.id, stripeCustomerId);

    if (!stripeCustomerId) {
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const url = await createCheckoutSession(
      customerId,
      `${origin}/dashboard?upgraded=1`,
      `${origin}/upgrade`,
      priceId
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
