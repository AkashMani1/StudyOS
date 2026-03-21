"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellDot,
  CalendarClock,
  Flame,
  LogIn,
  Medal,
  Moon,
  Sparkles,
  Sun,
  Target,
  TimerReset
} from "lucide-react";
import { useTheme } from "next-themes";
import { primaryNavItems, secondaryNavItems } from "@/lib/constants";
import { getExploreDailyPlans, getExploreProfile, getExploreSessions, getExploreTasks } from "@/lib/explore-data";
import { useAuth } from "@/hooks/use-auth";
import { useStudyData } from "@/hooks/use-study-data";
import { cn, initials } from "@/lib/utils";
import { getAvatar } from "@/lib/avatars";
import { Badge, Button } from "@/components/ui";
import { FloatingCoach } from "@/components/floating-coach";
import { SectionTabs } from "@/components/section-tabs";

export function AppShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { profile, user, signOut, loading: authLoading } = useAuth();
  const { tasks, sessions, dailyPlans } = useStudyData();
  const viewer = profile ?? getExploreProfile();
  const isExplore = !user;
  const showSkeleton = authLoading && !isExplore;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleTasks = user ? tasks : getExploreTasks();
  const visibleSessions = user ? sessions : getExploreSessions();
  const visibleDailyPlans = user ? dailyPlans : getExploreDailyPlans();
  const activeTasks = visibleTasks.filter((task) => !task.completed).length;
  const missedSessions = visibleSessions.filter((session) => !session.completed).length;
  const todayPlan = visibleDailyPlans.find((plan) => plan.id === new Date().toISOString().slice(0, 10));
  const todayBlocks = todayPlan?.timeBlocks.length ?? 0;
  const focusScore =
    visibleSessions.length === 0
      ? 0
      : Math.round((visibleSessions.filter((session) => session.completed).length / visibleSessions.length) * 100);
  const visibleSecondaryItems = isExplore ? secondaryNavItems.filter((item) => item.href !== "/admin") : secondaryNavItems;

  return (
    <div className="min-h-screen bg-hero-grid text-ink dark:bg-night dark:text-white">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 pb-28 pt-5 lg:px-6 lg:pb-6">
        <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-80 shrink-0 flex-col rounded-[34px] border border-white/30 bg-white/75 p-5 shadow-glow backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 md:flex">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-comet text-lg font-bold text-white">
              SO
            </div>
            <div>
              <p className="font-display text-lg font-bold">StudyOS</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Student command center</p>
            </div>
          </Link>

          <div className="rounded-[30px] bg-[linear-gradient(160deg,rgba(95,111,255,1),rgba(9,17,31,1))] p-5 text-white shadow-2xl">
            {showSkeleton ? (
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-white/15" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-16 rounded bg-white/20" />
                    <div className="h-5 w-28 rounded bg-white/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-20 rounded-2xl bg-white/10" />
                  <div className="h-20 rounded-2xl bg-white/10" />
                </div>
                <div className="h-4 w-full rounded bg-white/10" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-inner",
                      getAvatar(viewer.avatarId).color
                    )}>
                      {(() => {
                        const { icon: AvatarIcon } = getAvatar(viewer.avatarId);
                        return <AvatarIcon className="h-7 w-7" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/60">{isExplore ? "Explore profile" : "Student profile"}</p>
                      <p className="mt-1 font-display text-2xl font-bold">{viewer.displayName}</p>
                    </div>
                  </div>
                  <Badge className="border-white/10 bg-white/10 text-white">{isExplore ? "Browse" : "Live"}</Badge>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">Focus score</p>
                    <p className="mt-2 font-display text-3xl font-bold">{focusScore}%</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">Coins</p>
                    <p className="mt-2 font-display text-3xl font-bold">{viewer.wallet.coins}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-white/72">
                  {isExplore
                    ? "See the full student experience. Sign in when you want your own data, rooms, and competition."
                    : "Your workspace is live. Keep your plan visible, your sessions honest, and your momentum strong."}
                </p>
              </>
            )}
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-comet">Student snapshot</p>
                <p className="mt-2 font-display text-xl font-bold">Everything important at a glance</p>
              </div>
              <Sparkles className="h-5 w-5 text-comet" />
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-comet/10 p-2 text-comet">
                    <Target className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">Active tasks</span>
                </div>
                <span className="font-display text-2xl font-bold">{activeTasks}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-ember/10 p-2 text-ember">
                    <TimerReset className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">Missed sessions</span>
                </div>
                <span className="font-display text-2xl font-bold">{missedSessions}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-aurora/20 p-2 text-ink dark:text-aurora">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">Today&apos;s blocks</span>
                </div>
                <span className="font-display text-2xl font-bold" suppressHydrationWarning>{todayBlocks}</span>
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-5 overflow-y-auto pr-1">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Main tabs</p>
              <div className="space-y-2">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                        active
                          ? "border-comet bg-comet text-white shadow-glow"
                          : "border-slate-200/80 bg-white/70 text-slate-700 hover:-translate-y-0.5 hover:border-comet/30 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {active ? <Flame className="h-4 w-4" /> : <span className="text-xs uppercase tracking-[0.2em] opacity-60">Go</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">More for students</p>
              <div className="space-y-2">
                {visibleSecondaryItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                        active
                          ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-slate-950"
                          : "border-slate-200/80 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {item.label === "Leaderboard" ? <Medal className="h-4 w-4 opacity-70" /> : item.label === "Settings" ? <BellDot className="h-4 w-4 opacity-70" /> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          <div className="mt-5 space-y-4 rounded-[28px] bg-gradient-to-br from-comet to-ink p-5 text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/70">Quick action</p>
              <p className="mt-2 text-xl font-bold">{isExplore ? "Jump in when ready" : "Stay in motion"}</p>
              <p className="text-sm text-white/80">
                {isExplore ? "Browse every screen first, then sign in to make the app personal." : `${viewer.wallet.coins} focus coins banked and ready to grow.`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-white text-ink hover:bg-white/90"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {mounted && resolvedTheme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                Theme
              </Button>
              {isExplore ? (
                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className="flex-1">
                  <Button className="w-full bg-white/10 hover:bg-white/20">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in
                  </Button>
                </Link>
              ) : (
                <Button className="flex-1 bg-white/10 hover:bg-white/20" onClick={() => void signOut()}>
                  Logout
                </Button>
              )}
            </div>
          </div>
        </aside>

        <div id="main-content" className="flex-1">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-comet">Study operating system</p>
              <h1 className="font-display text-3xl font-bold">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
              {isExplore ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Badge className="bg-comet text-white">Explore mode</Badge>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Browse every page first. Sign in when you want your own profile, progress, and competition.
                  </p>
                </div>
              ) : null}
            </div>
            <button
              className="rounded-2xl border border-white/10 bg-white/70 p-3 shadow-glow backdrop-blur-xl dark:bg-slate-950/70 lg:hidden"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </header>

          <SectionTabs />

          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pb-20"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-50 rounded-[28px] border border-white/10 bg-white/80 p-2 shadow-glow backdrop-blur-xl dark:bg-slate-950/80 md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {[...primaryNavItems, { href: "/leaderboard", label: "Board", icon: Medal }].map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[10px] font-semibold",
                  active ? "bg-comet text-white" : "text-slate-600 dark:text-slate-300"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <FloatingCoach />
    </div>
  );
}
