
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withinRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
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

    const body = await request.json();
    const { question_id } = body;

    await supabase
      .from("session_questions")
      .update({ help_requested: true })
      .eq("id", question_id)
      .eq("session_id", id);

    const { data: question } = await supabase
      .from("session_questions")
      .select("*, questions(optimal_framework)")
      .eq("id", question_id)
      .single();

    const bankQuestion = question?.question_bank_id
      ? await supabase
          .from("questions")
          .select("optimal_framework")
          .eq("id", question.question_bank_id)
          .single()
      : null;

    const framework = bankQuestion?.data?.optimal_framework || {
      keyPoints: ["Structure your answer clearly", "Use specific examples", "Quantify impact where possible"],
      structure: "STAR",
      sampleAnswer: "A strong answer would open by clarifying the context, describe a specific situation with measurable details, walk through the approach and decisions made, and close with concrete outcomes and learnings.",
      commonMistakes: ["Being too vague", "Forgetting to mention outcomes", "Not showing self-awareness"],
    };

    return NextResponse.json({ framework });
  } catch (err) {
    console.error("Help error:", err);
    return NextResponse.json({ error: "Failed to fetch help" }, { status: 500 });
  }
}
