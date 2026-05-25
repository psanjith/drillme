"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Zap } from "lucide-react";

interface Props {
  children: React.ReactNode;
  feature: string;
}

export function ProGate({ children, feature }: Props) {
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((d) => setIsPro(d.isPro ?? false));
  }, []);

  if (isPro === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="flex items-center justify-center flex-1 px-6 py-20">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Lock size={22} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{feature} is a Pro feature</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Upgrade to DrillMe Pro for unlimited interviews, detailed feedback, weakness tracking, and more.
          </p>
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            <Zap size={14} />
            Upgrade to Pro
          </Link>
          <p className="text-slate-600 text-xs mt-4">$15/month · Cancel any time</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
