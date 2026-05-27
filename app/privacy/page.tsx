import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="DrillMe" className="w-8 h-8 rounded object-contain" />
            <span className="text-foreground font-semibold">DrillMe</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: May 2026</p>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect the following information when you use DrillMe:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-slate-300">Account data:</strong> name, email address, and password (hashed)</li>
              <li><strong className="text-slate-300">Interview data:</strong> your spoken and typed responses during practice sessions</li>
              <li><strong className="text-slate-300">Usage data:</strong> session history, scores, and progress metrics</li>
              <li><strong className="text-slate-300">Payment data:</strong> handled entirely by Stripe — we never see your card details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">We use your data to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Provide and improve the interview preparation service</li>
              <li>Generate personalised feedback and track your progress</li>
              <li>Send transactional emails (account, billing, password reset)</li>
              <li>Detect and prevent abuse</li>
            </ul>
            <p className="mt-2">We do <strong className="text-slate-300">not</strong> sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">3. AI Processing</h2>
            <p>Your interview responses are sent to third-party AI providers (Groq / Meta Llama) for question generation and evaluation. These providers process data under their own privacy policies. We do not share your name or email with AI providers — only the text content of your responses.</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">4. Data Storage</h2>
            <p>Your data is stored in Supabase (PostgreSQL), hosted on AWS infrastructure. Data is encrypted at rest and in transit. We retain your account data for as long as your account is active. Interview transcripts are stored indefinitely to power your progress tracking; you may request deletion at any time.</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">5. Cookies and Local Storage</h2>
            <p>We use cookies strictly for authentication (Supabase session cookies) and theme preference (stored in localStorage). We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">6. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your interview history</li>
            </ul>
            <p className="mt-2">To exercise these rights, email <a href="mailto:support@drillme.app" className="text-blue-400 hover:text-blue-300">support@drillme.app</a></p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">7. Third-Party Services</h2>
            <p>DrillMe uses the following third-party services: Supabase (auth + database), Stripe (payments), Groq (AI inference), and Cloudflare (hosting). Each operates under their own privacy policies.</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">8. Changes to This Policy</h2>
            <p>We may update this policy. We will notify you of material changes via email or an in-app notice.</p>
          </section>

          <section>
            <h2 className="text-foreground font-semibold text-base mb-3">9. Contact</h2>
            <p>Privacy questions or data requests: <a href="mailto:support@drillme.app" className="text-blue-400 hover:text-blue-300">support@drillme.app</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--card-border)] flex gap-6 text-sm">
          <Link href="/terms" className="text-blue-400 hover:text-blue-300">Terms of Service</Link>
          <Link href="/" className="text-slate-400 hover:text-foreground">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
