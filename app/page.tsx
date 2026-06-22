import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { PricingSection, type PricingPlan } from "@/components/ui/pricing";

const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Free",
    price: "0",
    period: "month",
    description: "Get a feel for it — on us.",
    features: [
      "3 interviews per month",
      "Overall readiness score",
      "Voice practice",
    ],
    buttonText: "Get started",
    href: "/signup",
  },
  {
    name: "Bi-weekly",
    price: "14",
    period: "2 weeks",
    description: "Pay as you go, cancel anytime.",
    note: "Billed every 2 weeks",
    features: [
      "Unlimited interviews",
      "Full per-question feedback & scores",
      "Dashboard & readiness tracking",
      "Weakness profile & trends",
      "Drill mode & speaking coach",
    ],
    buttonText: "Start for free",
    href: "/signup",
  },
  {
    name: "Monthly",
    price: "25",
    period: "month",
    description: "Everything, for less per month.",
    note: "Billed monthly · best value",
    features: [
      "Everything in Bi-weekly",
      "Best value — cheaper per month",
      "Priority access to new features",
    ],
    buttonText: "Start for free",
    href: "/signup",
    isPopular: true,
  },
];

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
          <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--hero-bg)] h-auto md:h-[520px] transition-colors">
            <Spotlight className="spotlight-themed -top-40 left-0 md:left-60 md:-top-20" />

            <div className="flex flex-col md:flex-row h-full">
              {/* Left — copy */}
              <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center">
                <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-5" style={{ color: "var(--hero-body)" }}>
                  Prep · Perform · Peak
                </p>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-b from-[var(--hero-fg-from)] to-[var(--hero-fg-to)]">
                  Interview prep that
                  <br />
                  actually works
                </h1>
                <p className="mt-4 max-w-md leading-relaxed" style={{ color: "var(--hero-body)" }}>
                  Practice with realistic AI panellists, get instant structured feedback,
                  and walk into your next interview prepared.
                </p>
                <div className="mt-8 flex items-center gap-4 flex-wrap">
                  <Link href="/signup" className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                    Start for free
                  </Link>
                  <Link href="/login" className="font-medium px-2 transition-colors hover:opacity-70" style={{ color: "var(--hero-fg-from)" }}>
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

        {/* How it works */}
        <section className="border-t border-[var(--card-border)] px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-blue-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">How it works</p>
              <h2 className="text-3xl font-bold text-foreground leading-tight">From job description to job-ready</h2>
              <p className="text-slate-400 mt-3 max-w-xl mx-auto">
                DrillMe turns any job posting into a realistic mock interview, then shows you exactly where to improve — and lets you practice it.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  n: "1",
                  title: "Paste the job description",
                  desc: "Drop in any posting from Indeed, LinkedIn, or anywhere. DrillMe reads the role and tailors every question to it — no generic question dumps.",
                },
                {
                  n: "2",
                  title: "Get interviewed, out loud",
                  desc: "A panel of AI interviewers asks real questions and follows up in real time — so you practice under pressure, the way the actual interview feels.",
                },
                {
                  n: "3",
                  title: "See your score & drill your gaps",
                  desc: "Get a readiness score and a per-question breakdown of your strengths and weaknesses, then practice your weak spots right inside the app.",
                },
              ].map((step) => (
                <div key={step.n} className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 font-semibold flex items-center justify-center mb-4">
                    {step.n}
                  </div>
                  <h3 className="text-foreground font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { stat: "Tailored", label: "Questions matched to the exact role you're applying for" },
                { stat: "Honest", label: "Real scores and feedback — not vague encouragement" },
                { stat: "Active", label: "Practice and improve, instead of just reading tips" },
              ].map((b) => (
                <div key={b.stat} className="text-center">
                  <p className="text-blue-400 font-semibold text-sm mb-1">{b.stat}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PricingSection
          plans={PRICING_PLANS}
          title="Simple, honest pricing"
          description="Start free. Upgrade when you're ready to go all in."
        />

        {/* About us */}
        <section className="border-t border-[var(--card-border)] px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-blue-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3 text-center">Our story</p>
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center leading-tight">
              We built DrillMe because<br className="hidden sm:block" /> interview prep is broken
            </h2>

            <div className="space-y-5 text-slate-400 text-base leading-relaxed">
              <p>
                One of us bombed an interview once — not because we weren&apos;t qualified, but because we
                weren&apos;t prepared. Stumbling over questions we should have nailed, walking out knowing we&apos;d
                let ourselves down. And the worst part? Not even knowing what went wrong until it was too late.
              </p>
              <p>
                That experience stuck with us. Most people <span className="text-slate-300">consume content</span> about
                interviews — tips, articles, videos — instead of actually{" "}
                <span className="text-slate-300">practicing</span>{" "}
                them.
                Reading about interviews doesn&apos;t prepare you for the pressure of being in one.
              </p>
              <p>
                So we built DrillMe: an AI interview coach that actually knows the job you&apos;re applying for.
                Paste in any job description, get interviewed out loud by AI tailored to that exact role, then see
                your score and a breakdown of your weaknesses — and drill those weak spots right inside the app.
                No generic questions. No guessing. Just honest, targeted feedback so you walk in ready.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--card-border)] px-6 py-4 text-xs text-slate-600">
        <div className="flex flex-col items-center gap-3 text-center sm:relative sm:flex-row sm:justify-center sm:gap-0">
          <span className="tracking-wide">Built for the offer. Not the algorithm.</span>
          <div className="flex items-center gap-4 sm:absolute sm:right-0">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
