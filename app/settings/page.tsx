"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirm !== "DELETE") return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
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

          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
            disabled={confirm !== "DELETE"}
          >
            Delete my account
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
