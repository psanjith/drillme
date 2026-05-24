
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QUESTIONS } from "@/data/questions";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("questions").upsert(
      QUESTIONS.map((q) => ({
        text: q.text,
        type: q.type,
        topic: q.topic,
        difficulty: q.difficulty,
        companies: q.companies,
        frequency: q.frequency,
        source: q.source,
        optimal_framework: q.optimal_framework,
        follow_up_questions: q.follow_up_questions,
      })),
      { onConflict: "text" }
    );

    if (error) throw error;

    return NextResponse.json({ seeded: QUESTIONS.length });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
