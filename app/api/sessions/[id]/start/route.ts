
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNextQuestion } from "@/lib/gemini/prompts";
import { AIUnavailableError } from "@/lib/gemini/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await supabase
      .from("sessions")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", id);

    const { data: weaknessProfile } = await supabase
      .from("weakness_profile")
      .select("*")
      .eq("user_id", user.id)
      .order("severity", { ascending: false })
      .limit(10);

    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .in("type", session.interview_type === "technical" ? ["technical", "system_design"] : session.interview_type === "behavioural" ? ["behavioural"] : ["technical", "behavioural", "system_design"])
      .limit(30);

    const panellists = session.panel_config?.panellists || ["hiring_manager", "senior_engineer", "peer_engineer"];
    const panellist = panellists[0];

    const nextQ = await generateNextQuestion({
      sessionContext: {
        company: session.company,
        role_level: session.role_level,
        interview_type: session.interview_type,
        questions_asked: [],
      },
      weaknessProfile: weaknessProfile || [],
      panellist,
      availableQuestions: questions || [],
    });

    const { data: sessionQuestion, error: sqError } = await supabase
      .from("session_questions")
      .insert({
        session_id: id,
        question_bank_id: nextQ.question_bank_id,
        question_text: nextQ.question_text,
        source: nextQ.source,
        panellist_persona: panellist,
        question_type: nextQ.question_type,
        topic: nextQ.topic,
        order_index: 0,
        help_requested: false,
      })
      .select()
      .single();

    if (sqError) throw sqError;

    return NextResponse.json({ session, question: sessionQuestion });
  } catch (err) {
    if (err instanceof AIUnavailableError)
      return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Start session error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
