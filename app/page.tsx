import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";

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

      <main className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero — 3D Spline scene + spotlight */}
          <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--card-border)] bg-black/[0.96] h-auto md:h-[520px]">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

            <div className="flex flex-col md:flex-row h-full">
              {/* Left — copy */}
              <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center">
                <p className="text-neutral-400 text-xs font-semibold tracking-[0.25em] uppercase mb-5">
                  Prep · Perform · Peak
                </p>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                  Interview prep that
                  <br />
                  actually works
                </h1>
                <p className="mt-4 text-neutral-300 max-w-md leading-relaxed">
                  Practice with realistic AI panellists, get instant structured feedback,
                  and walk into your next interview prepared.
                </p>
                <div className="mt-8 flex items-center gap-4 flex-wrap">
                  <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                    Start for free
                  </Link>
                  <Link href="/login" className="text-neutral-300 hover:text-white font-medium px-2 transition-colors">
                    Sign in
                  </Link>
                </div>
              </div>

              {/* Right — interactive 3D scene */}
              <div className="flex-1 relative h-[280px] md:h-auto">
                <SplineScene
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12">
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
