
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSpeakingCoachIntro } from "@/lib/gemini/prompts";

const SPEAKING_PROMPTS = {
  prompted_talk: [
    "Explain how the internet works to a non-technical friend",
    "Describe your ideal work environment",
    "What's the most important lesson you've learned in your career?",
    "Explain the concept of machine learning using an analogy",
    "What would you change about how software is built today?",
  ],
  technical_explainer: [
    "Explain recursion to a 10-year-old",
    "What is a database and why do we need one?",
    "Explain how HTTPS keeps data secure",
    "What is an API and how does it work?",
    "Explain the difference between a frontend and backend",
  ],
  filler_word_bootcamp: [
    "Tell me about a recent project you worked on",
    "What are your hobbies outside of work?",
    "Describe your morning routine",
    "What's a skill you want to develop this year?",
    "Explain your favorite movie to someone who hasn't seen it",
  ],
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { session_type, prompt_text, presentation_notes } = body;

    let resolvedPrompt = prompt_text || null;

    if (!resolvedPrompt && session_type !== "free_talk" && session_type !== "presentation_practice") {
      const prompts = SPEAKING_PROMPTS[session_type as keyof typeof SPEAKING_PROMPTS] || SPEAKING_PROMPTS.prompted_talk;
      resolvedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    }

    if (session_type === "presentation_practice" && presentation_notes) {
      resolvedPrompt = presentation_notes;
    }

    const intro = await generateSpeakingCoachIntro({
      sessionType: session_type,
      promptText: resolvedPrompt,
    });

    const { data: session } = await supabase
      .from("speaking_sessions")
      .insert({
        user_id: user.id,
        session_type,
        prompt_text: resolvedPrompt,
      })
      .select()
      .single();

    return NextResponse.json({ session, intro });
  } catch (err) {
    console.error("Speaking start error:", err);
    return NextResponse.json({ error: "Failed to start speaking session" }, { status: 500 });
  }
}
