"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [linkValid, setLinkValid] = useState(true);

  // Establish a session from the recovery link before allowing a password
  // change. The reset email redirects here with a `?code=` (or an error);
  // without exchanging it, updateUser() fails with "Auth session missing!".
  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorDescription = params.get("error_description");

    if (errorDescription) {
      setError("This reset link is invalid or has expired. Please request a new one.");
      setLinkValid(false);
      setReady(true);
      return;
    }

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError("This reset link is invalid or has expired. Please request a new one.");
          setLinkValid(false);
        }
        setReady(true);
      });
    } else {
      // No code in URL — rely on any session already detected, or surface on submit.
      setReady(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="DrillMe" className="w-10 h-10 rounded object-contain" />
            <span className="text-foreground font-semibold text-lg">DrillMe</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
          <p className="text-slate-400 text-sm mt-1">Choose a strong password for your account</p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading || !ready} disabled={!linkValid} className="w-full mt-1">
              {ready ? "Update password" : "Verifying reset link…"}
            </Button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          {linkValid ? (
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Back to sign in
            </Link>
          ) : (
            <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">
              Request a new reset link
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}
