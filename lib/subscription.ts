import type { SupabaseClient } from "@supabase/supabase-js";

export async function getSubscription(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_period_end, stripe_customer_id")
    .eq("id", userId)
    .single();

  if (!data) return { isPro: false, stripeCustomerId: null };

  const isPro =
    data.subscription_status === "pro" &&
    (!data.subscription_period_end ||
      new Date(data.subscription_period_end) > new Date());

  return {
    isPro,
    status: data.subscription_status as string,
    stripeCustomerId: data.stripe_customer_id as string | null,
    periodEnd: data.subscription_period_end as string | null,
  };
}

export async function getMonthlySessionCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("created_at", startOfMonth.toISOString());

  return count ?? 0;
}

export const FREE_SESSION_LIMIT = 3;
