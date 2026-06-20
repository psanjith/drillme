
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDrillRecommendations } from "@/lib/gemini/prompts";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [sessionsResult, weaknessResult] = await Promise.all([
      // All completed sessions (bounded) so totals/streak are accurate, not capped at 30.
      supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1000),
      supabase
        .from("weakness_profile")
        .select("*")
        .eq("user_id", user.id)
        .order("severity", { ascending: false })
        .limit(10),
    ]);

    const sessions = sessionsResult.data || [];
    const weaknesses = weaknessResult.data || [];

    // Most recent session that actually has a score.
    const scored = sessions.filter((s) => s.overall_score != null);
    const latestScore = scored.length > 0 ? Math.round(scored[0].overall_score) : 0;

    // Chart: most recent 30 scored sessions, in chronological order.
    const readinessHistory = scored
      .slice(0, 30)
      .reverse()
      .map((s) => ({
        date: s.completed_at?.split("T")[0] || "",
        score: Math.round(s.overall_score),
      }));

    // Total practice time across ALL completed sessions.
    const totalMinutes = sessions.reduce((sum, s) => {
      if (s.started_at && s.completed_at) {
        const actual = Math.round(
          (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000
        );
        // Guard against clock skew (negative) and tab-left-open inflation (cap at planned duration).
        return sum + Math.max(0, Math.min(actual, s.duration_minutes || 60));
      }
      return sum + (s.duration_minutes || 0);
    }, 0);

    const streak = calculateStreak(sessions);

    // AI recommendations are non-essential — never let an AI hiccup blank the dashboard.
    let recommendations: string[] = [];
    try {
      recommendations = await generateDrillRecommendations(weaknesses);
    } catch (err) {
      console.error("Drill recommendations unavailable:", err);
    }

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
