import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { InterviewType } from "@/types";

const INTERVIEW_TYPES: InterviewType[] = ["technical", "behavioural", "mixed"];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, company, role_level, interview_type, overall_score, completed_at, duration_minutes")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ targets: [] });
    }

    // Group by company + role_level
    const map = new Map<string, typeof sessions>();
    for (const s of sessions) {
      const key = `${s.company || "General Practice"}__${s.role_level}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }

    const targets = Array.from(map.entries()).map(([key, group]) => {
      const [company, roleLevel] = key.split("__");
      const lastPracticed = group[0]?.completed_at ?? null;
      const totalSessions = group.length;
      const allScores = group.map((s) => s.overall_score).filter((n): n is number => n !== null);
      const overallScore = allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : null;

      const byType = INTERVIEW_TYPES.map((type) => {
        const typeSessions = group.filter((s) => s.interview_type === type);
        const typeScores = typeSessions.map((s) => s.overall_score).filter((n): n is number => n !== null);
        return {
          type,
          sessionCount: typeSessions.length,
          avgScore: typeScores.length > 0
            ? Math.round(typeScores.reduce((a, b) => a + b, 0) / typeScores.length)
            : null,
          lastPracticed: typeSessions[0]?.completed_at ?? null,
        };
      });

      const coveredTypes = byType.filter((t) => t.sessionCount > 0).length;
      const readiness = overallScore !== null
        ? Math.round(overallScore * (coveredTypes / INTERVIEW_TYPES.length))
        : 0;

      return {
        company,
        roleLevel,
        totalSessions,
        overallScore,
        readiness,
        lastPracticed,
        byType,
      };
    });

    // Sort by most recently practiced
    targets.sort((a, b) =>
      (b.lastPracticed ?? "").localeCompare(a.lastPracticed ?? "")
    );

    return NextResponse.json({ targets });
  } catch (err) {
    console.error("Job targets error:", err);
    return NextResponse.json({ error: "Failed to fetch job targets" }, { status: 500 });
  }
}
