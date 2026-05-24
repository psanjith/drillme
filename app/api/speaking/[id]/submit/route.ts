
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateSpeakingSession } from "@/lib/gemini/prompts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { transcript, duration_seconds } = body;

    const { data: speakingSession } = await supabase
      .from("speaking_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!speakingSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const evaluation = await evaluateSpeakingSession({
      transcript,
      sessionType: speakingSession.session_type,
      promptText: speakingSession.prompt_text,
      durationSeconds: duration_seconds,
    });

    await supabase
      .from("speaking_sessions")
      .update({
        transcript,
        duration_seconds,
        scores: evaluation.scores,
        filler_word_count: evaluation.filler_word_count,
        filler_words_detected: evaluation.filler_words_detected,
        confidence_flags: evaluation.confidence_flags,
        feedback: evaluation.feedback,
      })
      .eq("id", id);

    await updateSpeakingProfile(supabase, user.id, evaluation.scores);

    return NextResponse.json({ evaluation });
  } catch (err) {
    console.error("Speaking submit error:", err);
    return NextResponse.json({ error: "Failed to submit speaking session" }, { status: 500 });
  }
}

async function updateSpeakingProfile(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  scores: { clarity: number; structure: number }
) {
  const metrics = [
    { metric: "clarity", score: scores.clarity },
    { metric: "structure", score: scores.structure },
  ];

  for (const { metric, score } of metrics) {
    const { data: existing } = await supabase
      .from("speaking_profile")
      .select("*")
      .eq("user_id", userId)
      .eq("metric", metric)
      .single();

    if (existing) {
      const newScore = (existing.current_score * existing.session_count + score) / (existing.session_count + 1);
      const trend = score > existing.current_score ? "improving" : score < existing.current_score ? "worsening" : "stable";
      await supabase
        .from("speaking_profile")
        .update({
          current_score: Math.round(newScore * 100) / 100,
          trend,
          session_count: existing.session_count + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("speaking_profile").insert({
        user_id: userId,
        metric,
        current_score: score,
        trend: "stable",
        session_count: 1,
        last_seen_at: new Date().toISOString(),
      });
    }
  }
}
