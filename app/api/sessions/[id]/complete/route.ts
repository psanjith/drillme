
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDebrief, updateWeaknessProfile } from "@/lib/gemini/prompts";

export async function POST(
  request: Request,
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

    const { data: sessionQuestions } = await supabase
      .from("session_questions")
      .select("*")
      .eq("session_id", id)
      .order("order_index");

    const answeredQuestions = (sessionQuestions || []).filter(
      (q) => q.user_answer_transcript
    );

    // Compute score deterministically from per-question scores (1-5 per dimension → 0-100).
    // Each question has 4 dimensions max 5 each = 20 max per question.
    const scoredQuestions = answeredQuestions.filter((q) => q.scores);
    const overallScore = scoredQuestions.length > 0
      ? Math.round(
          scoredQuestions.reduce((sum, q) => {
            const s = q.scores;
            return sum + s.technical_accuracy + s.communication_clarity +
              s.structured_thinking + s.completeness;
          }, 0) / (scoredQuestions.length * 20) * 100
        )
      : 0;

    const [debriefResult, previousSession] = await Promise.all([
      generateDebrief({
        sessionQuestions: answeredQuestions,
        roleLevel: session.role_level,
        company: session.company,
      }),
      supabase
        .from("sessions")
        .select("overall_score")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single()
        .then((r) => r.data),
    ]);

    const readinessDelta = previousSession?.overall_score != null
      ? overallScore - previousSession.overall_score
      : 0;

    await supabase
      .from("sessions")
      .update({
        status: "completed",
        overall_score: overallScore,
        readiness_delta: readinessDelta,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    const debrief = debriefResult;

    const allWeaknessTags = answeredQuestions.flatMap((q) => {
      const tags = q.feedback?.weakness_tags || [];
      return tags;
    });

    if (allWeaknessTags.length > 0) {
      const { data: currentProfile } = await supabase
        .from("weakness_profile")
        .select("*")
        .eq("user_id", user.id);

      const updates = await updateWeaknessProfile({
        currentProfile: currentProfile || [],
        sessionFindings: allWeaknessTags,
        userId: user.id,
      });

      for (const update of updates) {
        const existing = (currentProfile || []).find((w) => w.tag === update.tag);
        if (existing) {
          const newSeverity = Math.max(0, Math.min(10, existing.severity + update.severity_delta));
          const trend =
            update.severity_delta > 0 ? "worsening" : update.severity_delta < 0 ? "improving" : "stable";
          await supabase
            .from("weakness_profile")
            .update({
              severity: newSeverity,
              occurrence_count: existing.occurrence_count + (update.severity_delta > 0 ? 1 : 0),
              last_seen_at: new Date().toISOString(),
              trend,
            })
            .eq("id", existing.id);
        } else if (update.is_new) {
          await supabase.from("weakness_profile").insert({
            user_id: user.id,
            tag: update.tag,
            category: update.category,
            severity: 3,
            occurrence_count: 1,
            last_seen_at: new Date().toISOString(),
            trend: "stable",
          });
        }
      }
    }

    return NextResponse.json({ debrief, session_id: id });
  } catch (err) {
    console.error("Complete session error:", err);
    return NextResponse.json({ error: "Failed to complete session" }, { status: 500 });
  }
}
