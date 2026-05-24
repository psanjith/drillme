
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: sessions } = await supabase
      .from("speaking_sessions")
      .select("*")
      .eq("user_id", user.id)
      .not("transcript", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ sessions: sessions || [] });
  } catch (err) {
    console.error("Speaking history error:", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
