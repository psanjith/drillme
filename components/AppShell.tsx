"use client";

import Link from "next/link";
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
  Crown,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/job-targets", label: "Job Targets", icon: Briefcase },
  { href: "/interview/setup", label: "Interview", icon: Mic },
  { href: "/drill", label: "Drill Mode", icon: Zap },
  { href: "/weakness", label: "Weaknesses", icon: BarChart3 },
  { href: "/speaking", label: "Speaking", icon: MessageSquare },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      <aside className="w-56 flex-shrink-0 border-r border-[#2a3040] flex flex-col">
        <div className="px-5 py-5 border-b border-[#2a3040]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="DrillMe" className="w-8 h-8 rounded object-contain" />
            <span className="text-white font-semibold">DrillMe</span>
          </Link>
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

        <div className="px-3 py-4 border-t border-[#2a3040] flex flex-col gap-1">
          <Link
            href="/upgrade"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-400/5 transition-all"
          >
            <Crown size={16} />
            Upgrade to Pro
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 w-full transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
