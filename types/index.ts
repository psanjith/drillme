export type ExperienceLevel = "junior" | "mid" | "senior" | "staff";
export type InterviewType = "technical" | "behavioural" | "mixed";
export type PanellistPersona = "hiring_manager" | "senior_engineer" | "peer_engineer";
export type QuestionType = "technical" | "behavioural" | "system_design";
export type QuestionDifficulty = "junior" | "mid" | "senior" | "staff";
export type QuestionSource = "glassdoor" | "leetcode" | "engineering_blog" | "ai_generated";
export type WeaknessCategory = "technical" | "behavioural" | "communication" | "process";
export type WeaknessTrend = "improving" | "stable" | "worsening";
export type SpeakingSessionType = "free_talk" | "prompted_talk" | "presentation_practice" | "technical_explainer" | "filler_word_bootcamp";
export type SessionStatus = "setup" | "active" | "completed" | "abandoned";

export interface Profile {
  id: string;
  name: string;
  experience_level: ExperienceLevel;
  target_companies: string[];
  weekly_goal: number;
  created_at: string;
  stripe_customer_id: string | null;
  subscription_status: "free" | "pro";
  subscription_period_end: string | null;
}

export interface OptimalFramework {
  keyPoints: string[];
  structure: "STAR" | "UMPIRE" | "custom";
  sampleAnswer: string;
  commonMistakes: string[];
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  topic: string;
  difficulty: QuestionDifficulty;
  companies: string[];
  frequency: number;
  source: QuestionSource;
  optimal_framework: OptimalFramework;
  follow_up_questions: string[];
}

export interface QuestionScores {
  technical_accuracy: number;
  communication_clarity: number;
  structured_thinking: number;
  completeness: number;
}

export interface QuestionFeedback {
  strengths: string[];
  gaps: string[];
  top_answer_additions: string;
  optimal_framework_summary: string;
}

export interface SessionQuestion {
  id: string;
  session_id: string;
  question_bank_id: string | null;
  question_text: string;
  source: string;
  panellist_persona: PanellistPersona;
  question_type: QuestionType;
  topic: string;
  order_index: number;
  user_answer_transcript: string | null;
  help_requested: boolean;
  scores: QuestionScores | null;
  feedback: QuestionFeedback | null;
  follow_ups: FollowUp[] | null;
}

export interface FollowUp {
  question: string;
  answer: string | null;
  panellist: PanellistPersona;
}

export interface PanelConfig {
  panellists: PanellistPersona[];
  voices?: Record<PanellistPersona, string>;
}

export interface Session {
  id: string;
  user_id: string;
  job_description: string | null;
  company: string | null;
  role_level: ExperienceLevel;
  interview_type: InterviewType;
  panel_config: PanelConfig;
  duration_minutes: number;
  status: SessionStatus;
  overall_score: number | null;
  readiness_delta: number | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface WeaknessProfile {
  id: string;
  user_id: string;
  tag: string;
  category: WeaknessCategory;
  severity: number;
  occurrence_count: number;
  last_seen_at: string;
  trend: WeaknessTrend;
}

export interface SpeakingSession {
  id: string;
  user_id: string;
  session_type: SpeakingSessionType;
  prompt_text: string | null;
  transcript: string | null;
  duration_seconds: number | null;
  scores: SpeakingScores | null;
  filler_word_count: number | null;
  filler_words_detected: Record<string, number> | null;
  confidence_flags: string[] | null;
  feedback: string | null;
  created_at: string;
}

export interface SpeakingScores {
  clarity: number;
  structure: number;
  pacing: "too_fast" | "appropriate" | "too_slow";
  vocabulary_range: "limited" | "moderate" | "strong";
}

export interface SpeakingProfile {
  id: string;
  user_id: string;
  metric: string;
  current_score: number;
  trend: WeaknessTrend;
  session_count: number;
  last_seen_at: string;
}

export interface DashboardData {
  readiness_score: number;
  readiness_history: { date: string; score: number }[];
  sessions_completed: number;
  total_practice_minutes: number;
  daily_streak: number;
  top_weaknesses: WeaknessProfile[];
  focus_recommendations: string[];
  recent_sessions: Session[];
}
