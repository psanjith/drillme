"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProGate } from "@/components/ProGate";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Minus, Flame, Mic, Zap, MessageCircle, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DashboardData } from "@/types";

const TREND_ICONS = {
  improving: TrendingUp,
  worsening: TrendingDown,
  stable: Minus,
};
const TREND_COLORS = { improving: "text-green-400", worsening: "text-red-400", stable: "text-slate-400" } as const;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  const score = data?.readiness_score || 0;
  const scoreColor = score >= 75 ? "text-green-400" : score >= 55 ? "text-blue-400" : "text-amber-400";

  return (
    <AppShell>
      <ProGate feature="Dashboard">
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <Link href="/interview/setup">
            <Button>
              <Mic size={15} />
              New interview
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-5">
            <p className="text-slate-400 text-xs mb-1">Readiness score</p>
            <p className={`text-4xl font-bold ${scoreColor}`}>{score || "—"}</p>
            <p className="text-slate-500 text-xs mt-1">out of 100</p>
          </Card>

          <Card className="p-5">
            <p className="text-slate-400 text-xs mb-1">Sessions done</p>
            <p className="text-4xl font-bold text-white">{data?.sessions_completed || 0}</p>
            <p className="text-slate-500 text-xs mt-1">interviews</p>
          </Card>

          <Card className="p-5">
            <p className="text-slate-400 text-xs mb-1">Practice time</p>
            <p className="text-4xl font-bold text-white">{data?.total_practice_minutes || 0}</p>
            <p className="text-slate-500 text-xs mt-1">minutes</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-xs mb-1">Daily streak</p>
                <p className="text-4xl font-bold text-white">{data?.daily_streak || 0}</p>
                <p className="text-slate-500 text-xs mt-1">days</p>
              </div>
              <Flame size={20} className={data?.daily_streak ? "text-amber-400" : "text-slate-600"} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-2">
            <Card className="p-5">
              <p className="text-white text-sm font-medium mb-4">Readiness over time</p>
              {(data?.readiness_history || []).length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={data?.readiness_history}>
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1f2e", border: "1px solid #2a3040", borderRadius: "8px" }}
                      labelStyle={{ color: "#94a3b8", fontSize: "11px" }}
                      itemStyle={{ color: "#3b82f6", fontSize: "12px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-slate-600 text-sm">Complete sessions to see your progress</p>
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card className="p-5 h-full">
              <p className="text-white text-sm font-medium mb-4">Top weaknesses</p>
              {(data?.top_weaknesses || []).length === 0 ? (
                <p className="text-slate-600 text-xs">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {(data?.top_weaknesses || []).slice(0, 5).map((w) => {
                    const TrendIcon = TREND_ICONS[w.trend];
                    return (
                      <div key={w.id}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-slate-300 text-xs truncate">{w.tag}</p>
                          <TrendIcon size={11} className={TREND_COLORS[w.trend]} />
                        </div>
                        <div className="h-1 bg-[#2a3040] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${w.severity >= 7 ? "bg-red-500" : w.severity >= 4 ? "bg-amber-500" : "bg-green-500"}`}
                            style={{ width: `${(w.severity / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>

        {(data?.focus_recommendations || []).length > 0 && (
          <Card className="p-5 mb-6 border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-medium mb-2">AI focus recommendations</p>
                <ul className="space-y-1.5">
                  {data?.focus_recommendations.map((r, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">{i + 1}.</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-5">
            <p className="text-white text-sm font-medium mb-3">Recent sessions</p>
            {(data?.recent_sessions || []).length === 0 ? (
              <p className="text-slate-600 text-xs">No sessions yet</p>
            ) : (
              <div className="space-y-2">
                {(data?.recent_sessions || []).slice(0, 4).map((s) => (
                  <Link key={s.id} href={`/debrief/${s.id}`} className="flex items-center justify-between py-2 border-b border-[#2a3040] last:border-0 hover:bg-white/5 -mx-2 px-2 rounded transition-colors">
                    <div>
                      <p className="text-slate-200 text-xs font-medium">{s.company || "Practice"}</p>
                      <p className="text-slate-500 text-xs">{s.role_level} · {s.interview_type}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${(s.overall_score || 0) >= 75 ? "text-green-400" : (s.overall_score || 0) >= 55 ? "text-blue-400" : "text-amber-400"}`}>
                        {s.overall_score || "—"}
                      </p>
                      <p className="text-slate-600 text-xs">{s.completed_at?.split("T")[0]}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="text-white text-sm font-medium mb-3">Quick actions</p>
            <div className="space-y-2">
              <Link href="/interview/setup" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Mic size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-200 text-sm">Start interview</p>
                  <p className="text-slate-500 text-xs">Full practice session</p>
                </div>
              </Link>
              <Link href="/drill" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Zap size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-200 text-sm">Drill mode</p>
                  <p className="text-slate-500 text-xs">Target weaknesses</p>
                </div>
              </Link>
              <Link href="/speaking" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
                  <MessageCircle size={14} className="text-teal-400" />
                </div>
                <div>
                  <p className="text-slate-200 text-sm">Speaking practice</p>
                  <p className="text-slate-500 text-xs">Improve your delivery</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
      </ProGate>
    </AppShell>
  );
}
