import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, getMonthlySessionCount, FREE_SESSION_LIMIT } from "@/lib/subscription";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [{ isPro, status, periodEnd }, sessionsThisMonth] = await Promise.all([
      getSubscription(supabase, user.id),
      getMonthlySessionCount(supabase, user.id),
    ]);

    return NextResponse.json({
      isPro,
      status,
      periodEnd,
      sessionsThisMonth,
      sessionLimit: FREE_SESSION_LIMIT,
    });
  } catch (err) {
    console.error("Billing status error:", err);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
