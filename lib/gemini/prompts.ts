import { generateJson } from "./client";
import type {
  Question,
  QuestionScores,
  QuestionFeedback,
  WeaknessProfile,
  SpeakingScores,
  PanellistPersona,
  ExperienceLevel,
  InterviewType,
  SessionQuestion,
} from "@/types";

const SCORING_RUBRIC = `
Scoring rubric (1-5 for each dimension):
1 = Very poor / missing
2 = Below expectations
3 = Meets basic expectations
4 = Above expectations
5 = Exceptional / would impress top-tier interviewers

Technical Accuracy: Is the answer technically correct? Does it demonstrate real knowledge?
Communication Clarity: Is the answer easy to follow? Well-articulated?
Structured Thinking: Does the answer have clear structure (e.g. STAR, problem → approach → solution)?
Completeness: Does it cover all important aspects of the question?
`;

const PANELLIST_PERSONAS = {
  hiring_manager: `You are a Hiring Manager conducting a technical interview.
You care most about: business impact, cross-team communication, culture fit, leadership potential, and how candidates handle ambiguity.
You ask follow-up questions about real-world consequences and how decisions affected teams or products.
Your tone is warm but evaluative. You push back when answers feel rehearsed.`,

  senior_engineer: `You are a Senior Engineer conducting a technical interview.
You care most about: technical depth, architectural thinking, code quality, scalability, and engineering trade-offs.
You ask follow-up questions that dig into implementation details, edge cases, and "what would you do differently".
Your tone is direct and technically rigorous. You expect candidates to know specifics, not just concepts.`,

  peer_engineer: `You are a Peer Engineer conducting a technical interview.
You care most about: collaborative problem-solving, intellectual curiosity, openness to feedback, and how candidates think through problems with others.
You ask follow-up questions about how candidates arrived at decisions and how they'd approach uncertainty.
Your tone is collegial and curious. You're genuinely interested in the candidate's thought process.`,
};

export async function extractJobDescriptionInfo(jd: string): Promise<{
  company: string;
  role: string;
  seniority: ExperienceLevel;
  technical_requirements: string[];
  soft_skills: string[];
}> {
  const prompt = `Extract structured information from this job description.

Job Description:
${jd}

Return a JSON object with exactly these fields:
{
  "company": "company name or 'Unknown'",
  "role": "role title",
  "seniority": "junior" | "mid" | "senior" | "staff",
  "technical_requirements": ["req1", "req2", ...],
  "soft_skills": ["skill1", "skill2", ...]
}`;

  return generateJson(prompt);
}

export async function generateNextQuestion(params: {
  sessionContext: {
    company: string | null;
    role_level: ExperienceLevel;
    interview_type: InterviewType;
    jd_summary?: string;
    questions_asked: string[];
  };
  weaknessProfile: WeaknessProfile[];
  panellist: PanellistPersona;
  availableQuestions: Question[];
}): Promise<{
  question_text: string;
  question_type: "technical" | "behavioural" | "system_design";
  topic: string;
  source: "bank" | "ai_generated";
  question_bank_id: string | null;
  rationale: string;
}> {
  const { sessionContext, weaknessProfile, panellist, availableQuestions } = params;

  const weaknessSummary = weaknessProfile.length > 0
    ? weaknessProfile
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 5)
        .map((w) => `${w.tag} (severity: ${w.severity}, category: ${w.category})`)
        .join(", ")
    : "No known weaknesses yet";

  const bankSample = availableQuestions.slice(0, 20).map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    topic: q.topic,
    difficulty: q.difficulty,
  }));

  const prompt = `${PANELLIST_PERSONAS[panellist]}

You are selecting the next interview question for a candidate.

Session context:
- Company: ${sessionContext.company || "General"}
- Role level: ${sessionContext.role_level}
- Interview type: ${sessionContext.interview_type}
- JD summary: ${sessionContext.jd_summary || "Not provided"}
- Questions already asked: ${sessionContext.questions_asked.join("; ") || "None yet"}

Candidate weakness profile (prioritise probing these areas):
${weaknessSummary}

Available questions from question bank (you may select one or generate a new one):
${JSON.stringify(bankSample, null, 2)}

Select the most appropriate next question. If selecting from the bank, use that question's text verbatim. If generating, create a targeted question.

Return JSON:
{
  "question_text": "the full question text",
  "question_type": "technical" | "behavioural" | "system_design",
  "topic": "specific topic e.g. Dynamic Programming, Conflict Resolution",
  "source": "bank" | "ai_generated",
  "question_bank_id": "id if from bank, null if generated",
  "rationale": "brief reason for selecting this question"
}`;

  return generateJson(prompt);
}

export async function evaluateAnswer(params: {
  question: string;
  questionType: string;
  topic: string;
  answer: string;
  roleLevel: ExperienceLevel;
  panellist: PanellistPersona;
}): Promise<{
  scores: QuestionScores;
  feedback: QuestionFeedback;
  weakness_tags: { tag: string; category: string }[];
}> {
  const { question, questionType, topic, answer, roleLevel, panellist } = params;

  const prompt = `You are evaluating a candidate's interview answer at ${roleLevel} level.

${SCORING_RUBRIC}

Question: "${question}"
Question type: ${questionType}
Topic: ${topic}
Panellist: ${panellist.replace("_", " ")}

Candidate's answer:
"${answer}"

Evaluate rigorously. A ${roleLevel}-level candidate is expected to demonstrate ${
    roleLevel === "junior"
      ? "foundational understanding and eagerness to learn"
      : roleLevel === "mid"
      ? "practical experience and ability to own work independently"
      : roleLevel === "senior"
      ? "deep expertise, system-level thinking, and mentoring ability"
      : "architectural vision, org-wide impact, and technical leadership"
  }.

Return JSON:
{
  "scores": {
    "technical_accuracy": 1-5,
    "communication_clarity": 1-5,
    "structured_thinking": 1-5,
    "completeness": 1-5
  },
  "feedback": {
    "strengths": ["specific strength 1", "specific strength 2"],
    "gaps": ["specific gap 1", "specific gap 2"],
    "top_answer_additions": "what a top-tier answer would add",
    "optimal_framework_summary": "ideal framework/structure for this question"
  },
  "weakness_tags": [
    {"tag": "specific weakness e.g. Dynamic Programming", "category": "technical" | "behavioural" | "communication" | "process"}
  ]
}`;

  return generateJson(prompt);
}

export async function generateFollowUp(params: {
  question: string;
  answer: string;
  panellist: PanellistPersona;
  roleLevel: ExperienceLevel;
}): Promise<{
  should_follow_up: boolean;
  follow_up_question: string | null;
  rationale: string;
}> {
  const { question, answer, panellist, roleLevel } = params;

  const prompt = `${PANELLIST_PERSONAS[panellist]}

You just heard this answer to an interview question. Decide if a follow-up is warranted.

Original question: "${question}"
Candidate's answer: "${answer}"
Role level: ${roleLevel}

A follow-up is warranted if:
- The answer was vague and you want specifics
- The answer raised an interesting point worth exploring
- The answer missed a key aspect you care about given your persona
- The answer was good and you want to probe depth

Limit follow-ups to probing genuinely interesting aspects, not just restating the question.

Return JSON:
{
  "should_follow_up": true | false,
  "follow_up_question": "the follow-up question text, or null if no follow-up",
  "rationale": "brief reason"
}`;

  return generateJson(prompt);
}

export async function generateDebrief(params: {
  sessionQuestions: Array<{
    question_text: string;
    question_type: string;
    topic: string;
    user_answer_transcript: string;
    scores: QuestionScores | null;
    feedback: QuestionFeedback | null;
    panellist_persona: PanellistPersona;
    help_requested: boolean;
  }>;
  roleLevel: ExperienceLevel;
  company: string | null;
}): Promise<{
  overall_score: number;
  top_strengths: string[];
  top_weaknesses: string[];
  readiness_summary: string;
  next_steps: string[];
}> {
  const { sessionQuestions, roleLevel, company } = params;

  const prompt = `You are generating a comprehensive debrief after a ${roleLevel} interview${company ? ` at ${company}` : ""}.

Questions and answers:
${sessionQuestions
  .map(
    (q, i) => `
Q${i + 1} [${q.question_type} - ${q.topic}] by ${q.panellist_persona.replace("_", " ")}:
"${q.question_text}"
Answer: "${q.user_answer_transcript || "No answer provided"}"
Scores: ${q.scores ? JSON.stringify(q.scores) : "Not evaluated"}
Help requested: ${q.help_requested}
`
  )
  .join("\n")}

Generate an overall readiness score (0-100) and comprehensive debrief.

Return JSON:
{
  "overall_score": 0-100,
  "top_strengths": ["strength1", "strength2", "strength3"],
  "top_weaknesses": ["weakness1", "weakness2", "weakness3"],
  "readiness_summary": "2-3 sentence overall assessment",
  "next_steps": ["actionable next step 1", "actionable next step 2", "actionable next step 3"]
}`;

  return generateJson(prompt);
}

export async function updateWeaknessProfile(params: {
  currentProfile: WeaknessProfile[];
  sessionFindings: { tag: string; category: string }[];
  userId: string;
}): Promise<
  Array<{
    tag: string;
    category: string;
    severity_delta: number;
    is_new: boolean;
  }>
> {
  const { currentProfile, sessionFindings } = params;

  const prompt = `You are updating a candidate's weakness profile based on a new interview session.

Current weakness profile:
${JSON.stringify(currentProfile.map((w) => ({ tag: w.tag, category: w.category, severity: w.severity, occurrence_count: w.occurrence_count })), null, 2)}

New weaknesses detected in this session:
${JSON.stringify(sessionFindings, null, 2)}

For each weakness found:
- If it already exists in the profile: increase severity by 1-2 (max 10)
- If it's new: start at severity 3
- If a previously known weakness was NOT found in this session: decrease severity by 0.5

Return JSON array:
[
  {
    "tag": "weakness tag",
    "category": "technical" | "behavioural" | "communication" | "process",
    "severity_delta": number (positive to increase, negative to decrease),
    "is_new": true | false
  }
]`;

  return generateJson(prompt);
}

export async function generateDrillRecommendations(
  weaknessProfile: WeaknessProfile[]
): Promise<string[]> {
  if (weaknessProfile.length === 0) {
    return [
      "Complete your first interview to identify areas for improvement.",
      "Try a mixed interview to assess your overall readiness.",
      "Practice system design questions to build architectural thinking.",
    ];
  }

  const prompt = `Based on this candidate's weakness profile, generate 3 specific, actionable focus recommendations.

Weakness profile (sorted by severity):
${weaknessProfile
  .sort((a, b) => b.severity - a.severity)
  .slice(0, 10)
  .map((w) => `- ${w.tag} (${w.category}, severity: ${w.severity}, trend: ${w.trend})`)
  .join("\n")}

Return JSON array of exactly 3 recommendation strings. Be specific, not generic. Reference the actual weakness tags.
["recommendation 1", "recommendation 2", "recommendation 3"]`;

  return generateJson<string[]>(prompt);
}

export async function evaluateSpeakingSession(params: {
  transcript: string;
  sessionType: string;
  promptText: string | null;
  durationSeconds: number;
}): Promise<{
  scores: SpeakingScores;
  filler_word_count: number;
  filler_words_detected: Record<string, number>;
  confidence_flags: string[];
  feedback: string;
  highlighted_transcript: { text: string; type: "filler" | "strong" | "normal" }[];
}> {
  const { transcript, sessionType, promptText, durationSeconds } = params;

  const wordCount = transcript.split(/\s+/).length;
  const wpm = Math.round((wordCount / durationSeconds) * 60);

  const prompt = `You are Alex, a warm and encouraging speaking coach. Evaluate this ${sessionType} speaking session.

${promptText ? `Prompt given: "${promptText}"` : ""}
Duration: ${durationSeconds}s (${wpm} words per minute)

Transcript:
"${transcript}"

Filler words to detect: "um", "uh", "like", "so", "you know", "basically", "literally", "right", "kind of", "sort of", "I mean", "actually"

Evaluate the speaking session and provide coaching feedback.

Pacing guide: <120wpm = too slow, 120-180wpm = appropriate, >180wpm = too fast

Return JSON:
{
  "scores": {
    "clarity": 1-5,
    "structure": 1-5,
    "pacing": "too_fast" | "appropriate" | "too_slow",
    "vocabulary_range": "limited" | "moderate" | "strong"
  },
  "filler_word_count": total count,
  "filler_words_detected": {"um": count, "uh": count, ...only include words that appear},
  "confidence_flags": ["specific confidence-undermining pattern observed", ...],
  "feedback": "2-3 paragraph coaching feedback from Alex, warm and specific",
  "highlighted_transcript": [
    {"text": "word or phrase", "type": "filler" | "strong" | "normal"}
  ]
}`;

  return generateJson(prompt);
}

export async function generateSpeakingCoachIntro(params: {
  sessionType: string;
  promptText: string | null;
}): Promise<string> {
  const { sessionType, promptText } = params;

  const prompt = `You are Alex, an encouraging speaking coach. Generate a brief, warm introduction for a ${sessionType} speaking session.
${promptText ? `The topic/prompt is: "${promptText}"` : ""}

Keep it to 2-3 sentences. Be warm, clear, and motivating. Tell them what to do.
Return just the intro text as a plain string (not JSON).`;

  const { generateText } = await import("./client");
  return (await generateText(prompt)).trim();
}
