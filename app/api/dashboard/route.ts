
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDrillRecommendations } from "@/lib/gemini/prompts";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [sessionsResult, weaknessResult] = await Promise.all([
      supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(30),
      supabase
        .from("weakness_profile")
        .select("*")
        .eq("user_id", user.id)
        .order("severity", { ascending: false })
        .limit(10),
    ]);

    const sessions = sessionsResult.data || [];
    const weaknesses = weaknessResult.data || [];

    const latestScore = sessions[0]?.overall_score || 0;

    const readinessHistory = sessions
      .slice()
      .reverse()
      .filter((s) => s.overall_score != null)
      .map((s) => ({
        date: s.completed_at?.split("T")[0] || "",
        score: Math.round(s.overall_score),
      }));

    const totalMinutes = sessions.reduce((sum, s) => {
      if (s.started_at && s.completed_at) {
        const actual = Math.round(
          (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000
        );
        return sum + Math.min(actual, s.duration_minutes || 60);
      }
      return sum + (s.duration_minutes || 0);
    }, 0);

    const streak = calculateStreak(sessions);

    const recommendations = await generateDrillRecommendations(weaknesses);

    return NextResponse.json({
      readiness_score: latestScore,
      readiness_history: readinessHistory,
      sessions_completed: sessions.length,
      total_practice_minutes: totalMinutes,
      daily_streak: streak,
      top_weaknesses: weaknesses.slice(0, 5),
      focus_recommendations: recommendations,
      recent_sessions: sessions.slice(0, 5),
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}

function calculateStreak(sessions: Array<{ completed_at?: string | null }>) {
  if (sessions.length === 0) return 0;

  const dates = new Set(
    sessions
      .map((s) => s.completed_at?.split("T")[0])
      .filter(Boolean)
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    if (dates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}
