
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNextQuestion } from "@/lib/gemini/prompts";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: weaknessProfile } = await supabase
      .from("weakness_profile")
      .select("*")
      .eq("user_id", user.id)
      .order("severity", { ascending: false })
      .limit(5);

    const topWeaknesses = weaknessProfile || [];

    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .limit(50);

    const { data: drillSession } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        job_description: null,
        company: null,
        role_level: profile?.experience_level || "mid",
        interview_type: "mixed",
        panel_config: { panellists: ["senior_engineer"] },
        duration_minutes: 15,
        status: "active",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!drillSession) throw new Error("Failed to create drill session");

    const drillQuestions = [];
    for (let i = 0; i < Math.min(5, topWeaknesses.length || 3); i++) {
      const nextQ = await generateNextQuestion({
        sessionContext: {
          company: null,
          role_level: profile?.experience_level || "mid",
          interview_type: "mixed",
          questions_asked: drillQuestions.map((q: { question_text: string }) => q.question_text),
        },
        weaknessProfile: topWeaknesses,
        panellist: "senior_engineer",
        availableQuestions: questions || [],
      });

      const { data: sq } = await supabase
        .from("session_questions")
        .insert({
          session_id: drillSession.id,
          question_bank_id: nextQ.question_bank_id,
          question_text: nextQ.question_text,
          source: nextQ.source,
          panellist_persona: "senior_engineer",
          question_type: nextQ.question_type,
          topic: nextQ.topic,
          order_index: i,
          help_requested: false,
        })
        .select()
        .single();

      if (sq) drillQuestions.push(sq);
    }

    return NextResponse.json({
      session: drillSession,
      questions: drillQuestions,
      target_weaknesses: topWeaknesses.slice(0, 3).map((w) => w.tag),
    });
  } catch (err) {
    console.error("Drill start error:", err);
    return NextResponse.json({ error: "Failed to start drill" }, { status: 500 });
  }
}
