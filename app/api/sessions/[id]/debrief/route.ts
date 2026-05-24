
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/subscription";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const [{ data: questions }, { isPro }] = await Promise.all([
      supabase
        .from("session_questions")
        .select("*")
        .eq("session_id", id)
        .order("order_index"),
      getSubscription(supabase, user.id),
    ]);

    return NextResponse.json({ session, questions: questions || [], isPro });
  } catch (err) {
    console.error("Debrief fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch debrief" }, { status: 500 });
  }
}
