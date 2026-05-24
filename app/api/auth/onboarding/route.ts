
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, experience_level, target_companies, weekly_goal } = body;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name: name || user.user_metadata?.name || "User",
        experience_level: experience_level || "mid",
        target_companies: target_companies || [],
        weekly_goal: weekly_goal || 3,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Onboarding error:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
