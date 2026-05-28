import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <nav className="border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="DrillMe" className="w-8 h-8 rounded object-contain" />
          <span className="text-foreground font-semibold text-lg">DrillMe</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="text-slate-400 hover:text-foreground text-sm transition-colors">Sign in</Link>
          <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">Get started</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-500 text-xs font-semibold tracking-[0.25em] uppercase mb-8">Prep · Perform · Peak</p>

          <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Interview prep that
            <span className="text-blue-400"> actually works</span>
          </h1>

          <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Practice with realistic AI panellists, get instant structured feedback,
            track your weaknesses, and walk into interviews prepared.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
            <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8 py-3.5 rounded-lg transition-colors text-base">
              Start for free
            </Link>
            <Link href="/login" className="bg-transparent border border-[var(--card-border)] hover:border-slate-500 text-slate-300 font-medium px-8 py-3.5 rounded-lg transition-colors text-base">
              Sign in
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { label: "AI Panellists", desc: "3 distinct interviewer personas" },
              { label: "Voice Practice", desc: "Speak & get instant feedback" },
              { label: "Weakness Tracking", desc: "Cross-session progress" },
              { label: "Speaking Coach", desc: "5 session types" },
            ].map((f) => (
              <div key={f.label} className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 text-left">
                <p className="text-foreground font-medium text-sm mb-1">{f.label}</p>
                <p className="text-slate-500 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--card-border)] px-6 py-4 text-xs text-slate-600">
        <div className="relative flex items-center justify-center">
          <span className="tracking-wide">Built for the offer. Not the algorithm.</span>
          <div className="absolute right-0 flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
