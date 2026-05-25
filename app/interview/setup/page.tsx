"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import type { ExperienceLevel, InterviewType, PanellistPersona } from "@/types";

const COMPANIES = ["Google", "Meta", "Apple", "Amazon", "Microsoft", "Netflix", "Stripe", "Airbnb", "Uber", "Databricks", "OpenAI", "Anthropic", "Other"];
const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "staff", label: "Staff+" },
];
const TYPES: { value: InterviewType; label: string; desc: string }[] = [
  { value: "mixed", label: "Mixed", desc: "Technical + Behavioural" },
  { value: "technical", label: "Technical", desc: "DSA, System Design, Code" },
  { value: "behavioural", label: "Behavioural", desc: "Situational & culture" },
];
const DURATIONS = [20, 35, 50];
const PANELLISTS: { value: PanellistPersona; label: string; desc: string }[] = [
  { value: "hiring_manager", label: "Hiring Manager", desc: "Impact & culture" },
  { value: "senior_engineer", label: "Senior Engineer", desc: "Technical depth" },
  { value: "peer_engineer", label: "Peer Engineer", desc: "Collaboration" },
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"jd" | "quick">("jd");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    company: "",
    role_level: "mid" as ExperienceLevel,
    interview_type: "mixed" as InterviewType,
    panel_config: { panellists: ["hiring_manager", "senior_engineer", "peer_engineer"] as PanellistPersona[] },
    duration_minutes: 35,
  });

  useEffect(() => {
    const company = searchParams.get("company");
    const level = searchParams.get("level") as ExperienceLevel | null;
    if (company || level) {
      setMode("quick");
      setForm((f) => ({
        ...f,
        ...(company ? { company } : {}),
        ...(level ? { role_level: level } : {}),
      }));
    }
  }, [searchParams]);

  function togglePanellist(p: PanellistPersona) {
    setForm((f) => {
      const current = f.panel_config.panellists;
      const updated = current.includes(p)
        ? current.filter((x) => x !== p)
        : [...current, p];
      if (updated.length === 0) return f;
      return { ...f, panel_config: { panellists: updated } };
    });
  }

  async function handleStart() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: mode === "jd" ? jd : null,
          company: mode === "quick" ? form.company : null,
          role_level: form.role_level,
          interview_type: form.interview_type,
          panel_config: form.panel_config,
          duration_minutes: form.duration_minutes,
        }),
      });
      const data = await res.json();
      if (data.error === "free_limit_reached") {
        router.push("/upgrade");
        return;
      }
      if (data.error) throw new Error(data.error);
      router.push(`/interview/${data.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Start an interview</h1>
          <p className="text-slate-400 text-sm">Configure your practice session</p>
        </div>

        <div className="flex gap-2 mb-6 bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-1">
          {(["jd", "quick"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                mode === m
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {m === "jd" ? "Paste Job Description" : "Quick Setup"}
            </button>
          ))}
        </div>

        {mode === "jd" ? (
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 mb-5">
            <Textarea
              label="Job Description"
              placeholder="Paste the full job description here. We'll extract the company, role, and requirements automatically..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={10}
            />
          </div>
        ) : (
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5 mb-5 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Company (optional)</label>
              <div className="flex flex-wrap gap-2">
                {COMPANIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, company: f.company === c ? "" : c }))}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      form.company === c
                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                        : "border-[var(--card-border)] text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <label className="text-sm font-medium text-slate-300 block mb-3">Experience Level</label>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setForm((f) => ({ ...f, role_level: l.value }))}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                    form.role_level === l.value
                      ? "border-blue-500 bg-blue-500/10 text-foreground font-medium"
                      : "border-[var(--card-border)] text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <label className="text-sm font-medium text-slate-300 block mb-3">Interview Type</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm((f) => ({ ...f, interview_type: t.value }))}
                  className={`flex-1 py-3 rounded-lg border text-left px-3 transition-all ${
                    form.interview_type === t.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-[var(--card-border)] hover:border-slate-500"
                  }`}
                >
                  <p className={`text-sm font-medium ${form.interview_type === t.value ? "text-foreground" : "text-slate-300"}`}>{t.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <label className="text-sm font-medium text-slate-300 block mb-3">Panel ({form.panel_config.panellists.length} panellists)</label>
            <div className="flex flex-col gap-2">
              {PANELLISTS.map((p) => {
                const active = form.panel_config.panellists.includes(p.value);
                return (
                  <button
                    key={p.value}
                    onClick={() => togglePanellist(p.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      active ? "border-blue-500 bg-blue-500/10" : "border-[var(--card-border)] hover:border-slate-500"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${active ? "bg-blue-500 border-blue-500" : "border-slate-600"}`}>
                      {active && <svg className="w-2.5 h-2.5 text-foreground" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${active ? "text-foreground" : "text-slate-300"}`}>{p.label}</p>
                      <p className="text-xs text-slate-500">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-5">
            <label className="text-sm font-medium text-slate-300 block mb-3">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setForm((f) => ({ ...f, duration_minutes: d }))}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
                    form.duration_minutes === d
                      ? "border-blue-500 bg-blue-500/10 text-foreground font-medium"
                      : "border-[var(--card-border)] text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <Button
          onClick={handleStart}
          loading={loading}
          size="lg"
          className="w-full"
          disabled={mode === "jd" && jd.trim().length < 20}
        >
          {loading ? "Setting up your interview..." : "Start interview"}
        </Button>
      </div>
    </AppShell>
  );
}
