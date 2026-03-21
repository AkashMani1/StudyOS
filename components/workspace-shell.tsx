"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn, Moon, Sun, Medal, Shield, Settings, LayoutDashboard, ListTodo, BarChart3, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { initials, cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isMarketing = ["/", "/login", "/onboarding"].includes(pathname);

  if (isMarketing) return <>{children}</>;

  const allNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/planner", label: "Planner", icon: ListTodo },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/rooms", label: "Rooms", icon: Users },
    { href: "/leaderboard", label: "Leaderboard", icon: Medal },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(user && profile?.role === "admin" ? [{ href: "/admin", label: "Admin", icon: Shield }] : [])
  ];

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col gap-2 p-3">
      {allNavItems.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-4 rounded-xl px-3 py-3 transition-colors",
              active 
                ? "bg-indigo-50 dark:bg-indigo-500/10 border-l-4 border-indigo-600 text-indigo-700 dark:text-indigo-400 font-semibold" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="whitespace-nowrap opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] font-body selection:bg-indigo-500/30">
      {/* Mobile Fixed Header */}
      <header className="fixed top-0 left-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-4 dark:border-white/5 dark:bg-slate-950 md:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white transition-transform hover:scale-105">
            SO
          </Link>
        </div>
        {mounted && (
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="p-2 text-slate-600 dark:text-slate-300">
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        )}
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-slate-50 dark:border-white/5 dark:bg-slate-950 md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-white/5">
                <span className="font-display font-bold text-slate-900 dark:text-white">Workspace</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pt-4">
                <NavLinks onClick={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Expandable) */}
      <aside className="group fixed left-0 top-0 z-50 hidden h-screen w-16 hover:w-64 flex-col border-r border-slate-200 bg-slate-50 transition-all duration-300 dark:border-white/5 dark:bg-slate-950 md:flex">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/5 px-3">
          <Link href="/" className="flex overflow-hidden items-center group/logo hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm transition-transform group-hover/logo:scale-105">
              SO
            </div>
            <span className="ml-4 whitespace-nowrap font-display font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-slate-900 dark:text-white">
              StudyOS
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-x-hidden overflow-y-auto py-4">
          <NavLinks />
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200 p-3 dark:border-white/5 overflow-hidden">
          {mounted && (
            <button 
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex items-center gap-4 rounded-xl px-3 py-3 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <div className="shrink-0 flex items-center justify-center">
                {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </div>
              <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                Switch Theme
              </span>
            </button>
          )}
          {user ? (
            <button 
              onClick={() => signOut()}
              className="flex items-center gap-[10px] rounded-xl pl-1.5 pr-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <div className="shrink-0 flex items-center justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {initials(profile?.displayName || "Us")}
                </div>
              </div>
              <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                Log out
              </span>
            </button>
          ) : (
            <Link 
              href="/login"
              className="flex items-center gap-4 rounded-xl px-3 py-3 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <div className="shrink-0 flex items-center justify-center">
                <LogIn className="h-5 w-5" />
              </div>
              <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                Sign in
              </span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="min-h-screen pt-16 md:pt-0 md:pl-16 transition-all duration-300 relative z-10 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
