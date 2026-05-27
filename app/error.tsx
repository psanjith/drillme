"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
          <svg
            className="w-8 h-8 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-slate-400 text-sm mb-1">
          An unexpected error occurred. You can try again or head back to the dashboard.
        </p>
        {error.digest && (
          <p className="text-slate-600 text-xs mb-6 font-mono">Error ID: {error.digest}</p>
        )}

        <div
          className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 mb-6 text-left"
        >
          <p className="text-slate-400 text-xs font-mono break-words">
            {error.message || "An unknown error occurred."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button className="w-full" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium
              text-slate-300 border border-[var(--card-border)] rounded-lg
              hover:bg-white/5 transition-all duration-150"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
