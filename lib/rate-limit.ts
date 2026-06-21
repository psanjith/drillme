import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Lightweight per-user rate limiter backed by a Supabase `rate_limits` table.
 *
 * Fails OPEN: if the table doesn't exist yet, or any error occurs, the request
 * is allowed — so deploying this before running the migration never blocks
 * real users. Once the table exists, limits are enforced.
 *
 * Returns true if the request is within the limit (allowed), false if exceeded.
 */
export async function withinRateLimit(
  supabase: SupabaseClient,
  userId: string,
  bucket: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

    // Drop rows outside the current window for this user+bucket (keeps table small).
    await supabase
      .from("rate_limits")
      .delete()
      .eq("user_id", userId)
      .eq("bucket", bucket)
      .lt("created_at", windowStart);

    const { count, error } = await supabase
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("bucket", bucket);

    if (error) return true; // fail open (e.g. table missing)
    if ((count ?? 0) >= limit) return false;

    await supabase.from("rate_limits").insert({ user_id: userId, bucket });
    return true;
  } catch {
    return true; // fail open on any unexpected error
  }
}
