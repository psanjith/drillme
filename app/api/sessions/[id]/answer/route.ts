
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withinRateLimit } from "@/lib/rate-limit";
import { evaluateAnswer, generateFollowUp, generateNextQuestion } from "@/lib/gemini/prompts";
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

    if (!(await withinRateLimit(supabase, user.id, "ai", 20, 60))) {
      return NextResponse.json({ error: "Too many requests — please slow down and try again in a moment." }, { status: 429 });
    }

    const body = await request.json();
    const { question_id, transcript } = body;

    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const { data: currentQuestion } = await supabase
      .from("session_questions")
      .select("*")
      .eq("id", question_id)
      .single();
    if (!currentQuestion) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    await supabase
      .from("session_questions")
      .update({ user_answer_transcript: transcript })
      .eq("id", question_id);

    const [evaluation, followUpResult] = await Promise.all([
      evaluateAnswer({
        question: currentQuestion.question_text,
        questionType: currentQuestion.question_type,
        topic: currentQuestion.topic,
        answer: transcript,
        roleLevel: session.role_level,
        panellist: currentQuestion.panellist_persona,
      }),
      generateFollowUp({
        question: currentQuestion.question_text,
        answer: transcript,
        panellist: currentQuestion.panellist_persona,
        roleLevel: session.role_level,
      }),
    ]);

    await supabase
      .from("session_questions")
      .update({
        scores: evaluation.scores,
        // Nest weakness_tags inside feedback so the complete route can read
        // them when building the weakness profile.
        feedback: { ...evaluation.feedback, weakness_tags: evaluation.weakness_tags ?? [] },
      })
      .eq("id", question_id);

    const { data: allQuestions } = await supabase
      .from("session_questions")
      .select("question_text, order_index")
      .eq("session_id", id)
      .order("order_index");

    const questionCount = allQuestions?.length || 0;
    const elapsedMinutes = session.started_at
      ? (Date.now() - new Date(session.started_at).getTime()) / 60000
      : 0;
    const sessionOver = elapsedMinutes >= session.duration_minutes;

    let nextQuestion = null;
    let followUpQuestion = null;

    if (followUpResult.should_follow_up && followUpResult.follow_up_question) {
      const { data: fq } = await supabase
        .from("session_questions")
        .insert({
          session_id: id,
          question_bank_id: null,
          question_text: followUpResult.follow_up_question,
          source: "ai_generated",
          panellist_persona: currentQuestion.panellist_persona,
          question_type: currentQuestion.question_type,
          topic: currentQuestion.topic,
          order_index: questionCount,
          help_requested: false,
        })
        .select()
        .single();
      followUpQuestion = fq;
    } else if (!sessionOver) {
      const { data: weaknessProfile } = await supabase
        .from("weakness_profile")
        .select("*")
        .eq("user_id", user.id)
        .order("severity", { ascending: false })
        .limit(10);

      const typeFilter =
        session.interview_type === "technical"
          ? ["technical", "system_design"]
          : session.interview_type === "behavioural"
          ? ["behavioural"]
          : ["technical", "behavioural", "system_design"];

      const { data: questions } = await supabase
        .from("questions")
        .select("*")
        .in("type", typeFilter)
        .limit(30);

      const panellists = session.panel_config?.panellists || ["hiring_manager", "senior_engineer", "peer_engineer"];
      const nextPanellistIndex = questionCount % panellists.length;
      const nextPanellist = panellists[nextPanellistIndex];

      const nextQ = await generateNextQuestion({
        sessionContext: {
          company: session.company,
          role_level: session.role_level,
          interview_type: session.interview_type,
          questions_asked: allQuestions?.map((q) => q.question_text) || [],
        },
        weaknessProfile: weaknessProfile || [],
        panellist: nextPanellist,
        availableQuestions: questions || [],
      });

      const { data: nq } = await supabase
        .from("session_questions")
        .insert({
          session_id: id,
          question_bank_id: nextQ.question_bank_id,
          question_text: nextQ.question_text,
          source: nextQ.source,
          panellist_persona: nextPanellist,
          question_type: nextQ.question_type,
          topic: nextQ.topic,
          order_index: questionCount,
          help_requested: false,
        })
        .select()
        .single();
      nextQuestion = nq;
    }

    return NextResponse.json({
      evaluation,
      followUpQuestion,
      nextQuestion,
      sessionOver,
    });
  } catch (err) {
    if (err instanceof AIUnavailableError)
      return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Answer error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
