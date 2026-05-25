"use client";

import { useState, useRef, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ProGate } from "@/components/ProGate";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PanellistAvatar } from "@/components/interview/PanellistAvatar";
import { VoiceVisualizer } from "@/components/interview/VoiceVisualizer";
import { SpeechRecognitionManager } from "@/lib/speech/recognition";
import { speak, stopSpeaking } from "@/lib/speech/synthesis";
import { Mic, MicOff, Target, ChevronRight } from "lucide-react";
import type { Session, SessionQuestion } from "@/types";

type DrillState = "idle" | "loading" | "active" | "recording" | "processing" | "feedback" | "complete";

interface DrillData {
  session: Session;
  questions: SessionQuestion[];
  target_weaknesses: string[];
}

export default function DrillPage() {
  const [drillState, setDrillState] = useState<DrillState>("idle");
  const [drillData, setDrillData] = useState<DrillData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ scores: Record<string, number>; feedback: { strengths: string[]; gaps: string[] } } | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);

  const currentQuestion = drillData?.questions[currentIndex];

  const speakQuestion = useCallback((text: string) => {
    setIsSpeaking(true);
    speak(text, "senior_engineer", () => setIsSpeaking(false));
  }, []);

  async function startDrill() {
    setDrillState("loading");
    const res = await fetch("/api/drill/start", { method: "POST" });
    const data = await res.json();

    if (data.error) {
      setDrillState("idle");
      return;
    }

    setDrillData(data);
    setCurrentIndex(0);

    const manager = new SpeechRecognitionManager({
      onTranscript: (text) => setTranscript(text),
      onStateChange: () => {},
      onError: () => setVoiceSupported(false),
    });
    if (!manager.isSupported()) setVoiceSupported(false);
    recognitionRef.current = manager;

    setDrillState("active");
    speakQuestion(data.questions[0].question_text);
  }

  function startRecording() {
    setTranscript("");
    setIsRecording(true);
    setDrillState("recording");
    stopSpeaking();
    recognitionRef.current?.start();
  }

  async function stopRecording() {
    setIsRecording(false);
    setDrillState("processing");
    const finalTranscript = recognitionRef.current?.getFinalTranscript() || transcript;

    if (!currentQuestion || !drillData) return;

    const res = await fetch(`/api/sessions/${drillData.session.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: currentQuestion.id,
        transcript: finalTranscript || "(No answer provided)",
      }),
    });
    const data = await res.json();

    setLastFeedback(data.evaluation);
    setDrillState("feedback");

    const feedbackText = data.evaluation?.scores
      ? `Good effort. ${data.evaluation.feedback?.strengths?.[0] || "Keep practicing."}`
      : "Good effort. Let's review the feedback.";
    speakQuestion(feedbackText);
  }

  function nextQuestion() {
    const next = currentIndex + 1;
    if (next >= (drillData?.questions.length || 0)) {
      setDrillState("complete");
      speakQuestion("Great work! You've completed this drill session. Keep practicing those weak areas.");
    } else {
      setCurrentIndex(next);
      setTranscript("");
      setLastFeedback(null);
      setDrillState("active");
      speakQuestion(drillData!.questions[next].question_text);
    }
  }

  return (
    <AppShell>
      <ProGate feature="Drill Mode">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Drill Mode</h1>
          <p className="text-slate-400 text-sm">10–15 minute focused sessions targeting your highest-severity weaknesses</p>
        </div>

        {drillState === "idle" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={28} className="text-blue-400" />
            </div>
            <h2 className="text-foreground font-semibold text-lg mb-2">Ready to be drilled?</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              We&apos;ll target your top 3–5 weakness areas with focused questions and coaching feedback.
            </p>
            <Button onClick={startDrill} size="lg">
              <Target size={16} />
              Start drill session
            </Button>
          </div>
        )}

        {drillState === "loading" && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Building your targeted drill...</p>
          </div>
        )}

        {(drillState === "active" || drillState === "recording" || drillState === "processing" || drillState === "feedback") && currentQuestion && drillData && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {drillData.target_weaknesses.slice(0, 3).map((w) => (
                  <Badge key={w} variant="amber">{w}</Badge>
                ))}
              </div>
              <span className="text-slate-400 text-sm">{currentIndex + 1} / {drillData.questions.length}</span>
            </div>

            <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <PanellistAvatar persona="senior_engineer" speaking={isSpeaking} size="md" />
              </div>
              <p className="text-foreground text-base leading-relaxed font-medium">{currentQuestion.question_text}</p>
              <p className="text-slate-500 text-xs mt-2">Topic: {currentQuestion.topic}</p>
            </div>

            {drillState !== "feedback" && (
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Your answer</p>
                  <VoiceVisualizer isRecording={isRecording} isSpeaking={isSpeaking} />
                </div>
                {transcript ? (
                  <p className="text-slate-200 text-sm leading-relaxed">{transcript}</p>
                ) : (
                  <p className="text-slate-600 text-sm italic">
                    {isRecording ? "Listening..." : drillState === "processing" ? "Evaluating..." : "Press record to answer"}
                  </p>
                )}
                {!voiceSupported && (
                  <textarea
                    placeholder="Type your answer..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full bg-transparent text-slate-200 text-sm outline-none resize-none placeholder:text-slate-600 mt-2"
                    rows={3}
                  />
                )}
              </div>
            )}

            {drillState === "feedback" && lastFeedback && (
              <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 mb-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(lastFeedback.scores || {}).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="text-foreground">{val}/5</span>
                      </div>
                      <div className="h-1.5 bg-[#2a3040] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${(val as number) >= 4 ? "bg-green-500" : (val as number) >= 3 ? "bg-blue-500" : "bg-amber-500"}`}
                          style={{ width: `${((val as number) / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {lastFeedback.feedback?.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs text-green-400 font-medium mb-1">What worked</p>
                    <p className="text-slate-300 text-sm">{lastFeedback.feedback.strengths[0]}</p>
                  </div>
                )}

                {lastFeedback.feedback?.gaps?.length > 0 && (
                  <div>
                    <p className="text-xs text-amber-400 font-medium mb-1">To improve</p>
                    <p className="text-slate-300 text-sm">{lastFeedback.feedback.gaps[0]}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              {drillState === "feedback" ? (
                <Button onClick={nextQuestion}>
                  {currentIndex + 1 >= drillData.questions.length ? "Finish drill" : "Next question"}
                  <ChevronRight size={16} />
                </Button>
              ) : isRecording ? (
                <Button onClick={stopRecording} variant="danger" size="lg">
                  <MicOff size={16} />
                  Stop & submit
                </Button>
              ) : drillState === "processing" ? (
                <Button loading size="lg">Evaluating...</Button>
              ) : (
                <Button onClick={startRecording} size="lg">
                  <Mic size={16} />
                  {voiceSupported ? "Record answer" : "Submit answer"}
                </Button>
              )}
            </div>
          </div>
        )}

        {drillState === "complete" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-foreground font-semibold text-lg mb-2">Drill complete!</h2>
            <p className="text-slate-400 text-sm mb-6">Great practice session. Keep drilling to see your weakness scores drop.</p>
            <Button onClick={() => { setDrillState("idle"); setDrillData(null); }}>
              Start another drill
            </Button>
          </div>
        )}
      </div>
      </ProGate>
    </AppShell>
  );
}
