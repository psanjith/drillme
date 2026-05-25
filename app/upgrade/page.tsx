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

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
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
          <h1 className="text-3xl font-bold text-white mb-3">Unlock your full potential</h1>
          <p className="text-slate-400">Everything you need to walk into any interview prepared.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Free */}
          <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-2xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">Free</p>
            <p className="text-3xl font-bold text-white mb-6">$0</p>
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
          <div className="bg-[#1a1f2e] border-2 border-blue-500 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              Recommended
            </div>
            <p className="text-blue-400 text-sm font-medium mb-1">Pro</p>
            <div className="flex items-baseline gap-1 mb-6">
              <p className="text-3xl font-bold text-white">$15</p>
              <p className="text-slate-400 text-sm">/month</p>
            </div>
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
          {loading ? "Redirecting to checkout..." : "Upgrade to Pro"}
        </button>

        <p className="text-center text-slate-500 text-xs mt-4">
          Cancel any time · No contracts ·{" "}
          <Link href="/dashboard" className="text-slate-400 hover:text-white underline">Back to dashboard</Link>
        </p>
      </div>
    </AppShell>
  );
}
