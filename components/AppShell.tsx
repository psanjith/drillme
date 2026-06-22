"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Mic,
  Zap,
  BarChart3,
  MessageSquare,
  Briefcase,
  LogOut,
  Menu,
  X,
  Settings,
  Crown,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/interview/setup", label: "Interview", icon: Mic },
  { href: "/job-targets", label: "Job Targets", icon: Briefcase },
  { href: "/drill", label: "Drill Mode", icon: Zap },
  { href: "/weakness", label: "Weaknesses", icon: BarChart3 },
  { href: "/speaking", label: "Speaking", icon: MessageSquare },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((d) => setIsPro(d.isPro ?? false))
      .catch(() => setIsPro(false));
  }, []);

  // Guard against the browser back/forward cache (bfcache) showing this
  // authenticated page after sign-out. On a bfcache restore the page keeps its
  // old in-memory Supabase client whose access-token JWT is still valid for up
  // to an hour, so a client-side getUser() check falsely passes. Instead, force
  // a full reload on bfcache restore: that re-runs middleware, which reads the
  // cookies (cleared on sign-out) and redirects to /login when there's no session.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-[var(--card-border)] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="DrillMe" className="w-8 h-8 rounded object-contain" />
          <span className="text-foreground font-semibold">DrillMe</span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-foreground">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                ${active
                  ? "bg-blue-500/15 text-blue-300 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }
              `}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[var(--card-border)] flex flex-col gap-1">
        {isPro === false && (
          <Link
            href="/upgrade"
            className="mb-2 block rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 px-3.5 py-3 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown size={15} className="text-blue-400" />
              <span className="text-foreground text-sm font-semibold">Upgrade to Pro</span>
            </div>
            <p className="text-slate-400 text-xs leading-snug">Unlimited interviews & full feedback.</p>
          </Link>
        )}
        {isPro === true && (
          <Link
            href="/settings"
            className="mb-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-white/5 transition-all"
          >
            <Crown size={15} />
            <span className="font-medium">Pro</span>
          </Link>
        )}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        >
          <Settings size={16} />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 w-full transition-all"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-56 flex-shrink-0 border-r border-[var(--card-border)] flex flex-col
        bg-[var(--background)] transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--card-border)]">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-foreground">
            <Menu size={20} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="DrillMe" className="w-6 h-6 rounded object-contain" />
            <span className="text-foreground font-semibold text-sm">DrillMe</span>
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
