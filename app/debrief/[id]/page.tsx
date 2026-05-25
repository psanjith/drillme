"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PanellistAvatar } from "@/components/interview/PanellistAvatar";
import { ChevronDown, ChevronRight, Star, Lock } from "lucide-react";
import Link from "next/link";
import type { Session, SessionQuestion, PanellistPersona } from "@/types";

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 4 ? "bg-green-500" : score >= 3 ? "bg-blue-500" : score >= 2 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-foreground font-medium">{score}/5</span>
      </div>
      <div className="h-1.5 bg-[#2a3040] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(score / 5) * 100}%` }} />
      </div>
    </div>
  );
}

function QuestionAccordion({ question, index, isPro }: { question: SessionQuestion; index: number; isPro: boolean }) {
  const [open, setOpen] = useState(index === 0);
  const avgScore = question.scores
    ? Object.values(question.scores).reduce((a, b) => a + b, 0) / 4
    : null;

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-slate-500 text-sm font-mono w-5 flex-shrink-0">Q{index + 1}</span>
          <PanellistAvatar persona={question.panellist_persona as PanellistPersona} size="sm" />
          <p className="text-slate-200 text-sm truncate">{question.question_text}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          {avgScore !== null && (
            <div className="flex items-center gap-1">
              <Star size={12} className={avgScore >= 4 ? "text-green-400" : avgScore >= 3 ? "text-blue-400" : "text-amber-400"} fill="currentColor" />
              <span className="text-xs text-slate-300">{avgScore.toFixed(1)}</span>
            </div>
          )}
          {question.help_requested && <Badge variant="amber">Help used</Badge>}
          <Badge variant={question.source === "ai_generated" ? "amber" : "green"}>
            {question.source === "ai_generated" ? "AI" : "Verified"}
          </Badge>
          {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--card-border)] px-5 py-5 space-y-5 relative">
          {!isPro && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--card)]/80 backdrop-blur-sm rounded-b-xl">
              <Lock size={18} className="text-blue-400 mb-2" />
              <p className="text-foreground text-sm font-medium mb-1">Detailed feedback is a Pro feature</p>
              <Link href="/upgrade" className="text-blue-400 hover:text-blue-300 text-xs underline">Upgrade to unlock →</Link>
            </div>
          )}
          {question.user_answer_transcript && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Your answer</p>
              <p className="text-slate-300 text-sm leading-relaxed bg-[var(--background)] rounded-lg p-3">
                {question.user_answer_transcript}
              </p>
            </div>
          )}

          {question.scores && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Scores</p>
              <div className="grid grid-cols-2 gap-3">
                <ScoreBar label="Technical accuracy" score={question.scores.technical_accuracy} />
                <ScoreBar label="Communication" score={question.scores.communication_clarity} />
                <ScoreBar label="Structure" score={question.scores.structured_thinking} />
                <ScoreBar label="Completeness" score={question.scores.completeness} />
              </div>
            </div>
          )}

          {question.feedback && (
            <>
              {question.feedback.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Strengths</p>
                  <ul className="space-y-1.5">
                    {question.feedback.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-green-400 mt-0.5">+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {question.feedback.gaps?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Gaps</p>
                  <ul className="space-y-1.5">
                    {question.feedback.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-red-400 mt-0.5">−</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {question.feedback.top_answer_additions && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">What a top answer adds</p>
                  <p className="text-slate-300 text-sm leading-relaxed bg-[var(--background)] rounded-lg p-3">
                    {question.feedback.top_answer_additions}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DebriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sessions/${id}/debrief`)
      .then((r) => r.json())
      .then((data) => {
        setSession(data.session);
        setQuestions(data.questions || []);
        setIsPro(data.isPro ?? false);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const answeredQuestions = questions.filter((q) => q.user_answer_transcript);
  const avgScore = session?.overall_score || 0;
  const scoreColor = avgScore >= 75 ? "text-green-400" : avgScore >= 55 ? "text-blue-400" : "text-amber-400";

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Interview Debrief</h1>
            <p className="text-slate-400 text-sm">
              {session?.company || "Practice"} · {session?.role_level} · {session?.interview_type}
            </p>
          </div>
          <Link href="/interview/setup">
            <Button variant="secondary">New interview</Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 col-span-1">
            <p className="text-slate-400 text-xs mb-1">Readiness score</p>
            <p className={`text-4xl font-bold ${scoreColor}`}>{avgScore}</p>
            <p className="text-slate-500 text-xs mt-1">out of 100</p>
            {session?.readiness_delta !== null && session?.readiness_delta !== undefined && (
              <p className={`text-xs mt-2 ${session.readiness_delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                {session.readiness_delta >= 0 ? "+" : ""}{session.readiness_delta} vs last session
              </p>
            )}
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <p className="text-slate-400 text-xs mb-1">Questions answered</p>
            <p className="text-3xl font-bold text-foreground">{answeredQuestions.length}</p>
            <p className="text-slate-500 text-xs mt-1">of {questions.length} asked</p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <p className="text-slate-400 text-xs mb-1">Help used</p>
            <p className="text-3xl font-bold text-foreground">
              {questions.filter((q) => q.help_requested).length}
            </p>
            <p className="text-slate-500 text-xs mt-1">times</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Questions & Feedback</h2>
          {!isPro && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
              <p className="text-blue-300 text-sm">Upgrade to Pro to unlock full per-question feedback & scores.</p>
              <Link href="/upgrade" className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-4">Upgrade</Link>
            </div>
          )}
          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionAccordion key={q.id} question={q} index={i} isPro={isPro} />
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/weakness" className="flex-1">
            <Button variant="secondary" className="w-full">View weakness profile</Button>
          </Link>
          <Link href="/drill" className="flex-1">
            <Button className="w-full">Start drill mode</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
