"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ExperienceLevel } from "@/types";

const COMPANIES = ["Google", "Meta", "Apple", "Amazon", "Microsoft", "Netflix", "Stripe", "Airbnb", "Uber", "Lyft", "Twitter/X", "LinkedIn", "Salesforce", "Palantir", "Databricks", "OpenAI", "Anthropic", "Other"];
const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: "junior", label: "Junior", desc: "0–2 years" },
  { value: "mid", label: "Mid", desc: "2–5 years" },
  { value: "senior", label: "Senior", desc: "5–10 years" },
  { value: "staff", label: "Staff+", desc: "10+ years" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    experience_level: "mid" as ExperienceLevel,
    target_companies: [] as string[],
    weekly_goal: 3,
  });

  function toggleCompany(c: string) {
    setForm((f) => ({
      ...f,
      target_companies: f.target_companies.includes(c)
        ? f.target_companies.filter((x) => x !== c)
        : [...f.target_companies, c],
    }));
  }

  async function handleFinish() {
    setLoading(true);
    try {
      await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  }

  const steps = [
    {
      title: "What should we call you?",
      content: (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 bg-[#0f1117] border border-[#2a3040] rounded-lg text-white text-lg placeholder:text-slate-600 outline-none focus:border-blue-500 transition-colors"
            autoFocus
          />
        </div>
      ),
      canNext: form.name.trim().length > 0,
    },
    {
      title: "Your experience level",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {EXPERIENCE_LEVELS.map((lvl) => (
            <button
              key={lvl.value}
              onClick={() => setForm((f) => ({ ...f, experience_level: lvl.value }))}
              className={`p-4 rounded-xl border text-left transition-all ${
                form.experience_level === lvl.value
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-[#2a3040] hover:border-slate-500"
              }`}
            >
              <p className="text-white font-medium">{lvl.label}</p>
              <p className="text-slate-500 text-sm">{lvl.desc}</p>
            </button>
          ))}
        </div>
      ),
      canNext: true,
    },
    {
      title: "Target companies",
      content: (
        <div>
          <p className="text-slate-400 text-sm mb-4">Select all that apply. We&apos;ll use real questions from these companies.</p>
          <div className="flex flex-wrap gap-2">
            {COMPANIES.map((c) => (
              <button
                key={c}
                onClick={() => toggleCompany(c)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  form.target_companies.includes(c)
                    ? "border-blue-500 bg-blue-500/15 text-blue-300"
                    : "border-[#2a3040] text-slate-400 hover:border-slate-500"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ),
      canNext: true,
    },
    {
      title: "Weekly prep goal",
      content: (
        <div>
          <p className="text-slate-400 text-sm mb-6">How many sessions per week do you aim to complete?</p>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 5, 7, 10, 14, 21].map((n) => (
              <button
                key={n}
                onClick={() => setForm((f) => ({ ...f, weekly_goal: n }))}
                className={`p-3 rounded-xl border text-center transition-all ${
                  form.weekly_goal === n
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-[#2a3040] text-slate-400 hover:border-slate-500"
                }`}
              >
                <p className="text-xl font-semibold">{n}</p>
                <p className="text-xs mt-0.5">{n === 1 ? "session" : "sessions"}</p>
              </button>
            ))}
          </div>
        </div>
      ),
      canNext: true,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="DrillMe" className="w-28 h-28 rounded-xl object-contain" />
            <span className="text-white font-semibold">DrillMe</span>
          </div>
          <div className="flex gap-1.5 mb-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? "bg-blue-500" : "bg-[#2a3040]"
                }`}
              />
            ))}
          </div>
          <p className="text-slate-500 text-sm mb-2">Step {step + 1} of {steps.length}</p>
          <h1 className="text-2xl font-bold text-white">{current.title}</h1>
        </div>

        <div className="mb-8">{current.content}</div>

        <div className="flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {isLast ? (
            <Button loading={loading} onClick={handleFinish}>
              Go to dashboard
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!current.canNext}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
