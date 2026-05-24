"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProGate } from "@/components/ProGate";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { VoiceVisualizer } from "@/components/interview/VoiceVisualizer";
import { SpeechRecognitionManager } from "@/lib/speech/recognition";
import { speak, stopSpeaking } from "@/lib/speech/synthesis";
import { Mic, MicOff, RotateCcw, MessageCircle } from "lucide-react";
import type { SpeakingSessionType } from "@/types";

const SESSION_TYPES: { value: SpeakingSessionType; label: string; desc: string; color: string; duration: string }[] = [
  {
    value: "free_talk",
    label: "Free Talk",
    desc: "Speak for 1–5 minutes on any topic. No prompt.",
    color: "border-teal-500/30 hover:border-teal-500/60",
    duration: "1–5 min",
  },
  {
    value: "prompted_talk",
    label: "Prompted Talk",
    desc: "Alex gives you a random topic. You speak for 1–3 minutes.",
    color: "border-blue-500/30 hover:border-blue-500/60",
    duration: "1–3 min",
  },
  {
    value: "presentation_practice",
    label: "Presentation Practice",
    desc: "Paste your notes. Alex acts as your audience and gives structured feedback.",
    color: "border-purple-500/30 hover:border-purple-500/60",
    duration: "Any length",
  },
  {
    value: "technical_explainer",
    label: "Technical Explainer",
    desc: "Explain a technical concept to a non-technical audience.",
    color: "border-amber-500/30 hover:border-amber-500/60",
    duration: "1–3 min",
  },
  {
    value: "filler_word_bootcamp",
    label: "Filler Word Bootcamp",
    desc: "60-second bursts. Every um, uh, and like gets flagged and counted.",
    color: "border-red-500/30 hover:border-red-500/60",
    duration: "60 sec",
  },
];

type SpeakingState = "setup" | "intro" | "recording" | "processing" | "feedback";

interface HighlightedWord {
  text: string;
  type: "filler" | "strong" | "normal";
}

interface SpeakingFeedback {
  scores: {
    clarity: number;
    structure: number;
    pacing: string;
    vocabulary_range: string;
  };
  filler_word_count: number;
  filler_words_detected: Record<string, number>;
  confidence_flags: string[];
  feedback: string;
  highlighted_transcript: HighlightedWord[];
}

export default function SpeakingPage() {
  const [sessionType, setSessionType] = useState<SpeakingSessionType | null>(null);
  const [presentationNotes, setPresentationNotes] = useState("");
  const [speakingState, setSpeakingState] = useState<SpeakingState>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [intro, setIntro] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const manager = new SpeechRecognitionManager({
      onTranscript: (text) => setTranscript(text),
      onStateChange: () => {},
      onError: () => setVoiceSupported(false),
    });
    if (!manager.isSupported()) setVoiceSupported(false);
    recognitionRef.current = manager;

    return () => {
      stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function handleStartSession() {
    if (!sessionType) return;
    setLoading(true);

    const res = await fetch("/api/speaking/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_type: sessionType,
        presentation_notes: sessionType === "presentation_practice" ? presentationNotes : null,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) return;

    setSessionId(data.session.id);
    setIntro(data.intro);
    setSpeakingState("intro");

    setIsSpeaking(true);
    speak(data.intro, "peer_engineer", () => {
      setIsSpeaking(false);
    });
  }

  function startRecording() {
    setTranscript("");
    setIsRecording(true);
    setSpeakingState("recording");
    const now = Date.now();
    setStartTime(now);
    stopSpeaking();
    recognitionRef.current?.start();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - now) / 1000));
    }, 1000);
  }

  async function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setSpeakingState("processing");
    if (timerRef.current) clearInterval(timerRef.current);

    const duration = startTime ? Math.round((Date.now() - startTime) / 1000) : elapsed;
    const finalTranscript = recognitionRef.current?.getFinalTranscript() || transcript;

    const res = await fetch(`/api/speaking/${sessionId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: finalTranscript || "(No speech detected)",
        duration_seconds: duration,
      }),
    });
    const data = await res.json();

    setFeedback(data.evaluation);
    setSpeakingState("feedback");
  }

  function reset() {
    recognitionRef.current?.stop();
    stopSpeaking();
    setSpeakingState("setup");
    setSessionType(null);
    setFeedback(null);
    setTranscript("");
    setElapsed(0);
    setStartTime(null);
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }

  const pacingColor = feedback?.scores.pacing === "appropriate" ? "text-green-400" : feedback?.scores.pacing === "too_fast" ? "text-red-400" : "text-amber-400";

  return (
    <AppShell>
      <ProGate feature="Speaking Coach">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
            <MessageCircle size={20} className="text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Speaking Practice</h1>
            <p className="text-slate-400 text-sm">Coached by Alex · 5 session types</p>
          </div>
        </div>

        {speakingState === "setup" && (
          <div>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {SESSION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSessionType(type.value)}
                  className={`p-4 rounded-xl border text-left transition-all bg-[#1a1f2e] ${
                    sessionType === type.value
                      ? type.color + " bg-teal-500/5"
                      : "border-[#2a3040] " + type.color
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-medium text-sm">{type.label}</p>
                    <Badge variant="slate">{type.duration}</Badge>
                  </div>
                  <p className="text-slate-400 text-xs">{type.desc}</p>
                </button>
              ))}
            </div>

            {sessionType === "presentation_practice" && (
              <div className="mb-4">
                <Textarea
                  label="Presentation notes"
                  placeholder="Paste your slides or presentation notes here..."
                  value={presentationNotes}
                  onChange={(e) => setPresentationNotes(e.target.value)}
                  rows={6}
                />
              </div>
            )}

            <Button
              onClick={handleStartSession}
              loading={loading}
              disabled={!sessionType || (sessionType === "presentation_practice" && !presentationNotes.trim())}
              size="lg"
              variant="teal"
              className="w-full"
            >
              Start session with Alex
            </Button>
          </div>
        )}

        {speakingState === "intro" && (
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-teal-300 font-bold">A</span>
            </div>
            <p className="text-white text-sm font-medium mb-1">Alex, your speaking coach</p>
            {isSpeaking && <p className="text-teal-400 text-xs mb-4">Speaking...</p>}
            <p className="text-slate-300 text-sm leading-relaxed mb-6 bg-[#0f1117] rounded-lg p-3">{intro}</p>
            <Button onClick={startRecording} variant="teal" size="lg">
              <Mic size={16} />
              {voiceSupported ? "Start speaking" : "I'm ready"}
            </Button>
          </Card>
        )}

        {(speakingState === "recording" || speakingState === "processing") && (
          <div>
            <Card className="p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-white text-sm font-medium">Recording</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm font-mono">{formatTime(elapsed)}</span>
                  <VoiceVisualizer isRecording={isRecording} isSpeaking={false} />
                </div>
              </div>

              {transcript ? (
                <p className="text-slate-300 text-sm leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-slate-600 text-sm italic">Start speaking...</p>
              )}

              {!voiceSupported && (
                <textarea
                  placeholder="Type what you're saying..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full bg-transparent text-slate-300 text-sm outline-none resize-none placeholder:text-slate-600 mt-2"
                  rows={4}
                />
              )}
            </Card>

            <div className="flex justify-center">
              {speakingState === "processing" ? (
                <Button loading variant="teal" size="lg">Analysing your speech...</Button>
              ) : (
                <Button onClick={stopRecording} variant="danger" size="lg" className="px-10">
                  <MicOff size={16} />
                  Stop & get feedback
                </Button>
              )}
            </div>
          </div>
        )}

        {speakingState === "feedback" && feedback && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Clarity", value: feedback.scores.clarity, max: 5 },
                { label: "Structure", value: feedback.scores.structure, max: 5 },
                { label: "Fillers", value: feedback.filler_word_count, max: null },
              ].map((m) => (
                <Card key={m.label} className="p-3 text-center">
                  <p className="text-slate-400 text-xs mb-1">{m.label}</p>
                  <p className="text-white font-bold text-xl">{m.value}{m.max ? `/${m.max}` : ""}</p>
                </Card>
              ))}
              <Card className="p-3 text-center">
                <p className="text-slate-400 text-xs mb-1">Pacing</p>
                <p className={`font-bold text-sm mt-1 ${pacingColor}`}>{feedback.scores.pacing.replace(/_/g, " ")}</p>
              </Card>
            </div>

            {Object.keys(feedback.filler_words_detected || {}).length > 0 && (
              <Card className="p-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Filler words detected</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(feedback.filler_words_detected).map(([word, count]) => (
                    <div key={word} className="bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 flex items-center gap-1.5">
                      <span className="text-red-300 text-xs">&quot;{word}&quot;</span>
                      <span className="text-red-400 text-xs font-bold">×{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {feedback.highlighted_transcript && feedback.highlighted_transcript.length > 0 && (
              <Card className="p-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Annotated transcript</p>
                <p className="text-sm leading-relaxed">
                  {feedback.highlighted_transcript.map((token, i) => (
                    <span
                      key={i}
                      className={
                        token.type === "filler"
                          ? "text-red-400 bg-red-500/10 rounded px-0.5"
                          : token.type === "strong"
                          ? "text-green-400 bg-green-500/10 rounded px-0.5"
                          : "text-slate-300"
                      }
                    >
                      {token.text}{" "}
                    </span>
                  ))}
                </p>
              </Card>
            )}

            {feedback.confidence_flags?.length > 0 && (
              <Card className="p-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Confidence patterns</p>
                <ul className="space-y-1">
                  {feedback.confidence_flags.map((flag, i) => (
                    <li key={i} className="text-amber-300 text-sm flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-teal-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-300 text-xs font-bold">A</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{feedback.feedback}</p>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setFeedback(null);
                  setTranscript("");
                  setElapsed(0);
                  setStartTime(null);
                  setSpeakingState("intro");
                  setIsSpeaking(true);
                  speak(intro, "peer_engineer", () => setIsSpeaking(false));
                }}
                variant="secondary"
                className="flex-1"
              >
                <RotateCcw size={15} />
                Repeat this prompt
              </Button>
              <Button onClick={reset} variant="teal" className="flex-1">
                New session
              </Button>
            </div>
          </div>
        )}
      </div>
      </ProGate>
    </AppShell>
  );
}
