"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Minus, Zap, AlertTriangle } from "lucide-react";
import type { WeaknessProfile } from "@/types";

const CATEGORY_COLORS = {
  technical: "blue" as const,
  behavioural: "amber" as const,
  communication: "teal" as const,
  process: "purple" as const,
};

const TREND_ICONS = {
  improving: TrendingUp,
  worsening: TrendingDown,
  stable: Minus,
};
const TREND_COLORS = {
  improving: "text-green-400",
  worsening: "text-red-400",
  stable: "text-slate-400",
};

function SeverityBar({ severity }: { severity: number }) {
  const pct = (severity / 10) * 100;
  const color = severity >= 7 ? "bg-red-500" : severity >= 4 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#2a3040] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-4">{severity}</span>
    </div>
  );
}

export default function WeaknessPage() {
  const [profile, setProfile] = useState<WeaknessProfile[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    fetch("/api/weakness-profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.profile || []);
        setRecommendations(data.recommendations || []);
        setLoading(false);
      });
  }, []);

  const categories = ["all", "technical", "behavioural", "communication", "process"];
  const filtered = activeCategory === "all"
    ? profile
    : profile.filter((w) => w.category === activeCategory);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Weakness Profile</h1>
            <p className="text-slate-400 text-sm">Tracked across all your sessions</p>
          </div>
          <Link href="/drill">
            <Button>
              <Zap size={15} />
              Drill mode
            </Button>
          </Link>
        </div>

        {recommendations.length > 0 && (
          <Card className="p-5 mb-6 border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-medium mb-2">Focus recommendations</p>
                <ul className="space-y-1.5">
                  {recommendations.map((r, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all capitalize ${
                activeCategory === c
                  ? "border-blue-500 bg-blue-500/15 text-blue-300"
                  : "border-[#2a3040] text-slate-400 hover:border-slate-500"
              }`}
            >
              {c}
              {c !== "all" && (
                <span className="ml-1.5 text-slate-500">
                  {profile.filter((w) => w.category === c).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[#1a1f2e] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">No weaknesses tracked yet.</p>
            <p className="text-slate-600 text-xs mt-1">Complete an interview to start tracking.</p>
            <Link href="/interview/setup" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">Start an interview</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((w) => {
              const TrendIcon = TREND_ICONS[w.trend];
              const trendColor = TREND_COLORS[w.trend];
              return (
                <Card key={w.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{w.tag}</p>
                      <Badge variant={CATEGORY_COLORS[w.category]}>{w.category}</Badge>
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                      <TrendIcon size={12} />
                      {w.trend}
                    </div>
                  </div>
                  <SeverityBar severity={w.severity} />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">
                      {w.occurrence_count} occurrence{w.occurrence_count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-slate-600">
                      Last seen {new Date(w.last_seen_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
