
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDrillRecommendations } from "@/lib/gemini/prompts";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("weakness_profile")
      .select("*")
      .eq("user_id", user.id)
      .gt("severity", 0) // hide fully-resolved weaknesses
      .order("severity", { ascending: false });

    // AI recommendations are non-essential — never let an AI hiccup blank the page.
    let recommendations: string[] = [];
    try {
      recommendations = await generateDrillRecommendations(profile || []);
    } catch (err) {
      console.error("Drill recommendations unavailable (non-fatal):", err);
    }

    return NextResponse.json({ profile: profile || [], recommendations });
  } catch (err) {
    console.error("Weakness profile error:", err);
    return NextResponse.json({ error: "Failed to fetch weakness profile" }, { status: 500 });
  }
}
