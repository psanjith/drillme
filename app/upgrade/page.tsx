"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Check, Zap } from "lucide-react";

const PRO_FEATURES = [
  "Unlimited interview sessions",
  "Full per-question feedback & scores",
  "Dashboard & readiness tracking",
  "Weakness profile & trend analysis",
  "Drill mode — targeted practice",
  "Speaking coach — all 5 session types",
  "Job targets tracker",
];

const FREE_FEATURES = [
  "3 interviews per month",
  "Overall readiness score",
];

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cycle, setCycle] = useState<"biweekly" | "monthly">("monthly");

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: cycle }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
            <Zap size={12} className="text-blue-400" />
            <span className="text-blue-400 text-xs font-medium">DrillMe Pro</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Unlock your full potential</h1>
          <p className="text-slate-400">Everything you need to walk into any interview prepared.</p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center bg-[var(--card)] border border-[var(--card-border)] rounded-lg p-1">
            {(["biweekly", "monthly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  cycle === c ? "bg-blue-500 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {c === "biweekly" ? "Bi-weekly" : "Monthly"}
                {c === "monthly" && (
                  <span className={`ml-2 text-xs ${cycle === c ? "text-white/80" : "text-green-400"}`}>best value</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Free */}
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">Free</p>
            <p className="text-3xl font-bold text-foreground mb-6">$0</p>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <Check size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="bg-[var(--card)] border-2 border-blue-500 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              Recommended
            </div>
            <p className="text-blue-400 text-sm font-medium mb-1">Pro</p>
            <div className="flex items-baseline gap-1 mb-1">
              <p className="text-3xl font-bold text-foreground">{cycle === "biweekly" ? "$14" : "$25"}</p>
              <p className="text-slate-400 text-sm">{cycle === "biweekly" ? "/2 weeks" : "/month"}</p>
            </div>
            <p className="text-xs text-slate-500 mb-5 h-4">
              {cycle === "biweekly" ? "Billed every 2 weeks" : "Billed monthly · best value"}
            </p>
            <ul className="space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <Check size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-medium py-3.5 rounded-xl transition-colors text-base"
        >
          {loading
            ? "Redirecting to checkout..."
            : cycle === "biweekly" ? "Upgrade to Pro — $14 / 2 weeks" : "Upgrade to Pro — $25 / month"}
        </button>

        <p className="text-center text-slate-500 text-xs mt-4">
          Cancel any time · No contracts ·{" "}
          <Link href="/dashboard" className="text-slate-400 hover:text-foreground underline">Back to dashboard</Link>
        </p>
      </div>
    </AppShell>
  );
}
