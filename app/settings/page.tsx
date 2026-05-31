"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Crown } from "lucide-react";

export default function SettingsPage() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((d) => setIsPro(d.isPro ?? false));
  }, []);

  async function handleDelete() {
    if (confirm !== "DELETE") return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error();
      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again or contact drillme26@gmail.com");
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>

        <div className="space-y-4">
          {/* Appearance */}
          <Card className="p-6">
            <h2 className="text-foreground font-semibold mb-1">Appearance</h2>
            <p className="text-slate-400 text-sm mb-4">Toggle between light and dark mode.</p>
            <ThemeToggle />
          </Card>

          {/* Subscription */}
          <Card className="p-6">
            <h2 className="text-foreground font-semibold mb-1">Subscription</h2>
            {isPro === null && <p className="text-slate-500 text-sm">Loading…</p>}
            {isPro === false && (
              <>
                <p className="text-slate-400 text-sm mb-4">You're on the free plan — 3 interviews per month.</p>
                <a
                  href="/upgrade"
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Crown size={14} />
                  Upgrade to Pro
                </a>
              </>
            )}
            {isPro === true && (
              <>
                <p className="text-slate-400 text-sm mb-4">You're on the Pro plan — unlimited interviews and full access.</p>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/billing/portal", { method: "POST" });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400/50 px-4 py-2 rounded-lg transition-colors"
                >
                  <Crown size={14} />
                  Manage subscription
                </button>
              </>
            )}
          </Card>

          {/* Delete account */}
          <Card className="p-6 border-red-500/20">
            <h2 className="text-foreground font-semibold mb-1">Delete account</h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Permanently deletes your account, all interview sessions, scores, and progress. This cannot be undone.
            </p>
            <div className="mb-4">
              <label className="text-sm text-slate-400 block mb-1.5">
                Type <span className="font-mono text-red-400">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-foreground text-sm outline-none focus:border-red-500 transition-colors"
              />
            </div>
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
                {error}
              </div>
            )}
            <Button variant="danger" onClick={handleDelete} loading={deleting} disabled={confirm !== "DELETE"}>
              Delete my account
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
