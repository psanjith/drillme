
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
      .order("severity", { ascending: false });

    const recommendations = await generateDrillRecommendations(profile || []);

    return NextResponse.json({ profile: profile || [], recommendations });
  } catch (err) {
    console.error("Weakness profile error:", err);
    return NextResponse.json({ error: "Failed to fetch weakness profile" }, { status: 500 });
  }
}
