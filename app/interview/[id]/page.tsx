"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VoiceVisualizer } from "@/components/interview/VoiceVisualizer";
import { PanellistAvatar } from "@/components/interview/PanellistAvatar";
import { SpeechRecognitionManager } from "@/lib/speech/recognition";
import { speak, stopSpeaking, loadVoices, assignPanellistVoices } from "@/lib/speech/synthesis";
import { Mic, MicOff, HelpCircle, ChevronRight, X } from "lucide-react";
import type { Session, SessionQuestion, PanellistPersona, OptimalFramework } from "@/types";

type InterviewState = "loading" | "error" | "intro" | "question" | "recording" | "processing" | "answered" | "complete";

const SOURCE_LABELS: Record<string, string> = {
  bank: "Verified",
  ai_generated: "AI Generated",
  glassdoor: "Verified",
  leetcode: "Verified",
  engineering_blog: "Verified",
};

export default function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [state, setState] = useState<InterviewState>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<SessionQuestion | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [helpPanel, setHelpPanel] = useState<OptimalFramework | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState("");
  const [sessionOver, setSessionOver] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const introTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const submittingRef = useRef(false);

  const speakQuestion = useCallback((text: string, persona: PanellistPersona) => {
    setIsSpeaking(true);
    speak(text, persona, () => setIsSpeaking(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadVoices();
      if (cancelled) return;

      const manager = new SpeechRecognitionManager({
        onTranscript: (text) => setTranscript(text),
        onStateChange: (s) => {
          if (s === "error") setVoiceSupported(false);
        },
        onError: () => setVoiceSupported(false),
      });

      if (!manager.isSupported()) setVoiceSupported(false);
      recognitionRef.current = manager;

      let data;
      try {
        const res = await fetch(`/api/sessions/${id}/start`, { method: "POST" });
        data = await res.json();
      } catch {
        if (cancelled) return;
        setError("Network error — could not reach the server. Check your connection and try again.");
        setState("error" as InterviewState);
        return;
      }

      if (cancelled) return;

      if (data.error) {
        setError(
          data.error === "ai_unavailable"
            ? "Our AI is busy right now. Please wait a moment and refresh to try again."
            : data.error
        );
        setState("error" as InterviewState);
        return;
      }

      setSession(data.session);
      setCurrentQuestion(data.question);

      const panellists = data.session.panel_config?.panellists || [];
      assignPanellistVoices(panellists);

      const intro = `Welcome to your ${data.session.duration_minutes}-minute ${data.session.interview_type} interview. I'm your panel today. Let's get started.`;
      setState("intro");
      setIsSpeaking(true);
      speak(intro, panellists[0] || "senior_engineer", () => {
        if (cancelled) return;
        setIsSpeaking(false);
        introTimeoutRef.current = setTimeout(() => {
          if (cancelled) return;
          setState("question");
          speakQuestion(data.question.question_text, data.question.panellist_persona);
          startTimeRef.current = new Date();
          timerRef.current = setInterval(() => {
            if (startTimeRef.current) {
              setElapsed(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
            }
          }, 1000);
        }, 500);
      });
    }

    init().catch((err) => {
      setError(err?.message || "Unexpected error. Please try again.");
      setState("error" as InterviewState);
    });

    return () => {
      cancelled = true;
      stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
      if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
      recognitionRef.current?.stop();
    };
  }, [id, speakQuestion]);

  function startRecording() {
    if (!recognitionRef.current) return;
    setTranscript("");
    setIsRecording(true);
    setState("recording");
    stopSpeaking();
    recognitionRef.current.start();
  }

  async function stopRecording() {
    if (!recognitionRef.current || !currentQuestion) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    recognitionRef.current.stop();
    setIsRecording(false);
    setState("processing");

    const finalTranscript = recognitionRef.current.getFinalTranscript() || transcript;

    try {
      const res = await fetch(`/api/sessions/${id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          transcript: finalTranscript || "(No answer provided)",
        }),
      });
      const data = await res.json();

      if (data.error) {
        submittingRef.current = false;
        setState("question");
        setError(
          data.error === "ai_unavailable"
            ? "Our AI is busy right now — please wait a moment and try again."
            : data.error
        );
        return;
      }

      submittingRef.current = false;

      if (data.sessionOver) {
        setSessionOver(true);
        setState("complete");
        return;
      }

      const nextQ = data.followUpQuestion || data.nextQuestion;
      if (nextQ) {
        setCurrentQuestion(nextQ);
        setState("question");
        setTranscript("");
        speakQuestion(nextQ.question_text, nextQ.panellist_persona);
      } else {
        setSessionOver(true);
        setState("complete");
      }
    } catch {
      submittingRef.current = false;
      setState("question");
      setError("Failed to submit answer. Please try again.");
    }
  }

  async function handleHelp() {
    if (!currentQuestion) return;
    stopSpeaking();
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    const res = await fetch(`/api/sessions/${id}/help`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: currentQuestion.id }),
    });
    const data = await res.json();
    setHelpPanel(data.framework);
    setHelpOpen(true);
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await fetch(`/api/sessions/${id}/complete`, { method: "POST" });
      router.push(`/debrief/${id}`);
    } catch {
      setCompleting(false);
    }
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const timeLimit = (session?.duration_minutes || 35) * 60;
  const timeProgress = Math.min(elapsed / timeLimit, 1);
  const timeColor = timeProgress > 0.85 ? "bg-red-500" : timeProgress > 0.6 ? "bg-amber-500" : "bg-blue-500";

  if (state === "loading" || state === "error") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          {state === "error" ? (
            <>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-foreground font-medium mb-2">Failed to start interview</p>
              <p className="text-red-400 text-sm mb-6 leading-relaxed">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push("/interview/setup")}
                  className="px-4 py-2 border border-[var(--card-border)] text-slate-400 rounded-lg text-sm hover:border-slate-500 hover:text-slate-200 transition-colors"
                >
                  ← Back to setup
                </button>
                <button
                  onClick={() => { setState("loading"); window.location.reload(); }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400 text-sm">Setting up your interview...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <header className="border-b border-[var(--card-border)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="DrillMe" className="w-7 h-7 rounded object-contain" />
          <span className="text-foreground font-medium text-sm">
            {session?.company ? `${session.company} Interview` : "Practice Interview"}
          </span>
          {session && (
            <Badge variant="blue">{session.interview_type}</Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-[#2a3040] rounded-full overflow-hidden">
              <div className={`h-full ${timeColor} transition-all`} style={{ width: `${timeProgress * 100}%` }} />
            </div>
            <span className="text-slate-400 text-xs font-mono">{formatTime(elapsed)}</span>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              if (timerRef.current) clearInterval(timerRef.current);
              if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
              recognitionRef.current?.stop();
              setIsRecording(false);
              setSessionOver(true);
            }}
            className="text-slate-500 hover:text-red-400 text-xs border border-[var(--card-border)] hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            End interview
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-4 flex items-center justify-between">
              {error}
              <button onClick={() => setError("")}><X size={14} /></button>
            </div>
          )}

          {currentQuestion && !sessionOver && state !== "complete" && (
            <div className="flex-1 flex flex-col">
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                  <PanellistAvatar
                    persona={currentQuestion.panellist_persona as PanellistPersona}
                    speaking={isSpeaking}
                    size="md"
                  />
                  <div className="flex items-center gap-2">
                    <Badge variant="slate">{currentQuestion.question_type.replace("_", " ")}</Badge>
                    <Badge variant={currentQuestion.source === "ai_generated" ? "amber" : "green"}>
                      {SOURCE_LABELS[currentQuestion.source] || currentQuestion.source}
                    </Badge>
                  </div>
                </div>

                <p className="text-foreground text-lg leading-relaxed font-medium">
                  {currentQuestion.question_text}
                </p>

                {currentQuestion.topic && (
                  <p className="text-slate-500 text-xs mt-3">Topic: {currentQuestion.topic}</p>
                )}
              </div>

              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 mb-4 flex-1 min-h-40">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Your answer</p>
                  <VoiceVisualizer isRecording={isRecording} isSpeaking={isSpeaking} />
                </div>

                {transcript ? (
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
                ) : (
                  <p className="text-slate-600 text-sm italic">
                    {isRecording ? "Listening..." : state === "processing" ? "Processing your answer..." : "Press the microphone button to start speaking"}
                  </p>
                )}

                {!voiceSupported && (
                  <div className="mt-3">
                    <textarea
                      placeholder="Type your answer here..."
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="w-full bg-transparent text-slate-200 text-sm outline-none resize-none placeholder:text-slate-600"
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleHelp}
                  disabled={state === "processing"}
                  className="flex items-center gap-2 text-slate-500 hover:text-amber-400 text-sm transition-colors"
                >
                  <HelpCircle size={16} />
                  Show optimal approach
                </button>

                <div className="flex items-center gap-3">
                  {(state === "question" || state === "recording") && (
                    <>
                      {isRecording ? (
                        <Button onClick={stopRecording} variant="danger" size="lg" className="px-8">
                          <MicOff size={18} />
                          Stop & submit
                        </Button>
                      ) : (
                        <Button onClick={startRecording} size="lg" className="px-8">
                          <Mic size={18} />
                          {voiceSupported ? "Start recording" : "Submit answer"}
                        </Button>
                      )}
                    </>
                  )}

                  {state === "processing" && (
                    <Button loading size="lg">Evaluating...</Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {(state === "complete" || sessionOver) && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Interview complete</h2>
                <p className="text-slate-400 text-sm mb-6">Great work. Let&apos;s see how you did.</p>
                <Button onClick={handleComplete} loading={completing} size="lg">
                  {completing ? "Generating debrief…" : "View debrief"}
                  {!completing && <ChevronRight size={16} />}
                </Button>
                {completing && (
                  <p className="text-slate-500 text-xs mt-3">Analysing your answers — takes about 10 seconds</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {helpOpen && helpPanel && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-end z-50" onClick={() => setHelpOpen(false)}>
          <div
            className="w-full max-w-md h-full bg-[var(--card)] border-l border-[var(--card-border)] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-foreground font-semibold">Optimal approach</h3>
              <button onClick={() => setHelpOpen(false)} className="text-slate-400 hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Framework</p>
                <Badge variant="blue">{helpPanel.structure}</Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Key points</p>
                <ul className="space-y-1.5">
                  {helpPanel.keyPoints.map((kp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-0.5">•</span>
                      {kp}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Sample strong answer</p>
                <p className="text-slate-300 text-sm leading-relaxed bg-[var(--background)] rounded-lg p-3">
                  {helpPanel.sampleAnswer}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Common mistakes</p>
                <ul className="space-y-1.5">
                  {helpPanel.commonMistakes.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-red-400 mt-0.5">✗</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
