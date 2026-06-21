
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateWeaknessProfile, generateDebrief } from "@/lib/gemini/prompts";

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

    // Readiness score is computed deterministically from per-question scores
    // (4 dimensions, 1-5 each → 20 max per question → 0-100). No AI needed, so
    // it can never be lost to an AI outage. Guard every value against NaN.
    const dimSum = (s: Record<string, unknown> | null | undefined) =>
      (Number(s?.technical_accuracy) || 0) +
      (Number(s?.communication_clarity) || 0) +
      (Number(s?.structured_thinking) || 0) +
      (Number(s?.completeness) || 0);

    const scoredQuestions = answeredQuestions.filter((q) => q.scores);
    const overallScore = scoredQuestions.length > 0
      ? Math.max(0, Math.min(100, Math.round(
          scoredQuestions.reduce((sum, q) => sum + dimSum(q.scores), 0) /
          (scoredQuestions.length * 20) * 100
        )))
      : 0;

    const { data: previousSession } = await supabase
      .from("sessions")
      .select("overall_score")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    const readinessDelta = previousSession?.overall_score != null
      ? overallScore - previousSession.overall_score
      : 0;

    // Persist completion + score FIRST so a later AI failure can never block
    // the user from finishing or lose their readiness score.
    await supabase
      .from("sessions")
      .update({
        status: "completed",
        overall_score: overallScore,
        readiness_delta: readinessDelta,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Update the weakness profile. This uses an AI call, so it's best-effort —
    // if it fails, the interview still completes with a valid score.
    try {
      const allWeaknessTags = answeredQuestions.flatMap(
        (q) => q.feedback?.weakness_tags || []
      );

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

        // Normalize tags for matching so casing/punctuation/spacing variants
        // ("Dynamic-Programming", "dynamic programming") merge into one entry.
        const normalize = (t: string) =>
          (t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

        // Look up existing weaknesses by their normalized tag.
        type WRow = { id: string; tag: string; severity: number; occurrence_count: number };
        const byNorm = new Map<string, WRow>();
        for (const w of (currentProfile || []) as WRow[]) byNorm.set(normalize(w.tag), w);

        const seen = new Set<string>();
        for (const update of updates) {
          const key = normalize(update.tag);
          if (!key || seen.has(key)) continue; // skip blanks + duplicates within this batch
          seen.add(key);

          const existing = byNorm.get(key);
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
              tag: update.tag.trim(),
              category: update.category,
              severity: 3,
              occurrence_count: 1,
              last_seen_at: new Date().toISOString(),
              trend: "stable",
            });
          }
        }
      }
    } catch (err) {
      console.error("Weakness profile update failed (non-fatal):", err);
    }

    // Generate a session-level written summary (strengths / focus / next steps).
    // Best-effort and stored separately so a missing `debrief` column or an AI
    // outage can never break completion.
    try {
      const summary = await generateDebrief({
        sessionQuestions: answeredQuestions,
        roleLevel: session.role_level,
        company: session.company,
      });
      await supabase
        .from("sessions")
        .update({
          debrief: {
            top_strengths: summary.top_strengths ?? [],
            top_weaknesses: summary.top_weaknesses ?? [],
            readiness_summary: summary.readiness_summary ?? "",
            next_steps: summary.next_steps ?? [],
          },
        })
        .eq("id", id);
    } catch (err) {
      console.error("Debrief summary generation failed (non-fatal):", err);
    }

    return NextResponse.json({ session_id: id, overall_score: overallScore });
  } catch (err) {
    console.error("Complete session error:", err);
    return NextResponse.json({ error: "Failed to complete session" }, { status: 500 });
  }
}
