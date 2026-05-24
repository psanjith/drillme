"use client";

import { useEffect, useRef } from "react";

interface VoiceVisualizerProps {
  isRecording: boolean;
  isSpeaking: boolean;
}

export function VoiceVisualizer({ isRecording, isSpeaking }: VoiceVisualizerProps) {
  const barsRef = useRef<HTMLDivElement[]>([]);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording && !isSpeaking) {
      barsRef.current.forEach((bar) => {
        if (bar) bar.style.height = "4px";
      });
      return;
    }

    function animate() {
      barsRef.current.forEach((bar) => {
        if (!bar) return;
        const h = isRecording
          ? 4 + Math.random() * 28
          : isSpeaking
          ? 4 + Math.random() * 20
          : 4;
        bar.style.height = `${h}px`;
      });
      animRef.current = requestAnimationFrame(animate);
    }

    const id = setInterval(() => {
      barsRef.current.forEach((bar) => {
        if (!bar) return;
        const h = isRecording ? 4 + Math.random() * 28 : 4 + Math.random() * 20;
        bar.style.height = `${h}px`;
      });
    }, 80);

    return () => clearInterval(id);
  }, [isRecording, isSpeaking]);

  const color = isRecording ? "#3b82f6" : isSpeaking ? "#22c55e" : "#2a3040";

  return (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { if (el) barsRef.current[i] = el; }}
          style={{
            width: "3px",
            height: "4px",
            backgroundColor: color,
            borderRadius: "2px",
            transition: "height 0.08s ease, background-color 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}
