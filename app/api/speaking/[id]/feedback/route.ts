
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withinRateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await withinRateLimit(supabase, user.id, "ai", 20, 60))) {
      return NextResponse.json({ error: "Too many requests — please slow down and try again in a moment." }, { status: 429 });
    }

    const { data: session } = await supabase
      .from("speaking_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    return NextResponse.json({ session });
  } catch (err) {
    console.error("Speaking feedback error:", err);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}
