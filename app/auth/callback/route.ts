import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if this user has a profile (i.e. has completed onboarding)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      // New Google OAuth user — send to onboarding
      if (!profile) {
        // Create a minimal profile so middleware doesn't block them
        await supabase.from("profiles").insert({
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User",
          experience_level: "mid",
          target_companies: [],
          weekly_goal: 3,
        });
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
