
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("speaking_profile")
      .select("*")
      .eq("user_id", user.id);

    return NextResponse.json({ profile: profile || [] });
  } catch (err) {
    console.error("Speaking profile error:", err);
    return NextResponse.json({ error: "Failed to fetch speaking profile" }, { status: 500 });
  }
}
