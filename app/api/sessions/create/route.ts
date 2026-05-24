
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractJobDescriptionInfo } from "@/lib/gemini/prompts";
import { getSubscription, getMonthlySessionCount, FREE_SESSION_LIMIT } from "@/lib/subscription";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [{ isPro }, sessionsThisMonth] = await Promise.all([
      getSubscription(supabase, user.id),
      getMonthlySessionCount(supabase, user.id),
    ]);

    if (!isPro && sessionsThisMonth >= FREE_SESSION_LIMIT) {
      return NextResponse.json(
        { error: "free_limit_reached", sessionsThisMonth, limit: FREE_SESSION_LIMIT },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      job_description,
      company,
      role_level,
      interview_type,
      panel_config,
      duration_minutes,
    } = body;

    let resolvedCompany = company;
    let resolvedRoleLevel = role_level;

    if (job_description && job_description.trim().length > 50) {
      try {
        const extracted = await extractJobDescriptionInfo(job_description);
        resolvedCompany = resolvedCompany || extracted.company;
        resolvedRoleLevel = resolvedRoleLevel || extracted.seniority;
      } catch {
        // Use provided values if extraction fails
      }
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        job_description: job_description || null,
        company: resolvedCompany || null,
        role_level: resolvedRoleLevel || "mid",
        interview_type: interview_type || "mixed",
        panel_config: panel_config || { panellists: ["hiring_manager", "senior_engineer", "peer_engineer"] },
        duration_minutes: duration_minutes || 35,
        status: "setup",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session });
  } catch (err) {
    console.error("Create session error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
