"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Briefcase, ChevronDown, ChevronRight, Plus, Check } from "lucide-react";
import type { InterviewType } from "@/types";

interface TypeStat {
  type: InterviewType;
  sessionCount: number;
  avgScore: number | null;
  lastPracticed: string | null;
}

interface JobTarget {
  company: string;
  roleLevel: string;
  totalSessions: number;
  overallScore: number | null;
  readiness: number;
  lastPracticed: string | null;
  byType: TypeStat[];
}

const TYPE_LABELS: Record<InterviewType, string> = {
  technical: "Technical",
  behavioural: "Behavioural",
  mixed: "Mixed",
};

const LEVEL_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  staff: "Staff",
};

function scoreColor(score: number | null) {
  if (score === null) return "text-slate-500";
  if (score >= 75) return "text-green-400";
  if (score >= 55) return "text-amber-400";
  return "text-red-400";
}

function readinessBarColor(readiness: number) {
  if (readiness >= 70) return "bg-green-500";
  if (readiness >= 40) return "bg-amber-500";
  return "bg-blue-500";
}

function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function targetLabel(t: JobTarget) {
  return `${t.company} · ${LEVEL_LABELS[t.roleLevel] || t.roleLevel}`;
}

export default function JobTargetsPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<JobTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/job-targets")
      .then((r) => r.json())
      .then((d) => setTargets(d.targets || []))
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const target = targets[selected] ?? null;

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Job Targets</h1>
            <p className="text-slate-400 text-sm mt-0.5">Track your prep progress per role</p>
          </div>
          <button
            onClick={() => router.push("/interview/setup")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            New session
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : targets.length === 0 ? (
          <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-12 text-center">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={22} className="text-blue-400" />
            </div>
            <p className="text-white font-medium mb-1">No sessions yet</p>
            <p className="text-slate-400 text-sm mb-5">Complete your first interview to start tracking progress</p>
            <button
              onClick={() => router.push("/interview/setup")}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Start an interview
            </button>
          </div>
        ) : (
          <>
            {/* Dropdown selector */}
            <div className="relative mb-5" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-full flex items-center justify-between bg-[#1a1f2e] border border-[#2a3040] hover:border-slate-500 rounded-xl px-4 py-3.5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
                    <Briefcase size={15} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{target?.company}</p>
                    <p className="text-slate-400 text-xs">{LEVEL_LABELS[target?.roleLevel] || target?.roleLevel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs">{targets.length} target{targets.length !== 1 ? "s" : ""}</span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1a1f2e] border border-[#2a3040] rounded-xl shadow-xl z-20 overflow-hidden">
                  {targets.map((t, i) => (
                    <button
                      key={`${t.company}-${t.roleLevel}`}
                      onClick={() => { setSelected(i); setDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-[#2a3040] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${readinessBarColor(t.readiness)}`} />
                        <div className="text-left">
                          <p className="text-white text-sm font-medium">{t.company}</p>
                          <p className="text-slate-400 text-xs">{LEVEL_LABELS[t.roleLevel] || t.roleLevel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${scoreColor(t.overallScore)}`}>
                          {t.overallScore !== null ? t.overallScore : "—"}
                        </span>
                        {i === selected && <Check size={14} className="text-blue-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stats card */}
            {target && (
              <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl p-5">
                {/* Score + readiness */}
                <div className="flex items-center gap-5 mb-5">
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${scoreColor(target.overallScore)}`}>
                      {target.overallScore !== null ? target.overallScore : "—"}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">avg score</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-400 text-xs">Readiness</span>
                      <span className="text-slate-300 text-xs font-medium">{target.readiness}%</span>
                    </div>
                    <div className="h-2 bg-[#2a3040] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${readinessBarColor(target.readiness)} transition-all duration-500`}
                        style={{ width: `${target.readiness}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-slate-600 text-xs">{target.totalSessions} session{target.totalSessions !== 1 ? "s" : ""} total</span>
                      <span className="text-slate-600 text-xs">Last: {timeAgo(target.lastPracticed)}</span>
                    </div>
                  </div>
                </div>

                {/* Interview type breakdown */}
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">By interview type</p>
                <div className="space-y-2 mb-5">
                  {target.byType.map((t) => (
                    <div key={t.type} className="flex items-center gap-3 bg-[#0f1117] border border-[#2a3040] rounded-lg px-4 py-3">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.sessionCount > 0 ? readinessBarColor(t.avgScore ?? 0) : "bg-slate-700"}`} />
                      <span className="text-slate-300 text-sm flex-1">{TYPE_LABELS[t.type]}</span>
                      {t.sessionCount > 0 ? (
                        <>
                          <span className="text-slate-500 text-xs">{t.sessionCount} session{t.sessionCount !== 1 ? "s" : ""}</span>
                          <span className="text-slate-500 text-xs w-16 text-right">{timeAgo(t.lastPracticed)}</span>
                          <span className={`text-sm font-semibold w-8 text-right ${scoreColor(t.avgScore)}`}>
                            {t.avgScore !== null ? t.avgScore : "—"}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-600 text-xs">Not practiced yet</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Practice again */}
                <button
                  onClick={() => router.push(`/interview/setup?company=${encodeURIComponent(target.company)}&level=${target.roleLevel}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 text-sm font-medium rounded-lg transition-colors"
                >
                  Practice {target.company} interview
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
