import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe";
import { getSubscription } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { stripeCustomerId } = await getSubscription(supabase, user.id);
    if (!stripeCustomerId) return NextResponse.json({ error: "No billing account found" }, { status: 400 });

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const url = await createPortalSession(stripeCustomerId, `${origin}/dashboard`);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Portal error:", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
